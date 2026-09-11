import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '../..');
process.chdir(root);
if (process.env.EV_NETWORK_RESTRICTED !== 'seccomp-v1') {
  console.error('BLOCKED: start with npm run verify:safe.'); process.exit(2);
}
const destination = join(root, '.audit-verification');
mkdirSync(destination, { recursive: true });
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
// Explicit reviewed entry points. A new audit requires review and a manifest update.
const suites = [
  ['preparation-session-plan', 'src/engine/preparationSessionPlanAudit.js'],
  ['basic-interview', 'src/engine/basicInterviewSmokeTest.js'],
  ['claudio', 'src/engine/claudioConversationAudit.js'],
  ['clinical-claudio', 'src/engine/clinicalSimulationEngine.claudioAudit.js'],
  ['clinical-all', 'src/engine/clinicalSimulationEngine.allAudit.js'],
  ['phase3a-safety', 'src/engine/phase3aSafetyAudit.js'],
  ['adult-avatars', 'src/engine/adultAvatarConsistencyAudit.js'],
  ['encoding', 'scripts/audit-text-encoding.mjs'],
  ['feedback', 'scripts/audit-feedback-evidence.mjs'],
  ['session-expiration', 'scripts/audit-session-expiration.mjs'],
  ['session-resume-auth', 'scripts/audit-session-resume-auth.mjs'],
  ['session-duration-policy', 'scripts/audit-session-duration-policy.mjs'],
  ['agenda', 'scripts/audit-agenda.mjs'],
  ['persistence-ui', 'scripts/audit-persistence-ui.mjs'],
  ['canonical-biographies', 'scripts/audit-avatar-canonical-biographies.mjs'],
  ['narratives', 'scripts/audit-avatar-narratives.mjs'],
  ['narrative-disclosure', 'scripts/audit-narrative-disclosure.mjs'],
  ['narrative-integration', 'scripts/audit-local-narrative-integration.mjs'],
  ['conversation-scenarios', 'scripts/audit-avatar-conversation-scenarios.mjs'],
  ['simulator-flow', 'scripts/audit-simulator-flow.mjs'],
  ['research-consent', 'scripts/audit-research-consent.mjs'],
  ['access-consent', 'scripts/audit-access-consent.mjs'],
  ['feedback-academic', 'scripts/audit-feedback-academic.mjs'],
  ['feedback-mediation', 'scripts/audit-feedback-mediation.mjs'],
  ['simulator-enrollment', 'scripts/test-simulator-enrollment.mjs'],
];
const reviewed = new Set(suites.map(([, path]) => `node ${path}`));
const unknown = Object.entries(pkg.scripts).filter(([name, command]) =>
  name !== 'audit:all' && (name.startsWith('audit:') || name === 'basicInterviewSmokeTest') && !reviewed.has(command));
if (unknown.length) { console.error('BLOCKED: unreviewed audit entries:', unknown.map(([name]) => name).join(', ')); process.exit(2); }

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8', timeout: 5000 });
  if (result.status !== 0) throw new Error('Git metadata unavailable. Use a Git checkout.');
  return result.stdout.trim();
}
function snapshot() {
  const paths = git(['ls-files', '-co', '--exclude-standard', '-z']).split('\0').filter(Boolean).sort();
  const hash = createHash('sha256');
  for (const path of paths) hash.update(path + '\0').update(readFileSync(path));
  return hash.digest('hex');
}
const startedAt = new Date().toISOString();
const before = snapshot();
const checks = [];
function run(name, args) {
  const start = Date.now();
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 60000,
    killSignal: 'SIGKILL', maxBuffer: 8 * 1024 * 1024, env: { ...process.env } });
  const text = `${result.stdout || ''}\n${result.stderr || ''}`;
  writeFileSync(join(destination, `${name}.log`), text);
  const item = { name, status: result.status === 0 && !result.error ? 'PASS' : 'FAIL',
    exitCode: result.status, signal: result.signal, timedOut: result.error?.code === 'ETIMEDOUT',
    durationMs: Date.now() - start, log: `.audit-verification/${name}.log` };
  checks.push(item); console.log(`${item.status} ${name}`);
  return { item, text };
}

