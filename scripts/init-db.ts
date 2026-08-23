import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não definida");

// Migrações de dados one-time NÃO entram aqui: reaplicá-las corromperia
// dados já convertidos (ex.: re-hash de IDs). Use npm run db:migrate.
const MIGRACOES_MANUAIS = new Set(["003_hash_existing_ids.sql"]);

const sqlDir = path.resolve("sql");
const arquivos = (await readdir(sqlDir))
  .filter((arquivo) => arquivo.endsWith(".sql") && !MIGRACOES_MANUAIS.has(arquivo))
  .sort();

const pool = new pg.Pool({ connectionString: databaseUrl });
try {
  for (const arquivo of arquivos) {
    const sql = await readFile(path.join(sqlDir, arquivo), "utf8");
    await pool.query(sql);
    console.log(`Aplicado: ${arquivo}`);
  }
  console.log("Banco inicializado com sucesso (schema completo).");
} finally {
  await pool.end();
}
