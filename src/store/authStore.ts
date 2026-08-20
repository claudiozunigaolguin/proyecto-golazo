import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  init: () => () => void;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,
  isInitialized: false,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, isLoading: false, isInitialized: true });
      if (data.session) void get().refreshProfile();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isLoading: false });
      if (session) {
        void get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });

    return () => subscription.subscription.unsubscribe();
  },

  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) set({ profile: data });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async ({ email, password, firstName, lastName, phone }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone: phone ?? null },
      },
    });
    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    set({ session: null, profile: null });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },
}));
