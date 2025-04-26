import { supabase } from './supabaseClient';
import { getProfileByWalletAddress } from './profileService';
import { useEffect } from 'react';

export interface PixelData {
  id?: string;
  x: number;
  y: number;
  color: string;
  wallet_address: string;
  username?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get all pixels from the canvas
 */
export async function getAllPixels(): Promise<PixelData[]> {
    try {
      // Simplify the query to just get the pixel data directly
      const { data, error } = await supabase
        .from('pixel_canvas')
        .select('*');
  
      if (error) {
        console.error('Error fetching pixels:', error);
        return [];
      }
  
      return data || [];
    } catch (error) {
      console.error('Exception fetching pixels:', error);
      return [];
    }
  }

/**
 * Get pixels by wallet address
 */
export async function getPixelsByWalletAddress(walletAddress: string): Promise<PixelData[]> {
  try {
    const { data, error } = await supabase
      .from('pixel_canvas')
      .select('*')
      .eq('wallet_address', walletAddress);

    if (error) {
      console.error('Error fetching pixels for wallet:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching pixels for wallet:', error);
    return [];
  }
}

/**
 * Place a pixel on the canvas
 */
/**
 * Place a pixel on the canvas
 */
export async function placePixel(pixelData: PixelData): Promise<PixelData | null> {
    try {
      // Check if user is authenticated with Supabase
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Current session:", session ? "Found" : "Not found");
      
      // Check if a pixel already exists at this position
      const { data: existingPixel, error: queryError } = await supabase
        .from('pixel_canvas')
        .select('id')
        .eq('x', pixelData.x)
        .eq('y', pixelData.y)
        .single();
  
      if (queryError) {
        console.log("Query error details:", queryError);
        // Continue if it's just "no rows returned"
        if (queryError.code !== 'PGRST116') {
          console.error('Error checking existing pixel:', queryError);
          return null;
        }
      }
  
      let result;
      
      if (existingPixel) {
        console.log("Updating existing pixel at", pixelData.x, pixelData.y);
        // Update existing pixel
        const { data, error } = await supabase
          .from('pixel_canvas')
          .update({
            color: pixelData.color,
            wallet_address: pixelData.wallet_address,
            username: pixelData.username,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPixel.id)
          .select()
          .single();
  
        if (error) {
          console.error('Error updating pixel:', error);
          console.log("Full error details:", JSON.stringify(error, null, 2));
          return null;
        }
  
        result = data;
      } else {
        console.log("Creating new pixel at", pixelData.x, pixelData.y);
        // Insert new pixel
        const { data, error } = await supabase
          .from('pixel_canvas')
          .insert([{
            x: pixelData.x,
            y: pixelData.y,
            color: pixelData.color,
            wallet_address: pixelData.wallet_address,
            username: pixelData.username || "Anonymous"
          }]);
  
        if (error) {
          console.error('Error creating pixel:', error);
          console.log("Full error details:", JSON.stringify(error, null, 2));
          return null;
        }
  
        // If we don't get an error, fetch the created pixel
        const { data: createdPixel, error: fetchError } = await supabase
          .from('pixel_canvas')
          .select('*')
          .eq('x', pixelData.x)
          .eq('y', pixelData.y)
          .single();
          
        if (fetchError) {
          console.error('Error fetching created pixel:', fetchError);
          return null;
        }
  
        result = createdPixel;
      }
  
      return result;
    } catch (error) {
      console.error('Exception placing pixel:', error);
      console.log("Full exception details:", JSON.stringify(error, null, 2));
      return null;
    }
  }