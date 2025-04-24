import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";

export interface WalletData {
  address: string;
  displayName: string;
  joinedDate: string;
  balance: number;
  totalValue: number;
  transactions: number;
  nftsOwned: number;
  nftsMinted: number;
  portfolioHistory?: Array<{ date: string; value: number }>; // Added for portfolio history
}

export interface NFTData {
  audioUrl: any;
  createdAt: string;
  properties: any;
  id: string;
  name: string;
  collection: string;
  description: string;
  acquired?: string;
  minted?: string;
  mintedAt?: string;
  listed?: string;
  price: number;
  type: string;
  shapeType: string;
  color: string;
  image?: string;
  fallbackImages?: string[];
  ipfsHash?: string;
  ipfsUrl?: string;
  mintAddress?: string;
  model3d?: string; // Direct model URL
  model3dHash?: string; // IPFS hash for the model
  modelViewerUrl?: string; // Model viewer URL
  attributes?: { trait_type: string; value: string }[];
  valueHistory?: Array<{ date: string; value: number }>; // Added for tracking NFT value
  rarity?: number; // Added for rarity score
  lastSalePrice?: number; // Added for market data
  estimatedValue?: number; // Added for estimated value
}

// Transaction interface for improved typing
export interface TransactionData {
  signature: string;
  blockTime: string;
  type: string;
  amount: number;
  fullSignature: string;
  status?: string;
  from?: string;
  to?: string;
  description?: string;
  fee?: number;
}

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);
const connection = new Connection(endpoint);

// Add this helper function at the top of walletService.ts
function convertIpfsToHttpUrl(ipfsUri: string): string {
  // Handle ipfs:// protocol
  if (ipfsUri.startsWith("ipfs://")) {
    const hash = ipfsUri.replace("ipfs://", "");
    // Use multiple gateways for reliability, starting with Pinata
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  // If it's already an HTTP URL, return as is
  if (ipfsUri.startsWith("http")) {
    return ipfsUri;
  }

  // Handle /ipfs/ paths
  if (ipfsUri.includes("/ipfs/")) {
    const hash = ipfsUri.split("/ipfs/")[1];
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  // Just return the original if we can't identify it
  return ipfsUri;
}

// Get wallet information
export async function getWalletInfo(publicKey: PublicKey): Promise<WalletData> {
  try {
    // Get balance
    const balance = await connection.getBalance(publicKey);
    const balanceInSOL = balance / LAMPORTS_PER_SOL;

    // Get transaction history
    const transactions = await connection.getSignaturesForAddress(publicKey, {
      limit: 100,
    });

    // In a real implementation, you would use a library like Metaplex to get NFTs
    // This is a simplified example
    const nftsOwned = 0; // Will update later with Metaplex

    // Calculate mock portfolio value - in a real app this would be from blockchain data
    const mockPortfolioValue = balanceInSOL * 1.5;

    // Create joined date based on first transaction (if any)
    // If no transactions or transaction doesn't have blockTime, display current date
    let joinedDate;
    if (transactions.length > 0) {
      const firstTx = transactions[transactions.length - 1];
      if (firstTx.blockTime) {
        const date = new Date(firstTx.blockTime * 1000);
        const monthNames = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MAY",
          "JUN",
          "JUL",
          "AUG",
          "SEP",
          "OCT",
          "NOV",
          "DEC",
        ];
        joinedDate = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      } else {
        // If no blockTime, use current date
        const currentDate = new Date();
        const monthNames = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MAY",
          "JUN",
          "JUL",
          "AUG",
          "SEP",
          "OCT",
          "NOV",
          "DEC",
        ];
        joinedDate = `${
          monthNames[currentDate.getMonth()]
        } ${currentDate.getFullYear()}`;
      }
    } else {
      // If no transactions, use current date
      const currentDate = new Date();
      const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      joinedDate = `${
        monthNames[currentDate.getMonth()]
      } ${currentDate.getFullYear()}`;
    }

    // Generate portfolio history data for the dashboard
    // In a real app, this would be based on actual historical data
    const portfolioHistory = generateMockPortfolioHistory(
      mockPortfolioValue,
      transactions
    );

    return {
      address: publicKey.toString(),
      displayName: "VOID_COLLECTOR", // Would come from a profile service in a real app
      joinedDate,
      balance: balanceInSOL,
      totalValue: mockPortfolioValue,
      transactions: transactions.length,
      nftsOwned,
      nftsMinted: 0, // Need to add logic to count minted NFTs
      portfolioHistory,
    };
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    throw error;
  }
}

