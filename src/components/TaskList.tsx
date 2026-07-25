import { useAccount, useReadContracts } from "wagmi";
import { useEffect, useMemo } from "react";
import { contractAbi, contractAddress } from "../contract";
import { useCampfireRead, useTx } from "../lib/useCampfire";
import { formatCredits, shortAddress, formatRelative } from "../lib/format";
import type { TaskRow } from "../abi";
import type { ToastApi } from "../lib/useToasts";
import { TxPill } from "./CreateTaskForm";
import type { Address } from "viem";

interface TaskListProps {
  toasts: ToastApi;
  /** Bump this number to trigger a refetch after a write succeeds. */
  refreshKey: number;
}

const STATUS_LABELS: Record<number, string> = {
  0: "Open",
  1: "Claimed",
  2: "Submitted",
  3: "Completed",
  4: "Cancelled",
};

/**
 * Flat editorial list of tasks. Loads up to the most recent 30 tasks by
 * reading taskCount then getTask for each id. No nested cards.
 */
export function TaskList({ toasts, refreshKey }: TaskListProps) {
  const { address } = useAccount();

  const { data: countRaw, isLoading: countLoading } = useCampfireRead(
    "taskCount",
    [],
  );
  const count = countRaw ? Number(countRaw) : 0;

  // Build a batch of getTask calls for the most recent 30 ids.
  const calls = useMemo(() => {
    if (count === 0) return [];
    const limit = Math.min(count, 30);
    const start = count - limit + 1;
    return Array.from({ length: limit }, (_, i) => {
      const id = BigInt(start + i);
      return {
        abi: contractAbi,
        address: contractAddress,
        functionName: "getTask",
        args: [id],
      };
    });
  }, [count]);

  const { data, isLoading, refetch, isFetching } = useReadContracts({
    contracts: calls,
    query: {
      enabled: calls.length > 0,
    },
  });

  // Refetch when refreshKey changes (after a successful write).
  useEffect(() => {
    if (refreshKey > 0) refetch();
  }, [refreshKey, refetch]);

  const { data: communityEntityRaw } = useCampfireRead("communityEntity", []);
  const communityEntity = communityEntityRaw as Address | undefined;

  const tx = useTx();
  const busy =
    tx.status.state === "awaiting-approval" || tx.status.state === "pending";

  const tasks: TaskRow[] = useMemo(() => {
    if (!data) return [];
    return data
      .map((r) => r.result as TaskRow | undefined)
      .filter((t): t is TaskRow => !!t && t.id !== 0n)
      .sort((a, b) => Number(b.id - a.id));
  }, [data]);

  if (countLoading || isLoading) {
    return (
      <section className="panel">
        <div className="panel__head">
          <h3 className="panel__title">Activity</h3>
        </div>
        <div className="state">Loading tasks…</div>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="panel">
        <div className="panel__head">
          <h3 className="panel__title">Activity</h3>
          <span className="panel__hint">{count} total</span>
        </div>
        <div className="state">
          <p className="state__title">The board is empty</p>
          <p className="state__hint">
            Be the first to post a request or an offer.
          </p>
        </div>
      </section>
    );
  }

  const runAction = async (
    functionName: string,
    args: readonly unknown[],
    successTitle: string,
  ) => {
    if (busy) return;
    await tx.run({
      functionName,
      args,
      onError: (r) =>
        toasts.push({ kind: "danger", title: "Action failed", message: r }),
    });
    if (tx.status.state === "success") {
      toasts.push({ kind: "success", title: successTitle });
      await refetch();
    }
  };

  return (
    <section className="panel panel--bare">
      <div className="panel__head" style={{ padding: "var(--space-5) var(--space-5) 0" }}>
        <h3 className="panel__title">Activity</h3>
        <span className="panel__hint">
          {tasks.length} shown · {count} total{isFetching ? " · refreshing" : ""}
        </span>
      </div>

      <div className="tasklist" style={{ padding: "0 var(--space-5)" }}>
        {tasks.map((t) => {
          const status = t.status;
          const viewerIsCreator =
            !!address && t.creator.toLowerCase() === address.toLowerCase();
          const viewerIsClaimant =
            !!address && t.claimant.toLowerCase() === address.toLowerCase();
          const viewerIsCommunityEntity =
            !!address &&
            !!communityEntity &&
            address.toLowerCase() === communityEntity.toLowerCase();
          const canApprove =
            (viewerIsCreator || viewerIsCommunityEntity) && status === 2;
          const canCancel =
            (viewerIsCreator || viewerIsCommunityEntity) &&
            (status === 0 || status === 1);
          const canClaim =
            !!address &&
            status === 0 &&
            !viewerIsCreator;
          const canSubmit = viewerIsClaimant && status === 1;

          const kindLabel = t.kind === 1 ? "Offer" : "Request";
          const kindClass = t.kind === 1 ? "taskrow__kind--offer" : "taskrow__kind--request";
          const statusClass =
            "status--" +
            (["open", "claimed", "submitted", "completed", "cancelled"][status] ?? "open");

          return (
            <article key={t.id} className="taskrow">
              <div>
                <span className={`taskrow__kind ${kindClass}`}>{kindLabel}</span>
                <div className="tiny muted" style={{ marginTop: 6 }}>
                  #{t.id.toString()}
                </div>
              </div>

              <div className="taskrow__body">
                <p className="taskrow__desc">{t.description}</p>
                <div className="taskrow__meta">
                  <span>
                    by <span className="taskrow__reward">{shortAddress(t.creator)}</span>
                  </span>
                  {t.claimant && t.claimant !== "0x0000000000000000000000000000000000000000" && (
                    <span>
                      claimed by {shortAddress(t.claimant)}
                    </span>
                  )}
                  <span>{formatRelative(t.createdAt)}</span>
                </div>
              </div>

              <div className="taskrow__actions">
                <span
                  className="taskrow__reward"
                  style={{ fontSize: 16 }}
                >
                  {formatCredits(t.reward)}{" "}
                  <span className="tiny muted">credits</span>
                </span>
                <span className={`status ${statusClass}`}>
                  {STATUS_LABELS[status] ?? "Unknown"}
                </span>

                {canClaim && (
                  <button
                    className="btn btn--small"
                    disabled={busy}
                    onClick={() => runAction("claimTask", [t.id], "Task claimed")}
                  >
                    Claim
                  </button>
                )}
                {canSubmit && (
                  <button
                    className="btn btn--small btn--success"
                    disabled={busy}
                    onClick={() => runAction("submitTask", [t.id], "Completion submitted")}
                  >
                    Submit completion
                  </button>
                )}
                {canApprove && (
                  <button
                    className="btn btn--small btn--primary"
                    disabled={busy}
                    onClick={() => runAction("approveTask", [t.id], "Task approved · credits issued")}
                  >
                    Approve &amp; issue
                  </button>
                )}
                {canCancel && (
                  <button
                    className="btn btn--small btn--danger"
                    disabled={busy}
                    onClick={() => runAction("cancelTask", [t.id], "Task cancelled")}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div
        style={{
          padding: "var(--space-3) var(--space-5)",
          borderTop: "var(--line-soft)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TxPill status={tx.status} />
        <button className="btn btn--ghost btn--small" onClick={() => refetch()}>
          Refresh
        </button>
      </div>
    </section>
  );
}
