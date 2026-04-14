export function clp(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function statusLabel(status?: string) {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    en_ruta: 'En ruta',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };
  return labels[status || ''] || status || '-';
}

export function categoryLabel(category?: string) {
  const labels: Record<string, string> = {
    promos: 'Promos',
    cervezas: 'Cervezas',
    destilados: 'Destilados',
    vinos: 'Vinos',
    mixers: 'Mixers',
    snacks: 'Snacks',
    cigarros: 'Cigarros',
    otros: 'Otros',
  };
  return labels[category || ''] || category || 'Otros';
}

export function safeDate(date?: string | null) {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  } catch {
    return date;
  }
}
