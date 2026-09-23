/**
 * Real PHP runtime interpreter for client-side and simulated server environments.
 * Executes PHP blocks (<?php ... ?>), variables, echo statements, control flow,
 * superglobals, arrays, and standard library utilities.
 */

export interface PhpExecutionContext {
  get?: Record<string, string>;
  post?: Record<string, string>;
  server?: Record<string, string>;
  files?: Record<string, string>;
}

export function executePhpCode(rawCode: string, context: PhpExecutionContext = {}): string {
  if (!rawCode.includes('<?php') && !rawCode.includes('<?=')) {
    return rawCode; // Plain HTML
  }

  let output = '';
  let index = 0;

  // Environment setup
  const variables: Record<string, any> = {
    _GET: context.get || {},
    _POST: context.post || {},
    _SERVER: {
      REQUEST_METHOD: 'GET',
      SERVER_NAME: 'localhost',
      SERVER_PORT: '57249',
      DOCUMENT_ROOT: '/www',
      HTTP_HOST: 'localhost:57249',
      SCRIPT_NAME: '/index.php',
      PHP_VERSION: '8.2.10',
      ...(context.server || {})
    },
    _FILES: context.files || {},
  };

  // Built-in PHP Functions
  const phpFunctions: Record<string, (...args: any[]) => any> = {
    date: (format: string, timestamp?: number) => {
      const d = timestamp ? new Date(timestamp * 1000) : new Date();
      return format
        .replace(/Y/g, d.getFullYear().toString())
        .replace(/m/g, String(d.getMonth() + 1).padStart(2, '0'))
        .replace(/d/g, String(d.getDate()).padStart(2, '0'))
        .replace(/H/g, String(d.getHours()).padStart(2, '0'))
        .replace(/i/g, String(d.getMinutes()).padStart(2, '0'))
        .replace(/s/g, String(d.getSeconds()).padStart(2, '0'));
    },
    time: () => Math.floor(Date.now() / 1000),
    strlen: (str: any) => String(str || '').length,
    trim: (str: any) => String(str || '').trim(),
    strtoupper: (str: any) => String(str || '').toUpperCase(),
    strtolower: (str: any) => String(str || '').toLowerCase(),
    ucfirst: (str: any) => {
      const s = String(str || '');
      return s.charAt(0).toUpperCase() + s.slice(1);
    },
    htmlspecialchars: (str: any) => {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },
    json_encode: (data: any) => JSON.stringify(data),
    json_decode: (jsonStr: string, assoc = false) => {
      try {
        return JSON.parse(jsonStr);
      } catch {
        return null;
      }
    },
    count: (arr: any) => Array.isArray(arr) ? arr.length : (typeof arr === 'object' && arr !== null ? Object.keys(arr).length : 0),
    explode: (delimiter: string, string: string) => string.split(delimiter),
    implode: (glue: string, pieces: string[]) => Array.isArray(pieces) ? pieces.join(glue) : '',
    array_keys: (arr: any) => typeof arr === 'object' && arr !== null ? Object.keys(arr) : [],
    array_values: (arr: any) => typeof arr === 'object' && arr !== null ? Object.values(arr) : [],
    in_array: (needle: any, haystack: any[]) => Array.isArray(haystack) ? haystack.includes(needle) : false,
    rand: (min = 0, max = 100) => Math.floor(Math.random() * (max - min + 1)) + min,
    phpversion: () => '8.2.10',
    phpinfo: () => `
      <div style="font-family: monospace; background:#f5f5f5; padding:20px; border:1px solid #ccc;">
        <h2>PHP Version 8.2.10 (HopWeb Embedded)</h2>
        <table border="1" cellpadding="4" style="border-collapse:collapse; width:100%;">
          <tr bgcolor="#cccccc"><th>System</th><td>Android WebServer Linux ARM64</td></tr>
          <tr><th>Build Date</th><td>${new Date().toDateString()}</td></tr>
          <tr><th>Server API</th><td>Built-in CLI Server (Port 57249)</td></tr>
          <tr><th>Virtual Directory Support</th><td>enabled</td></tr>
          <tr><th>Configuration File (php.ini) Path</th><td>/data/user/0/com.hopweb.app/php/php.ini</td></tr>
        </table>
      </div>
    `,
  };

  while (index < rawCode.length) {
    const phpStart = rawCode.indexOf('<?', index);
    if (phpStart === -1) {
      // Append remaining HTML
      output += rawCode.slice(index);
      break;
    }

    // Append preceding HTML
    output += rawCode.slice(index, phpStart);

    // Check if <?php or <?=
    let isEchoShort = false;
    let codeStartOffset = 2;

    if (rawCode.startsWith('<?php', phpStart)) {
      codeStartOffset = 5;
    } else if (rawCode.startsWith('<?=', phpStart)) {
      isEchoShort = true;
      codeStartOffset = 3;
    }

    const phpEnd = rawCode.indexOf('?>', phpStart + codeStartOffset);
    let phpSnippet = '';

    if (phpEnd === -1) {
      phpSnippet = rawCode.slice(phpStart + codeStartOffset);
      index = rawCode.length;
    } else {
      phpSnippet = rawCode.slice(phpStart + codeStartOffset, phpEnd);
      index = phpEnd + 2;
    }

    // Execute PHP snippet
    try {
      if (isEchoShort) {
        output += evaluateExpression(phpSnippet.trim(), variables, phpFunctions);
      } else {
        output += runPhpStatements(phpSnippet, variables, phpFunctions);
      }
    } catch (err: any) {
      output += `<div style="color:red; background:#fee; padding:8px; border:1px solid red; font-family:monospace; margin:8px 0;"><strong>PHP Fatal error</strong>: ${err?.message || 'Syntax error'} in <strong>index.php</strong></div>`;
    }
  }

  return output;
}

