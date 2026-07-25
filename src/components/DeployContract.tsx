import { useState } from "react";
import {
  useAccount,
  useDeployContract,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  campfireBytecode,
  campfireDeployAbi,
  campfireConstructorArgs,
} from "../contract-deployment";
import { monadTestnet } from "../config";
import type { ToastApi } from "../lib/useToasts";
import { shortAddress } from "../lib/format";
import type { Hash } from "viem";

interface DeployContractProps {
  toasts: ToastApi;
  onDeployed: (address: `0x${string}`) => void;
}

/**
 * In-app contract deployment. Shows a callout with a Deploy button that
 * signs the deployment transaction via the connected wallet. The deployer
 * becomes the community entity (first member, can invite others).
 *
 * After success, the new address is written to localStorage and the parent
 * is notified via onDeployed so it can re-read the config without a rebuild.
 */
export function DeployContract({ toasts, onDeployed }: DeployContractProps) {
  const { address, isConnected } = useAccount();
  const { deployContractAsync, isPending } = useDeployContract();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const [deployTxHash, setDeployTxHash] = useState<Hash | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<`0x${string}` | null>(
    null,
  );

  // Watch the deployment tx for confirmation, then extract the contract
  // address from the receipt.
  const receipt = useWaitForTransactionReceipt({
    hash: deployTxHash ?? undefined,
    query: { enabled: !!deployTxHash },
  });

  if (deployTxHash && receipt.isSuccess && !deployedAddress) {
    const addr = receipt.data?.contractAddress;
    if (addr) {
      setDeployedAddress(addr);
      localStorage.setItem("campfire:contractAddress", addr);
      toasts.push({
        kind: "success",
        title: "Contract deployed!",
        message: `Address: ${shortAddress(addr)}. You are now the community entity.`,
        txHash: deployTxHash,
      });
      // Defer onDeployed to the next tick so state settles.
      setTimeout(() => onDeployed(addr), 0);
    }
  }

  async function handleDeploy() {
    if (!address) {
      toasts.push({
        kind: "warning",
        title: "Connect wallet first",
        message: "You need a connected wallet to deploy the contract.",
      });
      return;
    }
    if (!publicClient) {
      toasts.push({
        kind: "danger",
        title: "No RPC client",
        message: "Public client not available. Make sure you're on Monad Testnet.",
      });
      return;
    }

    try {
      toasts.push({
        kind: "info",
        title: "Deploying contract",
        message: "Approve the deployment in your wallet. You will become the community entity.",
      });

      const hash = await deployContractAsync({
        abi: campfireDeployAbi,
        bytecode: campfireBytecode,
        args: [...campfireConstructorArgs],
      });

      toasts.push({
        kind: "info",
        title: "Deployment sent",
        message: `Transaction ${shortAddress(hash)} — waiting for confirmation…`,
        txHash: hash,
      });
      setDeployTxHash(hash);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const isRejection = /rejected|denied|user rejected|4001/i.test(reason);
      toasts.push({
        kind: isRejection ? "info" : "danger",
        title: isRejection ? "Deployment rejected" : "Deployment failed",
        message: isRejection
          ? "You closed the wallet prompt. Click Deploy again when ready."
          : reason,
      });
    }
  }

  async function handleSwitchAndDeploy() {
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
      await new Promise((r) => setTimeout(r, 300));
      await handleDeploy();
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      toasts.push({
        kind: "danger",
        title: "Network switch failed",
        message: reason,
      });
    }
  }

  if (deployedAddress) {
    return (
      <div
        className="callout callout--info"
        style={{ marginBottom: "var(--space-4)" }}
      >
        <div className="callout__title">Contract deployed</div>
        Address: <code>{deployedAddress}</code>
        <br />
        <span className="tiny muted">
          Reloading the page to activate the new address…
        </span>
      </div>
    );
  }

  const waiting = !!deployTxHash && !receipt.isSuccess;

  return (
    <div
      className="callout callout--warning"
      style={{ marginBottom: "var(--space-4)" }}
    >
      <div className="callout__title">Contract not deployed</div>
      <p style={{ margin: "var(--space-2) 0" }}>
        <code>CAMPFIRE_CONTRACT_ADDRESS</code> in <code>src/config.ts</code> is
        still the placeholder. You can deploy the contract right here — your
        connected wallet will become the community entity (the only address
        that can invite members and approve tasks it didn't create).
      </p>

      {!isConnected ? (
        <p className="tiny muted">
          Connect your wallet first, then click Deploy.
        </p>
      ) : (
        <button
          className="btn btn--primary"
          disabled={isPending || waiting}
          onClick={handleSwitchAndDeploy}
          style={{ marginTop: "var(--space-2)" }}
        >
          {isPending
            ? "Confirming in wallet…"
            : waiting
              ? "Waiting for confirmation…"
              : "Deploy contract"}
        </button>
      )}

      <p className="tiny muted" style={{ marginTop: "var(--space-2)" }}>
        Constructor args: <code>"Campfire"</code>,{" "}
        <code>
          "A shared ledger for mutual aid — record help, claim work, settle in
          local credits."
        </code>
        <br />
        Deploying to: {monadTestnet.name} (chain id {monadTestnet.id})
      </p>
    </div>
  );
}
