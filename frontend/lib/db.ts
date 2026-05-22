import "server-only";

import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? "3306"),
  user: process.env.DB_USER ?? "admin",
  password: process.env.DB_PASSWORD ?? "adminpwrd",
  database: process.env.DB_NAME ?? "classicmodels",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  decimalNumbers: true,
  dateStrings: true
});

export async function query<T>(sql: string, values: Record<string, unknown> = {}) {
  const [rows] = await pool.query(sql, values as never);
  return rows as T[];
}

export async function execute(sql: string, values: Record<string, unknown> = {}) {
  const [result] = await pool.execute(sql, values as never);
  return result;
}
