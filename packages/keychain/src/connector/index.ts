import { Error, ResponseCodes, Session } from "@cartridge/controller";

import { normalize as normalizeOrigin } from "utils/url";
import Controller from "utils/controller";
import { constants } from "starknet";
import { KeychainContext } from "types/keychain";
import { connectToParent } from "@cartridge/penpal";
import { connectFactory, disconnect } from "./connect";
import { executeFactory } from "./execute";
import { estimateDeclareFee, estimateInvokeFee } from "./estimate";
import provision from "./provision";
import { register } from "./register";
import login from "./login";
import logout from "./logout";
import { probe } from "./probe";
import { revoke, session, sessions } from "./sessions";
import { signMessageFactory } from "./sign";
import { issueStarterPackFactory } from "./starter-pack";
import { showQuestsFactory } from "hooks/quest";

export function connectToController({
  chainId,
  setChainId,
  setContext,
}: {
  chainId: constants.StarknetChainId;
  setChainId: (chainId: constants.StarknetChainId) => void;
  setContext: (ctx: KeychainContext) => void;
}) {
  return connectToParent({
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
}

function normalize<Promise>(
  fn: (origin: string) => Promise,
): (origin: string) => Promise {
  return (origin: string) => fn(normalizeOrigin(origin));
}

function validate<T>(
  fn: (controller: Controller, session: Session, origin: string) => T,
): (origin: string) => T | (() => Promise<Error>) {
  return (origin: string) => {
    const controller = Controller.fromStore();
    if (!controller) {
      return async () => ({
        code: ResponseCodes.NOT_CONNECTED,
        message: "Controller not found.",
      });
    }

    const session = controller.session(origin);
    if (!session) {
      return async () => ({
        code: ResponseCodes.NOT_CONNECTED,
        message: "Controller not connected.",
      });
    }

    return fn(controller, session, origin);
  };
}
