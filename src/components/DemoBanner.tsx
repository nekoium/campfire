interface DemoBannerProps {
  onExit: () => void;
}

/**
 * Shown at the top of the board when demo mode is active. Makes it clear to
 * viewers (and hackathon judges) that the data is placeholder content and
 * the wallet isn't connected.
 */
export function DemoBanner({ onExit }: DemoBannerProps) {
  return (
    <div
      className="callout callout--info"
      style={{
        marginBottom: "var(--space-4)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "var(--space-3)",
      }}
    >
      <div>
        <div className="callout__title">Demo mode</div>
        <span className="tiny muted">
          Showing placeholder content. Connect a wallet and deploy the
          contract to record real contributions.
        </span>
      </div>
      <button className="btn btn--ghost btn--small" onClick={onExit}>
        Exit demo
      </button>
    </div>
  );
}
