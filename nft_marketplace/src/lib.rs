use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    program_pack::{IsInitialized, Pack, Sealed},
    sysvar::{rent::Rent, Sysvar},
    system_instruction,
    program::{invoke, invoke_signed},
};
use spl_token::state::Account as TokenAccount;
use spl_associated_token_account::get_associated_token_address;
use std::convert::TryInto;
use std::mem::size_of;
use serde::{Deserialize, Serialize};

// Define the NFT types
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, PartialEq, Serialize, Deserialize)]
pub enum NFTType {
    Cube,
    Music,
    Other,
}

// Define sale data structure
#[derive(BorshSerialize, BorshDeserialize, Debug, Serialize, Deserialize)]
pub struct SaleData {
    pub is_initialized: bool,
    pub seller: Pubkey,
    pub mint: Pubkey,
    pub token_account: Pubkey,
    pub price: u64,
    pub nft_type: NFTType,
    pub listing_time: u64,
    pub featured: bool,
    pub collection: Option<String>,
}

// Define metadata structure
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Serialize, Deserialize)]
pub struct NFTMetadata {
    pub title: String,
    pub description: String,
    pub media: String, // URL of media
    pub nft_type: NFTType,
    pub collection: Option<String>,
    pub attributes: Option<Vec<NFTAttribute>>,
}

// Define NFT attribute for richer metadata
#[derive(BorshSerialize, BorshDeserialize, Clone, Debug, Serialize, Deserialize)]
pub struct NFTAttribute {
    pub trait_type: String,
    pub value: String,
}

// Program instructions
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum MarketplaceInstruction {
    /// Initialize marketplace
    /// 0. `[signer]` Initializer (will be owner)
    /// 1. `[writable]` MarketplaceState account
    /// 2. `[]` Rent sysvar
    InitializeMarketplace {
        treasury: Pubkey,
        transaction_fee: u16,
    },

    /// List NFT for sale
    /// 0. `[signer]` Seller
    /// 1. `[writable]` Token account holding NFT
    /// 2. `[]` Mint of NFT
    /// 3. `[writable, signer]` Sale account (newly created)
    /// 4. `[]` Rent sysvar
    /// 5. `[]` Optional metadata account for NFT type detection
    ListForSale {
        price: u64,
        nft_type: NFTType,
        listing_time: u64,
        featured: bool,
        collection: Option<String>,
    },

    /// Remove NFT from sale
    /// 0. `[signer]` Seller (sale owner)
    /// 1. `[writable]` Sale account
    RemoveSale,

    /// Buy NFT
    /// 0. `[signer, writable]` Buyer
    /// 1. `[writable]` Seller
    /// 2. `[writable]` Sale account
    /// 3. `[writable]` Seller's token account (source)
    /// 4. `[writable]` Buyer's token account (destination)
    /// 5. `[]` Token program
    /// 6. `[]` MarketplaceState
    /// 7. `[writable]` Treasury account
    BuyNFT,

    /// Transfer NFT (with transaction fee)
    /// 0. `[signer, writable]` Sender
    /// 1. `[writable]` Receiver
    /// 2. `[]` Mint of NFT
    /// 3. `[writable]` Sender's token account
    /// 4. `[writable]` Receiver's token account
    /// 5. `[]` Token program
    /// 6. `[]` MarketplaceState
    /// 7. `[writable]` Treasury account
    TransferNFT,

    /// Burn NFT
    /// 0. `[signer]` NFT owner
    /// 1. `[]` Mint of NFT
    /// 2. `[writable]` Token account holding NFT
    /// 3. `[]` Token program
    BurnNFT,

    /// Mint new NFT
    /// 0. `[signer, writable]` Owner of marketplace
    /// 1. `[writable]` New mint account
    /// 2. `[writable]` Destination token account
    /// 3. `[writable]` Metadata account
    /// 4. `[]` Token program
    /// 5. `[]` Rent sysvar
    /// 6. `[]` MarketplaceState
    MintNFT {
        metadata: NFTMetadata,
    },
}

