#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcrypt');

async function main() {
  const code = process.argv[2];
  if (!code) {
    console.error('Usage: node scripts/generateAccessHash.js <code>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(code, 10);
  console.log(hash);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
