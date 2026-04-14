export type ProductCategory =
  | 'promos'
  | 'cervezas'
  | 'destilados'
  | 'vinos'
  | 'mixers'
  | 'snacks'
  | 'cigarros'
  | 'otros';

export type OrderStatus = 'pendiente' | 'confirmado' | 'en_ruta' | 'entregado' | 'cancelado';
export type PaymentMethod = 'transferencia' | 'efectivo' | 'webpay' | 'flow';
export type PaymentStatus = 'pendiente' | 'confirmado' | 'fallido' | 'reembolsado';
export type DriverVehicle = 'moto' | 'auto' | 'bicicleta' | 'a_pie';

export interface StoreZone {
  id: string;
  store_id: string;
  name: string;
  comuna: string;
  delivery_fee: number;
  min_order: number;
  estimated_time: string;
  is_active: boolean;
  sort_order: number;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  address: string;
  comuna: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  schedule: Record<string, unknown>;
  is_active: boolean;
  is_approved: boolean;
  allow_cash: boolean;
  allow_transfer: boolean;
  bank_details: Record<string, unknown>;
  store_zones?: StoreZone[];
  products?: Product[];
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  promo_price: number | null;
  category: ProductCategory;
  image_url: string | null;
  stock_status: 'disponible' | 'poco_stock' | 'agotado';
  is_available: boolean;
  sort_order: number;
}

export interface Driver {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  vehicle: DriverVehicle;
  is_active: boolean;
  current_status: 'disponible' | 'asignado' | 'en_ruta' | 'inactivo';
  access_token: string;
  last_latitude: number | null;
  last_longitude: number | null;
  last_location_at: string | null;
}

export interface OrderItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface AddressSelection {
  addressLine: string;
  addressRef?: string;
  comuna: string;
  formattedAddress?: string;
  placeId?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PublicTrackingResponse {
  order_id: string;
  order_code: string;
  status: OrderStatus;
  store_name: string;
  driver_name: string | null;
  driver_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  last_location_at: string | null;
  customer_name: string;
  address_line: string;
  address_ref: string | null;
  estimated_time: string | null;
}
