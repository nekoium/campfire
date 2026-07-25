import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet, CAMPFIRE_CONTRACT_ADDRESS } from "./config";
import { campfireAbi } from "./abi";
import type { Address } from "viem";

/**
 * Wagmi config for Campfire.
 *
 * Only Monad Testnet is supported. Rabby (and any other EIP-1193 injected
 * wallet) is exposed through the `injected()` connector. The DESIGN doc
 * requires wallet connection to be explicit and never disguised as a
 * generic login, so the connector is named "Rabby / injected".
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
  ],
  multiInjectedProviderDiscovery: true,
  transports: {
    [monadTestnet.id]: http(),
  },
});

/** True when the contract address has been set by the deployer. */
export function isContractConfigured(): boolean {
  return (
    CAMPFIRE_CONTRACT_ADDRESS.toLowerCase() !==
    "0x0000000000000000000000000000000000000000"
  );
}

export const contractAddress = CAMPFIRE_CONTRACT_ADDRESS as Address;
export const contractAbi = campfireAbi;
