import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { shortAddress } from "../lib/format";
import { useIsCorrectChain } from "../lib/useCampfire";
import { monadTestnet } from "../config";

/**
 * Wallet connection bar. Surfaces every required UX state from DESIGN.md:
 * disconnected, connected, wrong network, pending wallet approval.
 */
export function WalletBar() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connectors, connectAsync, isPending: connectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const correctChain = useIsCorrectChain();

  const { data: monBalance } = useBalance({
    address: address,
    query: { enabled: !!address },
  });

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
            onClick={() => disconnect()}
          >
            Disconnect
          </button>
        </>
      )}
      {!isConnected && (
        <button
          className="btn btn--primary btn--small"
          disabled={!injected || connectPending}
          onClick={async () => {
            if (!injected) return;
            try {
              await connectAsync({ connector: injected });
            } catch {
              /* user rejection handled by toast elsewhere */
            }
          }}
        >
          {connectPending ? "Opening wallet…" : "Connect Rabby"}
        </button>
      )}
    </div>
  );
}
