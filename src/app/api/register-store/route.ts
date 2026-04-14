import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();
    if (!token) return NextResponse.json({ error: 'Falta token de sesión.' }, { status: 401 });

    const body = await request.json();
    const required = ['name', 'slug', 'address', 'comuna'];
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `Falta ${field}` }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const userResult = await admin.auth.getUser(token);
    if (userResult.error || !userResult.data.user) {
      return NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 });
    }

    const user = userResult.data.user;

    const { data: existingSlug } = await admin.from('stores').select('id').eq('slug', body.slug).maybeSingle();
    if (existingSlug) {
      return NextResponse.json({ error: 'Ese slug ya está en uso.' }, { status: 409 });
    }

    const { data: store, error: storeError } = await admin
      .from('stores')
      .insert({
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        address: body.address,
        comuna: body.comuna,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        email: body.email || user.email || null,
        created_by: user.id,
        schedule: {
          lun: { open: '20:00', close: '02:00' },
          mar: { open: '20:00', close: '02:00' },
          mie: { open: '20:00', close: '02:00' },
          jue: { open: '20:00', close: '03:00' },
          vie: { open: '20:00', close: '04:00' },
          sab: { open: '20:00', close: '04:00' },
          dom: null,
        },
      })
      .select('*')
      .single();

    if (storeError) {
      return NextResponse.json({ error: storeError.message }, { status: 400 });
    }

    const { error: memberError } = await admin.from('store_members').insert({
      store_id: store.id,
      user_id: user.id,
      role: 'admin',
    });
    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }

    const defaultZones = [
      { name: 'Zona principal', comuna: body.comuna, delivery_fee: 2000, min_order: 0, estimated_time: '20-30 min', sort_order: 1 },
    ];
    await admin.from('store_zones').insert(defaultZones.map((zone: any) => ({ ...zone, store_id: store.id })));

    return NextResponse.json({ ok: true, store });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo registrar la boti.' },
      { status: 500 },
    );
  }
}
