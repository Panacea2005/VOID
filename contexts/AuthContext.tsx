'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSupabase } from './SupabaseContext';
import { ProfileData, getProfileByWalletAddress, createOrUpdateProfile } from '@/lib/supabase/profileService';

// Auth context type definition
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  profile: ProfileData | null;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (profileData: Partial<ProfileData>) => Promise<ProfileData | null>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const hasCheckedAuth = useRef<boolean>(false);
  
  const { publicKey, signMessage, disconnect } = useWallet();
  const { supabase } = useSupabase();

  // Check authentication status on mount only
  useEffect(() => {
    // Only run once on initial mount
    if (!hasCheckedAuth.current) {
      const checkAuthAndProfile = async () => {
        setIsLoading(true);
        try {
          if (!publicKey) {
            setIsAuthenticated(false);
            setProfile(null);
            setIsLoading(false);
            return;
          }

          // Check if user is authenticated with Supabase
          const { data: { session } } = await supabase.auth.getSession();
          
          // If session exists, user is authenticated
          if (session) {
            setIsAuthenticated(true);
            
            // Fetch user profile
            const walletAddress = publicKey.toString();
            const userProfile = await getProfileByWalletAddress(walletAddress);
            setProfile(userProfile);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error checking authentication:', error);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
          hasCheckedAuth.current = true;
        }
      };

      checkAuthAndProfile();
    }
  }, []);

  // Update when wallet changes (but not constantly)
  useEffect(() => {
    const updateForWalletChange = async () => {
      if (!publicKey) {
        setIsAuthenticated(false);
        setProfile(null);
        return;
      }

      // If we've already done the initial check, update profile for wallet change
      if (hasCheckedAuth.current) {
        try {
          setIsLoading(true);
          // Fetch user profile for the new wallet
          const walletAddress = publicKey.toString();
          const userProfile = await getProfileByWalletAddress(walletAddress);
          
          if (userProfile) {
            setProfile(userProfile);
            // Don't change auth state here - that happens through login/logout
          } else {
            setProfile(null);
          }
        } catch (error) {
          console.error('Error updating profile for wallet change:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    updateForWalletChange();
  }, [publicKey]);

  // Login with wallet - only called explicitly by user action
  const login = async (): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      console.error('Wallet not connected or signMessage not available');
      return false;
    }

    setIsLoading(true);
    try {
      // Create a message for the user to sign
      const message = `Login to VOID NFT Platform\nWallet: ${publicKey.toString()}\nTimestamp: ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);
      
      // Get signature from wallet
      const signature = await signMessage(encodedMessage);
      
      // Sign in with Supabase - simplified for demo
      const { error } = await supabase.auth.signInWithPassword({
        email: `${publicKey.toString()}@phantom.wallet`, // Virtual email using wallet address
        password: process.env.NEXT_PUBLIC_WALLET_AUTH_SECRET || 'default-secret',
      });
      
      if (error) {
        console.error('Login error:', error);
        return false;
      }
      
      setIsAuthenticated(true);
      
      // Create or get user profile
      const walletAddress = publicKey.toString();
      let userProfile = await getProfileByWalletAddress(walletAddress);
      
      // If no profile exists, create a default one
      if (!userProfile) {
        userProfile = await createOrUpdateProfile({
          wallet_address: walletAddress,
          username: `VOID_${walletAddress.substring(0, 6)}`,
        });
      }
      
      setProfile(userProfile);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout - only called explicitly by user action
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setProfile(null);
      
      // Disconnect wallet
      if (disconnect) {
        await disconnect();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh profile data - called by components when needed
  const refreshProfile = async (): Promise<void> => {
    if (!publicKey) return;
    
    try {
      const walletAddress = publicKey.toString();
      const userProfile = await getProfileByWalletAddress(walletAddress);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Update profile - called by components when needed
  const updateProfile = async (profileData: Partial<ProfileData>): Promise<ProfileData | null> => {
    if (!publicKey || !isAuthenticated) return null;
    
    try {
      const walletAddress = publicKey.toString();
      const updatedProfile = await createOrUpdateProfile({
        wallet_address: walletAddress,
        username: profileData.username || `VOID_${walletAddress.substring(0, 6)}`,
        ...profileData,
      });
      
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
      
      return updatedProfile;
    } catch (error) {
      console.error('Error updating profile:', error);
      return null;
    }
  };

  // Context value
  const value = {
    isAuthenticated,
    isLoading,
    profile,
    login,
    logout,
    refreshProfile,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Default export for dynamic import
export default AuthProvider;