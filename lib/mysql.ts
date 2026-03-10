// lib/mysql.ts
import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  if (!process.env.MYSQL_HOST) {
    throw new Error("[woodiz/mysql] MYSQL_HOST est manquant.");
  }
  return mysql.createPool({
    host:               process.env.MYSQL_HOST     ?? "localhost",
    port:               Number(process.env.MYSQL_PORT ?? 3306),
    user:               process.env.MYSQL_USER     ?? "woodiz",
    password:           process.env.MYSQL_PASSWORD ?? "",
    database:           process.env.MYSQL_DATABASE ?? "woodiz",
    charset:            "utf8mb4",
    timezone:           "+00:00",
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    typeCast(field: any, next: any) {
      if (field.type === "TINY" && field.length === 1) {
        return field.string() === "1";
      }
      if (field.type === "JSON") {
        const val = field.string("utf8");
        if (val === null) return null;
        try { return JSON.parse(val); } catch { return val; }
      }
      return next();
    },
  });
}

export const pool: mysql.Pool =
  globalThis._mysqlPool ?? (globalThis._mysqlPool = createPool());

export async function query<T = Record<string, any>>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function execute(
  sql: string,
  params?: any[]
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}

export async function queryOne<T = Record<string, any>>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
