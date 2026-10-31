const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../prisma/dev.db');
const targetPath = path.resolve(__dirname, '../src/lib/db-seed-binary.ts');

if (fs.existsSync(dbPath)) {
  const data = fs.readFileSync(dbPath);
  const b64 = data.toString('base64');
  const code = `// Auto-generated pre-seeded SQLite database for zero-config serverless deployments (Vercel, AWS Lambda)
export const SEED_DB_BASE64 = "${b64}";
`;
  fs.writeFileSync(targetPath, code, 'utf8');
  console.log(`Generated ${targetPath} with ${b64.length} base64 characters.`);
} else {
  console.error("prisma/dev.db not found at:", dbPath);
}
