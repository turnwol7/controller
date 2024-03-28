import { Abi, Call, constants, InvocationsDetails, typedData } from "starknet";
import {
  Error,
  ResponseCodes,
  ExecuteReply,
  Policy,
  Session,
} from "@cartridge/controller";
import Controller, { diff } from "utils/controller";
import { Execute, KeychainContext } from "types/keychain";
import { Status } from "utils/account";

export function executeFactory(
  chainId: constants.StarknetChainId,
  setContext: (ctx: KeychainContext) => void,
) {
  return (controller: Controller, session: Session, origin: string) =>
    async (
      transactions: Call | Call[],
      abis?: Abi[],
      transactionsDetail?: InvocationsDetails & {
        chainId?: constants.StarknetChainId;
      },
      sync?: boolean,
    ): Promise<ExecuteReply | Error> => {
      const cId = transactionsDetail?.chainId
        ? transactionsDetail.chainId
        : chainId;
      if (sync) {
        return new Promise((resolve, reject) => {
          setContext({
            type: "execute",
            origin,
            transactions,
            abis,
            transactionsDetail,
            resolve,
            reject,
          } as Execute);
        });
      }

      const account = controller.account(cId);
      if (
        !(
          account.status === Status.REGISTERED ||
          account.status === Status.REGISTERING
        )
      ) {
        return Promise.resolve({
          code: ResponseCodes.NOT_ALLOWED,
          message: "Account not registered or deployed.",
        });
      }

      const calls = Array.isArray(transactions) ? transactions : [transactions];
      const policies = calls.map(
        (txn) =>
          ({
            target: txn.contractAddress,
            method: txn.entrypoint,
          } as Policy),
      );

      const missing = diff(policies, session.policies);
      if (missing.length > 0) {
        return Promise.resolve({
          code: ResponseCodes.NOT_ALLOWED,
          message: `Missing policies: ${JSON.stringify(missing)}`,
        });
      }

      if (!transactionsDetail.maxFee) {
        transactionsDetail.maxFee = (
          await account.estimateInvokeFee(calls, {
            nonce: transactionsDetail.nonce,
          })
        ).suggestedMaxFee;
      }

      if (
        session.maxFee &&
        transactionsDetail &&
        BigInt(transactionsDetail.maxFee) > BigInt(session.maxFee)
      ) {
        return Promise.resolve({
          code: ResponseCodes.NOT_ALLOWED,
          message: `Max fee exceeded: ${transactionsDetail.maxFee.toString()} > ${session.maxFee.toString()}`,
        });
      }

      const res = await account.execute(calls, abis, transactionsDetail);
      return {
        code: ResponseCodes.SUCCESS,
        ...res,
      };
    };
}
