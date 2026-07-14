// Test the script logic on a small sample
const testCases = [
  {
    name: 'basic try-catch with variable',
    input: `try {
  doSomething();
} catch (e) {
  handleError();
}`,
    expected: `try {
  doSomething();
} catch (e) {
  console.error('test error:', e);
  handleError();
}`
  },
  {
    name: 'catch without variable',
    input: `try {
  doSomething();
} catch {
  handleError();
}`,
    expected: `try {
  doSomething();
} catch (error) {
  console.error('test error:', error);
  handleError();
}`
  },
  {
    name: 'already has console.error',
    input: `try {
  doSomething();
} catch (e) {
  console.error('msg:', e);
}`,
    expected: `try {
  doSomething();
} catch (e) {
  console.error('msg:', e);
}`
  },
  {
    name: 'empty catch body',
    input: `try {
  doSomething();
} catch (e) {}`,
    expected: `try {
  doSomething();
} catch (e) {
  console.error('test error:', e);
}`
  },
  {
    name: 'nested braces in body',
    input: `try {
  doSomething();
} catch (e) {
  if (x) { y(); }
}`,
    expected: `try {
  doSomething();
} catch (e) {
  console.error('test error:', e);
  if (x) { y(); }
}`
  },
  {
    name: 'tab indentation',
    input: `try {
\tsomething();
} catch (e) {
\thandleError();
}`,
    expected: `try {
\tsomething();
} catch (e) {
\tconsole.error('test error:', e);
\thandleError();
}`
  },
];

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
  // Get the first non-empty, non-brace-only line of the body to determine indentation
  const body = code.slice(bodyStart);
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && trimmed !== '' && trimmed !== '}') {
      return line.match(/^(\s*)/)[1];
    }
  }
  // Fallback: get indentation from the catch line + standard indent
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

let passCount = 0;
let failCount = 0;

for (const tc of testCases) {
  let code = tc.input;
  const blocks = findCatchBlocks(code);
  
  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    if (hasConsoleError(code.slice(b.bodyStart, b.bodyEnd))) continue;
    
    const varName = b.errVar || 'error';
    const indent = getBodyIndent(code, b.bodyStart);
    const catchIndent = getCatchLineIndent(code, b.bodyStart);
    const relPath = 'test';
    const logLine = `${indent}console.error('${relPath} error:', ${varName});`;
    
    const body = code.slice(b.bodyStart, b.bodyEnd);
    const trimmedBody = body.trim();
    
    if (!trimmedBody) {
      // Empty body: catch (e) {}
      // Insert newline + logLine + newline + catchIndent before closing }
      code = code.slice(0, b.bodyStart) + '\n' + logLine + '\n' + catchIndent + code.slice(b.bodyStart);
    } else {
      // Non-empty body: insert before existing content
      const rest = code.slice(b.bodyStart);
      if (rest.startsWith('\n')) {
        code = code.slice(0, b.bodyStart) + '\n' + logLine + rest;
      } else {
        code = code.slice(0, b.bodyStart) + '\n' + logLine + '\n' + indent + rest.trimStart();
      }
    }
    
    // If catch had no error variable, add one
    if (b.needsVar) {
      const catchText = code.slice(b.start, b.openBracePos + 1);
      const newCatch = catchText.replace(/catch\s*\{/, 'catch (error) {');
      code = code.slice(0, b.start) + newCatch + code.slice(b.openBracePos + 1);
    }
  }
  
  const pass = code === tc.expected;
  console.log(`${pass ? '✅' : '❌'} ${tc.name}`);
  if (!pass) {
    failCount++;
    console.log('  Got:      ' + JSON.stringify(code));
    console.log('  Expected: ' + JSON.stringify(tc.expected));
  } else {
    passCount++;
  }
}

console.log(`\n${passCount}/${passCount + failCount} passed`);
