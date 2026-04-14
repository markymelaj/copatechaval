import { getSupabaseBrowser } from '@/lib/supabase/browser';

export async function getCurrentUserContext() {
  const supabase = getSupabaseBrowser();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) throw new Error('No has iniciado sesión');

  const userId = sessionData.session.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name, platform_role')
    .eq('id', userId)
    .single();
  if (profileError) throw profileError;

  const { data: memberships, error: membershipError } = await supabase
    .from('store_members')
    .select('id, role, store_id, stores(id, name, slug, is_approved, is_active)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(5);
  if (membershipError) throw membershipError;

  const list = (memberships ?? []) as any[];
  const primary = list[0] ?? null;

  return {
    session: sessionData.session,
    profile: profile as any,
    memberships: list,
    primaryStore: (primary?.stores as any) || null,
    primaryRole: (primary?.role as any) || null,
  };
}