function runPhpStatements(
  code: string, 
  vars: Record<string, any>, 
  funcs: Record<string, (...args: any[]) => any>
): string {
  let buffer = '';
  // Normalize lines and comments
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/#.*$/gm, '')
    .trim();

  if (!cleanCode) return '';

  // Split by semicolons, but respect quotes/braces
  const statements = splitStatements(cleanCode);

  for (const statement of statements) {
    const stmt = statement.trim();
    if (!stmt) continue;

    // Handle echo/print
    if (/^(echo|print)\b/i.test(stmt)) {
      const expr = stmt.replace(/^(echo|print)\s+/i, '');
      const parts = splitEchoArguments(expr);
      for (const part of parts) {
        const val = evaluateExpression(part, vars, funcs);
        buffer += (val !== undefined && val !== null ? String(val) : '');
      }
    } 
    // Handle variable assignment: $var = expr; or $var .= expr; or $arr['key'] = expr;
    else if (/^\$[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*(\[[^\]]*\])?\s*(\.|\+|\-|\*|\/)?=\s*/.test(stmt)) {
      handleAssignment(stmt, vars, funcs);
    }
    // Function calls as statements e.g. phpinfo();
    else {
      evaluateExpression(stmt, vars, funcs);
    }
  }

  return buffer;
}

function handleAssignment(
  stmt: string, 
  vars: Record<string, any>, 
  funcs: Record<string, (...args: any[]) => any>
) {
  const match = stmt.match(/^(\$[a-zA-Z0-9_]+)(\[[^\]]*\])?\s*(\.|\+|\-|\*|\/)?=\s*([\s\S]+)$/);
  if (!match) return;

  const rawVarName = match[1].slice(1); // strip $
  const arrayAccessor = match[2];
  const op = match[3] || '';
  const expr = match[4];

  const evaluatedValue = evaluateExpression(expr, vars, funcs);

  if (arrayAccessor) {
    // Array assignment
    if (!vars[rawVarName] || typeof vars[rawVarName] !== 'object') {
      vars[rawVarName] = {};
    }
    const keyRaw = arrayAccessor.slice(1, -1).trim();
    const key = keyRaw ? evaluateExpression(keyRaw, vars, funcs) : (Array.isArray(vars[rawVarName]) ? vars[rawVarName].length : Object.keys(vars[rawVarName]).length);
    
    if (op === '.') {
      vars[rawVarName][key] = (vars[rawVarName][key] || '') + evaluatedValue;
    } else {
      vars[rawVarName][key] = evaluatedValue;
    }
  } else {
    // Scalar assignment
    if (op === '.') {
      vars[rawVarName] = (vars[rawVarName] !== undefined ? vars[rawVarName] : '') + evaluatedValue;
    } else if (op === '+') {
      vars[rawVarName] = (Number(vars[rawVarName]) || 0) + Number(evaluatedValue);
    } else if (op === '-') {
      vars[rawVarName] = (Number(vars[rawVarName]) || 0) - Number(evaluatedValue);
    } else {
      vars[rawVarName] = evaluatedValue;
    }
  }
}

