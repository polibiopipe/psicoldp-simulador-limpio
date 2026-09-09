import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
let failed = 0;
let passed = 0;
for (const [name, command] of Object.entries(scripts)) {
  if (name === 'audit:all' || (!name.startsWith('audit:') && name !== 'basicInterviewSmokeTest')) continue;
  const result = spawnSync(process.execPath, command.slice('node '.length).split(' '), { encoding: 'utf8' });
  const ok = result.status === 0;
  if (ok) passed += 1; else failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  if (!ok) console.error(result.stdout, result.stderr);
}
console.log(`${passed} suites passed; ${failed} failed.`);
process.exitCode = failed ? 1 : 0;
