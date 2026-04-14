import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { generateOrderCode } from '@/lib/order-code';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const required = ['store_slug', 'zone_id', 'customer_name', 'customer_phone', 'address_line', 'comuna', 'payment_method', 'items'];
    for (const field of required) {
      if (!body[field] || (Array.isArray(body[field]) && !body[field].length)) {
        return NextResponse.json({ error: `Falta ${field}` }, { status: 400 });
      }
    }

    const admin = getSupabaseAdmin();
    const { data: store, error: storeError } = await admin
      .from('stores')
      .select('id, slug, name, is_active, is_approved, allow_cash, allow_transfer')
      .eq('slug', body.store_slug)
      .single();

    if (storeError || !store || !store.is_active || !store.is_approved) {
      return NextResponse.json({ error: 'La tienda no está disponible.' }, { status: 400 });
    }

    const { data: zone, error: zoneError } = await admin
      .from('store_zones')
      .select('*')
      .eq('id', body.zone_id)
      .eq('store_id', store.id)
      .eq('is_active', true)
      .single();

    if (zoneError || !zone) {
      return NextResponse.json({ error: 'Zona de reparto no válida.' }, { status: 400 });
    }

    const ids = body.items.map((item: any) => item.product_id);
    const { data: products, error: productsError } = await admin
      .from('products')
      .select('id, name, price, promo_price, is_available')
      .eq('store_id', store.id)
      .in('id', ids);

    if (productsError) throw productsError;

    const productMap = new Map((products || []).map((product: any) => [product.id, product]));

    let subtotal = 0;
    const normalizedItems: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }> = body.items.map((item: any) => {
      const product = productMap.get(item.product_id);
      if (!product || !product.is_available) {
        throw new Error('Hay productos inválidos o no disponibles en el carrito.');
      }
      const unit = product.promo_price ?? product.price;
      const qty = Number(item.quantity || 0);
      const lineTotal = unit * qty;
      subtotal += lineTotal;
      return {
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: unit,
        line_total: lineTotal,
      };
    });

    if (subtotal < zone.min_order) {
      return NextResponse.json({ error: `El pedido mínimo para esta zona es ${zone.min_order}.` }, { status: 400 });
    }

    const total = subtotal + zone.delivery_fee;

    const { data: customer } = await admin
      .from('customers')
      .insert({
        name: body.customer_name,
        phone: body.customer_phone,
        email: body.customer_email || null,
        default_address: body.address_line,
        default_address_ref: body.address_ref || null,
        default_comuna: body.comuna,
        default_place_id: body.place_id || null,
        default_formatted_address: body.formatted_address || null,
        default_latitude: body.latitude ?? null,
        default_longitude: body.longitude ?? null,
      })
      .select('id')
      .single();

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        order_code: generateOrderCode(),
        channel: body.channel || 'direct',
        store_id: store.id,
        zone_id: zone.id,
        customer_id: customer?.id || null,
        status: 'pendiente',
        payment_method: body.payment_method,
        payment_status: 'pendiente',
        subtotal,
        delivery_fee: zone.delivery_fee,
        total,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email || null,
        address_line: body.address_line,
        address_ref: body.address_ref || null,
        comuna: body.comuna,
        formatted_address: body.formatted_address || null,
        place_id: body.place_id || null,
        delivery_latitude: body.latitude ?? null,
        delivery_longitude: body.longitude ?? null,
        zone_name_snapshot: zone.name,
        notes: body.notes || null,
      })
      .select('id, order_code, tracking_token')
      .single();

    if (orderError || !order) throw orderError;

    const { error: itemsError } = await admin.from('order_items').insert(
      normalizedItems.map((item: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        line_total: number;
      }) => ({
        order_id: order.id,
        ...item,
      })),
    );
    if (itemsError) throw itemsError;

    if (body.payment_method === 'transferencia') {
      await admin.from('payments').insert({
        order_id: order.id,
        method: 'transferencia',
        amount: total,
        delivery_fee: zone.delivery_fee,
        status: 'pendiente',
      });
    }

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        order_code: order.order_code,
        tracking_token: order.tracking_token,
        total,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear el pedido' },
      { status: 500 },
    );
  }
}
