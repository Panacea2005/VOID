use near_sdk::test_utils::{accounts, VMContextBuilder};
use near_sdk::{testing_env, Balance, VMContext};
use near_sdk::json_types::U128;
use near_contract_standards::non_fungible_token::metadata::NFTContractMetadata;
use nft_marketplace::{Contract, NFTType, Sale};

const MINT_STORAGE_COST: u128 = 5870000000000000000000;

fn get_context(predecessor_account_id: String, storage_usage: u64) -> VMContext {
    let mut builder = VMContextBuilder::new();
    builder
        .current_account_id(accounts(0))
        .signer_account_id(predecessor_account_id.clone())
        .predecessor_account_id(predecessor_account_id)
        .storage_usage(storage_usage);
    builder.build()
}

fn sample_token_metadata() -> near_contract_standards::non_fungible_token::metadata::TokenMetadata {
    near_contract_standards::non_fungible_token::metadata::TokenMetadata {
        title: Some("Cube NFT".into()),
        description: Some("A test NFT".into()),
        media: None,
        media_hash: None,
        copies: None,
        issued_at: None,
        expires_at: None,
        starts_at: None,
        updated_at: None,
        extra: None,
        reference: None,
        reference_hash: None,
    }
}

fn init_contract() -> Contract {
    let mut context = get_context(accounts(0).to_string(), 0);
    context.attached_deposit = MINT_STORAGE_COST;
    context.predecessor_account_id = accounts(0).to_string();
    testing_env!(context);
    
    let metadata = NFTContractMetadata {
        spec: "nft-1.0.0".to_string(),
        name: "NFT Game".to_string(),
        symbol: "NFTG".to_string(),
        icon: None,
        base_uri: None,
        reference: None,
        reference_hash: None,
    };
    
    let contract = Contract::new(
        accounts(0).to_string(),    // owner_id
        accounts(1).to_string(),    // treasury_id
        500,                        // transaction_fee (5%)
        metadata,                   // metadata
    );
    
    contract
}

#[test]
fn test_new_contract() {
    let contract = init_contract();
    
    // Kiểm tra metadata
    let metadata = contract.nft_metadata();
    assert_eq!(metadata.spec, "nft-1.0.0");
    assert_eq!(metadata.name, "NFT Game");
    assert_eq!(metadata.symbol, "NFTG");
}

#[test]
fn test_mint_and_list_for_sale() {
    let mut contract = init_contract();
    
    // Mint một NFT cube
    let mut context = get_context(accounts(0).to_string(), 0);
    context.attached_deposit = MINT_STORAGE_COST;
    testing_env!(context);
    
    let token = contract.nft_mint(
        "cube-1".to_string(),
        accounts(2).to_string(),
        sample_token_metadata(),
        NFTType::Cube,
    );
    
    // Kiểm tra token
    assert_eq!(token.token_id, "cube-1");
    assert_eq!(token.owner_id, accounts(2).to_string());
    
    // Liệt kê để bán
    let mut context = get_context(accounts(2).to_string(), 0);
    context.attached_deposit = 10000000000000000000000; // 0.01 NEAR
    testing_env!(context);
    
    contract.list_for_sale(
        "cube-1".to_string(),
        U128(1000000000000000000000000), // 1 NEAR
    );
    
    // Kiểm tra sale
    let sale = contract.get_sale("cube-1".to_string()).unwrap();
    assert_eq!(sale.owner_id, accounts(2).to_string());
    assert_eq!(sale.price, 1000000000000000000000000);
    // Không thể kiểm tra nft_type trực tiếp vì không implement PartialEq, nhưng có thể kiểm tra các thuộc tính khác
    
    // Kiểm tra get_sales
    let sales = contract.get_sales(None, None);
    assert_eq!(sales.len(), 1);
    
    // Kiểm tra get_sales_by_owner_id
    let owner_sales = contract.get_sales_by_owner_id(accounts(2).to_string(), None, None);
    assert_eq!(owner_sales.len(), 1);
}

