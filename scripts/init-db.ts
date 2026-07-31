import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL não definida");

const pool = new pg.Pool({ connectionString: databaseUrl });
const sql = await readFile(path.resolve("sql/001_init.sql"), "utf8");
try {
  await pool.query(sql);
  console.log("Banco inicializado com sucesso.");
} finally {
  await pool.end();
}
