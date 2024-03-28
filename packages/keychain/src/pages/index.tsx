import type { NextPage } from "next";
import dynamic from "next/dynamic";
import { useState } from "react";
import Controller, { diff } from "utils/controller";
import {
  Error,
  ResponseCodes,
  ExecuteReply,
  Policy,
} from "@cartridge/controller";
import { Signature } from "starknet";
import logout from "../methods/logout";
import { Status } from "utils/account";
import {
  Connect,
  DeploymentRequired,
  Execute,
  Login,
  Logout,
  Quests,
  Redeploy,
  SignMessage,
  Signup,
  StarterPack,
} from "components";
import { useController } from "hooks/controller";
import * as types from "types/keychain";
import { useKeychainContext } from "hooks/keychain";

const Index: NextPage = () => {
  const { context, chainId, setContext } = useKeychainContext();

  const [controller, setController] = useController();
  const [showSignup, setShowSignup] = useState(false);
  const [prefilledUsername, setPrefilledUsername] = useState<string>();

  if (window.self === window.top || !context?.origin) {
    return null;
  }

  const onController = async (controller: Controller) => {
    if (context.type !== "connect") return;

    if (controller.session(context.origin)) {
      setController(controller);
      return;
    }

    const account = controller.account(
      (context as any).transactionsDetail?.chainId ?? chainId,
    );

    if (account.status === Status.COUNTERFACTUAL) {
      // TODO: Deploy?
      context.resolve({
        code: ResponseCodes.SUCCESS,
        address: controller.address,
        policies: context.policies,
      } as any);
      setController(controller);
      return;
    }

    // This device needs to be registered, so do a webauthn signature request
    // for the register transaction during the connect flow.
    if (account.status === Status.DEPLOYED) {
      try {
        await account.register();
      } catch (e) {
        context.resolve({
          code: ResponseCodes.CANCELED,
          message: "Canceled",
        } as Error);
        setController(controller);
        return;
      }
    }

    controller.approve(context.origin, context.policies, "");

    context.resolve({
      code: ResponseCodes.SUCCESS,
      address: controller.address,
      policies: context.policies,
    } as any);

    setController(controller);
  };

  // No controller, send to login
  if (!controller) {
    return (
      <>
        {showSignup ? (
          <Signup
            prefilledName={prefilledUsername}
            onLogin={(username) => {
              setPrefilledUsername(username);
              setShowSignup(false);
            }}
            onController={onController}
            context={context as types.Connect}
          />
        ) : (
          <Login
            prefilledName={prefilledUsername}
            onSignup={(username) => {
              setPrefilledUsername(username);
              setShowSignup(true);
            }}
            onController={onController}
            context={context as types.Connect}
          />
        )}
      </>
    );
  }

  const onLogout = (context: types.KeychainContext) => {
    setContext({
      origin: context.origin,
      type: "logout",
      resolve: context.resolve,
      reject: context.reject,
    } as types.Logout);
  };

  const account = controller.account(
    (context as any).transactionsDetail?.chainId ?? chainId,
  );
  const sesh = controller.session(context.origin);

  const onConnect = async ({
    context,
    policies,
    maxFee,
  }: {
    context: types.KeychainContext;
    policies: Policy[];
    maxFee: string;
  }) => {
    if (account.status === Status.COUNTERFACTUAL) {
      // TODO: Deploy?
      context.resolve({
        code: ResponseCodes.SUCCESS,
        address: controller.address,
        policies,
      } as any);
      return;
    }

    // This device needs to be registered, so do a webauthn signature request
    // for the register transaction during the connect flow.
    if (account.status === Status.DEPLOYED) {
      try {
        await account.register();
      } catch (e) {
        context.resolve({
          code: ResponseCodes.CANCELED,
          message: "Canceled",
        } as Error);
        return;
      }
    }

    controller.approve(context.origin, policies, maxFee);

    context.resolve({
      code: ResponseCodes.SUCCESS,
      address: controller.address,
      policies,
    } as any);
  };

  if (context.type === "connect" || !sesh) {
    const ctx = context as types.Connect;

    // if no mismatch with existing policies then return success
    if (sesh && diff(sesh.policies, ctx.policies).length === 0) {
      ctx.resolve({
        code: ResponseCodes.SUCCESS,
        address: controller.address,
        policies: ctx.policies,
      });
      return <></>;
    }

    return (
      <Connect
        chainId={chainId}
        origin={ctx.origin}
        policies={ctx.type === "connect" ? (ctx as types.Connect).policies : []}
        onConnect={(policies) =>
          onConnect({
            context: ctx,
            policies,
            maxFee: "",
          })
        }
        onCancel={() =>
          ctx.resolve({ code: ResponseCodes.CANCELED, message: "Canceled" })
        }
        onLogout={() => onLogout(ctx)}
      />
    );
  }

  if (context.type === "logout") {
    const ctx = context as types.Logout;

    return (
      <Logout
        onConfirm={() => {
          logout(ctx.origin)();
          ctx.resolve({
            code: ResponseCodes.NOT_CONNECTED,
            message: "User logged out",
          });
        }}
        onCancel={() =>
          ctx.resolve({
            code: ResponseCodes.CANCELED,
            message: "User cancelled logout",
          })
        }
      />
    );
  }

  if (context.type === "starterpack") {
    const ctx = context as types.StarterPack;
    return (
      <StarterPack
        controller={controller}
        starterPackId={ctx.starterPackId}
        onClaim={(res: ExecuteReply) => ctx.resolve(res)}
      />
    );
  }

  if (context.type === "quests") {
    const ctx = context as types.Quests;
    return (
      <Quests
        gameId={ctx.gameId}
        address={controller.address}
        chainId={chainId}
        onLogout={() => onLogout(ctx)}
      />
    );
  }

  if (context.type === "sign-message") {
    const ctx = context as types.SignMessage;
    return (
      <SignMessage
        chainId={chainId}
        controller={controller}
        origin={ctx.origin}
        typedData={ctx.typedData}
        onSign={(sig: Signature) => context.resolve(sig)}
        onCancel={() =>
          ctx.resolve({
            code: ResponseCodes.CANCELED,
            message: "Canceled",
          })
        }
        onLogout={() => onLogout(ctx)}
      />
    );
  }

  if (context.type === "execute") {
    const ctx = context as types.Execute;
    const _chainId = ctx.transactionsDetail?.chainId ?? chainId;
    const account = controller.account(_chainId);

    if (account.status === Status.DEPLOYED) {
      return (
        <Connect
          origin={ctx.origin}
          chainId={_chainId}
          policies={[]}
          onConnect={() =>
            onConnect({
              context: ctx,
              policies: [],
              maxFee: "",
            })
          }
          onCancel={() =>
            ctx.resolve({ code: ResponseCodes.CANCELED, message: "Canceled" })
          }
          onLogout={() => onLogout(ctx)}
        />
      );
    }

    if (account.status === Status.COUNTERFACTUAL) {
      return (
        <Redeploy
          chainId={_chainId}
          controller={controller}
          onLogout={() => onLogout(ctx)}
        />
      );
    }

    return (
      <DeploymentRequired
        chainId={chainId}
        controller={controller}
        onClose={() =>
          ctx.resolve({
            code: ResponseCodes.CANCELED,
            message: "Canceled",
          })
        }
        onLogout={() => onLogout(ctx)}
      >
        <Execute
          {...ctx}
          chainId={_chainId}
          controller={controller}
          onExecute={(res: ExecuteReply) => ctx.resolve(res)}
          onCancel={() =>
            ctx.resolve({
              code: ResponseCodes.CANCELED,
              message: "Canceled",
            })
          }
          onLogout={() => onLogout(ctx)}
        />
      </DeploymentRequired>
    );
  }

  return <>*Waves*</>;
};

export default dynamic(() => Promise.resolve(Index), { ssr: false });
