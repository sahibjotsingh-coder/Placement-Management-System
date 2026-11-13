const bcrypt = require('bcryptjs');

async function main() {
  const passwords = ['admin123', 'test123'];
  for (const pw of passwords) {
    const hash = await bcrypt.hash(pw, 10);
    // Print on ONE line — no wrapping
    process.stdout.write(`"${pw}": "${hash}"\n`);
  }
}

main();