import { db, filas, prepararDb } from '@/lib/db';
import { ErrorUsuario, leerCuerpo, responder, sorteoHecho } from '@/lib/estado';
import { armarSorteo } from '@/lib/sorteo';
import { MINIMO_PARTICIPANTES } from '@/lib/config';

// El organizador ve quién está inscrito y activa el sorteo, pero esta ruta
// nunca devuelve a quién le salió cada uno.
async function resumen() {
  const lista = await filas(
    db()`SELECT id, nombre, jsonb_array_length(deseos) AS deseos, revelado_en IS NOT NULL AS ya_saco
         FROM participantes ORDER BY creado_en`
  );
  return {
    participantes: lista.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      deseos: Number(p.deseos),
      yaSaco: Boolean(p.ya_saco),
    })),
    sorteoHecho: await sorteoHecho(),
    minimo: MINIMO_PARTICIPANTES,
  };
}

export async function POST(req: Request) {
  return responder(async () => {
    const { clave, accion, id } = await leerCuerpo(req);
    const esperada = process.env.ADMIN_KEY;
    if (!esperada) throw new ErrorUsuario('Falta configurar ADMIN_KEY en el servidor.', 500);
    if (typeof clave !== 'string' || clave !== esperada) throw new ErrorUsuario('Clave incorrecta.', 401);

    await prepararDb();
    const q = db();

    if (accion === 'sortear') {
      if (await sorteoHecho()) throw new ErrorUsuario('El sorteo ya se hizo.', 409);
      const lista = await filas(q`SELECT id FROM participantes`);
      if (lista.length < MINIMO_PARTICIPANTES) {
        throw new ErrorUsuario(`Se necesitan al menos ${MINIMO_PARTICIPANTES} inscritos.`);
      }
      const pares = armarSorteo(lista.map((p) => p.id as string));
      try {
        // Una sola transacción: si dos personas oprimen el botón a la vez, el
        // segundo intento choca con la clave 'sorteo_en' y no cambia nada.
        await q.transaction([
          q`INSERT INTO ajustes (clave, valor) VALUES ('sorteo_en', ${new Date().toISOString()})`,
          ...pares.map(
            ([de, para]) =>
              q`UPDATE participantes SET asignado_a = ${para}, revelado_en = NULL WHERE id = ${de}`
          ),
        ]);
      } catch (e: any) {
        if (e?.code === '23505') throw new ErrorUsuario('El sorteo ya se hizo.', 409);
        throw e;
      }
    } else if (accion === 'eliminar') {
      if (await sorteoHecho()) {
        throw new ErrorUsuario('Ya no se puede quitar a nadie: el sorteo ya se hizo. Reinícialo primero.', 409);
      }
      if (typeof id !== 'string') throw new ErrorUsuario('Falta el participante.');
      await q`DELETE FROM participantes WHERE id = ${id}`;
    } else if (accion === 'reiniciar') {
      await q.transaction([
        q`UPDATE participantes SET asignado_a = NULL, revelado_en = NULL`,
        q`DELETE FROM ajustes WHERE clave = 'sorteo_en'`,
      ]);
    } else if (accion !== 'estado') {
      throw new ErrorUsuario('Acción desconocida.');
    }

    return resumen();
  });
}
