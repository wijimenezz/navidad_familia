import { cerrarSesion, construirEstado, responder } from '@/lib/estado';

export async function POST() {
  return responder(async () => {
    await cerrarSesion();
    return construirEstado(null);
  });
}
