import { parseAbi } from "viem";

/**
 * CampfireCommunity ABI, parsed into viem's typed Abi shape so wagmi hooks
 * can infer function names and arg types.
 *
 * Source of truth: contracts/CampfireCommunity.sol. When the contract
 * changes, update this file and the matching read/write hooks in
 * src/contract.ts.
 */
export const campfireAbi = parseAbi([
  // ---- constants & storage ----
  "function EXPIRY_DURATION() view returns (uint256)",
  "function communityEntity() view returns (address)",
  "function communityName() view returns (string)",
  "function communityStatement() view returns (string)",
  "function taskCount() view returns (uint256)",

  // ---- membership ----
  "function isMember(address) view returns (bool)",
  "function memberBalance(address) view returns (uint256)",
  "function lastActivity(address) view returns (uint256)",
  "function memberCount() view returns (uint256)",
  "function memberAt(uint256) view returns (address)",
  "function inviteMember(address member)",
  "function removeMember(address member)",
  "function memberInfo(address) view returns (bool member_, uint256 balance, uint256 lastActivityAt, uint256 expiresIn)",

  // ---- tasks ----
  "function createTask(string description, uint256 reward, uint8 kind) returns (uint256)",
  "function claimTask(uint256 taskId)",
  "function submitTask(uint256 taskId)",
  "function approveTask(uint256 taskId)",
  "function cancelTask(uint256 taskId)",
  "function getTask(uint256 taskId) view returns ((uint256 id, address creator, address claimant, string description, uint256 reward, uint8 kind, uint8 status, uint256 createdAt, uint256 completedAt))",

  // ---- credits ----
  "function transferCredits(address recipient, uint256 amount)",
  "function revokeExpired(address member)",
  "function secondsUntilExpiry(address member) view returns (uint256)",
  "function isExpired(address member) view returns (bool)",

  // ---- events ----
  "event MemberInvited(address indexed member, address indexed by)",
  "event MemberRemoved(address indexed member, address indexed by)",
  "event TaskCreated(uint256 indexed taskId, address indexed creator, uint8 kind, uint256 reward)",
  "event TaskClaimed(uint256 indexed taskId, address indexed claimant)",
  "event TaskSubmitted(uint256 indexed taskId, address indexed claimant)",
  "event TaskCompleted(uint256 indexed taskId, address indexed claimant, uint256 reward)",
  "event TaskCancelled(uint256 indexed taskId, address indexed creator)",
  "event CreditsIssued(address indexed to, uint256 amount, uint256 indexed taskId)",
  "event CreditsTransferred(address indexed from, address indexed to, uint256 amount)",
  "event ExpiredBalanceRevoked(address indexed member, uint256 amount)",
]);

/** Numeric task kind, mirrors CampfireCommunity.TaskKind. */
export const TASK_KIND = {
  Request: 0,
  Offer: 1,
} as const;

/** Numeric task status, mirrors CampfireCommunity.TaskStatus. */
export const TASK_STATUS = {
  Open: 0,
  Claimed: 1,
  Submitted: 2,
  Completed: 3,
  Cancelled: 4,
} as const;

export type TaskKind = keyof typeof TASK_KIND;
export type TaskStatus = keyof typeof TASK_STATUS;
export type TaskKindValue = (typeof TASK_KIND)[TaskKind];
export type TaskStatusValue = (typeof TASK_STATUS)[TaskStatus];

export interface TaskRow {
  id: bigint;
  creator: `0x${string}`;
  claimant: `0x${string}`;
  description: string;
  reward: bigint;
  kind: number;
  status: number;
  createdAt: bigint;
  completedAt: bigint;
}