// Program state
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MarketplaceState {
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub treasury: Pubkey,
    pub transaction_fee: u16, // As a percentage multiplied by 100 (e.g., 5% = 500)
}

// Program ID
solana_program::declare_id!("NFTMarketplace111111111111111111111111111111111");

// Entrypoint
entrypoint!(process_instruction);

// Process instructions
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = MarketplaceInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    
    match instruction {
        MarketplaceInstruction::InitializeMarketplace { treasury, transaction_fee } => {
            process_initialize_marketplace(program_id, accounts, treasury, transaction_fee)
        },
        MarketplaceInstruction::ListForSale { price, nft_type, listing_time, featured, collection } => {
            process_list_for_sale(program_id, accounts, price, nft_type, listing_time, featured, collection)
        },
        MarketplaceInstruction::RemoveSale => {
            process_remove_sale(program_id, accounts)
        },
        MarketplaceInstruction::BuyNFT => {
            process_buy_nft(program_id, accounts)
        },
        MarketplaceInstruction::TransferNFT => {
            process_transfer_nft(program_id, accounts)
        },
        MarketplaceInstruction::BurnNFT => {
            process_burn_nft(program_id, accounts)
        },
        MarketplaceInstruction::MintNFT { metadata } => {
            process_mint_nft(program_id, accounts, metadata)
        },
    }
}

// Initialize marketplace
fn process_initialize_marketplace(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    treasury: Pubkey,
    transaction_fee: u16,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let initializer_info = next_account_info(account_info_iter)?;
    let marketplace_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    
    // Verify initializer is the signer
    if !initializer_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Check if program owns marketplace account
    if marketplace_info.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }
    
    // Get rent
    let rent = Rent::from_account_info(rent_info)?;
    
    // Ensure marketplace account is rent exempt
    if !rent.is_exempt(marketplace_info.lamports(), marketplace_info.data_len()) {
        return Err(ProgramError::AccountNotRentExempt);
    }
    
    // Create and initialize marketplace state
    let marketplace_state = MarketplaceState {
        is_initialized: true,
        owner: *initializer_info.key,
        treasury,
        transaction_fee,
    };
    
    marketplace_state.serialize(&mut *marketplace_info.data.borrow_mut())?;
    
    msg!("Marketplace initialized successfully");
    Ok(())
}

// List NFT for sale
fn process_list_for_sale(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    price: u64,
    nft_type: NFTType,
    listing_time: u64,
    featured: bool,
    collection: Option<String>,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let seller_info = next_account_info(account_info_iter)?;
    let token_account_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let sale_account_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    
    // Verify seller is the signer
    if !seller_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Check token account ownership
    let token_account_data = TokenAccount::unpack(&token_account_info.data.borrow())?;
    if token_account_data.owner != *seller_info.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Ensure token account has 1 token (NFT)
    if token_account_data.amount != 1 {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Attempt to determine NFT type if metadata is provided
    let determined_nft_type = if let Ok(metadata_info) = account_info_iter.next() {
        // Try to parse metadata if provided (optional)
        if let Ok(metadata) = NFTMetadata::try_from_slice(&metadata_info.data.borrow()) {
            metadata.nft_type
        } else {
            // Use the provided type as fallback
            nft_type
        }
    } else {
        // Use the provided type if no metadata
        nft_type
    };
    
    // Set default listing time if not provided
    let actual_listing_time = if listing_time == 0 {
        solana_program::clock::Clock::get()?.unix_timestamp as u64
    } else {
        listing_time
    };
    
    // Get rent
    let rent = Rent::from_account_info(rent_info)?;
    
    // Ensure sale account is rent exempt
    if !rent.is_exempt(sale_account_info.lamports(), sale_account_info.data_len()) {
        return Err(ProgramError::AccountNotRentExempt);
    }
    
    // Create and initialize sale data
    let sale_data = SaleData {
        is_initialized: true,
        seller: *seller_info.key,
        mint: *mint_info.key,
        token_account: *token_account_info.key,
        price,
        nft_type: determined_nft_type.clone(),
        listing_time: actual_listing_time,
        featured,
        collection,
    };
    
    sale_data.serialize(&mut *sale_account_info.data.borrow_mut())?;
    
    // Emit an event that the NFT was listed with appropriate categorization
    msg!("NFT listed for sale successfully");
    msg!("NFT Type: {:?}", determined_nft_type);
    msg!("Price: {} lamports", price);
    
    // Emit specific events based on NFT type for indexing
    match determined_nft_type {
        NFTType::Cube => {
            msg!("Cube NFT listed");
        },
        NFTType::Music => {
            msg!("Music NFT listed");
        },
        NFTType::Other => {
            msg!("Other NFT listed");
        },
    }
    
    // Emit collection info if available
    if let Some(coll) = &collection {
        msg!("Collection: {}", coll);
    }
    
    Ok(())
}

// Remove NFT from sale
fn process_remove_sale(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let seller_info = next_account_info(account_info_iter)?;
    let sale_account_info = next_account_info(account_info_iter)?;
    
    // Verify seller is the signer
    if !seller_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Check if program owns sale account
    if sale_account_info.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }
    
    // Deserialize sale data
    let sale_data = SaleData::try_from_slice(&sale_account_info.data.borrow())?;
    
    // Verify seller is the owner of the NFT
    if sale_data.seller != *seller_info.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Check if sale is initialized
    if !sale_data.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }
    
    // Zero out the sale data
    let mut sale_data = sale_account_info.data.borrow_mut();
    for byte in sale_data.iter_mut() {
        *byte = 0;
    }
    
    msg!("Sale removed successfully");
    Ok(())
}

