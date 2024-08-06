// import { TransferEth } from "./components/TransferEth";
import { ConnectWallet } from "./components/ConnectWallet";
import { StarknetProvider } from "./components/StarknetProvider";
// import { InvalidTxn } from "./components/InvalidTxn";
// import { SignMessage } from "./components/SignMessage";
// import { DojoSpawnAndMove } from "./components/DojoSpawnAndMove";
// import { DelegateAccount } from "./components/DelegateAccount";

export function App() {
  return (
    <StarknetProvider>
      <div>
        <h2 className="text-3xl font-bold underline text-primary-foreground">Wallet</h2>
        <ConnectWallet />
        {/* <DojoSpawnAndMove />
      <TransferEth />
      <DelegateAccount />
      <InvalidTxn />
      <SignMessage /> */}
      </div>
    </StarknetProvider>
  );
}
