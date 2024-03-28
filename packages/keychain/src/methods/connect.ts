import { ConnectReply, Policy, Session } from "@cartridge/controller";
import { constants } from "starknet";
import { Connect, KeychainContext } from "types/keychain";
import Controller from "utils/controller";

export function connectFactory(
  setChainId: (chainId: constants.StarknetChainId) => void,
  setContext: (context: KeychainContext) => void,
) {
  return (origin: string) =>
    (
      policies: Policy[],
      starterPackId?: string,
      chainId?: constants.StarknetChainId,
    ): Promise<ConnectReply> => {
      if (chainId) {
        setChainId(chainId);
      }

      return new Promise((resolve, reject) => {
        setContext({
          type: "connect",
          origin,
          policies,
          starterPackId,
          resolve,
          reject,
        } as Connect);
      });
    };
}

export function disconnect(
  controller: Controller,
  _session: Session,
  origin: string,
) {
  return () => {
    controller.revoke(origin);
    return;
  };
}