// Buy NFT
fn process_buy_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let buyer_info = next_account_info(account_info_iter)?;
    let seller_info = next_account_info(account_info_iter)?;
    let sale_account_info = next_account_info(account_info_iter)?;
    let seller_token_account_info = next_account_info(account_info_iter)?;
    let buyer_token_account_info = next_account_info(account_info_iter)?;
    let token_program_info = next_account_info(account_info_iter)?;
    let marketplace_state_info = next_account_info(account_info_iter)?;
    let treasury_info = next_account_info(account_info_iter)?;
    
    // Verify buyer is the signer
    if !buyer_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Check if program owns sale account and marketplace account
    if sale_account_info.owner != program_id || marketplace_info.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }
    
    // Deserialize sale data and marketplace state
    let sale_data = SaleData::try_from_slice(&sale_account_info.data.borrow())?;
    let marketplace_state = MarketplaceState::try_from_slice(&marketplace_info.data.borrow())?;
    
    // Verify seller is the owner of the NFT
    if sale_data.seller != *seller_info.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify token account matches the one in sale data
    if *token_account_info.key != sale_data.token_account {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Calculate fees
    let fee_amount = (sale_data.price as u128)
        .checked_mul(marketplace_state.transaction_fee as u128)
        .ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(10_000)
        .ok_or(ProgramError::ArithmeticOverflow)? as u64;
    
    let seller_amount = sale_data.price.checked_sub(fee_amount).ok_or(ProgramError::ArithmeticOverflow)?;
    
    // Transfer lamports from buyer to seller and treasury
    if **buyer_info.lamports.borrow() < sale_data.price {
        return Err(ProgramError::InsufficientFunds);
    }
    
    // Transfer to seller
    **buyer_info.lamports.borrow_mut() = buyer_info
        .lamports()
        .checked_sub(sale_data.price)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    **seller_info.lamports.borrow_mut() = seller_info
        .lamports()
        .checked_add(seller_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    **treasury_info.lamports.borrow_mut() = treasury_info
        .lamports()
        .checked_add(fee_amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    
    // Transfer NFT from seller to buyer
    let transfer_instruction = spl_token::instruction::transfer(
        token_program_info.key,
        token_account_info.key,
        buyer_token_account_info.key,
        seller_info.key,
        &[],
        1,
    )?;
    
    invoke(
        &transfer_instruction,
        &[
            token_account_info.clone(),
            buyer_token_account_info.clone(),
            seller_info.clone(),
            token_program_info.clone(),
        ],
    )?;
    
    // Zero out the sale data
    let mut sale_data = sale_account_info.data.borrow_mut();
    for byte in sale_data.iter_mut() {
        *byte = 0;
    }
    
    msg!("NFT purchased successfully");
    Ok(())
}

// Transfer NFT (with transaction fee)
fn process_transfer_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let sender_info = next_account_info(account_info_iter)?;
    let receiver_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let sender_token_account_info = next_account_info(account_info_iter)?;
    let receiver_token_account_info = next_account_info(account_info_iter)?;
    let token_program_info = next_account_info(account_info_iter)?;
    let marketplace_state_info = next_account_info(account_info_iter)?;
    let treasury_info = next_account_info(account_info_iter)?;
    
    // Verify sender is the signer
    if !sender_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Deserialize marketplace state
    let marketplace_state = MarketplaceState::try_from_slice(&marketplace_state_info.data.borrow())?;
    
    // Check if marketplace is initialized
    if !marketplace_state.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }
    
    // Check token accounts match their owners
    let sender_token_account = TokenAccount::unpack(&sender_token_account_info.data.borrow())?;
    if sender_token_account.owner != *sender_info.key {
        return Err(ProgramError::InvalidAccountData);
    }
    if sender_token_account.mint != *mint_info.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Define the fixed fee for NFT transfers (e.g., 0.01 SOL)
    let transfer_fee = 10000000; // 0.01 SOL in lamports
    
    // Transfer fee from sender to treasury
    invoke(
        &system_instruction::transfer(sender_info.key, treasury_info.key, transfer_fee),
        &[sender_info.clone(), treasury_info.clone()],
    )?;
    
    // Transfer NFT token from sender to receiver
    let transfer_instruction = spl_token::instruction::transfer(
        token_program_info.key,
        sender_token_account_info.key,
        receiver_token_account_info.key,
        sender_info.key,
        &[],
        1,
    )?;
    
    invoke(
        &transfer_instruction,
        &[
            sender_token_account_info.clone(),
            receiver_token_account_info.clone(),
            sender_info.clone(),
            token_program_info.clone(),
        ],
    )?;
    
    msg!("NFT transferred successfully");
    Ok(())
}

