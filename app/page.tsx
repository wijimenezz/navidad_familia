'use client';

import { useCallback, useEffect, useState } from 'react';
import { ANIO, FAMILIA, PRESUPUESTO } from '@/lib/config';
import { IconoMas, IconoX, Luces, Nieve, Regalo } from './adornos';

type Persona = { id: string; nombre: string; yaSaco: boolean };
type Estado = {
  yo: { id: string; nombre: string; deseos: string[]; nota: string; yaSaco: boolean } | null;
  participantes: Persona[];
  sorteoHecho: boolean;
  amigo: { nombre: string; deseos: string[]; nota: string } | null;
  fechaEntrega: string;
};
type Vista = 'sorteo' | 'deseos' | 'resultado';

async function llamar(ruta: string, cuerpo?: unknown): Promise<Estado> {
  const r = await fetch(`/api/${ruta}`, {
    method: cuerpo === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    cache: 'no-store',
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || 'Algo salió mal. Intenta de nuevo.');
  return datos as Estado;
}

export default function Pagina() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [vista, setVista] = useState<Vista>('sorteo');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);

  // Ejecuta una acción contra el servidor y actualiza la pantalla con la respuesta.
  const hacer = useCallback(async (ruta: string, cuerpo?: unknown, luego?: (e: Estado) => void) => {
    setOcupado(true);
    setError('');
    try {
      const nuevo = await llamar(ruta, cuerpo);
      setEstado(nuevo);
      luego?.(nuevo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo salió mal.');
    } finally {
      setOcupado(false);
    }
  }, []);

  useEffect(() => {
    hacer('estado');
  }, [hacer]);

  let cuerpo;
  if (!estado) {
    cuerpo = (
      <div className="contenido">
        <div className="centro">
          <Regalo lado={120} />
          <p className="bajada" role="status">
            {error || 'Cargando…'}
          </p>
          {error && (
            <button className="enlace" onClick={() => hacer('estado')}>
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  } else if (!estado.yo) {
    cuerpo = <Bienvenida estado={estado} hacer={hacer} ocupado={ocupado} error={error} irADeseos={() => setVista('deseos')} />;
  } else if (vista === 'deseos') {
    cuerpo = <Deseos estado={estado} hacer={hacer} ocupado={ocupado} error={error} volver={() => setVista('sorteo')} />;
  } else if (vista === 'resultado' && estado.amigo) {
    cuerpo = <Resultado estado={estado} volver={() => setVista('sorteo')} />;
  } else {
    cuerpo = <Sorteo estado={estado} hacer={hacer} ocupado={ocupado} error={error} ir={setVista} />;
  }

  return (
    <main className="pantalla">
      <Nieve />
      <Luces />
      {cuerpo}
    </main>
  );
}

type Comun = {
  estado: Estado;
  hacer: (ruta: string, cuerpo?: unknown, luego?: (e: Estado) => void) => Promise<void>;
  ocupado: boolean;
  error: string;
};

function Bienvenida({ estado, hacer, ocupado, error, irADeseos }: Comun & { irADeseos: () => void }) {
  const [nombre, setNombre] = useState('');
  // Si el sorteo ya se hizo no hay inscripciones nuevas: solo se puede entrar.
  const [eligiendo, setEligiendo] = useState(estado.sorteoHecho);

  return (
    <div className="contenido">
      <div className="encabezado centrado">
        <Regalo />
        <div className="sobretitulo">{ANIO}</div>
        <h1 className="grande">Amigo Secreto Navideño</h1>
        <p className="bajada">
          {FAMILIA}. Inscríbete, cuentanos tu lista de regalos y saca tu papelito.
        </p>
      </div>

      {eligiendo ? (
        <div className="tarjeta">
          <h2>¿Quién eres?</h2>
          {estado.participantes.length === 0 ? (
            <p className="ayuda">Todavía no hay nadie inscrito.</p>
          ) : (
            <ul className="lista" style={{ padding: 0 }}>
              {estado.participantes.map((p) => (
                <li key={p.id}>
                  <button className="fila" disabled={ocupado} onClick={() => hacer('entrar', { id: p.id })}>
                    <span>{p.nombre}</span>
                    <span className="chip hueco">Soy yo</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="error" role="alert">{error}</p>}
          {estado.sorteoHecho ? (
            <p className="ayuda">Las inscripciones ya cerraron porque el sorteo ya se hizo.</p>
          ) : (
            <button className="enlace oscuro" onClick={() => setEligiendo(false)}>
              No estoy en la lista, quiero inscribirme
            </button>
          )}
        </div>
      ) : (
        <form
          className="tarjeta"
          onSubmit={(e) => {
            e.preventDefault();
            hacer('inscribir', { nombre }, irADeseos);
          }}
        >
          <div className="campo">
            <label htmlFor="nombre">Tu nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={30}
              autoComplete="given-name"
              placeholder="Como te dicen en la familia"
              required
            />
          </div>
          <p className="ayuda" style={{ margin: 0 }}>
           Entrega de regalos: {estado.fechaEntrega}. <br /> Presupuesto: ${PRESUPUESTO}.
          </p>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="boton" type="submit" disabled={ocupado}>
            {ocupado ? 'Inscribiendo…' : 'Inscribirme'}
          </button>
        </form>
      )}

      {!eligiendo && (
        <div className="abajo">
          <button className="enlace" onClick={() => setEligiendo(true)}>
            ¿Ya te inscribiste? Elige tu nombre
          </button>
        </div>
      )}
    </div>
  );
}

function Deseos({ estado, hacer, ocupado, error, volver }: Comun & { volver: () => void }) {
  const yo = estado.yo!;
  const [deseos, setDeseos] = useState<string[]>(() => {
    const d = [...yo.deseos];
    while (d.length < 3) d.push('');
    return d;
  });
  const [nota, setNota] = useState(yo.nota);

  const cambiar = (i: number, valor: string) => setDeseos((d) => d.map((x, j) => (j === i ? valor : x)));
  const quitar = (i: number) => setDeseos((d) => (d.length > 1 ? d.filter((_, j) => j !== i) : ['']));

  return (
    <form
      className="contenido"
      onSubmit={(e) => {
        e.preventDefault();
        hacer('deseos', { deseos, nota }, volver);
      }}
    >
      <div className="encabezado">
        <div className="sobretitulo">Hola, {yo.nombre}</div>
        <h1>Tu lista de deseos</h1>
        <p className="bajada">Escribe ideas de regalo. Solo las verá la persona a la que le salgas tú.</p>
      </div>

      <div className="tarjeta">
        {deseos.map((d, i) => (
          <div className="deseo" key={i}>
            <div className="numero" aria-hidden="true">{i + 1}</div>
            <input
              id={`deseo-${i}`}
              type="text"
              aria-label={`Deseo ${i + 1}`}
              value={d}
              maxLength={120}
              placeholder={i === 0 ? 'Algo que te gustaría recibir' : 'Otra idea de regalo'}
              onChange={(e) => cambiar(i, e.target.value)}
            />
            <button type="button" className="quitar" aria-label={`Quitar deseo ${i + 1}`} onClick={() => quitar(i)}>
              <IconoX />
            </button>
          </div>
        ))}
        {deseos.length < 10 && (
          <button type="button" className="boton punteado" onClick={() => setDeseos((d) => [...d, ''])}>
            <IconoMas />
            Agregar otro deseo
          </button>
        )}
        <div className="campo">
          <label htmlFor="nota">Nota para quien te regala (opcional)</label>
          <textarea
            id="nota"
            rows={2}
            maxLength={300}
            value={nota}
            placeholder="Tallas, colores, lo que no te gusta…"
            onChange={(e) => setNota(e.target.value)}
          />
        </div>
      </div>

      <div className="abajo">
        {error && <p className="error" role="alert">{error}</p>}
        <button className="boton" type="submit" disabled={ocupado}>
          {ocupado ? 'Guardando…' : 'Guardar mi lista'}
        </button>
        <p className="ayuda clara" style={{ margin: 0 }}>Puedes editarla cuando quieras antes de la entrega.</p>
      </div>
    </form>
  );
}

function Sorteo({ estado, hacer, ocupado, error, ir }: Comun & { ir: (v: Vista) => void }) {
  const yo = estado.yo!;
  const total = estado.participantes.length;
  const sinDeseos = yo.deseos.length === 0;

  return (
    <div className="contenido">
      <div className="encabezado">
        <div className="sobretitulo">Participantes</div>
        <h1>{total === 1 ? 'Eres el primero' : `Ya somos ${total}`}</h1>
        <p className="bajada">
          {estado.sorteoHecho
            ? 'Aquí solo se ve quién ya sacó papelito. Nunca a quién le salió.'
            : 'Cuando estén todos, el organizador activa el sorteo.'}
        </p>
      </div>

      <ul className="tarjeta lista">
        {estado.participantes.map((p) => {
          const soyYo = p.id === yo.id;
          let chip;
          if (!estado.sorteoHecho) chip = <span className={soyYo ? 'chip oro' : 'chip'}>{soyYo ? 'Tú' : 'Inscrito'}</span>;
          else if (p.yaSaco) chip = <span className="chip">Ya sacó</span>;
          else if (soyYo) chip = <span className="chip oro">Te toca</span>;
          else chip = <span className="chip hueco">Pendiente</span>;
          return (
            <li key={p.id} className={soyYo ? 'yo' : undefined}>
              <span>{soyYo ? `${p.nombre} (tú)` : p.nombre}</span>
              {chip}
            </li>
          );
        })}
      </ul>

      <div className="abajo">
        {error && <p className="error" role="alert">{error}</p>}
        {!estado.sorteoHecho ? (
          <>
            <div className="aviso">El sorteo todavía no se ha hecho. Vuelve cuando el organizador avise.</div>
            <button className="enlace" onClick={() => hacer('estado')} disabled={ocupado}>
              Actualizar
            </button>
          </>
        ) : yo.yaSaco ? (
          <button className="boton gigante" onClick={() => ir('resultado')}>
            Ver mi amigo secreto
          </button>
        ) : (
          <>
            <button
              className="boton gigante"
              disabled={ocupado}
              onClick={() => hacer('sacar', {}, (e) => e.amigo && ir('resultado'))}
            >
              {ocupado ? 'Sacando…' : 'Sacar mi papelito'}
            </button>
            <p className="ayuda clara" style={{ margin: 0 }}>
              Asegúrate de que nadie esté mirando tu pantalla. No te puede salir tu propio nombre.
            </p>
          </>
        )}
        <button className="enlace" onClick={() => ir('deseos')}>
          {sinDeseos ? 'Escribir mi lista de deseos' : 'Editar mi lista de deseos'}
        </button>
        <button className="enlace" style={{ fontWeight: 600, fontSize: 14 }} onClick={() => hacer('salir', {})}>
          No soy {yo.nombre}
        </button>
      </div>
    </div>
  );
}

function Resultado({ estado, volver }: { estado: Estado; volver: () => void }) {
  const amigo = estado.amigo!;
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <div className="contenido">
        <div className="encabezado centrado">
          <div className="sobretitulo">Tu papelito está listo</div>
          <h1>Asegúrate de que nadie esté mirando</h1>
        </div>
        <div className="centro">
          <Regalo lado={200} />
        </div>
        <div className="abajo">
          <button className="boton gigante" onClick={() => setAbierto(true)}>
            Destapar mi amigo secreto
          </button>
          <button className="enlace" onClick={volver}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="contenido">
      <div className="encabezado">
        <div className="sobretitulo">Te tocó regalarle a</div>
        <h1 className="enorme">{amigo.nombre}</h1>
      </div>

      <div className="tarjeta">
        <h2>Lo que le gustaría recibir</h2>
        {amigo.deseos.length > 0 ? (
          <ul className="deseos-amigo">
            {amigo.deseos.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className="ayuda" style={{ margin: 0 }}>
            Todavía no ha escrito su lista. Vuelve a mirar más tarde.
          </p>
        )}
        {amigo.nota && (
          <div className="nota">
            <strong>Su nota:</strong> {amigo.nota}
          </div>
        )}
      </div>

      <div className="dato">
        <span>Entrega de regalos</span>
        <span>{estado.fechaEntrega}</span>
      </div>

      <div className="dato">
        <span>Presupuesto</span>
        <span>${PRESUPUESTO}</span>
      </div>

      <div className="abajo">
        <button className="boton borde" onClick={() => setAbierto(false)}>
          Ocultar pantalla
        </button>
        <p className="ayuda clara" style={{ margin: 0 }}>Solo tú puedes ver esto. Guarda el secreto.</p>
      </div>
    </div>
  );
}
