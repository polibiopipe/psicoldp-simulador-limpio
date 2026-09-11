#!/usr/bin/env python3
"""Run reviewed local verification with no Internet sockets (Linux only).

This is a network restriction, not a filesystem sandbox for untrusted code.
There is deliberately no fallback to an unrestricted run.
"""
import ctypes
import ctypes.util
import errno
import json
import os
from datetime import datetime, timezone
from pathlib import Path
import shutil
import socket
import sys


def initial_report(status, reason):
    output = Path(__file__).resolve().parents[2] / ".audit-verification"
    output.mkdir(exist_ok=True)
    report = {"schemaVersion": 1, "offlineStatus": status,
              "startedAt": datetime.now(timezone.utc).isoformat(), "reason": reason}
    (output / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    (output / "report.md").write_text(f"# Verificación local\n\nEstado: **{status}**.\n\n{reason}\n")


def main():
    root = Path(__file__).resolve().parents[2]
    os.chdir(root)
    initial_report("INCOMPLETE", "Execution has not completed; a previous PASS is not current evidence.")
    if sys.platform != "linux":
        raise RuntimeError("Linux with libseccomp is required; verification was not started.")
    # Vite reads these independently of process.env, even with an empty environment.
    if any(p.name != ".env.example" for p in root.glob(".env*")):
        raise RuntimeError("Use a clean checkout without .env files; verification was not started.")
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required.")
    library = ctypes.util.find_library("seccomp")
    if not library:
        raise RuntimeError("libseccomp is required; verification was not started.")

    class Compare(ctypes.Structure):
        _fields_ = [("arg", ctypes.c_uint), ("op", ctypes.c_int),
                    ("a", ctypes.c_uint64), ("b", ctypes.c_uint64)]

    lib = ctypes.CDLL(library)
    lib.seccomp_init.argtypes = [ctypes.c_uint32]
    lib.seccomp_init.restype = ctypes.c_void_p
    lib.seccomp_syscall_resolve_name.argtypes = [ctypes.c_char_p]
    lib.seccomp_syscall_resolve_name.restype = ctypes.c_int
    lib.seccomp_rule_add_array.argtypes = [ctypes.c_void_p, ctypes.c_uint32, ctypes.c_int,
                                         ctypes.c_uint, ctypes.POINTER(Compare)]
    lib.seccomp_rule_add_array.restype = ctypes.c_int
    lib.seccomp_load.argtypes = [ctypes.c_void_p]
    lib.seccomp_load.restype = ctypes.c_int
    lib.seccomp_release.argtypes = [ctypes.c_void_p]
    context = lib.seccomp_init(0x7FFF0000)  # SCMP_ACT_ALLOW
    if not context:
        raise RuntimeError("Could not initialize network restriction.")
    deny = 0x00050000 | errno.EACCES  # SCMP_ACT_ERRNO
    try:
        for name in [b"socket", b"socketpair", b"socketcall", b"io_uring_setup"]:
            syscall = lib.seccomp_syscall_resolve_name(name)
            if syscall < 0:
                if name == b"socket":
                    raise RuntimeError("Unsupported socket syscall.")
                continue
            # Keep Unix IPC for esbuild. Deny every other address family.
            comparison = Compare(0, 1, socket.AF_UNIX, 0)  # SCMP_CMP_NE
            count = 1 if name in [b"socket", b"socketpair"] else 0
            if lib.seccomp_rule_add_array(context, deny, syscall, count,
                                          ctypes.byref(comparison) if count else None) != 0:
                raise RuntimeError("Could not configure network restriction.")
        if lib.seccomp_load(context) != 0:
            raise RuntimeError("Could not enforce network restriction; verification was not started.")
    finally:
        lib.seccomp_release(context)

    # Check kernel enforcement before launching any project code.
    for family in [socket.AF_INET, socket.AF_INET6]:
        for kind in [socket.SOCK_STREAM, socket.SOCK_DGRAM]:
            try:
                candidate = socket.socket(family, kind)
            except PermissionError:
                continue
            candidate.close()
            raise RuntimeError("Network restriction failed its self-check.")

    output = root / ".audit-verification"
    output.mkdir(exist_ok=True)
    temp = output / "tmp"
    temp.mkdir(exist_ok=True)
    # No inherited tokens, proxy settings, NODE_OPTIONS, VITE_* or service keys.
    environment = {"PATH": str(Path(node).parent) + ":/usr/bin:/bin", "LANG": "C.UTF-8",
                   "TZ": "UTC", "TMPDIR": str(temp), "EV_NETWORK_RESTRICTED": "seccomp-v1"}
    os.closerange(3, 65536)
    os.execve(node, [node, str(root / "scripts/verification/run.mjs")], environment)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        initial_report("BLOCKED", str(error))
        print(f"BLOCKED: {error}", file=sys.stderr)
        sys.exit(2)
