import { useState } from "react";
import { useAccount } from "wagmi";
import { useCampfireRead, useIsCorrectChain } from "../lib/useCampfire";
import { monadTestnet } from "../config";
import { isContractConfigured } from "../contract";
import type { ToastApi } from "../lib/useToasts";

import { TaskList } from "./TaskList";
import { CreateTaskForm } from "./CreateTaskForm";
import { TransferForm } from "./TransferForm";
import { BalancePanel } from "./BalancePanel";
import { HistoryPanel } from "./HistoryPanel";
import { DeployContract } from "./DeployContract";
import { DemoBanner } from "./DemoBanner";

interface BoardProps {
  toasts: ToastApi;
  demoMode?: boolean;
  onExitDemo?: () => void;
}

/**
 * Mutual-aid board. Two-column layout: task list on the left, sidebar with
 * credits / transfer / history on the right. Surfaces wrong-network and
 * not-configured states above the board.
 *
 * When `demoMode` is true, the board renders placeholder data and skips all
 * contract reads / writes — useful for demos without a connected wallet.
 */
export function Board({ toasts, demoMode = false, onExitDemo }: BoardProps) {
  const { address, isConnected } = useAccount();
  const correctChain = useIsCorrectChain();
  const [configured] = useState(isContractConfigured());
  const [refreshKey, setRefreshKey] = useState(0);

  const bump = () => setRefreshKey((k) => k + 1);

  const { data: isMemberRaw } = useCampfireRead(
    "isMember",
    [address ?? "0x0"],
    !!address && configured && !demoMode,
  );

  return (
    <section className="board">
      <div className="board__inner">
        <div className="board__main">
          <div className="board__heading">
            <div>
              <h2 className="board__title">Mutual-aid board</h2>
              <p className="board__sub">
                Open requests and offers. Local credits are issued on approval.
              </p>
            </div>
          </div>

          {demoMode && onExitDemo && <DemoBanner onExit={onExitDemo} />}

          {!demoMode && !configured && (
            <DeployContract
              toasts={toasts}
              onDeployed={() => {
                window.location.reload();
              }}
            />
          )}

          {!demoMode && configured && isConnected && !correctChain && (
            <div
              className="callout callout--warning"
              style={{ marginBottom: "var(--space-4)" }}
            >
              <div className="callout__title">Wrong network</div>
              Switch Rabby to <b>{monadTestnet.name}</b> (chain id{" "}
              {monadTestnet.id}) to read and post to the board.
            </div>
          )}

          {!demoMode &&
            configured &&
            isConnected &&
            correctChain &&
            !isMemberRaw && (
              <div
                className="callout callout--info"
                style={{ marginBottom: "var(--space-4)" }}
              >
                <div className="callout__title">
                  Connected wallet is not a member
                </div>
                Only invited members can post, claim, or hold credits. The
                community entity (deployer) can invite your address from Remix
                or the explorer.
              </div>
            )}

          <CreateTaskForm
            toasts={toasts}
            onCreated={bump}
            demoMode={demoMode}
          />

          <div style={{ height: "var(--space-4)" }} />

          <TaskList toasts={toasts} refreshKey={refreshKey} demoMode={demoMode} />
        </div>

        <aside className="board__sidebar">
          <BalancePanel
            toasts={toasts}
            onAfterAction={bump}
            demoMode={demoMode}
          />
          <TransferForm
            toasts={toasts}
            onTransferred={bump}
            demoMode={demoMode}
          />
          <HistoryPanel refreshKey={refreshKey} demoMode={demoMode} />
        </aside>
      </div>
    </section>
  );
}
