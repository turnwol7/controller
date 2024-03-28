import { useEffect, useState } from "react";
import { KeychainContext } from "types/keychain";
import { connectToController } from "connector";
import { constants } from "starknet";

type UseKeychainContextReturn = {
  context: KeychainContext;
  setContext: (context: KeychainContext) => void;
  chainId: constants.StarknetChainId;
};

export function useKeychainContext(): UseKeychainContextReturn {
  const [context, setContext] = useState<KeychainContext>();
  const [chainId, setChainId] = useState(constants.StarknetChainId.SN_SEPOLIA);

  // Create connection if not stored
  useEffect(() => {
    if (typeof window === "undefined" || window.self === window.top) {
      return;
    }

    const connection = connectToController({ chainId, setChainId, setContext });
    return () => {
      connection.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setContext]);

  return {
    context,
    setContext,
    chainId,
  };
}
