import { supabase } from './supabaseClient';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { decode as decodeUTF8 } from '@stablelib/utf8';
import { decode as decodeBase64 } from '@stablelib/base64';
import { encode as encodeBase64 } from '@stablelib/base64';

/**
 * Generate a random nonce for wallet signing
 */
export function generateNonce(): string {
  const nonceArray = new Uint8Array(32);
  window.crypto.getRandomValues(nonceArray);
  return encodeBase64(nonceArray);
}

/**
 * Store the nonce in localStorage for later verification
 */
export function storeNonce(walletAddress: string, nonce: string): void {
  localStorage.setItem(`auth-nonce-${walletAddress}`, nonce);
}

/**
 * Retrieve the stored nonce for verification
 */
export function retrieveNonce(walletAddress: string): string | null {
  return localStorage.getItem(`auth-nonce-${walletAddress}`);
}

/**
 * Clear the stored nonce after use
 */
export function clearNonce(walletAddress: string): void {
  localStorage.removeItem(`auth-nonce-${walletAddress}`);
}

/**
 * Create a message for the user to sign with their wallet
 */
export function createSignMessage(nonce: string): string {
  return `Sign this message to authenticate with the VOID NFT platform.\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
}

/**
 * Verify the signature against the message and public key
 */
export function verifySignature(
  signature: Uint8Array,
  message: string,
  publicKey: PublicKey
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = publicKey.toBytes();
    
    return nacl.sign.detached.verify(
      messageBytes,
      signature,
      publicKeyBytes
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Sign in with Supabase using a custom JWT
 * This function would be called after verifying the wallet signature
 */
export async function signInWithWallet(walletAddress: string): Promise<boolean> {
  try {
    // In a production app, you would make a request to your backend here
    // The backend would verify the signature and issue a JWT
    // For this example, we'll simulate a successful auth with Supabase
    
    // Create a custom login endpoint in your backend that issues a Supabase JWT
    // Here we're simulating that with a direct Supabase call
    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${walletAddress}@phantom.wallet`, // Virtual email
      password: process.env.NEXT_PUBLIC_WALLET_AUTH_SECRET || 'default-secret',
    });
    
    if (error) {
      console.error('Error signing in with wallet:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Exception during wallet sign in:', error);
    return false;
  }
}