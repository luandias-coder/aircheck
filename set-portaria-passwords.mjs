// ============================================================
// set-portaria-passwords.mjs
// Rodar na raiz do projeto com DATABASE_URL apontando pro staging:
//   DATABASE_URL="postgres://...staging..." node set-portaria-passwords.mjs
// ============================================================

import bcrypt from "bcryptjs";
import pg from "pg"; // ou use @neondatabase/serverless

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ Defina DATABASE_URL (banco staging)");
  process.exit(1);
}

const PASSWORD = "portaria123";

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  console.log(`🔑 Hash gerado para "${PASSWORD}": ${hash}`);

  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  // Atualizar todas as senhas dos CondominiumUsers
  const result = await client.query(
    `UPDATE "CondominiumUser" SET "passwordHash" = $1, "updatedAt" = NOW() RETURNING id, name, email, role`,
    [hash]
  );

  console.log(`\n✅ ${result.rowCount} porteiros atualizados com senha "${PASSWORD}":`);
  result.rows.forEach((r) => {
    console.log(`   - ${r.name} (${r.email}) [${r.role}]`);
  });

  await client.end();
}

main().catch((e) => {
  console.error("❌ Erro:", e.message);
  process.exit(1);
});
