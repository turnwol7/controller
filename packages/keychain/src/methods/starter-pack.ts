import { KeychainContext, StarterPack } from "types/keychain";

export function issueStarterPackFactory(
  setContext: (ctx: KeychainContext) => void,
) {
  return (origin: string) => async (starterPackId: string) => {
    return await new Promise((resolve, reject) => {
      setContext({
        type: "starterpack",
        origin,
        starterPackId,
        resolve,
        reject,
      } as StarterPack);
    });
  };
}
