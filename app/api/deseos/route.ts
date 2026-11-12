import { db } from '@/lib/db';
import {
  construirEstado,
  ErrorUsuario,
  leerCuerpo,
  participanteActual,
  responder,
} from '@/lib/estado';

export async function POST(req: Request) {
  return responder(async () => {
    const yo = await participanteActual();
    if (!yo) throw new ErrorUsuario('Primero inscríbete.', 401);

    const cuerpo = await leerCuerpo(req);
    const deseos = (Array.isArray(cuerpo.deseos) ? cuerpo.deseos : [])
      .filter((d: unknown): d is string => typeof d === 'string')
      .map((d: string) => d.trim().slice(0, 120))
      .filter((d: string) => d.length > 0)
      .slice(0, 10);
    const nota = typeof cuerpo.nota === 'string' ? cuerpo.nota.trim().slice(0, 300) : '';

    await db()`
      UPDATE participantes
      SET deseos = ${JSON.stringify(deseos)}::jsonb, nota = ${nota}
      WHERE id = ${yo.id}`;
    return construirEstado();
  });
}
