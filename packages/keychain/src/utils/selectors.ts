export const VERSION = "0.0.9";

export const selectors = {
  [VERSION]: {
    active: () => `@cartridge/active`,
    account: (address: string) => `@cartridge/account_v2/${address}`,
    deployment: (address: string, chainId: string) =>
      `@cartridge/deployment/${address}/${chainId}`,
    admin: (address: string, origin: string) =>
      `@cartridge/admin/${address}/${origin}`,
    session: (address: string, origin: string, chainId: string) =>
      `@cartridge/session/${address}/${origin}/${chainId}`,
  },
};
