import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, extname, relative } from 'path';

const ROOT = '/Users/phamthanhhung/Desktop/MyProject/IELTS';
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.codegraph']);

function* walk(dir) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) yield* walk(p);
      } else if (EXTS.has(extname(e.name))) {
        yield p;
      }
    }
  } catch {}
}

function findCatchBlocks(code) {
  const blocks = [];
  const re = /catch\s*(?:\s*\(([^)]*)\))?\s*\{/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    const errVar = (m[1] || '').trim() || null;
    const start = m.index;
    const catchEnd = m.index + m[0].length;
    const openBracePos = catchEnd - 1;

    let depth = 1;
    let pos = catchEnd;
    while (pos < code.length && depth > 0) {
      if (code[pos] === '{') depth++;
      else if (code[pos] === '}') depth--;
      pos++;
    }

    const bodyStart = catchEnd;
    const bodyEnd = pos - 1;
    const body = code.slice(bodyStart, bodyEnd);

    blocks.push({
      errVar,
      start,
      openBracePos,
      bodyStart,
      bodyEnd,
      endPos: pos,
      body,
      needsVar: errVar === null,
    });
  }
  return blocks;
}

function hasConsoleError(body) {
  return /console\.error\s*\(/.test(body);
}

function getBodyIndent(code, bodyStart) {
  const body = code.slice(bodyStart);
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed !== '' && trimmed !== '}') {
      return line.match(/^(\s*)/)[1];
    }
  }
  const before = code.slice(0, bodyStart);
  const lastNewline = before.lastIndexOf('\n');
  const catchLine = before.slice(lastNewline + 1);
  const catchIndent = catchLine.match(/^(\s*)/)[1];
  return catchIndent + '  ';
}

function getCatchLineIndent(code, bodyStart) {
  const before = code.slice(0, bodyStart);
  const lastNewline = before.lastIndexOf('\n');
  const catchLine = before.slice(lastNewline + 1);
  return catchLine.match(/^(\s*)/)[1];
}

let totalFixed = 0;
let changedFiles = 0;

for (const file of walk(ROOT)) {
  let code = readFileSync(file, 'utf-8');
  const blocks = findCatchBlocks(code);
  if (blocks.length === 0) continue;

  let modified = false;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    if (hasConsoleError(code.slice(b.bodyStart, b.bodyEnd))) continue;

    const varName = b.errVar || 'error';
    const indent = getBodyIndent(code, b.bodyStart);
    const catchIndent = getCatchLineIndent(code, b.bodyStart);
    const relPath = relative(ROOT, file);
    const logLine = `${indent}console.error('${relPath} error:', ${varName});`;

    const body = code.slice(b.bodyStart, b.bodyEnd);
    const trimmedBody = body.trim();

    if (!trimmedBody) {
      // Empty body: catch (e) {}
      code = code.slice(0, b.bodyStart) + '\n' + logLine + '\n' + catchIndent + code.slice(b.bodyStart);
    } else {
      const rest = code.slice(b.bodyStart);
      if (rest.startsWith('\n')) {
        code = code.slice(0, b.bodyStart) + '\n' + logLine + rest;
      } else {
        code = code.slice(0, b.bodyStart) + '\n' + logLine + '\n' + indent + rest.trimStart();
      }
    }

    if (b.needsVar) {
      const catchText = code.slice(b.start, b.openBracePos + 1);
      const newCatch = catchText.replace(/catch\s*\{/, 'catch (error) {');
      code = code.slice(0, b.start) + newCatch + code.slice(b.openBracePos + 1);
    }

    modified = true;
    totalFixed++;
  }

  if (modified) {
    writeFileSync(file, code, 'utf-8');
    changedFiles++;
    process.stdout.write('.');
  }
}

console.log(`\n\nDone! Added console.error to ${totalFixed} catch blocks in ${changedFiles} files.`);
