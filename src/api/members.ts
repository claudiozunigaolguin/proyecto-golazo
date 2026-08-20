import { supabase } from '@/lib/supabase';
import type { MemberRole } from '@/types/domain';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type MembershipRow = Database['public']['Tables']['championship_members']['Row'];

export interface ChampionshipMember {
  membershipId: string;
  userId: string;
  role: MemberRole;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
}

export async function listChampionshipMembers(championshipId: string): Promise<ChampionshipMember[]> {
  const { data: memberships, error: membershipsError } = await supabase
    .from('championship_members')
    .select('*')
    .eq('championship_id', championshipId);
  if (membershipsError) throw membershipsError;

  const rows = (memberships ?? []) as MembershipRow[];
  if (rows.length === 0) return [];

  const userIds = rows.map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);
  if (profilesError) throw profilesError;

  const profileById = new Map((profiles ?? []).map((p: Profile) => [p.id, p]));

  return rows.map((m) => {
    const profile = profileById.get(m.user_id);
    return {
      membershipId: m.id,
      userId: m.user_id,
      role: m.role as MemberRole,
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      email: profile?.email ?? '',
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
}

export async function addMemberByEmail(
  championshipId: string,
  email: string,
  role: MemberRole
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (profileError) throw profileError;

  if (!profile) {
    throw new Error(
      'No encontramos una cuenta registrada con ese email. Pídele que se registre primero en PENTAGOLAZO.'
    );
  }

  const { error: insertError } = await supabase
    .from('championship_members')
    .insert({ championship_id: championshipId, user_id: profile.id, role });

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('Ese usuario ya administra este campeonato.');
    }
    throw insertError;
  }
}

export async function removeMember(membershipId: string): Promise<void> {
  const { error } = await supabase.from('championship_members').delete().eq('id', membershipId);
  if (error) throw error;
}
