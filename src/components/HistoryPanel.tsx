import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import {
  decodeEventLog,
  parseAbiItem,
  type Address,
  type Log,
  type AbiEvent,
} from "viem";
import { contractAddress } from "../contract";
import { formatRelative, shortAddress, formatCredits } from "../lib/format";
import { DEMO_HISTORY } from "../lib/demoData";

interface HistoryEntry {
  kind: string;
  body: string;
  ts: number; // unix seconds
  txHash?: `0x${string}`;
}

const EVENT_ITEMS = [
  parseAbiItem("event MemberInvited(address indexed member, address indexed by)"),
  parseAbiItem("event MemberRemoved(address indexed member, address indexed by)"),
  parseAbiItem("event TaskCreated(uint256 indexed taskId, address indexed creator, uint8 kind, uint256 reward)"),
  parseAbiItem("event TaskClaimed(uint256 indexed taskId, address indexed claimant)"),
  parseAbiItem("event TaskSubmitted(uint256 indexed taskId, address indexed claimant)"),
  parseAbiItem("event TaskCompleted(uint256 indexed taskId, address indexed claimant, uint256 reward)"),
  parseAbiItem("event TaskCancelled(uint256 indexed taskId, address indexed creator)"),
  parseAbiItem("event CreditsIssued(address indexed to, uint256 amount, uint256 indexed taskId)"),
  parseAbiItem("event CreditsTransferred(address indexed from, address indexed to, uint256 amount)"),
  parseAbiItem("event ExpiredBalanceRevoked(address indexed member, uint256 amount)"),
] as const;

interface HistoryPanelProps {
  refreshKey: number;
  demoMode?: boolean;
}

/**
 * Pulls recent contract events via eth_getLogs and renders a short
 * contribution ledger. For MVP we fetch a wide block window; a production
 * app would use an indexer (see TECH_STACK.md P2).
 *
 * In demo mode, renders placeholder history entries instead of hitting the
 * RPC.
 */
