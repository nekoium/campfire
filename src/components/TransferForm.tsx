import { useState } from "react";
import { useAccount } from "wagmi";
import { useCampfireRead, useTx } from "../lib/useCampfire";
import { parseCredits, shortAddress, formatCredits } from "../lib/format";
import type { ToastApi } from "../lib/useToasts";
import { TxPill } from "./CreateTaskForm";

interface TransferFormProps {
  toasts: ToastApi;
  onTransferred?: () => void;
}

/**
 * Member-to-member internal credit transfer. The contract enforces that both
 * sender and recipient are members. Self-transfer is blocked client-side to
 * avoid a pointless wallet prompt.
 */
export function TransferForm({ toasts, onTransferred }: TransferFormProps) {
  const { address } = useAccount();
  const { data: isMemberRaw } = useCampfireRead("isMember", [address ?? "0x0"], !!address);
  const isMember = !!isMemberRaw;

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const tx = useTx();
  const busy =
    tx.status.state === "awaiting-approval" || tx.status.state === "pending";

  if (!isMember) return null;

  const recipientTrim = recipient.trim();
  const looksLikeAddress = /^0x[a-fA-F0-9]{40}$/.test(recipientTrim);
  const amountRaw = parseCredits(amount);
  const valid =
    looksLikeAddress &&
    recipientTrim.toLowerCase() !== (address ?? "").toLowerCase() &&
    amountRaw > 0n;

  const submit = async () => {
    if (!valid || busy) return;
    await tx.run({
      functionName: "transferCredits",
      args: [recipientTrim as `0x${string}`, amountRaw],
      onError: (r) =>
        toasts.push({ kind: "danger", title: "Transfer failed", message: r }),
    });
    if (tx.status.state === "success") {
      toasts.push({
        kind: "success",
        title: "Credits transferred",
        message: `${formatCredits(amountRaw)} → ${shortAddress(recipientTrim)}`,
        txHash: (tx.status as { hash?: `0x${string}` }).hash,
      });
      setAmount("");
      setRecipient("");
      onTransferred?.();
    }
  };

  return (
    <section className="panel">
      <div className="panel__head">
        <h3 className="panel__title">Transfer credits</h3>
        <span className="panel__hint">members only</span>
      </div>

      <div className="formrow">
        <label className="field">
          <span className="field__label">Recipient address</span>
          <input
            className="input"
            placeholder="0x…"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </label>

        <div className="formrow formrow--inline">
          <label className="field">
            <span className="field__label">Amount</span>
            <input
              className="input"
              inputMode="numeric"
              placeholder="5"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </label>
          <button
            className="btn btn--primary"
            disabled={!valid || busy}
            onClick={submit}
          >
            {busy ? "Confirming…" : "Send"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--space-3)",
          }}
        >
          <TxPill status={tx.status} />
          <span className="tiny muted">
            Credits are local and non-tradable. Recipient must be a member.
          </span>
        </div>
      </div>
    </section>
  );
}
