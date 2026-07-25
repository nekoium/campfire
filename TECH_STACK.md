# Campfire MVP: Tech Stack and 3-Hour Implementation Plan

> Hackathon scope: a working, demonstrable prototype completed in approximately three hours.

## Goal

Build a single-community mutual-aid board on Monad Testnet where a community records useful labor, issues non-tradable internal credits to contributors, lets members offer/request work, and automatically revokes balances that remain unused beyond a fixed expiry period.

## Product Thesis

Campfire makes invisible community labor legible. The blockchain records the credit issuance and exchange history, while the community remains responsible for deciding what work is useful and which people belong. Credits are local to the community, are not purchased for MON, and are not exposed as a freely tradable ERC-20.

## MVP User Flow

1. A user connects Rabby on Monad Testnet.
2. The app shows the Campfire community and its members.
3. A member creates an offer or request with a credit amount.
4. A member claims an item.
5. The claimant submits completion.
6. The requester/community entity approves completion.
7. The contract issues internal credits to the contributor.
8. A member transfers credits to another member for a completed exchange.
9. After the fixed expiry period, an expired unused balance can be revoked by anyone by calling the public expiry function.
10. The UI displays the event history as a visible contribution ledger.

For a three-hour demo, the happy path is the priority: create task -> claim -> approve -> issue -> transfer -> show history. Expiry should be implemented and demonstrated with a short test configuration or a clearly labeled demo expiry period.

## Architecture

```text
Rabby wallet
    |
    v
React/Vite frontend ---- read/write ----> Campfire Solidity contract
    |                                          |
    |                                          v
    |                                    Monad Testnet
    |
    +--> optional lightweight local UI state only
         (no backend required for the hackathon demo)
```

The frontend is a static client. The contract is the source of truth for community membership, tasks, balances, approvals, transfers, expiry, and event history.

## Recommended Stack

### Blockchain

- **Network:** Monad Testnet
- **Chain ID:** `10143`
- **Wallet:** Rabby
- **Contract language:** Solidity `^0.8.24`
- **Deployment:** Remix for the first deployment; use Rabby's injected provider
- **Contract design:** one `CampfireCommunity` contract with an internal credit ledger

Monad is useful here because it is EVM-compatible, works with standard Ethereum wallets and tooling, and is intended for high-throughput, fast-settlement applications. The prototype uses Monad for transparent state and settlement, not for hosting the whole social app.

### Frontend

- **React + Vite + TypeScript**
- **viem** for chain reads, writes, event decoding, and wallet interaction
- **wagmi** for React wallet/account hooks
- **Rabby injected provider** through the standard EIP-1193 wallet interface
- **Plain CSS or a small local stylesheet** for speed
- No backend, database, indexer, auth service, or token-exchange service in the MVP

If the existing frontend starter already uses another compatible stack, keep it. Do not spend hackathon time migrating frameworks.

### Contract

Use one contract instead of separate factory, token, governance, and reputation contracts.

The contract should contain:

- community name and metadata pointer
- community entity address
- member registry
- task/offer/request records
- internal credit balances
- last activity timestamp per member
- fixed expiry duration
- issuance, transfer, and expiry events

## Contract Semantics

### Community entity

Campfire supports multiple independent communities. In each one, the community entity is a distinct on-chain account that is also a member of that community group alongside ordinary members.

For the MVP, the deployer controls this entity account. It has explicit additional permissions: invite or remove members, approve work where appropriate, and operate the local-credit rules. Each privileged action emits an event and remains traceable on chain. A later version can replace the deployer-controlled entity with a multisig or community governance contract without moving the entity outside the group.

### Membership

The deployer can invite members. Members can be removed only by the deployer in the MVP. Membership checks prevent non-members from using the credit ledger.

### Credit issuance

The community entity issues credits only through the completion approval flow:

```text
requester creates task
claimant claims task
claimant submits completion
requester or community entity approves
contract credits claimant
```

Do not add a public mint function. That would make the labor-backed claim meaningless.

### Credit transfer

Credits can be transferred only between members of the same Campfire community. A transfer updates the activity timestamp of both parties and emits an event.

Credits are not an ERC-20 in the MVP. This prevents normal wallet/token-exchange behavior and makes the local-community boundary explicit.

### Expiry and automatic revocation

Solidity contracts cannot wake themselves up at a future timestamp. Therefore “automatic revocation” must be implemented as a deterministic rule plus a permissionless trigger:

```text
if block.timestamp >= lastActivity[user] + EXPIRY_DURATION:
    anyone may call revokeExpired(user)
    balance[user] becomes zero
    ExpiredBalanceRevoked event is emitted
```

The expiry duration is fixed in the deployed contract and cannot be changed in the MVP. For the demo, use a short duration only on a clearly labeled demo deployment; use a longer realistic duration in production.

Important limitation: a single `lastActivity` timestamp expires the whole balance, not individual credit units. That is sufficient for the hackathon prototype. A production design would need per-lot accounting or an explicit balance-age model.

