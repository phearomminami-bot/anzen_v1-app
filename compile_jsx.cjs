#!/usr/bin/env node
// Compile a JSX file to plain JS. Usage: node compile_jsx.js <file.jsx>
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
if (!file) { console.error('Usage: compile_jsx.js <file>'); process.exit(1); }

const src = fs.readFileSync(file, 'utf8');
const result = babel.transformSync(src, {
  filename: path.basename(file),
  presets: [['@babel/preset-react', { runtime: 'classic' }]],
  plugins: ['@babel/plugin-transform-block-scoping'],
  compact: false,
  comments: false,
  sourceType: 'script',
});
process.stdout.write(result.code);
