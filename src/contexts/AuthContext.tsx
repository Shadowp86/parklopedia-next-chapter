import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../components/ui';

interface AuthContextType {
  user: any;
  clerkUser: any;
  loading: boolean;
  signUp: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<void>;
}

interface ProfileData {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  avatar_url?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    if (clerkLoaded) {
      if (clerkUser) {
        // Sync Clerk user with Supabase
        syncUserWithSupabase(clerkUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    }
  }, [clerkUser, clerkLoaded]);

  const syncUserWithSupabase = async (clerkUser: any) => {
    try {
      // Check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUser.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
      }

      let userData;

      if (existingUser) {
        // Update existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            email: clerkUser.primaryEmailAddress?.emailAddress,
            full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            avatar_url: clerkUser.imageUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_user_id', clerkUser.id)
          .select()
          .single();

        if (updateError) throw updateError;
        userData = updatedUser;
      } else {
        // Create new user
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            clerk_user_id: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            avatar_url: clerkUser.imageUrl,
            role: 'owner',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        userData = newUser;
      }

      setUser(userData);
    } catch (error) {
      console.error('Error syncing user with Supabase:', error);
      showToast('error', 'Failed to sync user data');
      // Fallback to mock user for development
      const mockUser = {
        id: clerkUser.id,
        clerk_user_id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        full_name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        avatar_url: clerkUser.imageUrl,
        role: 'owner',
      };
      setUser(mockUser);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async () => {
    // Clerk handles signup through its components
    showToast('success', 'Account created successfully!');
  };

  const signIn = async () => {
    // Clerk handles signin through its components
    showToast('success', 'Welcome back!');
  };

  const signOut = async () => {
    try {
      await clerkSignOut();
      setUser(null);
      showToast('success', 'Signed out successfully');
    } catch (error) {
      showToast('error', 'Failed to sign out');
      throw error;
    }
  };

  const updateProfile = async (data: ProfileData) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setUser({ ...user, ...data });
      showToast('success', 'Profile updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    clerkUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
