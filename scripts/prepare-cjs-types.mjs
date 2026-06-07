import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const distDir = 'dist';

function addDeclarationImportExtension(source, extension) {
  return source.replace(/from '(\.[^']+)'/g, (match, specifier) => {
    if (specifier.endsWith('.js') || specifier.endsWith('.cjs')) {
      return match;
    }
    return `from '${specifier}${extension}'`;
  });
}

const declarationFiles = (await readdir(distDir)).filter((file) => file.endsWith('.d.ts'));

for (const file of declarationFiles) {
  const path = join(distDir, file);
  const source = await readFile(path, 'utf8');

  await writeFile(path, addDeclarationImportExtension(source, '.js'));
  await writeFile(
    join(distDir, file.replace(/\.d\.ts$/, '.d.cts')),
    addDeclarationImportExtension(source, '.cjs'),
  );
}