// Burn NFT
fn process_burn_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let owner_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let token_account_info = next_account_info(account_info_iter)?;
    let token_program_info = next_account_info(account_info_iter)?;
    
    // Verify owner is the signer
    if !owner_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Check token account ownership
    let token_account_data = TokenAccount::unpack(&token_account_info.data.borrow())?;
    if token_account_data.owner != *owner_info.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Check if there's a sale data for this NFT
    if sale_account_info.data_len() > 0 {
        let sale_data = SaleData::try_from_slice(&sale_account_info.data.borrow())?;
        
        // If NFT is listed, verify token account matches
        if sale_data.is_initialized && sale_data.token_account == *token_account_info.key {
            // Close sale account
            let dest_starting_lamports = owner_info.lamports();
            **owner_info.lamports.borrow_mut() = dest_starting_lamports
                .checked_add(sale_account_info.lamports())
                .ok_or(ProgramError::ArithmeticOverflow)?;
            
            **sale_account_info.lamports.borrow_mut() = 0;
            
            // Clear sale account data
            let mut sale_data = sale_account_info.data.borrow_mut();
            sale_data.fill(0);
        }
    }
    
    // Burn NFT
    let burn_instruction = spl_token::instruction::burn(
        token_program_info.key,
        token_account_info.key,
        mint_info.key,
        owner_info.key,
        &[],
        1,
    )?;
    
    invoke(
        &burn_instruction,
        &[
            token_account_info.clone(),
            mint_info.clone(),
            owner_info.clone(),
            token_program_info.clone(),
        ],
    )?;
    
    msg!("NFT burned successfully");
    Ok(())
}

