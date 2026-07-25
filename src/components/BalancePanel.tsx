import { useAccount } from "wagmi";
import { useCampfireRead, useMemberInfo } from "../lib/useCampfire";
import { formatCredits, formatSecondsLeft } from "../lib/format";
import { useTx } from "../lib/useCampfire";
import type { ToastApi } from "../lib/useToasts";
import { EXPLORERS } from "../config";

interface BalancePanelProps {
  toasts: ToastApi;
  onAfterAction?: () => void;
}

/**
 * Shows the connected member's local Campfire credit balance, distinct from
 * the MON gas balance shown in WalletBar. Also surfaces the expiry rule:
 * "expires in Xd Yh" or "eligible for revocation" with a public trigger.
 */
export function BalancePanel({ toasts, onAfterAction }: BalancePanelProps) {
  const { address } = useAccount();
  const { data: info, refetch } = useMemberInfo(address);
  const { data: isMemberRaw } = useCampfireRead("isMember", [address ?? "0x0"], !!address);
  const isMember = !!isMemberRaw;
  const expiryDuration = useCampfireRead("EXPIRY_DURATION", []);

  const tx = useTx();

  const balance = info?.[1];
  const lastActivityAt = info?.[2];
  const expiresIn = info?.[3];

  if (!address) {
    return (
      <section className="panel">
        <div className="panel__head">
          <h3 className="panel__title">Credits</h3>
        </div>
        <p className="state__hint">Connect a wallet to view credits.</p>
      </section>
    );
  }

  if (!isMember) {
    return (
      <section className="panel">
        <div className="panel__head">
          <h3 className="panel__title">Credits</h3>
        </div>
        <div className="callout callout--info">
          <div className="callout__title">Not a member</div>
          Connected wallet is not a member of this Campfire community. Only
          members can hold or transfer local credits.
        </div>
      </section>
    );
  }

  const expired = expiresIn !== undefined && expiresIn <= 0n;
  const expiryClass = expired
    ? "balance__expiry--danger"
    : expiresIn !== undefined && expiresIn < 60n * 60n * 6n
      ? "balance__expiry--warning"
      : "";

  return (
    <section className="panel">
      <div className="panel__head">
        <h3 className="panel__title">Local credits</h3>
        <span className="panel__hint">non-tradable</span>
      </div>

      <div className="balance">
        <div>
          <span className="balance__amount">{formatCredits(balance)}</span>
          <span className="balance__unit">credits</span>
        </div>

        <div className="balance__row">
          <span>MON gas</span>
          <b>see wallet</b>
        </div>
        <div className="balance__row">
          <span>Last activity</span>
          <b>{lastActivityAt ? new Date(Number(lastActivityAt) * 1000).toLocaleString() : "—"}</b>
        </div>

        <div className={`balance__expiry ${expiryClass}`}>
          {expired ? (
            <>
              Balance eligible for permissionless revocation. Anyone may call
              <code> revokeExpired</code>.
            </>
          ) : (
            <>
              Expires in <b>{formatSecondsLeft(expiresIn)}</b> of inactivity.
              The contract revokes the full balance once the{" "}
              {Number(expiryDuration.data ?? 0n) === 0 ? "fixed" : Number(expiryDuration.data) / 3600 + "h"}{" "}
              window passes without activity.
            </>
          )}
        </div>

        {expired && (
          <button
            className="btn btn--danger btn--small"
            disabled={
              tx.status.state === "awaiting-approval" ||
              tx.status.state === "pending"
            }
            onClick={async () => {
              await tx.run({
                functionName: "revokeExpired",
                args: [address],
                onError: (r) =>
                  toasts.push({
                    kind: "danger",
                    title: "Revoke failed",
                    message: r,
                  }),
              });
              await refetch();
              onAfterAction?.();
              if (tx.status.state === "success") {
                toasts.push({
                  kind: "success",
                  title: "Expired balance revoked",
                });
              }
            }}
          >
            Revoke expired balance
          </button>
        )}

        <a
          className="link-explorer"
          href={`${EXPLORERS.socialscan}/address/${address}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          View on explorer ↗
        </a>
      </div>
    </section>
  );
}
