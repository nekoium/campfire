import { useAccount } from "wagmi";
import { useCampfireRead, useIsCorrectChain } from "../lib/useCampfire";
import { COMMUNITY_INTRO, EXPLORERS, monadTestnet } from "../config";
import { isContractConfigured } from "../contract";

interface IntroProps {
  onEnter: () => void;
  onEnterDemo: () => void;
}

/**
 * Atmospheric community introduction. First-screen composition per DESIGN.md:
 * hero image + community name + statement of purpose + path into the board +
 * quiet Monad Testnet indicator.
 */
export function Intro({ onEnter, onEnterDemo }: IntroProps) {
  const { isConnected } = useAccount();
  const correctChain = useIsCorrectChain();
  const configured = isContractConfigured();

  const { data: onChainNameRaw } = useCampfireRead("communityName", [], configured);
  const { data: onChainStatementRaw } = useCampfireRead("communityStatement", [], configured);

  const onChainName =
    typeof onChainNameRaw === "string" ? onChainNameRaw : undefined;
  const onChainStatement =
    typeof onChainStatementRaw === "string" ? onChainStatementRaw : undefined;

  const name = configured ? (onChainName ?? COMMUNITY_INTRO.name) : COMMUNITY_INTRO.name;
  const statement = configured
    ? (onChainStatement ?? COMMUNITY_INTRO.statement)
    : COMMUNITY_INTRO.statement;

  const heroUrl =
    "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image" +
    "?prompt=" +
    encodeURIComponent(
      "warm shared interior community space with botanical life, soft afternoon sunlight, " +
        "plants in a workshop room, long wooden table, muted warm cream and botanical green " +
        "tones, editorial photograph, calm gathering place",
    ) +
    "&image_size=landscape_16_9";

  return (
    <>
      <section className="hero">
        <img className="hero__image" src={heroUrl} alt="" loading="eager" />
        <div className="hero__scrim" />
        <div className="hero__inner">
          <p className="hero__eyebrow">Mutual aid · community credit</p>
          <h1 className="hero__title">{name}</h1>
          <p className="hero__statement">{statement}</p>
          <div className="hero__actions">
            <button className="btn btn--primary" onClick={onEnter}>
              Enter the board →
            </button>
            <button
              className="btn btn--ghost"
              onClick={onEnterDemo}
              style={{ marginLeft: "var(--space-3)" }}
            >
              Try demo (no wallet)
            </button>
            <span className="hero__chain-note">
              Recorded on {monadTestnet.name} (chain id {monadTestnet.id})
            </span>
          </div>
        </div>
      </section>

      <section className="intro">
        <div className="intro__inner">
          <div>
            <p className="intro__lede">
              A community ledger for help, shared work, and reciprocal
              contribution — without turning the relationship into a market.
            </p>
            <div className="intro__rule" />
            <p className="tiny muted">
              Credits here are an internal settlement unit, not a tradable
              token. They are earned by useful labor and revoked after a fixed
              idle period.
            </p>
          </div>

          <div className="intro__points">
            <div>
              <div className="intro__point-title">Post a request or offer</div>
              A member describes what they need or what they can do, with a
              suggested credit reward.
            </div>
            <div>
              <div className="intro__point-title">Claim, complete, approve</div>
              Another member claims the task, submits completion, and the
              requester or community entity approves.
            </div>
            <div>
              <div className="intro__point-title">Local credits are issued</div>
              On approval the contract issues credits to the contributor.
              Credits stay inside the community.
            </div>
            <div>
              <div className="intro__point-title">Idle balances expire</div>
              After a fixed inactivity window, anyone may trigger revocation.
              Anti-hoarding by design.
            </div>
          </div>
        </div>
      </section>

      <section className="intro" style={{ paddingTop: 0 }}>
        <div className="intro__inner">
          <div className="callout">
            <div className="callout__title">Connection status</div>
            {configured ? (
              <>
                Wallet is{" "}
                <b>{isConnected ? "connected" : "not connected"}</b>.{" "}
                {isConnected && !correctChain && (
                  <>
                    Switch to <b>{monadTestnet.name}</b> to interact.
                  </>
                )}
                {isConnected && correctChain && (
                  <>You can post and claim work.</>
                )}
              </>
            ) : (
              <>
                Contract address is a placeholder. Deploy{" "}
                <code>contracts/CampfireCommunity.sol</code> to{" "}
                {monadTestnet.name} and update{" "}
                <code>src/config.ts</code> before posting tasks.
              </>
            )}
          </div>

          <div className="callout callout--info">
            <div className="callout__title">Inspect the contract</div>
            Source: <code>contracts/CampfireCommunity.sol</code>
            <br />
            Explorers:{" "}
            <a href={EXPLORERS.monadscan} target="_blank" rel="noreferrer noopener">
              Monadscan
            </a>{" "}
            ·{" "}
            <a href={EXPLORERS.socialscan} target="_blank" rel="noreferrer noopener">
              Socialscan
            </a>{" "}
            ·{" "}
            <a href={EXPLORERS.monadvision} target="_blank" rel="noreferrer noopener">
              MonadVision
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
