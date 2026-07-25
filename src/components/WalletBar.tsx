import { useState } from "react";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { shortAddress } from "../lib/format";
import { useIsCorrectChain } from "../lib/useCampfire";
import { monadTestnet } from "../config";
import type { ToastApi } from "../lib/useToasts";

interface WalletBarProps {
  toasts: ToastApi;
}

/**
 * Wallet connection bar. Surfaces every required UX state from DESIGN.md:
 * disconnected, connected, wrong network, pending wallet approval, plus
 * the "no injected wallet detected" case so the demo doesn't fail silently.
 *
 * Connect/disconnect/switch-network all run through wagmi hooks that talk
 * to whatever EIP-1193 wallet extension the user installed (Rabby, MetaMask,
 * etc). The app never sees a private key — signing happens in the extension.
 */
export function WalletBar({ toasts }: WalletBarProps) {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connectAsync, isPending: connectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: switchPending } = useSwitchChain();
  const correctChain = useIsCorrectChain();

  const [showNoWalletHint, setShowNoWalletHint] = useState(false);

  const { data: monBalance } = useBalance({
    address: address,
    query: { enabled: !!address },
  });

  // Pick the injected connector (Rabby/MetaMask expose themselves as this).
  // If multiInjectedProviderDiscovery is on, wagmi may surface several — we
  // just take the first one. That's enough for the MVP.
  const injected = connectors.find((c) => c.type === "injected");

  const dotClass = !isConnected
    ? ""
    : !correctChain
      ? "walletbar__dot--wrong"
      : isConnecting
        ? "walletbar__dot--pending"
        : "walletbar__dot--connected";

  const label = !isConnected
    ? "Not connected"
    : !correctChain
      ? `Wrong network — switch to ${monadTestnet.name}`
      : isConnecting
        ? "Connecting…"
        : "Connected";

  async function handleConnect() {
    if (!injected) {
      setShowNoWalletHint(true);
      toasts.push({
        kind: "warning",
        title: "No wallet detected",
        message:
          "Install Rabby or MetaMask, then refresh. The app talks to the wallet via the EIP-1193 standard.",
      });
      return;
    }
    try {
      await connectAsync({ connector: injected });
      toasts.push({ kind: "success", title: "Wallet connected" });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const isRejection = /rejected|denied|user rejected|4001/i.test(reason);
      toasts.push({
        kind: isRejection ? "info" : "danger",
        title: isRejection ? "Connection rejected" : "Connection failed",
        message: isRejection
          ? "You closed the wallet prompt. Click Connect again when ready."
          : reason,
      });
    }
  }

  async function handleSwitchChain() {
    try {
      await switchChainAsync({ chainId: monadTestnet.id });
      toasts.push({
        kind: "success",
        title: `Switched to ${monadTestnet.name}`,
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const isRejection = /rejected|denied|user rejected|4001/i.test(reason);
      toasts.push({
        kind: isRejection ? "info" : "danger",
        title: isRejection ? "Switch rejected" : "Switch failed",
        message: isRejection
          ? `You closed the network prompt. Add or switch to ${monadTestnet.name} (chain id ${monadTestnet.id}) in your wallet.`
          : reason,
      });
    }
  }

  function handleDisconnect() {
    disconnect();
    toasts.push({ kind: "info", title: "Wallet disconnected" });
  }

  return (
    <div className="walletbar" title="Wallet connection">
      <span className={`walletbar__dot ${dotClass}`} aria-hidden />
      <span className="walletbar__label">{label}</span>

      {isConnected && address && (
        <>
          <span className="walletbar__addr">{shortAddress(address)}</span>
          {monBalance && (
            <span className="walletbar__addr tiny">
              {Number(monBalance.formatted).toFixed(2)} {monBalance.symbol}
            </span>
          )}
          <button
            className="btn btn--ghost btn--small"
            onClick={handleDisconnect}
          >
            Disconnect
          </button>
        </>
      )}

      {isConnected && !correctChain && (
        <button
          className="btn btn--primary btn--small"
          disabled={switchPending}
          onClick={handleSwitchChain}
        >
          {switchPending ? "Switching…" : `Switch to ${monadTestnet.name}`}
        </button>
      )}

      {!isConnected && (
        <>
          <button
            className="btn btn--primary btn--small"
            disabled={connectPending}
            onClick={handleConnect}
          >
            {connectPending ? "Opening wallet…" : "Connect wallet"}
          </button>
          {showNoWalletHint && !injected && (
            <span className="walletbar__hint tiny">
              No EIP-1193 wallet found. Install{" "}
              <a
                href="https://rabby.io"
                target="_blank"
                rel="noreferrer noopener"
              >
                Rabby
              </a>{" "}
              or{" "}
              <a
                href="https://metamask.io"
                target="_blank"
                rel="noreferrer noopener"
              >
                MetaMask
              </a>
              .
            </span>
          )}
        </>
      )}
    </div>
  );
}
