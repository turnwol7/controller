use anyhow::Error;
use cainome::cairo_serde::CairoSerde;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Client, Request, Response, Server, StatusCode};
use serde_json::{json, Value};
use starknet::accounts::single_owner::SignError;
use starknet::accounts::{Account, AccountError, Call, ExecutionEncoding};
use starknet::core::types::InvokeTransactionResult;
use starknet::core::utils::get_selector_from_name;
use starknet::macros::selector;
use starknet::providers::jsonrpc::HttpTransport;
use starknet::providers::JsonRpcClient;
use starknet_crypto::Felt;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::Mutex;
use url::Url;

use crate::abigen;
use crate::account::outside_execution::OutsideExecutionRaw;

use super::katana::{single_owner_account_with_encoding, PREFUNDED};

pub struct CartridgeProxy {
    chain_id: Felt,
    rpc_url: Url,
    proxy_url: Url,
    rpc_client: JsonRpcClient<HttpTransport>,
    client: Client<hyper::client::HttpConnector>,
}

impl CartridgeProxy {
    pub fn new(rpc_url: Url, proxy_url: Url, chain_id: Felt) -> Self {
        let rpc_client = JsonRpcClient::new(HttpTransport::new(rpc_url.clone()));

        CartridgeProxy {
            chain_id,
            rpc_url,
            rpc_client,
            proxy_url,
            client: Client::new(),
        }
    }

    pub async fn run(self) {
        let proxy_addr: SocketAddr = self
            .proxy_url
            .socket_addrs(|| None)
            .expect("Failed to resolve proxy URL")
            .into_iter()
            .next()
            .expect("No socket addresses found for proxy URL");

        let shared_self = Arc::new(Mutex::new(self));

        let make_svc = make_service_fn(move |_conn| {
            let shared_self = shared_self.clone();
            async move {
                Ok::<_, hyper::Error>(service_fn(move |req| {
                    let shared_self = shared_self.clone();
                    async move {
                        let self_guard = shared_self.lock().await;
                        self_guard.handle_request(req).await
                    }
                }))
            }
        });

        let server = Server::bind(&proxy_addr).serve(make_svc);
        if let Err(e) = server.await {
            eprintln!("server error: {}", e);
        }
    }

    async fn handle_request(&self, req: Request<Body>) -> Result<Response<Body>, hyper::Error> {
        let (parts, body) = req.into_parts();
        let body_bytes = hyper::body::to_bytes(body).await?;
        let body: Value = serde_json::from_slice(&body_bytes).unwrap_or(json!({}));

        if let Some(method) = body.get("method") {
            if method == "cartridge_addExecuteOutsideTransaction" {
                let params = &body["params"];
                match parse_execute_outside_transaction_params(params) {
                    Ok((address, outside_execution, signature)) => {
                        match self
                            .execute_from_outside(outside_execution, signature, address)
                            .await
                        {
                            Ok(result) => {
                                return Ok(Response::builder()
                                    .status(StatusCode::OK)
                                    .body(Body::from(
                                        json!({
                                            "jsonrpc": "2.0",
                                            "id": body["id"],
                                            "result": format!("0x{:x}", result.transaction_hash)
                                        })
                                        .to_string(),
                                    ))
                                    .unwrap());
                            }
                            Err(e) => {
                                let error_response = json!({
                                    "jsonrpc": "2.0",
                                    "error": {
                                        "code": -32000,
                                        "message": "Execution error",
                                        "data": e.to_string()
                                    }
                                });

                                return Ok(Response::builder()
                                    .status(StatusCode::OK)
                                    .header("Content-Type", "application/json")
                                    .body(Body::from(error_response.to_string()))
                                    .unwrap());
                            }
                        };
                    }
                    Err(e) => {
                        let error_response = json!({
                            "jsonrpc": "2.0",
                            "id": body["id"],
                            "error": {
                                "code": -32602,
                                "message": e.to_string()
                            }
                        });
                        return Ok(Response::builder()
                            .status(StatusCode::OK)
                            .header("Content-Type", "application/json")
                            .body(Body::from(error_response.to_string()))
                            .unwrap());
                    }
                }
            }
        }

        let mut proxy_req = Request::builder()
            .method(parts.method)
            .uri(&self.rpc_url.to_string())
            .body(Body::from(serde_json::to_vec(&body).unwrap()))
            .unwrap();

        *proxy_req.headers_mut() = parts.headers;

        self.client.request(proxy_req).await
    }

