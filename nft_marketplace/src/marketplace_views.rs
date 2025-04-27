use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::AccountInfo,
    program_error::ProgramError,
    pubkey::Pubkey,
    msg,
};
use crate::{SaleData, NFTType, MarketplaceState, NFTMetadata};

#[near_bindgen]
impl Contract {
    /// Lấy thông tin marketplace metadata
    pub fn get_marketplace_metadata(&self) -> (Pubkey, Pubkey, u16) {
        get_marketplace_metadata(&self.marketplace_state)
    }
    
    /// Kiểm tra xem một NFT có đang được bán hay không
    pub fn is_token_on_sale(&self, token_id: TokenId) -> bool {
        is_token_on_sale(&self.program_id, &self.sale_accounts, &token_id)
    }
    
    /// Lấy danh sách NFT theo loại
    pub fn get_sales_by_nft_type(
        &self, 
        nft_type: NFTType,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<(Pubkey, SaleData)> {
        get_sales_by_nft_type(&self.program_id, &self.sale_accounts, nft_type, limit.unwrap_or(50) as usize)
    }
    
    /// Lấy danh sách NFT được bán gần đây
    pub fn get_recently_listed_sales(
        &self,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<(Pubkey, SaleData)> {
        get_recently_listed_nfts(&self.program_id, &self.sale_accounts, limit.unwrap_or(50) as usize)
    }
    
    /// Lấy danh sách NFT nổi bật
    pub fn get_featured_sales(
        &self,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<(Pubkey, SaleData)> {
        get_featured_nfts(&self.program_id, &self.sale_accounts, limit.unwrap_or(50) as usize)
    }
    
    /// Lấy danh sách NFT thuộc một bộ sưu tập cụ thể
    pub fn get_sales_by_collection(
        &self,
        collection: String,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<(Pubkey, SaleData)> {
        get_nfts_by_collection(&self.program_id, &self.sale_accounts, &collection, limit.unwrap_or(50) as usize)
    }
    
    /// Lấy danh sách NFT được bán bởi một chủ sở hữu cụ thể
    pub fn get_sales_by_owner_id(
        &self,
        owner_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<(Pubkey, SaleData)> {
        get_user_listed_nfts(&self.program_id, &self.sale_accounts, &owner_id, limit.unwrap_or(50) as usize)
    }
    
    /// Lấy danh sách NFT thuộc một bộ sưu tập cụ thể của một chủ sở hữu
    pub fn get_sales_by_collection_and_owner(
        &self,
        collection: String,
        owner_id: AccountId,
        from_index: Option<U128>,
        limit: Option<u64>
    ) -> Vec<(Pubkey, SaleData)> {
        get_user_nfts_by_type(&self.program_id, &self.sale_accounts, &owner_id, NFTType::from(collection), limit.unwrap_or(50) as usize)
    }
}

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
    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized && sale_data.mint == *mint {
                return Ok(true);
            }
        }
    }

    Ok(false)
}

// Get sales by NFT type
pub fn get_sales_by_nft_type(
    program_id: &Pubkey,
    sale_accounts: &[AccountInfo],
    nft_type: NFTType,
    limit: usize,
) -> Vec<(Pubkey, SaleData)> {
    let mut results = Vec::new();

    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized && sale_data.nft_type == nft_type {
                results.push((*sale_account.key, sale_data));
                if results.len() >= limit {
                    break;
                }
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

    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized {
                results.push((*sale_account.key, sale_data));
                if results.len() >= limit {
                    break;
                }
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

    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized && sale_data.seller == *user {
                results.push((*sale_account.key, sale_data));
                if results.len() >= limit {
                    break;
                }
            }
        }
    }

    results
}

// Get user's NFTs of a specific type
pub fn get_user_nfts_by_type(
    program_id: &Pubkey,
    sale_accounts: &[AccountInfo],
    user: &Pubkey,
    nft_type: NFTType,
    limit: usize,
) -> Vec<(Pubkey, SaleData)> {
    let mut results = Vec::new();

    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized && sale_data.seller == *user && sale_data.nft_type == nft_type {
                results.push((*sale_account.key, sale_data));
                if results.len() >= limit {
                    break;
                }
            }
        }
    }

    results
}

// Get featured NFTs
pub fn get_featured_nfts(
    program_id: &Pubkey,
    sale_accounts: &[AccountInfo],
    limit: usize,
) -> Vec<(Pubkey, SaleData)> {
    let mut results = Vec::new();

    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized && sale_data.featured {
                results.push((*sale_account.key, sale_data));
                if results.len() >= limit {
                    break;
                }
            }
        }
    }

    results
}

// Get NFTs from a specific collection
pub fn get_nfts_by_collection(
    program_id: &Pubkey,
    sale_accounts: &[AccountInfo],
    collection: &str,
    limit: usize,
) -> Vec<(Pubkey, SaleData)> {
    let mut results = Vec::new();

    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized {
                if let Some(nft_collection) = &sale_data.collection {
                    if nft_collection == collection {
                        results.push((*sale_account.key, sale_data));
                        if results.len() >= limit {
                            break;
                        }
                    }
                }
            }
        }
    }

    results
}

// Get recently listed NFTs
pub fn get_recently_listed_nfts(
    program_id: &Pubkey,
    sale_accounts: &[AccountInfo],
    limit: usize,
) -> Vec<(Pubkey, SaleData)> {
    let mut results = Vec::new();

    for sale_account in sale_accounts.iter() {
        if sale_account.owner != program_id {
            continue;
        }

        if let Ok(sale_data) = SaleData::try_from_slice(&sale_account.data.borrow()) {
            if sale_data.is_initialized {
                results.push((*sale_account.key, sale_data));
            }
        }
    }

    // Sort by listing time (most recent first)
    results.sort_by(|a, b| b.1.listing_time.cmp(&a.1.listing_time));
    
    if results.len() > limit {
        results.truncate(limit);
    }

    results
}