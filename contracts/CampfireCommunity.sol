// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title CampfireCommunity
/// @notice A single-community mutual-aid ledger on Monad Testnet.
///         Records tasks, approves useful labor, issues non-tradable internal
///         credits to contributors, and lets anyone trigger revocation of an
///         expired idle balance. Credits are NOT an ERC-20: they cannot leave
///         the community and exist only as an internal settlement unit.
///
/// @dev    The deployer is the community entity in this prototype. A later
///         version can replace the deployer authority with a multisig or a
///         community governance contract. See TECH_STACK.md and README.md.
contract CampfireCommunity {
    // -----------------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------------

    /// @dev Demo expiry window. A production deployment should use a much
    ///      longer realistic duration. Short here so the demo can show the
    ///      revocation path without a long wait.
    uint256 public constant EXPIRY_DURATION = 1 days;

    // -----------------------------------------------------------------------
    // Types
    // -----------------------------------------------------------------------

    enum TaskStatus {
        Open,       // 0 — created, waiting for a claimant
        Claimed,    // 1 — a member has claimed the task
        Submitted,  // 2 — claimant submitted completion for approval
        Completed,  // 3 — requester/community approved; credits issued
        Cancelled   // 4 — requester cancelled before completion
    }

    enum TaskKind {
        Request,    // 0 — "I need help with this"
        Offer       // 1 — "I am offering to do this"
    }

    struct Task {
        uint256 id;
        address creator;
        address claimant;
        string description;
        uint256 reward;
        TaskKind kind;
        TaskStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    // -----------------------------------------------------------------------
    // Storage
    // -----------------------------------------------------------------------

    address public communityEntity;
    string public communityName;
    string public communityStatement;
    uint256 public taskCount;

    mapping(address => bool) public isMember;
    mapping(address => uint256) public memberBalance;
    mapping(address => uint256) public lastActivity;
    address[] public memberList;

    mapping(uint256 => Task) public tasks;

    // -----------------------------------------------------------------------
    // Events
    // -----------------------------------------------------------------------

    event MemberInvited(address indexed member, address indexed by);
    event MemberRemoved(address indexed member, address indexed by);
    event TaskCreated(uint256 indexed taskId, address indexed creator, TaskKind kind, uint256 reward);
    event TaskClaimed(uint256 indexed taskId, address indexed claimant);
    event TaskSubmitted(uint256 indexed taskId, address indexed claimant);
    event TaskCompleted(uint256 indexed taskId, address indexed claimant, uint256 reward);
    event TaskCancelled(uint256 indexed taskId, address indexed creator);
    event CreditsIssued(address indexed to, uint256 amount, uint256 indexed taskId);
    event CreditsTransferred(address indexed from, address indexed to, uint256 amount);
    event ExpiredBalanceRevoked(address indexed member, uint256 amount);

    // -----------------------------------------------------------------------
    // Modifiers
    // -----------------------------------------------------------------------

    modifier onlyCommunityEntity() {
        require(msg.sender == communityEntity, "only community entity");
        _;
    }

    modifier onlyMember() {
        require(isMember[msg.sender], "only members");
        _;
    }

    // -----------------------------------------------------------------------
    // Constructor
    // -----------------------------------------------------------------------

    /// @param _communityName         Short display name of the community.
    /// @param _communityStatement    One-line statement of purpose.
    constructor(string memory _communityName, string memory _communityStatement) {
        communityEntity = msg.sender;
        communityName = _communityName;
        communityStatement = _communityStatement;
        // The deploying community entity is the first member.
        _invite(msg.sender);
    }

    // -----------------------------------------------------------------------
    // Membership
    // -----------------------------------------------------------------------

    function inviteMember(address member) external onlyCommunityEntity {
        _invite(member);
    }

    function removeMember(address member) external onlyCommunityEntity {
        require(isMember[member], "not a member");
        require(member != communityEntity, "cannot remove community entity");
        isMember[member] = false;
        emit MemberRemoved(member, msg.sender);
    }

    function _invite(address member) internal {
        require(!isMember[member], "already a member");
        isMember[member] = true;
        memberList.push(member);
        lastActivity[member] = block.timestamp;
        emit MemberInvited(member, msg.sender);
    }

    function memberCount() external view returns (uint256) {
        return memberList.length;
    }

    function memberAt(uint256 index) external view returns (address) {
        return memberList[index];
    }

    // -----------------------------------------------------------------------
    // Tasks
    // -----------------------------------------------------------------------

    /// @notice Create a request or an offer with a suggested credit reward.
    /// @dev    The reward is a suggested amount. Credits are minted by the
    ///         contract on approval — the requester does not prepay.
    function createTask(
        string calldata description,
        uint256 reward,
        TaskKind kind
    ) external onlyMember returns (uint256 taskId) {
        require(bytes(description).length > 0, "empty description");
        require(reward > 0, "reward must be > 0");

        taskId = ++taskCount;
        tasks[taskId] = Task({
            id: taskId,
            creator: msg.sender,
            claimant: address(0),
            description: description,
            reward: reward,
            kind: kind,
            status: TaskStatus.Open,
            createdAt: block.timestamp,
            completedAt: 0
        });

        _touch(msg.sender);
        emit TaskCreated(taskId, msg.sender, kind, reward);
    }

    function claimTask(uint256 taskId) external onlyMember {
        Task storage t = tasks[taskId];
        require(t.id != 0, "no such task");
        require(t.status == TaskStatus.Open, "task not open");
        require(t.creator != msg.sender, "cannot claim own task");

        t.claimant = msg.sender;
        t.status = TaskStatus.Claimed;
        _touch(msg.sender);
        emit TaskClaimed(taskId, msg.sender);
    }

    function submitTask(uint256 taskId) external onlyMember {
        Task storage t = tasks[taskId];
        require(t.id != 0, "no such task");
        require(t.status == TaskStatus.Claimed, "task not claimed");
        require(t.claimant == msg.sender, "only claimant can submit");

        t.status = TaskStatus.Submitted;
        _touch(msg.sender);
        emit TaskSubmitted(taskId, msg.sender);
    }

    /// @notice Approve a submitted task. Credits are issued to the claimant.
    /// @dev    Either the original requester (task.creator) or the community
    ///         entity may approve. This is the only path that mints credits.
    function approveTask(uint256 taskId) external onlyMember {
        Task storage t = tasks[taskId];
        require(t.id != 0, "no such task");
        require(t.status == TaskStatus.Submitted, "task not submitted");
        require(
            msg.sender == t.creator || msg.sender == communityEntity,
            "only requester or community entity"
        );

        t.status = TaskStatus.Completed;
        t.completedAt = block.timestamp;

        // Issue credits to the claimant.
        memberBalance[t.claimant] += t.reward;
        _touch(t.claimant);
        _touch(msg.sender);

        emit TaskCompleted(taskId, t.claimant, t.reward);
        emit CreditsIssued(t.claimant, t.reward, taskId);
    }

    function cancelTask(uint256 taskId) external onlyMember {
        Task storage t = tasks[taskId];
        require(t.id != 0, "no such task");
        require(t.status == TaskStatus.Open || t.status == TaskStatus.Claimed, "cannot cancel");
        require(
            msg.sender == t.creator || msg.sender == communityEntity,
            "only requester or community entity"
        );

        t.status = TaskStatus.Cancelled;
        _touch(msg.sender);
        emit TaskCancelled(taskId, msg.sender);
    }

    // -----------------------------------------------------------------------
    // Internal credit ledger (NOT an ERC-20)
    // -----------------------------------------------------------------------

    /// @notice Transfer internal credits to another member of this community.
    /// @dev    Credits cannot leave the community. Both sender and recipient
    ///         must be members. Updates the activity timestamp of both.
    function transferCredits(address recipient, uint256 amount) external onlyMember {
        require(recipient != msg.sender, "cannot transfer to self");
        require(isMember[recipient], "recipient not a member");
        require(amount > 0, "amount must be > 0");
        require(memberBalance[msg.sender] >= amount, "insufficient credits");

        memberBalance[msg.sender] -= amount;
        memberBalance[recipient] += amount;
        _touch(msg.sender);
        _touch(recipient);

        emit CreditsTransferred(msg.sender, recipient, amount);
    }

    // -----------------------------------------------------------------------
    // Expiry
    // -----------------------------------------------------------------------

    /// @notice Permissionless trigger. If a member has been inactive longer
    ///         than EXPIRY_DURATION, anyone may revoke their full balance.
    /// @dev    A single lastActivity timestamp expires the whole balance,
    ///         not individual credit lots. Acceptable for the hackathon.
    function revokeExpired(address member) external {
        require(isMember[member], "not a member");
        require(
            block.timestamp >= lastActivity[member] + EXPIRY_DURATION,
            "not yet eligible for revocation"
        );
        uint256 amount = memberBalance[member];
        require(amount > 0, "nothing to revoke");

        memberBalance[member] = 0;
        emit ExpiredBalanceRevoked(member, amount);
    }

    /// @notice Seconds remaining before a member's balance is eligible for
    ///         revocation. Returns 0 when already eligible.
    function secondsUntilExpiry(address member) external view returns (uint256) {
        uint256 deadline = lastActivity[member] + EXPIRY_DURATION;
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    /// @notice True when a member's balance is currently revocable.
    function isExpired(address member) external view returns (bool) {
        return block.timestamp >= lastActivity[member] + EXPIRY_DURATION;
    }

    // -----------------------------------------------------------------------
    // Views
    // -----------------------------------------------------------------------

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }

    function memberInfo(address member)
        external
        view
        returns (bool member_, uint256 balance, uint256 lastActivityAt, uint256 expiresIn)
    {
        member_ = isMember[member];
        balance = memberBalance[member];
        lastActivityAt = lastActivity[member];
        uint256 deadline = lastActivityAt + EXPIRY_DURATION;
        expiresIn = block.timestamp >= deadline ? 0 : deadline - block.timestamp;
    }

    // -----------------------------------------------------------------------
    // Internal
    // -----------------------------------------------------------------------

    function _touch(address member) internal {
        lastActivity[member] = block.timestamp;
    }
}
