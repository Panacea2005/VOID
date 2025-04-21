'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create context type
type SupabaseContextType = {
  supabase: SupabaseClient;
};

// Create the context
const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Export the provider component
export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  // Initialize Supabase client
  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
    }
    
    return createClient(supabaseUrl, supabaseAnonKey);
  });

  // Optional initialization or listeners
  useEffect(() => {
    // You could add auth state listeners or other initialization here
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Supabase auth event: ${event}`, session);
    });
    
    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Export the context hook
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}

// Default export for dynamic import
export default SupabaseProvider;