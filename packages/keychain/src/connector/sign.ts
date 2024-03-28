import { Session } from "@cartridge/controller";
import { typedData } from "starknet";
import { KeychainContext, SignMessage } from "types/keychain";
import Controller from "utils/controller";

export function signMessageFactory(setContext: (ctx: KeychainContext) => void) {
  return (_: Controller, _session: Session, origin: string) =>
    async (typedData: typedData.TypedData, account: string) => {
      return await new Promise((resolve, reject) => {
        setContext({
          type: "sign-message",
          origin,
          typedData,
          account,
          resolve,
          reject,
        } as SignMessage);
      });
    };
}
