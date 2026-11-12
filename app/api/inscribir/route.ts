import { randomBytes } from 'crypto';
import { db, prepararDb } from '@/lib/db';
import {
  construirEstado,
  ErrorUsuario,
  guardarSesion,
  leerCuerpo,
  responder,
  sorteoHecho,
} from '@/lib/estado';

export async function POST(req: Request) {
  return responder(async () => {
    const { nombre: crudo } = await leerCuerpo(req);
    const nombre = typeof crudo === 'string' ? crudo.trim().replace(/\s+/g, ' ') : '';
    if (nombre.length < 2 || nombre.length > 30) {
      throw new ErrorUsuario('Escribe tu nombre (entre 2 y 30 letras).');
    }
    await prepararDb();
    if (await sorteoHecho()) {
      throw new ErrorUsuario('Las inscripciones ya cerraron: el sorteo ya se hizo.', 409);
    }
    const token = randomBytes(24).toString('hex');
    try {
      await db()`INSERT INTO participantes (nombre, token) VALUES (${nombre}, ${token})`;
    } catch (e: any) {
      if (e?.code === '23505') {
        throw new ErrorUsuario(
          'Ya hay alguien inscrito con ese nombre. Si eres tú, usa "Ya me inscribí".',
          409
        );
      }
      throw e;
    }
    await guardarSesion(token);
    return construirEstado(token);
  });
}
