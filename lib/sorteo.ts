import { randomInt } from 'crypto';

// Arma el sorteo completo de una vez: baraja a los participantes y cada uno
// le regala al siguiente de la fila (el último al primero). Así nadie se sale
// a sí mismo, todos dan un regalo y todos reciben uno.
export function armarSorteo(ids: string[]): [string, string][] {
  if (ids.length < 2) throw new Error('Se necesitan al menos 2 participantes');
  const fila = [...ids];
  for (let i = fila.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [fila[i], fila[j]] = [fila[j], fila[i]];
  }
  return fila.map((de, i) => [de, fila[(i + 1) % fila.length]]);
}
