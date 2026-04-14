import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = getSupabaseAdmin();
    const { error } = await admin.rpc('set_order_en_route_by_driver', {
      p_access_token: body.accessToken,
      p_order_id: body.orderId,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo marcar en ruta' },
      { status: 500 },
    );
  }
}
