import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { monadTestnet, CAMPFIRE_CONTRACT_ADDRESS } from "./config";
import { campfireAbi } from "./abi";
import type { Address } from "viem";

/**
 * Wagmi config for Campfire.
 *
 * Only Monad Testnet is supported. We register two injected connectors:
 *   1. `injected({ target: "metaMask" })` — filters EIP-6963 announcements
 *      for MetaMask-compatible providers. Rabby announces itself as
 *      MetaMask-compatible, so this is the primary discovery path.
 *   2. `injected()` (no target) — fallback that picks up any EIP-1193
 *      provider announcing via `window.ethereum`.
 *
 * `multiInjectedProviderDiscovery: true` lets wagmi surface additional
 * EIP-6963-announced wallets beyond the two above.
 */
export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [
    injected({ shimDisconnect: true, target: "metaMask" }),
    injected({ shimDisconnect: true }),
  ],
  multiInjectedProviderDiscovery: true,
  transports: {
    [monadTestnet.id]: http(),
  },
});

const PLACEHOLDER = "0x0000000000000000000000000000000000000000";

/**
 * Read the active contract address. Priority:
 *   1. localStorage ("campfire:contractAddress") — set by the in-app deploy
 *      button, so the app picks it up without a rebuild.
 *   2. CAMPFIRE_CONTRACT_ADDRESS from src/config.ts — the hardcoded value
 *      baked in at build time.
 */
function readContractAddress(): `0x${string}` {
  if (typeof window !== "undefined") {
    const fromStorage = window.localStorage.getItem("campfire:contractAddress");
    if (fromStorage && /^0x[a-fA-F0-9]{40}$/.test(fromStorage)) {
      return fromStorage as `0x${string}`;
    }
  }
  return CAMPFIRE_CONTRACT_ADDRESS as `0x${string}`;
}

/** True when a real contract address has been configured. */
export function isContractConfigured(): boolean {
  return readContractAddress().toLowerCase() !== PLACEHOLDER;
}

/** Active contract address (localStorage overrides build-time config). */
export function getContractAddress(): `0x${string}` {
  return readContractAddress();
}

// For backwards compatibility with existing imports that expect a static
// value. This is evaluated once at module load; if the address is deployed
// in-app afterwards, components should call getContractAddress() instead.
export const contractAddress = readContractAddress() as Address;
export const contractAbi = campfireAbi;