// Generate mock portfolio history data based on transaction history
// In a real app, this would use actual historical wallet data
function generateMockPortfolioHistory(
  currentValue: number,
  transactions: any[]
): Array<{ date: string; value: number }> {
  const history: Array<{ date: string; value: number }> = [];

  // If no transactions, return empty array
  if (!transactions || transactions.length === 0) {
    return history;
  }

  // Sort transactions by blockTime
  const sortedTransactions = [...transactions].sort((a, b) => {
    if (!a.blockTime) return 1;
    if (!b.blockTime) return -1;
    return a.blockTime - b.blockTime;
  });

  // Start with a base value
  let baseValue = currentValue * 0.5; // Start at half the current value

  // Generate history points for each transaction
  sortedTransactions.forEach((tx) => {
    if (tx.blockTime) {
      const date = new Date(tx.blockTime * 1000);
      const formattedDate = `${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`;

      // Fluctuate the value based on transaction (simplified model)
      // In a real app, this would reflect actual value changes
      const randomChange = Math.random() * 0.2 - 0.1; // -10% to +10% change
      baseValue = baseValue * (1 + randomChange);

      history.push({
        date: formattedDate,
        value: parseFloat(baseValue.toFixed(2)),
      });
    }
  });

  // Add current value as the last point
  const today = new Date();
  const formattedToday = `${
    today.getMonth() + 1
  }/${today.getDate()}/${today.getFullYear()}`;
  history.push({
    date: formattedToday,
    value: currentValue,
  });

  return history;
}

