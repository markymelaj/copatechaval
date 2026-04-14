import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const comuna = request.nextUrl.searchParams.get('comuna')?.trim();
    if (!comuna) return NextResponse.json({ stores: [] });

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('stores')
      .select('id, name, slug, comuna, logo_url, description, is_active, is_approved, store_zones!inner(id, delivery_fee, is_active)')
      .eq('is_active', true)
      .eq('is_approved', true)
      .ilike('store_zones.comuna', comuna)
      .eq('store_zones.is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    const stores = (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      comuna: item.comuna,
      logo_url: item.logo_url,
      description: item.description,
      is_open: true,
      delivery_fee_min: Math.min(...item.store_zones.map((zone: any) => zone.delivery_fee)),
      zones_count: item.store_zones.length,
    }));

    return NextResponse.json({ stores });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar el marketplace' },
      { status: 500 },
    );
  }
}
