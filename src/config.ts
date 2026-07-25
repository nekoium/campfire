import { defineChain } from "viem";

/**
 * Monad Testnet configuration.
 * Chain ID 10143. Used as the only supported network for Campfire.
 * Source: https://docs.monad.xyz/build-on-monad/network-information/
 */
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monadscan",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

/** Explorer base URLs for the three Monad testnet explorers. */
export const EXPLORERS = {
  monadscan: "https://testnet.monadscan.com",
  socialscan: "https://testnet.monadexplorer.com",
  monadvision: "https://testnet.monadvision.com",
} as const;

/**
 * Deployed CampfireCommunity contract address on Monad Testnet.
 *
 * Replace this placeholder with the actual deployed address after running
 * the deployment step in DEPLOYMENT.md. Until then the app boots into a
 * "contract not configured" state and the board stays read-only.
 */
export const CAMPFIRE_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

/** Monad Testnet block time, used for rough polling cadence. */
export const BLOCK_TIME_MS = 1_000;

/** Demo expiry duration exposed by the contract (EXPIRY_DURATION). */
export const EXPIRY_DURATION_SECONDS = 60 * 60 * 24; // 1 day, matches contract

/** Community metadata shown on the intro screen. Must match the on-chain
 *  values once the contract is deployed with these arguments. */
export const COMMUNITY_INTRO = {
  name: "Campfire",
  statement:
    "A shared ledger for mutual aid — record help, claim work, settle in local credits.",
} as const;
