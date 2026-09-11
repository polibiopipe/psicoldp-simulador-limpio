import assert from 'node:assert/strict';
import net from 'node:net';
import dgram from 'node:dgram';
import { spawnSync } from 'node:child_process';

assert.equal(process.env.EV_NETWORK_RESTRICTED, 'seccomp-v1');
const allowed = new Set(['PATH', 'LANG', 'TZ', 'TMPDIR', 'EV_NETWORK_RESTRICTED']);
assert.deepEqual(Object.keys(process.env).filter(key => !allowed.has(key)), []);
for (const host of ['127.0.0.1', '::1']) {
  await new Promise((resolve, reject) => {
    const socket = net.connect({ host, port: 9 });
    socket.on('connect', () => { socket.destroy(); reject(new Error('Unexpected connection')); });
    socket.on('error', error => {
      try { assert.equal(error.code, 'EACCES'); resolve(); } catch (failure) { reject(failure); }
    });
  });
}
for (const type of ['udp4', 'udp6']) {
  await new Promise((resolve, reject) => {
    const socket = dgram.createSocket(type);
    socket.on('error', error => {
      socket.close();
      try { assert.equal(error.code, 'EACCES'); resolve(); } catch (failure) { reject(failure); }
    });
    socket.bind(0, () => { socket.close(); reject(new Error('Unexpected UDP socket')); });
  });
}
// Kernel restriction must survive exec, not just an in-process fetch mock.
const child = spawnSync(process.execPath, ['--input-type=module', '-e',
  "import net from 'node:net'; const s=net.connect({host:'127.0.0.1',port:9}); s.on('connect',()=>process.exit(1)); s.on('error',e=>process.exit(e.code==='EACCES'?0:1));"
], { timeout: 5000 });
assert.equal(child.status, 0);
console.log('PASS: clean environment; TCP/UDP IPv4/IPv6 denied; child process restriction inherited.');
