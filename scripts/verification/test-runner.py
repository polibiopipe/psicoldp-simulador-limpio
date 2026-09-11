"""Negative tests use disposable copies, synthetic canaries and no remote services."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

source = Path(__file__).resolve().parent


def fixture(root):
    folder = root / "scripts/verification"
    folder.mkdir(parents=True)
    for name in ["offline.py", "run.mjs", "probe.mjs"]:
        shutil.copyfile(source / name, folder / name)
    return folder


def run(root, extra=None):
    result = subprocess.run([sys.executable, str(root / "scripts/verification/offline.py")],
                            cwd=root, env={**os.environ, **(extra or {})}, capture_output=True,
                            text=True, timeout=15)
    return result


with tempfile.TemporaryDirectory(prefix="ev-verification-guards-") as temporary:
    base = Path(temporary)
    dirty = base / "dirty"
    fixture(dirty)
    (dirty / ".env.local").write_text("VITE_TEST_ONLY=synthetic\n")
    reports = dirty / ".audit-verification"
    reports.mkdir()
    (reports / "report.json").write_text('{"offlineStatus":"PASS"}')
    result = run(dirty)
    assert result.returncode == 2 and "without .env" in result.stderr
    assert json.loads((reports / "report.json").read_text())["offlineStatus"] == "BLOCKED"
    print("PASS: .env rejected; previous PASS invalidated.")

    unknown = base / "unknown"
    fixture(unknown)
    (unknown / "package.json").write_text(json.dumps({"type": "module", "scripts": {
        "audit:unknown": "node unknown.mjs"}}))
    (unknown / "unknown.mjs").write_text("import fs from 'node:fs'; fs.writeFileSync('UNEXPECTED', 'executed');")
    result = run(unknown)
    assert result.returncode == 2 and "unreviewed audit" in result.stderr
    assert not (unknown / "UNEXPECTED").exists()
    print("PASS: unknown audit is not executed.")

    clean = base / "clean"
    folder = fixture(clean)
    # Reuse the real probe to observe the wrapper's environment and inherited filter.
    (folder / "run.mjs").write_text("import './probe.mjs';\n")
    result = run(clean, {"SUPABASE_SERVICE_ROLE_KEY": "SYNTHETIC_CANARY",
                        "GEMINI_API_KEY": "SYNTHETIC_CANARY", "VITE_EXAMPLE": "SYNTHETIC_CANARY",
                        "NODE_OPTIONS": "--require=/nonexistent-verification-canary.cjs"})
    assert result.returncode == 0, result.stderr
    assert "clean environment" in result.stdout
    print("PASS: service keys, VITE variables and NODE_OPTIONS removed; network probe passed.")