// Mint NFT
fn process_mint_nft(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    metadata: NFTMetadata,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let minter_info = next_account_info(account_info_iter)?;
    let mint_info = next_account_info(account_info_iter)?;
    let token_account_info = next_account_info(account_info_iter)?;
    let metadata_account_info = next_account_info(account_info_iter)?;
    let token_program_info = next_account_info(account_info_iter)?;
    let rent_info = next_account_info(account_info_iter)?;
    let marketplace_state_info = next_account_info(account_info_iter)?;
    
    // Verify minter is the signer
    if !minter_info.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Check if program owns marketplace account
    if marketplace_info.owner != program_id {
        return Err(ProgramError::IllegalOwner);
    }
    
    // Deserialize marketplace state
    let marketplace_state = MarketplaceState::try_from_slice(&marketplace_info.data.borrow())?;
    
    // Only marketplace owner can mint
    if marketplace_state.owner != *minter_info.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Initialize mint account
    invoke(
        &spl_token::instruction::initialize_mint(
            token_program_info.key,
            mint_info.key,
            minter_info.key,
            None,
            0,
        )?,
        &[
            mint_info.clone(),
            rent_info.clone(),
            token_program_info.clone(),
        ],
    )?;
    
    // Initialize token account
    invoke(
        &spl_token::instruction::initialize_account(
            token_program_info.key,
            token_account_info.key,
            mint_info.key,
            minter_info.key,
        )?,
        &[
            token_account_info.clone(),
            mint_info.clone(),
            minter_info.clone(),
            rent_info.clone(),
            token_program_info.clone(),
        ],
    )?;
    
    // Mint token to token account
    invoke(
        &spl_token::instruction::mint_to(
            token_program_info.key,
            mint_info.key,
            token_account_info.key,
            minter_info.key,
            &[],
            1,
        )?,
        &[
            mint_info.clone(),
            token_account_info.clone(),
            minter_info.clone(),
            token_program_info.clone(),
        ],
    )?;
    
    // Here we'll create metadata and store it in metadata_account
    // This is a simplification - in practice we'd use Metaplex to manage metadata
    msg!("NFT minted successfully: {}", metadata.title);
    Ok(())
}

// Helper for view functions
pub mod marketplace_views {
    use super::*;

    // Get marketplace metadata
    pub fn get_marketplace_metadata(marketplace_state: &MarketplaceState) -> (Pubkey, Pubkey, u16) {
        (
            marketplace_state.owner,
            marketplace_state.treasury,
            marketplace_state.transaction_fee,
        )
    }

    // Check if NFT is on sale
    pub fn is_token_on_sale(
        program_id: &Pubkey,
        sale_accounts: &[AccountInfo],
        mint: &Pubkey,
    ) -> Result<bool, ProgramError> {
        for account in sale_accounts {
            if account.owner != program_id {
                continue;
            }

            if let Ok(sale) = SaleData::try_from_slice(&account.data.borrow()) {
                if sale.is_initialized && sale.mint == *mint {
                    return Ok(true);
                }
            }
        }

        Ok(false)
    }

    // Search sales by title
    pub fn search_sales_by_title(
        program_id: &Pubkey,
        sale_accounts: &[AccountInfo],
        query: &str,
        limit: usize,
    ) -> Vec<(Pubkey, SaleData)> {
        let mut results = Vec::new();
        let query = query.to_lowercase();

        for account in sale_accounts {
            if account.owner != program_id {
                continue;
            }

            if let Ok(sale) = SaleData::try_from_slice(&account.data.borrow()) {
                if !sale.is_initialized {
                    continue;
                }

                // In practice, we'd query metadata from off-chain database
                // or get it from Metaplex metadata account
                // Here we're assuming we have a way to get title from mint

                // Example assumption
                let title = format!("NFT #{}", sale.mint.to_string()[0..8].to_lowercase());
                
                if title.contains(&query) && results.len() < limit {
                    results.push((*account.key, sale));
                }
            }
        }

        results
    }