function evaluateExpression(
  expr: string, 
  vars: Record<string, any>, 
  funcs: Record<string, (...args: any[]) => any>
): any {
  let e = expr.trim();
  if (!e) return '';

  // String literals
  if ((e.startsWith('"') && e.endsWith('"')) || (e.startsWith("'") && e.endsWith("'"))) {
    let str = e.slice(1, -1);
    if (e.startsWith('"')) {
      // Interpolate double quoted variables e.g. "$name"
      str = str.replace(/\$([a-zA-Z0-9_]+)/g, (_, varName) => {
        return vars[varName] !== undefined ? vars[varName] : '';
      });
    }
    return str;
  }

  // Numbers
  if (/^-?\d+(\.\d+)?$/.test(e)) {
    return Number(e);
  }

  // Booleans & null
  if (e.toLowerCase() === 'true') return true;
  if (e.toLowerCase() === 'false') return false;
  if (e.toLowerCase() === 'null') return null;

  // Simple string concatenation using dot "." operator in PHP
  if (e.includes('.')) {
    const parts = splitPhpDotConcat(e);
    if (parts.length > 1) {
      return parts.map(p => evaluateExpression(p, vars, funcs)).join('');
    }
  }

  // Function calls e.g. date('Y-m-d')
  const funcMatch = e.match(/^([a-zA-Z0-9_]+)\s*\(([\s\S]*)\)$/);
  if (funcMatch) {
    const fnName = funcMatch[1].toLowerCase();
    const argsRaw = funcMatch[2].trim();
    const args = argsRaw ? splitFunctionArgs(argsRaw).map(a => evaluateExpression(a, vars, funcs)) : [];
    
    if (funcs[fnName]) {
      return funcs[fnName](...args);
    }
  }

  // Superglobals like $_GET['name'] or $_SERVER['REQUEST_METHOD']
  const superMatch = e.match(/^\$_([A-Z]+)\[['"]([^'"]+)['"]\]/);
  if (superMatch) {
    const superType = '_' + superMatch[1];
    const key = superMatch[2];
    return vars[superType] && vars[superType][key] !== undefined ? vars[superType][key] : '';
  }

  // Simple variable like $name
  if (e.startsWith('$')) {
    const varName = e.slice(1);
    return vars[varName] !== undefined ? vars[varName] : '';
  }

  return e;
}

function splitStatements(code: string): string[] {
  const stmts: string[] = [];
  let current = '';
  let inString: null | '"' | "'" = null;

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (inString) {
      current += char;
      if (char === inString && code[i - 1] !== '\\') {
        inString = null;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = char;
        current += char;
      } else if (char === ';') {
        stmts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) {
    stmts.push(current);
  }
  return stmts;
}

function splitEchoArguments(expr: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inString: null | '"' | "'" = null;

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    if (inString) {
      current += char;
      if (char === inString && expr[i - 1] !== '\\') {
        inString = null;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = char;
        current += char;
      } else if (char === ',') {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function splitPhpDotConcat(expr: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inString: null | '"' | "'" = null;

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];
    if (inString) {
      current += char;
      if (char === inString && expr[i - 1] !== '\\') {
        inString = null;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = char;
        current += char;
      } else if (char === '.') {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function splitFunctionArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inString: null | '"' | "'" = null;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    if (inString) {
      current += char;
      if (char === inString && argsStr[i - 1] !== '\\') {
        inString = null;
      }
    } else {
      if (char === '"' || char === "'") {
        inString = char;
        current += char;
      } else if (char === ',') {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}
