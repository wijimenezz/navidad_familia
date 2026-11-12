import { construirEstado, responder } from '@/lib/estado';

export const dynamic = 'force-dynamic';

export async function GET() {
  return responder(() => construirEstado());
}
