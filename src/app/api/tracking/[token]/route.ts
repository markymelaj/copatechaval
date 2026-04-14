import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: { token: string } }) {
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc('get_order_tracking_by_token', {
      p_tracking_token: params.token,
    });
    if (error) throw error;
    return NextResponse.json({ tracking: data?.[0] || null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo obtener tracking' },
      { status: 500 },
    );
  }
}
