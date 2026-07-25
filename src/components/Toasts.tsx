import type { Toast } from "../lib/useToasts";

interface ToastsProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function Toasts({ toasts, onDismiss }: ToastsProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>
          <button
            className="toast__close"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(t.id)}
          >
            ×
          </button>
          <div className="toast__title">{t.title}</div>
          {t.message && <div className="toast__msg">{t.message}</div>}
          {t.txHash && (
            <a
              className="link-explorer"
              href={`https://testnet.monadexplorer.com/tx/${t.txHash}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              View transaction ↗
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
