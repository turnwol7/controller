import { ProbeReply, ResponseCodes, Session } from "@cartridge/controller";
import Controller from "utils/controller";

export function probe(controller: Controller, session: Session) {
  return (): ProbeReply => ({
    code: ResponseCodes.SUCCESS,
    address: controller.address,
    policies: session.policies,
  });
}
