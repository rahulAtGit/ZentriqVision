import { create } from 'zustand';
import { authService, AuthUser, SignUpData, SignInData, AuthError } from '../services/auth';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  initializeAuth: () => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  // Actions
  initializeAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        set({ user, isAuthenticated: !!user, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Initialize auth error:', error);
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize authentication' 
      });
    }
  },

  signIn: async (data: SignInData) => {
    set({ isLoading: true, error: null });
    try {
      await authService.signIn(data);
      const user = await authService.getCurrentUser();
      set({ user, isAuthenticated: !!user, isLoading: false });
    } catch (error) {
      console.error('Sign in error:', error);
      const authError = error as AuthError;
      set({ 
        isLoading: false, 
        error: authError.message || 'Failed to sign in' 
      });
    }
  },

  signUp: async (data: SignUpData) => {
    set({ isLoading: true, error: null });
    try {
      await authService.signUp(data);
      set({ isLoading: false });
    } catch (error) {
      console.error('Sign up error:', error);
      const authError = error as AuthError;
      set({ 
        isLoading: false, 
        error: authError.message || 'Failed to sign up' 
      });
    }
  },

  confirmSignUp: async (email: string, code: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.confirmSignUp(email, code);
      set({ isLoading: false });
    } catch (error) {
      console.error('Confirm sign up error:', error);
      const authError = error as AuthError;
      set({ 
        isLoading: false, 
        error: authError.message || 'Failed to confirm sign up' 
      });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      console.error('Sign out error:', error);
      const authError = error as AuthError;
      set({ 
        isLoading: false, 
        error: authError.message || 'Failed to sign out' 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user: AuthUser | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
