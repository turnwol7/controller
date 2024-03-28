import {
  ConnectReply,
  Error,
  ExecuteReply,
  Policy,
} from "@cartridge/controller";
import {
  Abi,
  Call,
  constants,
  InvocationsDetails,
  Signature,
  typedData,
} from "starknet";

export type KeychainContext =
  | Connect
  | Logout
  | Execute
  | SignMessage
  | StarterPack
  | Quests;

export type Connect = {
  origin: string;
  type: "connect";
  policies: Policy[];
  starterPackId?: string;
  resolve: (res: ConnectReply | Error) => void;
  reject: (reason?: unknown) => void;
};

export type Logout = {
  origin: string;
  type: "logout";
  resolve: (res: Error) => void;
  reject: (reason?: unknown) => void;
};

export type Execute = {
  origin: string;
  type: "execute";
  transactions: Call | Call[];
  abis?: Abi[];
  transactionsDetail?: InvocationsDetails & {
    chainId?: constants.StarknetChainId;
  };
  resolve: (res: ExecuteReply | Error) => void;
  reject: (reason?: unknown) => void;
};

export type SignMessage = {
  origin: string;
  type: "sign-message";
  typedData: typedData.TypedData;
  account: string;
  resolve: (signature: Signature | Error) => void;
  reject: (reason?: unknown) => void;
};

export type StarterPack = {
  origin: string;
  type: "starterpack";
  starterPackId: string;
  resolve: (res: ExecuteReply | Error) => void;
  reject: (reason?: unknown) => void;
};

export type Quests = {
  origin: string;
  type: "quests";
  gameId: string;
  resolve: () => void;
  reject: () => void;
};
