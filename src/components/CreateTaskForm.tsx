import { useState } from "react";
import { useTx } from "../lib/useCampfire";
import { parseCredits } from "../lib/format";
import { TASK_KIND } from "../abi";
import type { ToastApi } from "../lib/useToasts";

interface CreateTaskFormProps {
  toasts: ToastApi;
  onCreated?: () => void;
  demoMode?: boolean;
}

/**
 * Inline form to create a new task. Rejects empty descriptions or zero
 * rewards client-side to avoid pointless wallet prompts (DESIGN.md error
 * prevention: block invalid actions before opening the wallet).
 *
 * In demo mode the form is interactive but never sends a transaction —
 * clicking submit shows a toast explaining how to enable real posting.
 */
export function CreateTaskForm({
  toasts,
  onCreated,
  demoMode = false,
}: CreateTaskFormProps) {
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [kind, setKind] = useState<number>(TASK_KIND.Request);

  const tx = useTx();

  const rewardRaw = parseCredits(reward);
  const valid =
    description.trim().length > 0 && rewardRaw > 0n && kind in TASK_KIND;

  const busy =
    tx.status.state === "awaiting-approval" || tx.status.state === "pending";

  const submit = async () => {
    if (demoMode) {
      toasts.push({
        kind: "info",
        title: "Demo mode",
        message:
          "Connect a wallet and deploy the contract to post real tasks.",
      });
      return;
    }
    if (!valid || busy) return;
    await tx.run({
      functionName: "createTask",
      args: [description.trim(), rewardRaw, kind],
      onError: (r) =>
        toasts.push({ kind: "danger", title: "Create task failed", message: r }),
    });
    if (tx.status.state === "success") {
      toasts.push({ kind: "success", title: "Task posted" });
      setDescription("");
      setReward("");
      setKind(TASK_KIND.Request);
      onCreated?.();
    }
  };

  return (
    <section className="panel">
      <div className="panel__head">
        <h3 className="panel__title">Post to the board</h3>
        <span className="panel__hint">request · offer</span>
      </div>

      <div className="formrow">
        <label className="field">
          <span className="field__label">Description</span>
          <textarea
            className="textarea"
            placeholder="e.g. Help fix the workshop door on Saturday."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={240}
          />
        </label>

        <div className="formrow formrow--inline">
          <label className="field">
            <span className="field__label">Credit reward</span>
            <input
              className="input"
              inputMode="numeric"
              placeholder="10"
              value={reward}
              onChange={(e) => setReward(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </label>

          <label className="field">
            <span className="field__label">Type</span>
            <select
              className="select"
              value={kind}
              onChange={(e) => setKind(Number(e.target.value))}
            >
              <option value={TASK_KIND.Request}>Request</option>
              <option value={TASK_KIND.Offer}>Offer</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-3)",
            flexWrap: "wrap",
          }}
        >
          {demoMode ? (
            <span className="tiny muted">Demo mode — posting disabled</span>
          ) : (
            <TxPill status={tx.status} />
          )}
          <button
            className="btn btn--primary"
            disabled={demoMode ? !valid : !valid || busy}
            onClick={submit}
          >
            {demoMode ? "Preview task" : busy ? "Confirming…" : "Post task"}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Re-exported so other forms can share the same look. */
export function TxPill({
  status,
}: {
  status: ReturnType<typeof useTx>["status"];
}) {
  if (status.state === "idle") return <span />;
  const map: Record<string, string> = {
    "awaiting-approval": "Confirm in wallet",
    pending: "Waiting for chain",
    success: "Confirmed",
    reverted: "Reverted",
    rejected: "Rejected",
  };
  const cls =
    status.state === "pending" || status.state === "awaiting-approval"
      ? "txstatus--pending"
      : status.state === "success"
        ? "txstatus--success"
        : "txstatus--danger";
  return (
    <span className={`txstatus ${cls}`}>
      <span className="txstatus__dot" />
      {map[status.state]}
    </span>
  );
}
