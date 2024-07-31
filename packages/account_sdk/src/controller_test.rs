use cainome::cairo_serde::CairoSerde;
use starknet::{
    accounts::{Account, Call},
    macros::{felt, selector},
    providers::Provider,
    signers::SigningKey,
};

use crate::{
    controller::Controller, provider::CartridgeProvider, signers::HashSigner,
    storage::InMemoryStorage, tests::runners::katana::KatanaRunner,
    transaction_waiter::TransactionWaiter,
};

#[tokio::test]
async fn test_deploy_controller() {
    // Initialize the test runner
    let runner = KatanaRunner::load();

    // Create signers
    let owner = SigningKey::from_random();
    let guardian_signer = SigningKey::from_random();

    // Create a provider
    let provider = runner.client();

    // Create an in-memory storage backend
    let backend = InMemoryStorage::default();

    // Create a new Controller instance
    let username = "testuser".to_string();
    let address = felt!("0x1234"); // Example address, you may want to calculate this
    let chain_id = provider.chain_id().await.unwrap();

    let controller = Controller::new(
        username.clone(),
        provider.clone(),
        owner.clone(),
        guardian_signer.clone(),
        address,
        chain_id,
        backend,
    );

    // Deploy the controller
    let max_fee = felt!("0x1000000000000000"); // Adjust as needed
    let deploy_result = controller.deploy(max_fee).await.unwrap();

    // Wait for the transaction to be mined
    TransactionWaiter::new(deploy_result.transaction_hash, provider.clone())
        .wait()
        .await
        .unwrap();

    // Verify the deployment
    let deployed_address = controller.address();
    assert_eq!(
        deployed_address, address,
        "Deployed address doesn't match expected address"
    );

    // Optional: You can add more assertions here to verify the deployed controller's state
    // For example, you could call a method on the deployed controller to check its initial state

    println!(
        "Controller deployed successfully at address: {}",
        deployed_address
    );
}
