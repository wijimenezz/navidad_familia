import { db, filas, prepararDb } from '@/lib/db';
import { construirEstado, ErrorUsuario, guardarSesion, leerCuerpo, responder } from '@/lib/estado';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// "Ya me inscribí": la persona elige su nombre y este dispositivo queda
// asociado a ella. No hay clave, es un acuerdo de confianza entre la familia.
export async function POST(req: Request) {
  return responder(async () => {
    const { id } = await leerCuerpo(req);
    if (typeof id !== 'string' || !UUID.test(id)) throw new ErrorUsuario('Elige tu nombre de la lista.');
    await prepararDb();
    const r = await filas(db()`SELECT token FROM participantes WHERE id = ${id}`);
    if (!r[0]) throw new ErrorUsuario('Ese participante ya no existe.', 404);
    await guardarSesion(r[0].token);
    return construirEstado(r[0].token);
  });
}
