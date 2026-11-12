import { db } from '@/lib/db';
import {
  construirEstado,
  ErrorUsuario,
  participanteActual,
  responder,
  sorteoHecho,
} from '@/lib/estado';

// "Sacar mi papelito": revela a esta persona (y solo a ella) quién le tocó.
export async function POST() {
  return responder(async () => {
    const yo = await participanteActual();
    if (!yo) throw new ErrorUsuario('Primero inscríbete.', 401);
    if (!(await sorteoHecho())) {
      throw new ErrorUsuario('El sorteo todavía no se ha hecho. Falta que el organizador lo active.', 409);
    }
    if (!yo.asignado_a) {
      throw new ErrorUsuario('No quedaste dentro del sorteo. Avísale al organizador.', 409);
    }
    await db()`
      UPDATE participantes
      SET revelado_en = COALESCE(revelado_en, now())
      WHERE id = ${yo.id}`;
    return construirEstado();
  });
}