#[test]
fn test_buy_nft() {
    let mut contract = init_contract();
    
    // Mint và list NFT
    let mut context = get_context(accounts(0).to_string(), 0);
    context.attached_deposit = MINT_STORAGE_COST;
    testing_env!(context);
    
    contract.nft_mint(
        "cube-1".to_string(),
        accounts(2).to_string(),
        sample_token_metadata(),
        NFTType::Cube,
    );
    
    let mut context = get_context(accounts(2).to_string(), 0);
    context.attached_deposit = 10000000000000000000000; // 0.01 NEAR
    testing_env!(context);
    
    contract.list_for_sale(
        "cube-1".to_string(),
        U128(1000000000000000000000000), // 1 NEAR
    );
    
    // Mua NFT
    let mut context = get_context(accounts(3).to_string(), 0);
    context.attached_deposit = 1000000000000000000000000; // 1 NEAR
    testing_env!(context);
    
    contract.buy("cube-1".to_string());
    
    // Kiểm tra chủ mới
    let tokens = contract.nft_tokens_for_owner(accounts(3).to_string(), None, None);
    assert_eq!(tokens.len(), 1);
    assert_eq!(tokens[0].token_id, "cube-1");
    
    // Kiểm tra sale đã bị xóa
    let sale = contract.get_sale("cube-1".to_string());
    assert!(sale.is_none());
}

#[test]
fn test_transfer_nft() {
    let mut contract = init_contract();
    
    // Mint NFT
    let mut context = get_context(accounts(0).to_string(), 0);
    context.attached_deposit = MINT_STORAGE_COST;
    testing_env!(context);
    
    contract.nft_mint(
        "cube-1".to_string(),
        accounts(2).to_string(),
        sample_token_metadata(),
        NFTType::Cube,
    );
    
    // Chuyển NFT
    let mut context = get_context(accounts(2).to_string(), 0);
    context.attached_deposit = 10000000000000000000000; // 0.01 NEAR
    testing_env!(context);
    
    contract.transfer_nft(accounts(3).to_string(), "cube-1".to_string());
    
    // Kiểm tra chủ mới
    let tokens = contract.nft_tokens_for_owner(accounts(3).to_string(), None, None);
    assert_eq!(tokens.len(), 1);
    assert_eq!(tokens[0].token_id, "cube-1");
}

#[test]
fn test_burn_nft() {
    let mut contract = init_contract();
    
    // Mint NFT
    let mut context = get_context(accounts(0).to_string(), 0);
    context.attached_deposit = MINT_STORAGE_COST;
    testing_env!(context);
    
    contract.nft_mint(
        "cube-1".to_string(),
        accounts(2).to_string(),
        sample_token_metadata(),
        NFTType::Cube,
    );
    
    // Burn NFT
    let mut context = get_context(accounts(2).to_string(), 0);
    testing_env!(context);
    
    contract.burn_nft("cube-1".to_string());
    
    // Kiểm tra NFT đã bị xóa
    let tokens = contract.nft_tokens_for_owner(accounts(2).to_string(), None, None);
    assert_eq!(tokens.len(), 0);
}

#[test]
#[should_panic(expected = "Only the token owner can list it for sale")]
fn test_list_not_owned_nft() {
    let mut contract = init_contract();
    
    // Mint NFT
    let mut context = get_context(accounts(0).to_string(), 0);
    context.attached_deposit = MINT_STORAGE_COST;
    testing_env!(context);
    
    contract.nft_mint(
        "cube-1".to_string(),
        accounts(2).to_string(),
        sample_token_metadata(),
        NFTType::Cube,
    );
    
    // Người không phải chủ sở hữu cố gắng liệt kê
    let mut context = get_context(accounts(3).to_string(), 0);
    context.attached_deposit = 10000000000000000000000; // 0.01 NEAR
    testing_env!(context);
    
    contract.list_for_sale(
        "cube-1".to_string(),
        U128(1000000000000000000000000), // 1 NEAR
    );
}

#[test]
#[should_panic(expected = "Only the token owner can burn it")]
fn test_burn_not_owned_nft() {
    let mut contract = init_contract();
    
    // Mint NFT
    let mut context = get_context(accounts(0).to_string(), 0);
    context.attached_deposit = MINT_STORAGE_COST;
    testing_env!(context);
    
    contract.nft_mint(
        "cube-1".to_string(),
        accounts(2).to_string(),
        sample_token_metadata(),
        NFTType::Cube,
    );
    
    // Người không phải chủ sở hữu cố gắng burn
    let mut context = get_context(accounts(3).to_string(), 0);
    testing_env!(context);
    
    contract.burn_nft("cube-1".to_string());
} 