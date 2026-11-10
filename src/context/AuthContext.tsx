import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOfficer: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginWithDemoStaff: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  // Fetch or bootstrap profile for authenticated user
  const fetchProfile = async (currentUser: User) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data as Profile);
      } else if (!error || error.code === 'PGRST116') {
        // No profile found yet: Auto-provision profile as admin if first user or default admin
        const newProfile: Partial<Profile> = {
          id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Church Admin',
          email: currentUser.email || '',
          role: 'admin',
          status: 'active',
        };

        const { data: created, error: createErr } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (!createErr && created) {
          setProfile(created as Profile);
        } else {
          // Fallback in-memory profile so user is not blocked
          setProfile(newProfile as Profile);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback in-memory profile
      setProfile({
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || 'Church Staff',
        email: currentUser.email || '',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    const supabase = getSupabase();

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user);
      }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Insert into public.profiles
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          status: 'active',
        });
      }

      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user);
    }
  };

  const isAdmin = useMemo(() => {
    return profile?.role === 'admin';
  }, [profile]);

  const isOfficer = useMemo(() => {
    return profile?.role === 'attendance_officer' || profile?.role === 'admin';
  }, [profile]);

  const loginWithDemoStaff = (role: UserRole) => {
    const mockUser = {
      id: role === 'admin' ? 'staff-admin-id' : 'staff-officer-id',
      email: role === 'admin' ? 'admin@methodistchurch.org.gh' : 'officer@methodistchurch.org.gh',
      app_metadata: {},
      user_metadata: { full_name: role === 'admin' ? 'Rev. Kwesi Mensah' : 'Bro. Emmanuel Osei' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as unknown as User;

    setUser(mockUser);
    setProfile({
      id: mockUser.id,
      full_name: role === 'admin' ? 'Rev. Kwesi Mensah' : 'Bro. Emmanuel Osei',
      email: mockUser.email || '',
      role,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('mcg_demo_role', role);
    }
  };

  // Restore demo session on mount if was active
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDemo = sessionStorage.getItem('mcg_demo_role') as UserRole | null;
      if (savedDemo && !user) {
        loginWithDemoStaff(savedDemo);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        isAdmin,
        isOfficer,
        isConfigured,
        signIn,
        signUp,
        signOut: async () => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('mcg_demo_role');
          }
          await signOut();
        },
        refreshProfile,
        loginWithDemoStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
