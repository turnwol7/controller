import { connectToParent } from "@cartridge/penpal";
import { useEffect, useState } from "react";
import { KeychainContext } from "types/keychain";
import { normalize, validate } from "../methods";
import { constants } from "starknet";
import { estimateDeclareFee, estimateInvokeFee } from "methods/estimate";
import provision from "methods/provision";
import { register } from "methods/register";
import login from "methods/login";
import logout from "methods/logout";
import { revoke, session, sessions } from "methods/sessions";
import { connectFactory, disconnect } from "methods/connect";
import { executeFactory } from "methods/execute";
import { probe } from "methods/prove";
import { signMessageFactory } from "methods/sign";
import { issueStarterPackFactory } from "methods/starter-pack";
import { showQuestsFactory } from "./quest";

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

    const connection = connectToParent({
      methods: {
        connect: normalize(connectFactory(setChainId, setContext)),
        disconnect: normalize(validate(disconnect)),
        execute: normalize(validate(executeFactory(chainId, setContext))),
        estimateDeclareFee: normalize(validate(estimateDeclareFee)),
        estimateInvokeFee: normalize(validate(estimateInvokeFee)),
        provision: normalize(provision),
        register: normalize(register),
        login: normalize(login),
        logout: normalize(logout),
        probe: normalize(validate(probe)),
        revoke: normalize(revoke),
        signMessage: normalize(validate(signMessageFactory(setContext))),
        session: normalize(session),
        sessions: normalize(sessions),
        reset: normalize(() => () => setContext(undefined)),
        issueStarterPack: normalize(issueStarterPackFactory(setContext)),
        showQuests: normalize(showQuestsFactory(setContext)),
      },
    });

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