export function HistoryPanel({ refreshKey, demoMode = false }: HistoryPanelProps) {
  const client = usePublicClient();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      setEntries(DEMO_HISTORY);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    async function load() {
      if (!client) return;
      setLoading(true);
      setError(null);
      try {
        const block = await client.getBlockNumber();
        const from = block > 50_000n ? block - 50_000n : 0n;
        const logs: Log[] = [];
        for (const item of EVENT_ITEMS) {
          const result = await client.getLogs({
            address: contractAddress as Address,
            event: item as AbiEvent,
            fromBlock: from,
            toBlock: block,
          });
          logs.push(...result);
        }
        logs.sort((a, b) => {
          const aBlock = BigInt(a.blockNumber ?? 0n);
          const bBlock = BigInt(b.blockNumber ?? 0n);
          if (aBlock !== bBlock) {
            return Number(bBlock - aBlock);
          }
          const aIdx = BigInt(a.logIndex ?? 0n);
          const bIdx = BigInt(b.logIndex ?? 0n);
          return Number(bIdx - aIdx);
        });

        const top = logs.slice(0, 25);

        // Resolve unique block timestamps so we can show relative time.
        const blockNumbers: bigint[] = top
          .map((l) => l.blockNumber)
          .filter((b): b is bigint => !!b);
        const uniqueBlocks: bigint[] = [];
        const seen = new Set<string>();
        for (const bn of blockNumbers) {
          const key = bn.toString();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueBlocks.push(bn);
          }
        }
        const tsByBlock = new Map<bigint, number>();
        await Promise.all(
          uniqueBlocks.map(async (bn) => {
            const blk = await client.getBlock({ blockNumber: bn });
            tsByBlock.set(bn, Number(blk.timestamp));
          }),
        );

        const decoded = top.map((log) => {
          const entry = decodeLog(log);
          const ts = log.blockNumber ? tsByBlock.get(log.blockNumber) ?? 0 : 0;
          return { ...entry, ts };
        });
        if (!cancelled) setEntries(decoded);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [client, refreshKey, demoMode]);

  return (
    <section className="panel">
      <div className="panel__head">
        <h3 className="panel__title">Contribution ledger</h3>
        <span className="panel__hint">{demoMode ? "demo" : "recent"}</span>
      </div>

      {loading && <div className="state">Reading chain history…</div>}
      {error && (
        <div className="state state--error">
          <p className="state__title">Could not load history</p>
          <p className="state__hint">{error}</p>
        </div>
      )}
      {!loading && !error && entries.length === 0 && (
        <div className="state">
          <p className="state__hint">No activity recorded yet.</p>
        </div>
      )}
      {!loading && !error && entries.length > 0 && (
        <div className="history">
          {entries.map((e, i) => (
            <div key={i} className="history__item">
              <span className="history__kind">{e.kind}</span>
              <span className="history__body">{e.body}</span>
              <span className="history__time">{formatRelative(e.ts)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function decodeLog(log: Log): Omit<HistoryEntry, "ts"> {
  for (const item of EVENT_ITEMS) {
    try {
      const decoded = decodeEventLog({
        abi: [item as AbiEvent],
        data: log.data as `0x${string}` | undefined,
        topics: log.topics as [signature: `0x${string}`, ...rest: `0x${string}`[]],
      });
      return {
        kind: labelFor(decoded.eventName),
        body: formatBody(decoded.eventName, decoded.args),
        txHash: log.transactionHash ?? undefined,
      };
    } catch {
      continue;
    }
  }
  return { kind: "Event", body: "Unknown event" };
}

function labelFor(name: string | undefined): string {
  switch (name) {
    case "MemberInvited":
      return "Invite";
    case "MemberRemoved":
      return "Removed";
    case "TaskCreated":
      return "Posted";
    case "TaskClaimed":
      return "Claimed";
    case "TaskSubmitted":
      return "Submitted";
    case "TaskCompleted":
      return "Completed";
    case "TaskCancelled":
      return "Cancelled";
    case "CreditsIssued":
      return "Issued";
    case "CreditsTransferred":
      return "Transfer";
    case "ExpiredBalanceRevoked":
      return "Revoked";
    default:
      return "Event";
  }
}

function formatBody(name: string | undefined, args: Record<string, unknown>): string {
  const at = (k: string) => args[k] as `0x${string}` | undefined;
  const num = (k: string) => {
    const v = args[k];
    if (typeof v === "bigint") return v;
    if (typeof v === "number") return BigInt(v);
    return 0n;
  };
  switch (name) {
    case "MemberInvited":
      return `${shortAddress(at("member"))} invited by ${shortAddress(at("by"))}`;
    case "MemberRemoved":
      return `${shortAddress(at("member"))} removed`;
    case "TaskCreated":
      return `Task #${num("taskId")} · ${formatCredits(num("reward"))} credits by ${shortAddress(at("creator"))}`;
    case "TaskClaimed":
      return `Task #${num("taskId")} claimed by ${shortAddress(at("claimant"))}`;
    case "TaskSubmitted":
      return `Task #${num("taskId")} submitted by ${shortAddress(at("claimant"))}`;
    case "TaskCompleted":
      return `Task #${num("taskId")} completed · ${formatCredits(num("reward"))} issued to ${shortAddress(at("claimant"))}`;
    case "TaskCancelled":
      return `Task #${num("taskId")} cancelled`;
    case "CreditsIssued":
      return `${formatCredits(num("amount"))} credits to ${shortAddress(at("to"))} for task #${num("taskId")}`;
    case "CreditsTransferred":
      return `${formatCredits(num("amount"))} credits · ${shortAddress(at("from"))} → ${shortAddress(at("to"))}`;
    case "ExpiredBalanceRevoked":
      return `${formatCredits(num("amount"))} credits revoked from ${shortAddress(at("member"))}`;
    default:
      return "Unknown event";
  }
}