    // Get sales by NFT type
    pub fn get_sales_by_nft_type(
        program_id: &Pubkey,
        sale_accounts: &[AccountInfo],
        nft_type: NFTType,
        limit: usize,
    ) -> Vec<(Pubkey, SaleData)> {
        let mut results = Vec::new();
        
        for account in sale_accounts {
            if results.len() >= limit {
                break;
            }
            
            if account.owner != program_id {
                continue;
            }
            
            if let Ok(sale_data) = SaleData::try_from_slice(&account.data.borrow()) {
                if sale_data.is_initialized && sale_data.nft_type == nft_type {
                    results.push((*account.key, sale_data));
                }
            }
        }
        
        results
    }

    // Get all listed sales
    pub fn get_all_listed_sales(
        program_id: &Pubkey,
        sale_accounts: &[AccountInfo],
        limit: usize,
    ) -> Vec<(Pubkey, SaleData)> {
        let mut results = Vec::new();
        
        for account in sale_accounts {
            if results.len() >= limit {
                break;
            }
            
            if account.owner != program_id {
                continue;
            }
            
            if let Ok(sale_data) = SaleData::try_from_slice(&account.data.borrow()) {
                if sale_data.is_initialized {
                    results.push((*account.key, sale_data));
                }
            }
        }
        
        results
    }

    // Get user's listed NFTs
    pub fn get_user_listed_nfts(
        program_id: &Pubkey,
        sale_accounts: &[AccountInfo],
        user: &Pubkey,
        limit: usize,
    ) -> Vec<(Pubkey, SaleData)> {
        let mut results = Vec::new();
        
        for account in sale_accounts {
            if results.len() >= limit {
                break;
            }
            
            if account.owner != program_id {
                continue;
            }
            
            if let Ok(sale_data) = SaleData::try_from_slice(&account.data.borrow()) {
                if sale_data.is_initialized && sale_data.seller == *user {
                    results.push((*account.key, sale_data));
                }
            }
        }
        
        results
    }
}

// Tests
#[cfg(test)]
mod tests {
    use super::*;
    use solana_program::clock::Epoch;
    use std::mem;

    // Test initialize marketplace
    #[test]
    fn test_initialize_marketplace() {
        let program_id = Pubkey::new_unique();
        let owner_key = Pubkey::new_unique();
        let treasury_key = Pubkey::new_unique();
        let marketplace_key = Pubkey::new_unique();
        let transaction_fee = 500; // 5%

        // Create owner account
        let owner_account = AccountInfo::new(
            &owner_key,
            true,
            false,
            &mut 10000u64,
            &mut [],
            &Pubkey::default(),
            false,
            Epoch::default(),
        );

        // Create marketplace state account
        let mut marketplace_data = vec![0; mem::size_of::<MarketplaceState>()];
        let marketplace_account = AccountInfo::new(
            &marketplace_key,
            false,
            true,
            &mut 10000u64,
            &mut marketplace_data,
            &program_id,
            false,
            Epoch::default(),
        );

        // Create rent sysvar account
        let rent_key = Pubkey::new_unique();
        let mut rent_data = vec![0; mem::size_of::<Rent>()];
        let rent = Rent {
            lamports_per_byte_year: 1,
            exemption_threshold: 2.0,
            burn_percent: 10,
        };
        rent.serialize(&mut rent_data).unwrap();
        let rent_account = AccountInfo::new(
            &rent_key,
            false,
            false,
            &mut 10000u64,
            &mut rent_data,
            &solana_program::sysvar::id(),
            false,
            Epoch::default(),
        );

        let accounts = vec![owner_account, marketplace_account, rent_account];

        // Process instruction
        let result = process_initialize_marketplace(
            &program_id,
            &accounts,
            treasury_key,
            transaction_fee,
        );

        // Check result
        assert!(result.is_ok());

        // Deserialize marketplace state and check values
        let marketplace_state = MarketplaceState::try_from_slice(&marketplace_data).unwrap();
        assert!(marketplace_state.is_initialized);
        assert_eq!(marketplace_state.owner, owner_key);
        assert_eq!(marketplace_state.treasury, treasury_key);
        assert_eq!(marketplace_state.transaction_fee, transaction_fee);
    }
}