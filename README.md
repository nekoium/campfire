# Campfire

A community mutual-aid and contribution ledger.

## Vision

Campfire is a community-first system for recording help, shared work, and reciprocal contribution in a way that supports trust without turning the system into a speculative currency.

It is built around a simple idea: a group becomes healthier when people can exchange work, support, and access inside a shared social field without needing to convert everything into outside market value.

The project starts from a local, bounded community. Members can make requests, offer help, claim tasks, and settle contribution in an internal credit system. The chain is used to make the record transparent, durable, and hard to fake. The social meaning of the work still comes from the community itself.

## Two Value Views

Campfire is informed by two complementary theories of value:

- **labor theory of value**: work takes time, effort, and material cost, so contribution has a real labor basis
- **subjective utility**: the usefulness of a task depends on context, urgency, and need, so value also depends on what the community actually wants

In practice, an offer or request is not assigned a purely fixed price. It is negotiated by the person making the offer or request, then accepted or rejected by the community according to shared judgment.

## Community Model

Campfire supports multiple independent communities. Each community has two connected layers:

- **community as a group**: an invite-only group in the Campfire system. Members can join it, make requests and offers, claim work, receive credits, and exchange credits with other members of that same group.
- **community as an entity-member**: a distinct on-chain account that belongs to the group alongside ordinary members. It represents the community's official role, but it is still a member inside the same community rather than an invisible administrator outside it.

The entity-member has additional, explicitly defined permissions in the first prototype, such as inviting members, issuing local credits through approved work, removing members, and triggering the public credit-revocation rule. Its actions are recorded and traceable in the same way as every other member action.

This model keeps authority visible and bounded. The community entity can exercise necessary operational powers, but it cannot disappear into private backend logic: its history, permissions, and actions remain part of the community's public record.

## Currency Creation and Disposal

Campfire treats the community as a kind of faucet.

When someone performs useful labor for the community, the community entity can issue internal credits to them. Those credits are not meant to be traded as a global asset. They are a local unit of exchange for work, help, and contribution inside the community.

Credits are designed to move through the community rather than sit idle. A credit balance that remains unused beyond the fixed expiry period is automatically revocable by the contract. The rule is part of the system and does not require a later community decision; anyone can trigger the expiry check once the deadline has passed.

The important point is that the token must be earned through actual contribution, not bought as another currency. In the first prototype, the credit is an internal ledger unit rather than a freely transferable ERC-20, so it does not become an external speculative asset.

## Core Rules

- communities are invited and bounded
- participation is permissioned by the community group
- contributions and approvals are recorded transparently
- value stays local to the community unless two communities explicitly agree to interact
- the system supports cooperation, not speculation
- reputation matters socially, not only economically
- credits are created in exchange for labor and automatically revocable after the fixed inactivity period

## Early Product Shape

A person can:

- join a community by invitation
- post a request for help or an offer of help
- claim a task
- submit completion
- receive community-issued credits
- spend credits within the same community

## Cross-Community Exchange

Cross-community exchange should be possible only if both communities explicitly define a shared rule for it.

That means Campfire can later support:

- community-to-community credit exchange
- shared event collaboration
- temporary project bridges between groups
- opt-in federation between communities

This should behave more like an explicit agreement between two local systems than like a free-floating market.

## Technical Questions to Solve

- how a community is represented as an on-chain entity
- how member identity and permission are tracked
- how credits are issued and consumed inside one community
- how two communities opt into exchange rules
- how reputation stays mostly off-chain while still informing decisions
- how the front end keeps the experience understandable for normal users

## Notes on the Token Idea

The internal MON-like unit is not meant to represent a global market currency by default. It is a local unit of exchange for work, help, access, and contribution inside a community.

That makes it closer to a community credit or internal settlement unit than to a speculative coin.

## Why Monad

Monad is a good fit if the project needs:

- low-friction EVM deployment
- fast settlement for many small interactions
- easy wallet compatibility
- a credible testnet environment for prototyping the community logic

The chain is not the whole product. It is the trust and settlement layer for the parts of the system that need shared, verifiable state.

## Short Philosophy

Campfire starts from the belief that crypto is not automatically good or bad. It becomes meaningful only inside a social structure.

If a system begins as pure speculation, it tends to reward extraction, status games, and competition for control. If it begins as shared work, mutual aid, and a clear local social fabric, the chain can become a useful coordination tool instead.

The point is not to make everything financial. The point is to make the social agreement durable enough that people can rely on it.
