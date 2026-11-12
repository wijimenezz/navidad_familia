import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { db, filas, prepararDb, type Fila } from './db';
import { FECHA_ENTREGA } from './config';

export const COOKIE = 'amigo_token';

export async function guardarSesion(token: string) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
}

export async function cerrarSesion() {
  (await cookies()).delete(COOKIE);
}

// Busca al participante de este dispositivo. `token` permite pasar uno recién
// creado (o null para "sin sesión") sin depender de la cookie de la petición.
export async function participanteActual(token?: string | null): Promise<Fila | null> {
  const t = token === undefined ? (await cookies()).get(COOKIE)?.value : token;
  if (!t) return null;
  await prepararDb();
  const r = await filas(
    db()`SELECT id, nombre, deseos, nota, asignado_a, revelado_en
         FROM participantes WHERE token = ${t}`
  );
  return r[0] ?? null;
}

export async function sorteoHecho(): Promise<boolean> {
  await prepararDb();
  const r = await filas(db()`SELECT 1 FROM ajustes WHERE clave = 'sorteo_en'`);
  return r.length > 0;
}

// Lo único que sale del servidor hacia cada celular. Nunca incluye a quién
// le salió cada participante: solo el amigo secreto de quien pregunta, y solo
// después de que esa persona sacó su papelito.
export async function construirEstado(token?: string | null) {
  await prepararDb();
  const yo = await participanteActual(token);
  const lista = await filas(
    db()`SELECT id, nombre, revelado_en IS NOT NULL AS ya_saco
         FROM participantes ORDER BY creado_en`
  );
  const hecho = await sorteoHecho();

  let amigo = null;
  if (yo && yo.revelado_en && yo.asignado_a) {
    const r = await filas(
      db()`SELECT nombre, deseos, nota FROM participantes WHERE id = ${yo.asignado_a}`
    );
    if (r[0]) amigo = { nombre: r[0].nombre, deseos: r[0].deseos ?? [], nota: r[0].nota ?? '' };
  }

  return {
    yo: yo
      ? {
          id: yo.id,
          nombre: yo.nombre,
          deseos: yo.deseos ?? [],
          nota: yo.nota ?? '',
          yaSaco: Boolean(yo.revelado_en),
        }
      : null,
    participantes: lista.map((p) => ({ id: p.id, nombre: p.nombre, yaSaco: Boolean(p.ya_saco) })),
    sorteoHecho: hecho,
    amigo,
    fechaEntrega: FECHA_ENTREGA,
  };
}

export class ErrorUsuario extends Error {
  estado: number;
  constructor(mensaje: string, estado = 400) {
    super(mensaje);
    this.estado = estado;
  }
}

// Envuelve cada ruta: los errores esperados vuelven con su mensaje, el resto
// como un error genérico (el detalle queda en los logs de Vercel).
export async function responder(fn: () => Promise<unknown>) {
  try {
    return NextResponse.json(await fn());
  } catch (e) {
    if (e instanceof ErrorUsuario) {
      return NextResponse.json({ error: e.message }, { status: e.estado });
    }
    console.error(e);
    return NextResponse.json(
      { error: 'Algo falló en el servidor. Intenta de nuevo en un momento.' },
      { status: 500 }
    );
  }
}

export async function leerCuerpo(req: Request): Promise<Fila> {
  try {
    const c = await req.json();
    return c && typeof c === 'object' ? c : {};
  } catch {
    return {};
  }
}
