import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const admin = getSupabaseAdmin();
    const { error } = await admin.rpc('upsert_driver_location_by_token', {
      p_access_token: body.accessToken,
      p_order_id: body.orderId,
      p_latitude: body.latitude,
      p_longitude: body.longitude,
      p_accuracy_meters: body.accuracy ?? null,
      p_heading: body.heading ?? null,
      p_speed_mps: body.speed ?? null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo actualizar ubicación' },
      { status: 500 },
    );
  }
}
