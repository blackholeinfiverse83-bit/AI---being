import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple hash function for passwords (in production, use bcrypt on backend)
const hashPassword = (password: string): string => {
  // This is a simple hash for demonstration
  // In production, passwords should be hashed on the server with bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useSupabase, setUseSupabase] = useState(isSupabaseConfigured);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = async () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (useSupabase && isSupabaseConfigured) {
        // Query Supabase User table
        const { data: userData, error: userError } = await supabase
          .from('User')
          .select('*')
          .eq('email', email)
          .single();

        if (userError || !userData) {
          throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (!userData.isActive) {
          throw new Error('Account is deactivated');
        }

        // Verify password
        const hashedPassword = hashPassword(password);
        if (userData.password !== hashedPassword) {
          throw new Error('Invalid email or password');
        }

        // Update last login
        await supabase
          .from('User')
          .update({ lastLoginAt: new Date().toISOString() })
          .eq('id', userData.id);

        // Create session token
        const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await supabase
          .from('Session')
          .insert([
            {
              token,
              userId: userData.id,
              expiresAt: expiresAt.toISOString(),
            },
          ]);

        const userInfo = { 
          id: userData.id, 
          email: userData.email, 
          name: userData.name 
        };
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
      } else {
        // Fallback to localStorage
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const foundUser = users.find((u: any) => u.email === email && u.password === password);
        
        if (!foundUser) {
          throw new Error('Invalid email or password');
        }

        const token = `token-${Date.now()}`;
        const userData = { id: foundUser.id, email: foundUser.email, name: foundUser.name };
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      if (useSupabase && isSupabaseConfigured) {
        // Check if email already exists
        const { data: existingUser } = await supabase
          .from('User')
          .select('email')
          .eq('email', email)
          .single();

        if (existingUser) {
          throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = hashPassword(password);

        // Insert new user
        const { data: newUser, error: insertError } = await supabase
          .from('User')
          .insert([
            {
              email,
              password: hashedPassword,
              name,
              isEmailVerified: false,
              isActive: true,
            },
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error('Failed to create account');
        }

        // Create session
        const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await supabase
          .from('Session')
          .insert([
            {
              token,
              userId: newUser.id,
              expiresAt: expiresAt.toISOString(),
            },
          ]);

        const userInfo = { 
          id: newUser.id, 
          email: newUser.email, 
          name: newUser.name 
        };
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
      } else {
        // Fallback to localStorage
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.find((u: any) => u.email === email)) {
          throw new Error('Email already registered');
        }

        const newUser = {
          id: `user-${Date.now()}`,
          name,
          email,
          password,
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        const token = `token-${Date.now()}`;
        const userData = { id: newUser.id, email: newUser.email, name: newUser.name };
        
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear local session
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
