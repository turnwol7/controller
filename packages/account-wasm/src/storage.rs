use account_sdk::storage::{StorageBackend, StorageError, StorageValue};
use async_trait::async_trait;
use web_sys::window;

use crate::signer::BrowserBackend;

#[cfg_attr(not(target_arch = "wasm32"), async_trait)]
#[cfg_attr(target_arch = "wasm32", async_trait)]
impl StorageBackend for BrowserBackend {
    async fn set(&mut self, key: &str, value: &StorageValue) -> Result<(), StorageError> {
        let local_storage = Self::local_storage()?;

        let serialized = serde_json::to_string(value)?;
        local_storage
            .set_item(key, &serialized)
            .map_err(|_| StorageError::OperationFailed("setting item in localStorage".into()))?;
        Ok(())
    }

    async fn get(&self, key: &str) -> Result<Option<StorageValue>, StorageError> {
        let local_storage = Self::local_storage()?;

        if let Ok(Some(value)) = local_storage.get_item(key) {
            let deserialized = serde_json::from_str(&value)?;
            Ok(Some(deserialized))
        } else {
            Ok(None)
        }
    }

    async fn remove(&mut self, key: &str) -> Result<(), StorageError> {
        let local_storage = Self::local_storage()?;

        local_storage
            .remove_item(key)
            .map_err(|_| StorageError::OperationFailed("removing item from localStorage".into()))?;
        Ok(())
    }

    async fn clear(&mut self) -> Result<(), StorageError> {
        let local_storage = Self::local_storage()?;

        local_storage
            .clear()
            .map_err(|_| StorageError::OperationFailed("clearing localStorage".into()))?;
        Ok(())
    }

    async fn keys(&self) -> Result<Vec<String>, StorageError> {
        let local_storage = Self::local_storage()?;
        let length = local_storage
            .length()
            .map_err(|_| StorageError::OperationFailed("getting localStorage length".into()))?;
        let mut keys = Vec::new();
        for i in 0..length {
            if let Ok(Some(key)) = local_storage.key(i) {
                keys.push(key);
            }
        }
        Ok(keys)
    }
}

impl BrowserBackend {
    fn local_storage() -> Result<web_sys::Storage, StorageError> {
        let window = window()
            .ok_or_else(|| StorageError::OperationFailed("No window object found".into()))?;
        window
            .local_storage()
            .map_err(|_| StorageError::OperationFailed("Failed to get localStorage".into()))?
            .ok_or_else(|| StorageError::OperationFailed("localStorage not available".into()))
    }
}
