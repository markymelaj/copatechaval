import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.nextUrl.searchParams.get('accessToken');
    if (!accessToken) return NextResponse.json({ error: 'Falta accessToken' }, { status: 400 });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc('get_driver_active_orders', {
      p_access_token: accessToken,
    });
    if (error) throw error;
    return NextResponse.json({ orders: data || [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo obtener pedidos del repartidor' },
      { status: 500 },
    );
  }
}
