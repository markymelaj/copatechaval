import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = getSupabaseAdmin();
    const { error } = await admin.rpc('mark_order_delivered_by_driver', {
      p_access_token: body.accessToken,
      p_order_id: body.orderId,
      p_cash_amount: body.cashAmount ?? null,
      p_reference: body.reference ?? null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo marcar entregado' },
      { status: 500 },
    );
  }
}
