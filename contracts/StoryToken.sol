// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// StoryToken — STORY ERC-20 on Celo
// Deployed on: Celo Alfajores (testnet) / Celo Mainnet
//
// Token economics:
//   - Minted by platform treasury for writer/agent rewards
//   - 10 STORY per published segment
//   - 100 STORY story completion bonus (split across contributors)
//   - Agents stake 50 STORY minimum to participate
//   - Quality gate < 40 → -5 STORY slash
//   - Quality gate > 80 → +15 STORY bonus

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract StoryToken is ERC20, ERC20Burnable, AccessControl, Pausable {

    bytes32 public constant MINTER_ROLE  = keccak256("MINTER_ROLE");
    bytes32 public constant SLASHER_ROLE = keccak256("SLASHER_ROLE");
    bytes32 public constant PAUSER_ROLE  = keccak256("PAUSER_ROLE");

    // ── Staking ────────────────────────────────────────────────────────────────
    uint256 public constant STAKING_MINIMUM = 50 * 10**18;  // 50 STORY

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakeTimestamp;

    event Staked(address indexed writer, uint256 amount);
    event Unstaked(address indexed writer, uint256 amount);
    event Slashed(address indexed writer, uint256 amount, string reason);
    event Rewarded(address indexed writer, uint256 amount, string reason);

    // ── Constructor ────────────────────────────────────────────────────────────
    constructor(address treasury) ERC20("StoryToken", "STORY") {
        _grantRole(DEFAULT_ADMIN_ROLE, treasury);
        _grantRole(MINTER_ROLE,  treasury);
        _grantRole(SLASHER_ROLE, treasury);
        _grantRole(PAUSER_ROLE,  treasury);

        // Initial treasury mint: 1,000,000 STORY for seeding rewards
        _mint(treasury, 1_000_000 * 10**18);
    }

    // ── Minting (platform treasury only) ──────────────────────────────────────
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
        emit Rewarded(to, amount, "platform_reward");
    }

    function mintBatch(address[] calldata recipients, uint256[] calldata amounts) external onlyRole(MINTER_ROLE) {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amounts[i]);
            emit Rewarded(recipients[i], amounts[i], "batch_reward");
        }
    }

    // ── Staking ────────────────────────────────────────────────────────────────
    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        stakeTimestamp[msg.sender] = block.timestamp;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external whenNotPaused {
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        // 7-day lock-up
        require(block.timestamp >= stakeTimestamp[msg.sender] + 7 days, "Stake locked for 7 days");
        stakedBalance[msg.sender] -= amount;
        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function canParticipate(address writer) external view returns (bool) {
        return stakedBalance[writer] >= STAKING_MINIMUM;
    }

    // ── Slashing (quality gate penalties) ─────────────────────────────────────
    function slash(address writer, uint256 amount, string calldata reason)
        external onlyRole(SLASHER_ROLE)
    {
        uint256 available = stakedBalance[writer];
        uint256 actual = amount > available ? available : amount;
        if (actual == 0) return;
        stakedBalance[writer] -= actual;
        _burn(address(this), actual);  // burned, not redistributed
        emit Slashed(writer, actual, reason);
    }

    // ── Governance helpers ─────────────────────────────────────────────────────
    function totalStaked() external view returns (uint256) {
        return balanceOf(address(this));
    }

    // ── Pause ──────────────────────────────────────────────────────────────────
    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _update(address from, address to, uint256 value)
        internal override whenNotPaused
    {
        super._update(from, to, value);
    }
}
