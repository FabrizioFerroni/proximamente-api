import { SQLStatement } from "sql-template-strings";

export function buildRawQuery(query: SQLStatement): string {
  const raw = query as any; // forzar acceso
  let result = "";
  raw.strings.forEach((str: string, i: number) => {
    result += str;
    if (i < raw.values.length) {
      const val = raw.values[i];
      result +=
        typeof val === "string"
          ? `'${val.replace(/'/g, "''")}'`
          : val instanceof Date
          ? `'${val.toISOString()}'`
          : val;
    }
  });
  return result;
}
