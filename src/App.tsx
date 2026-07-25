import { useState } from "react";
import { Intro } from "./components/Intro";
import { Board } from "./components/Board";
import { WalletBar } from "./components/WalletBar";
import { Toasts } from "./components/Toasts";
import { useToasts } from "./lib/useToasts";
import { EXPLORERS, monadTestnet } from "./config";
import { isContractConfigured, contractAddress } from "./contract";
import { shortAddress } from "./lib/format";

type View = "intro" | "board";

export default function App() {
  const [view, setView] = useState<View>("intro");
  const toasts = useToasts();

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="topbar__brand"
          onClick={() => setView("intro")}
          style={{
            background: "transparent",
            border: 0,
            padding: 0,
            cursor: "pointer",
          }}
          aria-label="Back to Campfire intro"
        >
          <span className="topbar__mark" />
          Campfire
        </button>

        <div className="topbar__meta">
          <span className="topbar__chain-tag">{monadTestnet.name}</span>
          <WalletBar />
          {view === "intro" && (
            <button
              className="btn btn--ghost btn--small"
              onClick={() => setView("board")}
            >
              Board →
            </button>
          )}
          {view === "board" && (
            <button
              className="btn btn--ghost btn--small"
              onClick={() => setView("intro")}
            >
              About
            </button>
          )}
        </div>
      </header>

      <main>
        {view === "intro" && <Intro onEnter={() => setView("board")} />}
        {view === "board" && <Board toasts={toasts} />}
      </main>

      <footer className="footer">
        <div>
          Campfire · mutual-aid ledger on {monadTestnet.name}
          {isContractConfigured() && (
            <>
              {" · contract "}
              <a
                href={`${EXPLORERS.socialscan}/address/${contractAddress}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {shortAddress(contractAddress)} ↗
              </a>
            </>
          )}
        </div>
        <div className="footer__links">
          <a href={EXPLORERS.monadscan} target="_blank" rel="noreferrer noopener">
            Monadscan
          </a>
          <a href={EXPLORERS.socialscan} target="_blank" rel="noreferrer noopener">
            Socialscan
          </a>
          <a href={EXPLORERS.monadvision} target="_blank" rel="noreferrer noopener">
            MonadVision
          </a>
        </div>
      </footer>

      <Toasts toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>
  );
}
