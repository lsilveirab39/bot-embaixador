import "dotenv/config";
import { readFile } from "node:fs/promises";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não definida");

const migrationPath = process.argv[2];
if (!migrationPath) throw new Error("Uso: tsx scripts/run-migration.ts sql/<arquivo>.sql");

const pool = new pg.Pool({ connectionString: databaseUrl });
const sql = await readFile(migrationPath, "utf8");
try {
  await pool.query(sql);
  console.log(`Migração ${migrationPath} aplicada com sucesso.`);
} catch (error) {
  console.error("Erro na migração:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