    async fn execute_from_outside(
        &self,
        outside_execution: OutsideExecutionRaw,
        signature: Vec<Felt>,
        contract_address: Felt,
    ) -> Result<
        InvokeTransactionResult,
        AccountError<SignError<starknet::signers::local_wallet::SignError>>,
    > {
        let mut calldata = <OutsideExecutionRaw as CairoSerde>::cairo_serialize(&outside_execution);
        calldata.extend(<Vec<Felt> as CairoSerde>::cairo_serialize(&signature));

        let call = Call {
            to: contract_address,
            selector: selector!("execute_from_outside_v2"),
            calldata,
        };

        let executor = single_owner_account_with_encoding(
            &self.rpc_client,
            PREFUNDED.0.clone(),
            PREFUNDED.1,
            self.chain_id,
            ExecutionEncoding::New,
        );

        executor.execute_v1(vec![call]).send().await
    }
}

fn parse_execute_outside_transaction_params(
    params: &Value,
) -> Result<(Felt, OutsideExecutionRaw, Vec<Felt>), Error> {
    let address: Felt = serde_json::from_value(params["address"].clone())?;
    let signature: Vec<Felt> = serde_json::from_value(params["signature"].clone())?;

    let outside_execution_params = &params["outside_execution"];
    let caller: Felt = serde_json::from_value(outside_execution_params["caller"].clone())?;
    let nonce: Felt = serde_json::from_value(outside_execution_params["nonce"].clone())?;
    let execute_after: u64 =
        serde_json::from_value(outside_execution_params["execute_after"].clone())?;
    let execute_before: u64 =
        serde_json::from_value(outside_execution_params["execute_before"].clone())?;

    let calls: Vec<abigen::controller::Call> = outside_execution_params["calls"]
        .as_array()
        .unwrap()
        .iter()
        .map(|call| {
            Ok(abigen::controller::Call {
                to: serde_json::from_value(call["contract_address"].clone())?,
                selector: get_selector_from_name(&serde_json::from_value::<String>(
                    call["entrypoint"].clone(),
                )?)?,
                calldata: serde_json::from_value(call["calldata"].clone())?,
            })
        })
        .collect::<Result<_, Error>>()?;

    let outside_execution = OutsideExecutionRaw {
        caller: caller.into(),
        nonce,
        execute_after,
        execute_before,
        calls,
    };

    Ok((address, outside_execution, signature))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;
    use std::str::FromStr;

    fn read_json_file(file_path: &str) -> Value {
        let path = Path::new(file_path);
        let contents = fs::read_to_string(path).expect("Unable to read file");
        serde_json::from_str(&contents).expect("Unable to parse JSON")
    }

    fn test_parse_execute_outside_transaction(file_path: &str) {
        let json_data = read_json_file(file_path);
        let params = &json_data["params"];

        let result = parse_execute_outside_transaction_params(params);
        if let Err(e) = result {
            panic!("Error parsing execute outside transaction: {}", e);
        }

        let (address, outside_execution, signature) = result.unwrap();

        // Assert address
        let expected_address = Felt::from_str(params["address"].as_str().unwrap()).unwrap();
        assert_eq!(address, expected_address, "Address mismatch");

        // Assert outside_execution
        let expected_caller =
            Felt::from_str(params["outside_execution"]["caller"].as_str().unwrap()).unwrap();
        assert_eq!(
            outside_execution.caller,
            expected_caller.into(),
            "Caller mismatch"
        );

        // Assert signature length
        let expected_signature_len = params["signature"].as_array().unwrap().len();
        assert_eq!(
            signature.len(),
            expected_signature_len,
            "Signature length mismatch"
        );
    }

    #[test]
    fn test_parse_session_execute_outside_transaction() {
        test_parse_execute_outside_transaction(
            "src/tests/runners/test_data/session_execute_outside.json",
        );
    }

    #[test]
    fn test_parse_webauthn_execute_outside_transaction() {
        test_parse_execute_outside_transaction(
            "src/tests/runners/test_data/webauthn_execute_outside.json",
        );
    }
}
