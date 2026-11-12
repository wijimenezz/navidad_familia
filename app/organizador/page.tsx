'use client';

import { useState } from 'react';
import { Luces } from '../adornos';

type Resumen = {
  participantes: { id: string; nombre: string; deseos: number; yaSaco: boolean }[];
  sorteoHecho: boolean;
  minimo: number;
};

export default function Organizador() {
  const [clave, setClave] = useState('');
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function accion(nombre: string, id?: string) {
    setOcupado(true);
    setError('');
    try {
      const r = await fetch('/api/organizador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave, accion: nombre, id }),
      });
      const datos = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(datos.error || 'Algo salió mal.');
      setResumen(datos);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal.');
    } finally {
      setOcupado(false);
    }
  }

  if (!resumen) {
    return (
      <main className="pantalla">
        <Luces />
        <form
          className="contenido"
          onSubmit={(e) => {
            e.preventDefault();
            accion('estado');
          }}
        >
          <div className="encabezado">
            <div className="sobretitulo">Organizador</div>
            <h1>Activar el sorteo</h1>
            <p className="bajada">Esta página es solo para quien organiza el amigo secreto.</p>
          </div>
          <div className="tarjeta">
            <div className="campo">
              <label htmlFor="clave">Clave del organizador</label>
              <input id="clave" type="password" value={clave} onChange={(e) => setClave(e.target.value)} required />
            </div>
            {error && <p className="error" role="alert">{error}</p>}
            <button className="boton" type="submit" disabled={ocupado}>
              Entrar
            </button>
          </div>
        </form>
      </main>
    );
  }

  const total = resumen.participantes.length;
  const faltan = Math.max(0, resumen.minimo - total);

  return (
    <main className="pantalla">
      <Luces />
      <div className="contenido">
        <div className="encabezado">
          <div className="sobretitulo">Organizador</div>
          <h1>{resumen.sorteoHecho ? 'Sorteo hecho' : `${total} inscritos`}</h1>
          <p className="bajada">
            {resumen.sorteoHecho
              ? 'Cada persona ya puede sacar su papelito. Aquí no se muestra a quién le salió cada uno.'
              : 'Cuando estén todos, activa el sorteo. Después ya no se puede inscribir nadie más.'}
          </p>
        </div>

        <ul className="tarjeta lista">
          {total === 0 && <li><span>Todavía no hay inscritos</span></li>}
          {resumen.participantes.map((p) => (
            <li key={p.id}>
              <span>
                {p.nombre}
                <span className="ayuda" style={{ display: 'block', fontWeight: 600 }}>
                  {p.deseos === 0 ? 'Sin lista de deseos' : `${p.deseos} ${p.deseos === 1 ? 'deseo' : 'deseos'}`}
                </span>
              </span>
              {resumen.sorteoHecho ? (
                <span className={p.yaSaco ? 'chip' : 'chip hueco'}>{p.yaSaco ? 'Ya sacó' : 'Pendiente'}</span>
              ) : (
                <button
                  className="enlace oscuro"
                  disabled={ocupado}
                  onClick={() => {
                    if (window.confirm(`¿Quitar a ${p.nombre} del amigo secreto?`)) accion('eliminar', p.id);
                  }}
                >
                  Quitar
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="abajo">
          {error && <p className="error" role="alert">{error}</p>}
          {!resumen.sorteoHecho ? (
            <>
              <button
                className="boton gigante"
                disabled={ocupado || faltan > 0}
                onClick={() => {
                  if (window.confirm(`¿Cerrar inscripciones y sortear entre ${total} personas?`)) accion('sortear');
                }}
              >
                Cerrar y sortear
              </button>
              {faltan > 0 && (
                <p className="ayuda clara" style={{ margin: 0 }}>
                  Faltan {faltan} {faltan === 1 ? 'persona' : 'personas'} para poder sortear.
                </p>
              )}
            </>
          ) : (
            <button
              className="boton borde"
              disabled={ocupado}
              onClick={() => {
                if (window.confirm('¿Reiniciar el sorteo? Se borra quién le salió a cada uno y se vuelve a abrir la inscripción.')) {
                  accion('reiniciar');
                }
              }}
            >
              Reiniciar sorteo
            </button>
          )}
          <button className="enlace" disabled={ocupado} onClick={() => accion('estado')}>
            Actualizar lista
          </button>
        </div>
      </div>
    </main>
  );
}
