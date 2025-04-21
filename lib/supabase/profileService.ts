import { supabase } from './supabaseClient';

export interface ProfileData {
  id?: string;
  wallet_address: string;
  username: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getProfileByWalletAddress(walletAddress: string): Promise<ProfileData | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching profile:', error);
    return null;
  }
}

export async function createOrUpdateProfile(profileData: ProfileData): Promise<ProfileData | null> {
  try {
    // Check if profile exists
    const existingProfile = await getProfileByWalletAddress(profileData.wallet_address);
    
    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', profileData.wallet_address)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return null;
      }

      return data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            wallet_address: profileData.wallet_address,
            username: profileData.username,
            avatar_url: profileData.avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select('*')
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Exception updating profile:', error);
    return null;
  }
}

export async function uploadAvatar(file: File, walletAddress: string): Promise<string | null> {
  try {
    // Create a unique file path using wallet address and timestamp
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${walletAddress}/${Date.now()}.${fileExt}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Exception uploading avatar:', error);
    return null;
  }
}