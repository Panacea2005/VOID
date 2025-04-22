// lib/utils/rpcManager.ts
// RPC manager for Devnet endpoints

import { Connection } from "@solana/web3.js";

// Array of Devnet RPC endpoints to try in sequence
const DEVNET_RPC_ENDPOINTS = [
  "https://api.devnet.solana.com",
  "https://devnet.genesysgo.net",  
  "https://devnet.rpcpool.com", 
  "https://devnet.rpcpool.com/",
  // Add any other Devnet endpoints you have access to
];

// Cache Connection objects to avoid recreating them
const connectionCache: Map<string, Connection> = new Map();

/**
 * Get a Solana Connection with fallback support (Devnet version)
 * @param preferredEndpoint Optional specific endpoint to try first
 * @returns A Solana Connection object
 */
export function getDevnetConnection(preferredEndpoint?: string): Connection {
  // Use the preferred endpoint if provided, or the first in the list
  const endpoints = preferredEndpoint 
    ? [preferredEndpoint, ...DEVNET_RPC_ENDPOINTS.filter(e => e !== preferredEndpoint)]
    : DEVNET_RPC_ENDPOINTS;
  
  // Try to get from cache first
  for (const endpoint of endpoints) {
    if (connectionCache.has(endpoint)) {
      return connectionCache.get(endpoint)!;
    }
  }
  
  // If not in cache, create a new connection with the first endpoint
  const connection = new Connection(endpoints[0], 'confirmed');
  connectionCache.set(endpoints[0], connection);
  return connection;
}

/**
 * Execute an operation with automatic RPC endpoint fallback on failure (Devnet version)
 * @param operation The async function to execute with a Connection
 * @param maxRetries Maximum number of retry attempts (defaults to number of endpoints)
 * @returns The result of the operation
 */
export async function executeWithDevnetFallback<T>(
  operation: (connection: Connection) => Promise<T>,
  maxRetries: number = DEVNET_RPC_ENDPOINTS.length
): Promise<T> {
  let lastError: Error | null = null;
  let retryCount = 0;
  
  // Try with each endpoint
  for (const endpoint of DEVNET_RPC_ENDPOINTS) {
    if (retryCount >= maxRetries) break;
    retryCount++;
    
    try {
      console.log(`Trying Devnet RPC endpoint: ${endpoint}`);
      
      // Get or create connection
      let connection = connectionCache.get(endpoint);
      if (!connection) {
        connection = new Connection(endpoint, 'confirmed');
        connectionCache.set(endpoint, connection);
      }
      
      // Set timeout to prevent hanging
      const timeoutMs = 15000;
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      );
      
      // Execute operation with timeout
      const resultPromise = operation(connection);
      const result = await Promise.race([resultPromise, timeoutPromise]);
      
      // If successful, return the result
      return result;
    } catch (error) {
      console.warn(`Error with Devnet endpoint ${endpoint}:`, error);
      lastError = error as Error;
      
      // Clear this endpoint from cache if it failed
      connectionCache.delete(endpoint);
      
      // Continue with next endpoint
    }
  }
  
  // If all endpoints failed, throw the last error
  throw lastError || new Error("All Devnet RPC endpoints failed");
}

/**
 * Get appropriate RPC endpoint based on environment setting
 */
export function getNetworkConnection(): Connection {
  const isDevnet = process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet';
  
  if (isDevnet) {
    console.log("Using Devnet connection");
    return getDevnetConnection();
  } else {
    console.log("Using Mainnet connection");
    // Create a mainnet connection if needed
    return new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  }
}

/**
 * Clear the connection cache
 */
export function clearConnectionCache(): void {
  connectionCache.clear();
}