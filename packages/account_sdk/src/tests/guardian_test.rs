use crate::{
    abigen::erc_20::Erc20,
    signers::{webauthn::WebauthnSigner, HashSigner},
    tests::{
        account::{webauthn::SoftPasskeySigner, FEE_TOKEN_ADDRESS},
        runners::katana::KatanaRunner,
    },
};
use cainome::cairo_serde::{ContractAddress, U256};
use starknet::{
    core::types::{BlockId, BlockTag},
    macros::felt,
    signers::SigningKey,
};

pub async fn test_verify_execute<S: HashSigner + Clone + Sync + Send>(signer: S) {
    let runner = KatanaRunner::load();
    let controller = runner.deploy_controller(&signer).await;

    let new_account = ContractAddress(felt!("0x18301129"));

    let contract_erc20 = Erc20::new(*FEE_TOKEN_ADDRESS, &controller);

    contract_erc20
        .balanceOf(&new_account)
        .block_id(BlockId::Tag(BlockTag::Latest))
        .call()
        .await
        .expect("failed to call contract");

    contract_erc20
        .transfer(
            &new_account,
            &U256 {
                low: 0x10_u128,
                high: 0,
            },
        )
        .send()
        .await
        .unwrap();
}

#[tokio::test]
async fn test_verify_execute_webauthn_guardian_starknet() {
    let signer = WebauthnSigner::register(
        "cartridge.gg".to_string(),
        "username".to_string(),
        "challenge".as_bytes(),
        SoftPasskeySigner::new("https://cartridge.gg".try_into().unwrap()),
    )
    .await
    .unwrap();

    test_verify_execute(signer).await;
}

#[tokio::test]
async fn test_verify_execute_starknet_guardian_starknet() {
    test_verify_execute(SigningKey::from_random()).await;
}
