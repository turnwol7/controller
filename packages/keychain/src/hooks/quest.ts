import { KeychainContext, Quests } from "types/keychain";

export function showQuestsFactory(setContext: (ctx: KeychainContext) => void) {
  return (origin: string) => async (gameId: string) => {
    return await new Promise((resolve, reject) => {
      setContext({
        type: "quests",
        origin,
        gameId,
        resolve,
        reject,
      } as Quests);
    });
  };
}