// Get NFTs for the wallet
// Get NFTs for the wallet - MODIFIED to only return blockchain NFTs
export async function getNFTs(publicKey: PublicKey): Promise<{
  ownedNFTs: NFTData[];
  mintedNFTs: NFTData[];
  listedNFTs: NFTData[];
}> {
  try {
    console.log("Fetching NFTs for wallet:", publicKey.toString());

    // Initialize arrays to store NFTs
    let ownedNFTs: NFTData[] = [];
    let mintedNFTs: NFTData[] = [];
    let listedNFTs: NFTData[] = [];

    // ONLY get NFTs from the blockchain using Metaplex, skip localStorage
    try {
      const metaplex = new Metaplex(connection);

      // Fetch all NFTs owned by this wallet
      console.log("Fetching blockchain NFTs via Metaplex...");
      const nfts = await metaplex.nfts().findAllByOwner({ owner: publicKey });
      console.log(`Found ${nfts.length} NFTs on blockchain`);

      // Process blockchain NFTs
      if (nfts && nfts.length > 0) {
        ownedNFTs = await Promise.all(
          nfts.map(async (nft) => {
            // Try to fetch metadata if available
            let metadata = null;
            let imageUrl = null;

            try {
              // Find this code in getNFTs where it's fetching metadata
              if (nft.uri) {
                try {
                  // Convert IPFS URI to HTTP URL before fetching
                  const httpUrl = convertIpfsToHttpUrl(nft.uri);
                  console.log(`Fetching metadata from HTTP URL: ${httpUrl}`);

                  const response = await fetch(httpUrl);
                  if (response.ok) {
                    metadata = await response.json();
                    imageUrl = metadata.image || null;

                    // Also convert the image URL if it's IPFS
                    if (imageUrl && imageUrl.startsWith("ipfs://")) {
                      imageUrl = convertIpfsToHttpUrl(imageUrl);
                    }
                  }
                } catch (metadataError) {
                  console.warn(
                    `Error fetching metadata for NFT ${nft.address.toString()}:`,
                    metadataError
                  );

                  // If first gateway fails, try alternatives
                  if (nft.uri && nft.uri.startsWith("ipfs://")) {
                    const ipfsHash = nft.uri.replace("ipfs://", "");
                    const alternativeGateways = [
                      `https://ipfs.io/ipfs/${ipfsHash}`,
                      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
                      `https://dweb.link/ipfs/${ipfsHash}`,
                    ];

                    // Try each alternative gateway
                    for (const gatewayUrl of alternativeGateways) {
                      try {
                        const response = await fetch(gatewayUrl);
                        if (response.ok) {
                          metadata = await response.json();
                          imageUrl = metadata.image || null;

                          // Also convert the image URL if it's IPFS
                          if (imageUrl && imageUrl.startsWith("ipfs://")) {
                            const imageHash = imageUrl.replace("ipfs://", "");
                            imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
                          }

                          // Break the loop if we got a successful response
                          break;
                        }
                      } catch (altError) {
                        console.warn(
                          `Alternative gateway ${gatewayUrl} failed:`,
                          altError
                        );
                      }
                    }
                  }
                }
              }
            } catch (metadataError) {
              console.warn(
                `Error fetching metadata for NFT ${nft.address.toString()}:`,
                metadataError
              );
            }

            // Determine if this is a minted NFT (created by this wallet)
            // A simple heuristic: if the NFT's mint authority matches the wallet
            const isMinted =
              "updateAuthority" in nft &&
              nft.updateAuthority?.toString() === publicKey.toString();

            // Random value for the estimated value (for the dashboard)
            const randomValue = Math.random() * 10 + 0.5;

            // Generate mock value history for this NFT
            const valueHistory = generateMockNFTValueHistory(randomValue);

            // Create NFT data object
            const nftData: NFTData = {
              id: nft.address.toString(),
              name:
                metadata?.name ||
                nft.name ||
                `NFT #${nft.address.toString().slice(0, 6)}`,
              collection:
                metadata?.collection?.name ||
                nft.collection?.address?.toString() ||
                "VOID Collection",
              description: metadata?.description || "A unique VOID NFT",
              acquired: new Date().toISOString().split("T")[0],
              minted: isMinted
                ? new Date().toISOString().split("T")[0]
                : undefined,
              mintedAt: isMinted ? new Date().toISOString() : undefined,
              price: randomValue,
              type:
                metadata?.attributes?.find(
                  (attr: any) => attr.trait_type === "Type"
                )?.value || "cube",
              shapeType:
                metadata?.attributes?.find(
                  (attr: any) => attr.trait_type === "Shape"
                )?.value || "complex",
              color:
                metadata?.attributes?.find(
                  (attr: any) => attr.trait_type === "Color"
                )?.value || "purple",
              image: imageUrl,
              attributes: metadata?.attributes || [],
              mintAddress: nft.address.toString(),
              ipfsHash: nft.uri?.includes("ipfs://")
                ? nft.uri.replace("ipfs://", "")
                : undefined,
              valueHistory: valueHistory,
              rarity: Math.floor(Math.random() * 100),
              lastSalePrice:
                Math.random() > 0.5 ? Math.random() * 5 + 0.1 : undefined,
              estimatedValue: randomValue,
              audioUrl: undefined,
              createdAt: "",
              properties: undefined,
            };

            // Add to minted collection if created by this wallet
            if (isMinted) {
              mintedNFTs.push(nftData);
            }

            return nftData;
          })
        );
      }
    } catch (metaplexError) {
      console.error("Error using Metaplex to fetch NFTs:", metaplexError);
    }

    // For listed NFTs only (since blockchain doesn't show listed status)
    // we'll still check localStorage but ONLY for NFTs that are already in ownedNFTs
    try {
      const storedNFTs = localStorage.getItem("userNfts");
      if (storedNFTs) {
        const parsedNFTs = JSON.parse(storedNFTs);

        // Filter to only include NFTs that are:
        // 1. Listed (have listed property)
        // 2. Match an ID of a blockchain NFT we already have
        const blockchainNftIds = new Set(ownedNFTs.map((nft) => nft.id));

        listedNFTs = parsedNFTs
          .filter((nft: any) => nft.listed && blockchainNftIds.has(nft.id))
          .map((nft: any) => {
            // Find the matching blockchain NFT
            const blockchainNft = ownedNFTs.find((bc) => bc.id === nft.id);
            if (!blockchainNft) return null;

            // Merge the blockchain NFT with the "listed" status
            return {
              ...blockchainNft,
              listed: nft.listed,
              price: nft.price || blockchainNft.price,
            };
          })
          .filter(Boolean); // Remove any null entries
      }
    } catch (localError) {
      console.error("Error reading localStorage NFTs:", localError);
    }

    console.log(
      `Returning NFTs - Owned: ${ownedNFTs.length}, Minted: ${mintedNFTs.length}, Listed: ${listedNFTs.length}`
    );

    return {
      ownedNFTs,
      mintedNFTs,
      listedNFTs,
    };
  } catch (error) {
    console.error("Error fetching NFTs:", error);
    // Return empty arrays on error
    return {
      ownedNFTs: [],
      mintedNFTs: [],
      listedNFTs: [],
    };
  }
}