const probe = run('network-and-environment', ['scripts/verification/probe.mjs']);
if (probe.item.status !== 'PASS') {
  console.error('BLOCKED: restriction self-check failed. No project audits were executed.'); process.exit(2);
}
// Report only file and rule, never matched credentials or snippets.
const patterns = [
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['google-api-key', /AIza[0-9A-Za-z_-]{35}/],
  ['github-token', /(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/],
  ['supabase-secret', /sb_secret_[A-Za-z0-9_-]{20,}/],
];
const findings = [];
for (const path of git(['ls-files', '-co', '--exclude-standard', '-z']).split('\0').filter(Boolean)) {
  if (!/\.(?:[cm]?js|jsx|tsx?|json|md|ya?ml|sql|py)$/.test(path)) continue;
  const content = readFileSync(path, 'utf8');
  for (const [rule, pattern] of patterns) if (pattern.test(content)) findings.push({ path, rule });
}
checks.push({ name: 'credential-patterns', status: findings.length ? 'FAIL' : 'PASS', findings,
  limitation: 'Selected literal patterns only; not a complete secret or vulnerability audit.' });
console.log(`${findings.length ? 'FAIL' : 'PASS'} credential-patterns`);
if (!findings.length) {
  for (const [name, path] of suites) run(name, [path]);
} else {
  for (const [name] of suites) checks.push({ name, status: 'BLOCKED' });
}
const build = findings.length ? null : run('build', ['node_modules/vite/bin/vite.js', 'build']);
const after = snapshot();
checks.push({ name: 'source-unchanged-by-tests', status: before === after ? 'PASS' : 'FAIL' });
const report = {
  schemaVersion: 1, startedAt, finishedAt: new Date().toISOString(),
  baseCommit: git(['rev-parse', 'HEAD']), sourceSha256: before, sourceSha256After: after,
  lockfileSha256: createHash('sha256').update(readFileSync('package-lock.json')).digest('hex'),
  node: process.version, platform: process.platform,
  packages: Object.fromEntries(['vite', 'react', 'react-test-renderer', 'esbuild', '@supabase/supabase-js']
    .map(name => [name, JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8')).version])),
  offlineStatus: checks.every(check => check.status === 'PASS') ? 'PASS' : 'FAIL',
  scope: 'Reviewed local code and synthetic fixtures; Internet sockets denied by Linux seccomp.',
  eccInstalled: false, checks,
  warnings: [
    ...(build?.text.includes('larger than 500 kB') ? ['Vite reports a chunk larger than 500 kB.'] : []),
    ...(build?.text.includes('dynamically imported') ? ['Vite reports mixed static/dynamic imports.'] : []),
  ],
  notVerified: ['Authenticated live Supabase/Gemini flow and production configuration',
    'Live database policies, SQL migrations, and concurrent database transactions',
    'Visual browser, mobile, and accessibility behavior',
    'Clinical or educational validity of AI feedback',
    'Complete dependency vulnerability audit or safety of the full ECC package'],
};
writeFileSync(join(destination, 'report.json'), JSON.stringify(report, null, 2) + '\n');
writeFileSync(join(destination, 'report.md'), [
  '# Verificación local de Escucha Viva', '', `Resultado local: **${report.offlineStatus}**.`,
  `Commit base: \`${report.baseCommit}\`.`, `SHA-256 del código: \`${before}\`.`,
  `Inicio UTC: ${startedAt}. Node: ${process.version}.`, '',
  'Las auditorías usan datos ficticios y servicios simulados. Este resultado no certifica producción.', '',
  '| Verificación | Estado |', '| --- | --- |', ...checks.map(c => `| ${c.name} | ${c.status} |`), '',
  '## Advertencias', '', ...(report.warnings.length ? report.warnings.map(w => `- ${w}`) : ['Ninguna advertencia de build detectada.']), '',
  '## No verificado', '', ...report.notVerified.map(item => `- ${item}`), '',
].join('\n'));
console.log(`${report.offlineStatus}: ${suites.length} suites configured. Report: .audit-verification/report.md`);
process.exitCode = report.offlineStatus === 'PASS' ? 0 : 1;
