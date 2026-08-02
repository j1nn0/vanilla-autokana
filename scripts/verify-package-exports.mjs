import assert from 'node:assert/strict';
import {
  access,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { promisify } from 'node:util';

const packageName = '@j1nn0/vanilla-autokana';
const packageRoot = resolve('.');
const distDir = join(packageRoot, 'dist');

// Public surface is intentionally limited to bind() and the AutoKana class (ADR-0003);
// kana utilities stay internal modules.
const expectedExports = ['AutoKana', 'bind'];
const execFileAsync = promisify(execFile);

function assertDeclarationImportsResolve(source, availableFiles, declarationExtension) {
  const importPattern = /\b(?:from|import)\s*['"](\.[^'"]+)['"]/g;

  for (const [, specifier] of source.matchAll(importPattern)) {
    const runtimeExtension = specifier.endsWith('.cjs')
      ? '.cjs'
      : specifier.endsWith('.js')
        ? '.js'
        : undefined;
    if (!runtimeExtension) {
      continue;
    }

    const declarationFile =
      `${specifier.slice(0, -runtimeExtension.length)}${declarationExtension}`.replace(/^\.\//, '');
    assert(
      availableFiles.has(declarationFile),
      `Missing ${declarationExtension} for declaration import "${specifier}".`,
    );
  }
}

async function verifyDeclarationClosure(directory = distDir) {
  const files = await readdir(directory);
  const availableFiles = new Set(files);
  const declarationFiles = files.filter(
    (file) => file.endsWith('.d.ts') || file.endsWith('.d.cts'),
  );

  for (const file of declarationFiles) {
    const source = await readFile(join(directory, file), 'utf8');
    const extension = file.endsWith('.d.cts') ? '.d.cts' : '.d.ts';
    assertDeclarationImportsResolve(source, availableFiles, extension);
  }
}

function verifyUmdGlobal(source) {
  const dom = new JSDOM('', { runScripts: 'outside-only' });
  try {
    dom.window.eval(source);
    const globalNamespace = dom.window.AutoKana;
    assert.deepEqual(Object.keys(globalNamespace ?? {}).sort(), expectedExports);
    assert.equal(typeof globalNamespace?.AutoKana, 'function');
    assert.equal(typeof globalNamespace?.bind, 'function');
  } finally {
    dom.window.close();
  }
}

async function verifyTypeConsumer(root = packageRoot) {
  const fixtureDir = await mkdtemp(join(tmpdir(), 'vanilla-autokana-consumer-'));
  const packageLink = join(fixtureDir, 'node_modules', '@j1nn0', 'vanilla-autokana');
  const esmFixture = join(fixtureDir, 'consumer.ts');
  const cjsFixture = join(fixtureDir, 'consumer.cts');

  try {
    await mkdir(dirname(packageLink), { recursive: true });
    await symlink(root, packageLink, 'dir');
    await writeFile(join(fixtureDir, 'package.json'), '{"type":"module"}\n');

    const consumerSource = `import { AutoKana, bind, type AutoKanaOption, type Bindable, type KatakanaOption } from '${packageName}';
declare const name: Bindable;
const option: AutoKanaOption = { katakana: 'half' };
const instance = bind(name, undefined, option);
const mode: KatakanaOption = instance.option.katakana;
const constructed = new AutoKana(name);
void [instance, mode, constructed];
`;
    await writeFile(esmFixture, consumerSource);
    await writeFile(cjsFixture, consumerSource);

    const tscPath = join(packageRoot, 'node_modules', 'typescript', 'bin', 'tsc');
    await execFileAsync(
      process.execPath,
      [
        tscPath,
        '--noEmit',
        '--module',
        'NodeNext',
        '--moduleResolution',
        'NodeNext',
        '--target',
        'ES2022',
        '--strict',
        '--skipLibCheck',
        'false',
        '--pretty',
        'false',
        esmFixture,
        cjsFixture,
      ],
      { cwd: fixtureDir },
    );
  } finally {
    await rm(fixtureDir, { recursive: true, force: true });
  }
}

async function verifyPackage() {
  const esm = await import(packageName);
  assert.deepEqual(Object.keys(esm).sort(), expectedExports);

  const require = createRequire(import.meta.url);
  const cjs = require(packageName);
  assert.deepEqual(Object.keys(cjs).sort(), expectedExports);

  const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
  assert.deepEqual(Object.keys(packageJson.exports), ['.']);
  assert.deepEqual(Object.keys(packageJson.exports['.']).sort(), ['import', 'require']);
  assert.deepEqual(Object.keys(packageJson.exports['.'].import).sort(), ['default', 'types']);
  assert.deepEqual(Object.keys(packageJson.exports['.'].require).sort(), ['default', 'types']);
  assert.equal(packageJson.exports['.'].import.types, './dist/index.d.ts');
  assert.equal(packageJson.exports['.'].import.default, './dist/autokana.es.js');
  assert.equal(packageJson.exports['.'].require.types, './dist/index.d.cts');
  assert.equal(packageJson.exports['.'].require.default, './dist/autokana.cjs');

  await access(join(distDir, 'index.d.ts'));
  await access(join(distDir, 'index.d.cts'));
  await verifyDeclarationClosure();
  verifyUmdGlobal(await readFile(join(distDir, 'autokana.umd.js'), 'utf8'));
  await verifyTypeConsumer();

  await assert.rejects(
    () => import(`${packageName}/dist/InputTracker.js`),
    /not defined by "exports"/,
  );
  assert.throws(() => require(`${packageName}/dist/InputTracker.cjs`), /not defined by "exports"/);

  console.log(
    'Verified package surface: ESM, CJS, declarations, TypeScript consumers, UMD, exports closure',
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await verifyPackage();
}