// Generate mock NFT value history
function generateMockNFTValueHistory(
  currentValue: number
): Array<{ date: string; value: number }> {
  const history: Array<{ date: string; value: number }> = [];

  // Generate data points for the last 6 months
  const today = new Date();
  let baseValue = currentValue * 0.7; // Start at 70% of current value

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(date.getMonth() - i);

    // Add some random fluctuation
    const randomChange = Math.random() * 0.3 - 0.1; // -10% to +20% change
    baseValue = baseValue * (1 + randomChange);

    history.push({
      date: `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`,
      value: parseFloat(baseValue.toFixed(2)),
    });
  }

  // Ensure the last value is the current value
  history[history.length - 1].value = currentValue;

  return history;
}

// Get transaction history with improved details
export async function getTransactionHistory(
  publicKey: PublicKey
): Promise<TransactionData[]> {
  try {
    const signatures = await connection.getSignaturesForAddress(publicKey);
    const transactions: TransactionData[] = [];

    for (let i = 0; i < Math.min(10, signatures.length); i++) {
      const signature = signatures[i];
      const tx = await connection.getTransaction(signature.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (tx) {
        // Store full signature for use in Solscan
        const fullSignature = signature.signature;

        // Determine transaction type with more detail
        let txType = "Transfer";
        if (tx.meta?.logMessages) {
          if (
            tx.meta.logMessages.some((msg) => msg.includes("Initialize mint"))
          ) {
            txType = "Mint";
          } else if (
            tx.meta.logMessages.some((msg) =>
              msg.includes("Instruction: CreateAccount")
            )
          ) {
            txType = "Create Account";
          } else if (
            tx.meta.logMessages.some((msg) =>
              msg.includes("Instruction: Transfer")
            )
          ) {
            txType = "Transfer";
          } else if (
            tx.meta.logMessages.some((msg) => msg.includes("Instruction: List"))
          ) {
            txType = "List NFT";
          } else if (
            tx.meta.logMessages.some((msg) => msg.includes("Instruction: Buy"))
          ) {
            txType = "Buy NFT";
          }
        }

        // Calculate amount more accurately
        const amount =
          tx.meta?.postBalances && tx.meta?.preBalances
            ? Math.abs(tx.meta.postBalances[0] - tx.meta.preBalances[0]) /
              LAMPORTS_PER_SOL
            : 0;

        // Format date
        const formattedDate = signature.blockTime
          ? new Date(signature.blockTime * 1000).toISOString().split("T")[0]
          : "Unknown";

        // Add transaction fee
        const fee = tx.meta?.fee ? tx.meta.fee / LAMPORTS_PER_SOL : 0;

        transactions.push({
          signature: signature.signature,
          blockTime: formattedDate,
          type: txType,
          amount: amount,
          fullSignature: fullSignature,
          status: "Confirmed",
          fee: fee,
          description: `${txType} transaction`,
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    return [];
  }
}

// Utility function to shorten wallet address
export function shortenAddress(address: string, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
