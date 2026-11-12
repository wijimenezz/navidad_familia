import { neon } from '@neondatabase/serverless';

type Sql = ReturnType<typeof neon>;

let sql: Sql | null = null;
let listo: Promise<void> | null = null;

export function db(): Sql {
  if (!sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('Falta la variable de entorno DATABASE_URL');
    sql = neon(url);
  }
  return sql;
}

// Crea las tablas la primera vez. No hay que correr migraciones a mano.
export function prepararDb(): Promise<void> {
  if (!listo) {
    const q = db();
    listo = (async () => {
      await q`
        CREATE TABLE IF NOT EXISTS participantes (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          nombre text NOT NULL,
          token text NOT NULL UNIQUE,
          deseos jsonb NOT NULL DEFAULT '[]'::jsonb,
          nota text NOT NULL DEFAULT '',
          asignado_a uuid REFERENCES participantes(id) ON DELETE SET NULL,
          revelado_en timestamptz,
          creado_en timestamptz NOT NULL DEFAULT now()
        )`;
      await q`
        CREATE UNIQUE INDEX IF NOT EXISTS participantes_nombre_unico
        ON participantes (lower(nombre))`;
      await q`
        CREATE TABLE IF NOT EXISTS ajustes (
          clave text PRIMARY KEY,
          valor text NOT NULL
        )`;
    })().catch((e) => {
      listo = null;
      throw e;
    });
  }
  return listo;
}

export type Fila = Record<string, any>;

export async function filas(consulta: Promise<unknown>): Promise<Fila[]> {
  return (await consulta) as Fila[];
}
