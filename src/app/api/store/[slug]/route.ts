import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const admin = getSupabaseAdmin();
    const { data: store, error } = await admin
      .from('stores')
      .select('*, store_zones(*), products(*)')
      .eq('slug', params.slug)
      .single();

    if (error || !store) {
      return NextResponse.json({ error: 'Tienda no encontrada' }, { status: 404 });
    }

    store.store_zones = (store.store_zones || []).filter((zone: any) => zone.is_active).sort((a: any, b: any) => a.sort_order - b.sort_order);
    store.products = (store.products || []).filter((product: any) => product.is_available).sort((a: any, b: any) => a.sort_order - b.sort_order);

    return NextResponse.json({ store });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo cargar la tienda' },
      { status: 500 },
    );
  }
}