### Event history

Emit events for:

- `MemberInvited`
- `MemberRemoved`
- `TaskCreated`
- `TaskClaimed`
- `TaskCompleted`
- `CreditsIssued`
- `CreditsTransferred`
- `ExpiredBalanceRevoked`

The frontend can reconstruct the visible history from contract reads for the MVP. An indexer can be added later.

## Minimal Contract Interface

The exact implementation can use structs and mappings, but the frontend should need approximately these methods:

```solidity
function inviteMember(address member) external;
function createTask(string calldata description, uint256 reward) external returns (uint256);
function claimTask(uint256 taskId) external;
function submitTask(uint256 taskId) external;
function approveTask(uint256 taskId) external;
function transferCredits(address recipient, uint256 amount) external;
function revokeExpired(address member) external;
function memberBalance(address member) external view returns (uint256);
function getTask(uint256 taskId) external view returns (...);
function isMember(address member) external view returns (bool);
```

The implementation should reject:

- non-members
- duplicate invitations
- claiming an already claimed task
- submitting a task by anyone except the claimant
- approving a task by anyone except the requester/community entity
- approving a task twice
- transferring more credits than the sender has
- transferring to a non-member
- revoking a balance before expiry

## Three-Hour Execution Plan

### 0:00-0:15 — Freeze scope and create project

- Create the frontend project in `C:/Users/Ashless/Projects/Development/campfire`.
- Install only the required frontend dependencies.
- Create a `src/config.ts` containing Monad Testnet configuration and a placeholder contract address.
- Create a `src/abi.ts` containing the deployed contract ABI.

### 0:15-1:00 — Write, compile, and deploy contract

- Create `contracts/CampfireCommunity.sol`.
- Implement membership, tasks, credits, transfer, expiry, and events.
- Compile in Remix with Solidity `0.8.24`.
- Deploy with Rabby on Monad Testnet.
- Record contract address and deployment transaction hash in `DEPLOYMENT.md`.

### 1:00-1:15 — Verify deployment

- Open the deployment transaction in the Monad testnet explorer.
- Confirm the contract address and chain ID.
- Call read methods from Remix.
- Invite a second test wallet if available.

### 1:15-2:15 — Build the frontend happy path

- Add wallet connection.
- Display connected address and MON testnet status.
- Display community name and member status.
- Display task list.
- Add create task form.
- Add claim, submit, and approve buttons with pending/success/error states.
- Display current internal credit balance.
- Add transfer form between members.

### 2:15-2:40 — Add history and expiry demonstration

- Display recent activity from contract events or a small set of read-derived records.
- Add expiry status to the member balance panel.
- Add a `Revoke expired balance` action that calls `revokeExpired`.
- Test expiry with the demo duration, or document how to wait for the configured duration.

### 2:40-3:00 — Test and prepare demo

- Test the complete flow with two accounts.
- Refresh the page and verify state comes from the chain.
- Capture contract address, explorer link, and screenshots.
- Write a short demo script: invisible labor -> approved contribution -> issued local credits -> reciprocal exchange -> expiry prevents hoarding.

## Files

Planned files for the MVP:

```text
campfire/
  README.md
  TECH_STACK.md
  DEPLOYMENT.md
  package.json
  index.html
  src/
    main.tsx
    App.tsx
    config.ts
    abi.ts
    contract.ts
    styles.css
  contracts/
    CampfireCommunity.sol
```

Do not add a backend or database unless a concrete blocker appears. Do not add cross-community bridges, reputation scoring, governance voting, NFTs, ERC-20 tokens, social login, or production keeper infrastructure in the three-hour version.

## Risks and Deliberate Tradeoffs

### Automatic expiry needs a trigger

The chain cannot execute a function without a transaction. The rule is automatic in outcome, but a user, frontend action, or keeper must trigger the state update. The contract's public function means no single operator controls expiry.

### Community entity is simplified

The deployer is the community entity in the demo. This gives the project a visible authority address but not full decentralized governance. A multisig or governance contract is the next step.

### Off-chain social trust is not verified

The contract records who issued, claimed, completed, approved, and received credits. It cannot determine whether labor was genuinely useful. The community's social process remains the source of that judgment.

### Credit disposal and inflation

Expiry prevents indefinite accumulation but does not by itself guarantee economic stability. The demo should describe it as an anti-hoarding circulation rule, not as a complete monetary policy.

### Public data

Anything stored on Monad is public and durable. Do not put private personal information or sensitive activity descriptions directly on chain. Use short public descriptions or content hashes/pointers in production.

## Acceptance Criteria

The MVP is complete when:

- the contract is deployed on Monad Testnet
- a wallet can connect to the frontend
- a member can create and claim a task
- completion approval issues internal credits
- credits can transfer only between members
- an expired balance can be revoked by a permissionless call
- refresh preserves the displayed chain state
- the README and deployment document explain the design and limitations
