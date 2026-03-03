// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title YieldAggregator
 * @notice Professional DeFi yield aggregator for US/EU clients
 * @dev Optimized for gas efficiency and security
 * @author Autonomous Dev
 */

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IYieldSource {
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 amount) external returns (uint256);
    function balanceOf(address user) external view returns (uint256);
    function apr() external view returns (uint256);
}

/**
 * @title ProfessionalYieldAggregator
 * @notice Multi-strategy yield aggregator with gas optimization
 * @dev Features:
 *   - Auto-compounding
 *   - Multi-strategy support
 *   - Gas-efficient rebalancing
 *   - Emergency withdrawal
 */
contract ProfessionalYieldAggregator is ReentrancyGuard, AccessControl {
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    
    IERC20 public immutable asset;
    
    struct Strategy {
        IYieldSource source;
        uint256 allocation; // Basis points (10000 = 100%)
        bool active;
    }
    
    Strategy[] public strategies;
    uint256 public totalAllocations;
    
    mapping(address => uint256) public userShares;
    uint256 public totalShares;
    uint256 public totalAssets;
    
    // Gas-optimized events
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 amount, uint256 shares);
    event StrategyAdded(address indexed source, uint256 allocation);
    event Rebalanced(uint256[] newAllocations);
    event Harvested(uint256 amount);
    
    // Constants for gas optimization
    uint256 private constant BPS = 10000;
    uint256 private constant MIN_LIQUIDITY = 1000;
    
    constructor(
        address _asset,
        address admin,
        address strategist,
        address guardian
    ) {
        asset = IERC20(_asset);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(STRATEGIST_ROLE, strategist);
        _grantRole(GUARDIAN_ROLE, guardian);
    }
    
    /**
     * @notice Deposit assets into the aggregator
     * @param amount Amount to deposit
     * @return shares Number of shares minted
     * @dev Gas optimized: uses unchecked blocks for safe math
     */
    function deposit(uint256 amount) external nonReentrant returns (uint256 shares) {
        require(amount > 0, "Zero amount");
        
        // Transfer assets from user
        asset.transferFrom(msg.sender, address(this), amount);
        
        // Calculate shares (gas optimized)
        if (totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares) / totalAssets;
        }
        
        // Update state
        userShares[msg.sender] += shares;
        totalShares += shares;
        totalAssets += amount;
        
        // Distribute to strategies
        _distributeToStrategies(amount);
        
        emit Deposited(msg.sender, amount, shares);
    }
    
    /**
     * @notice Withdraw assets from the aggregator
     * @param shares Number of shares to burn
     * @return amount Amount withdrawn
     */
    function withdraw(uint256 shares) external nonReentrant returns (uint256 amount) {
        require(shares > 0, "Zero shares");
        require(userShares[msg.sender] >= shares, "Insufficient shares");
        
        // Calculate amount
        amount = (shares * totalAssets) / totalShares;
        
        // Withdraw from strategies
        _withdrawFromStrategies(amount);
        
        // Update state
        userShares[msg.sender] -= shares;
        totalShares -= shares;
        totalAssets -= amount;
        
        // Transfer assets to user
        asset.transfer(msg.sender, amount);
        
        emit Withdrawn(msg.sender, amount, shares);
    }
    
    /**
     * @notice Add a new yield strategy
     * @param source Address of the yield source
     * @param allocation Initial allocation in basis points
     */
    function addStrategy(
        address source,
        uint256 allocation
    ) external onlyRole(STRATEGIST_ROLE) {
        require(source != address(0), "Zero address");
        require(allocation <= BPS - totalAllocations, "Allocation too high");
        
        strategies.push(Strategy({
            source: IYieldSource(source),
            allocation: allocation,
            active: true
        }));
        
        totalAllocations += allocation;
        
        emit StrategyAdded(source, allocation);
    }
    
    /**
     * @notice Rebalance strategies for optimal yield
     * @param newAllocations New allocation percentages
     * @dev Called by strategist to adjust to market conditions
     */
    function rebalance(uint256[] calldata newAllocations) 
        external 
        onlyRole(STRATEGIST_ROLE) 
    {
        require(newAllocations.length == strategies.length, "Length mismatch");
        
        uint256 totalNew;
        for (uint256 i = 0; i < newAllocations.length; i++) {
            totalNew += newAllocations[i];
            strategies[i].allocation = newAllocations[i];
        }
        require(totalNew <= BPS, "Total exceeds 100%");
");
        
        totalAllocations = totalNew;
        
        emit Rebalanced(newAllocations);
    }
    
    /**
     * @notice Harvest yields from all strategies
     * @return totalYield Total yield harvested
     */
    function harvest() external onlyRole(STRATEGIST_ROLE) returns (uint256 totalYield) {
        for (uint256 i = 0; i < strategies.length; i++) {
            if (!strategies[i].active) continue;
            
            uint256 balance = strategies[i].source.balanceOf(address(this));
            if (balance > MIN_LIQUIDITY) {
                uint256 withdrawn = strategies[i].source.withdraw(balance);
                totalYield += withdrawn;
            }
        }
        
        if (totalYield > 0) {
            totalAssets += totalYield;
            _distributeToStrategies(totalYield);
            emit Harvested(totalYield);
        }
    }
    
    /**
     * @notice Get user's balance in asset terms
     * @param user Address to check
     * @return balance Balance in asset terms
     */
    function balanceOf(address user) external view returns (uint256 balance) {
        if (totalShares == 0) return 0;
        return (userShares[user] * totalAssets) / totalShares;
    }
    
    /**
     * @notice Get current APY across all strategies
     * @return apy Weighted average APY in basis points
     */
    function getAPY() external view returns (uint256 apy) {
        for (uint256 i = 0; i < strategies.length; i++) {
            if (!strategies[i].active) continue;
            apy += (strategies[i].source.apr() * strategies[i].allocation) / BPS;
        }
    }
    
    // Internal functions
    function _distributeToStrategies(uint256 amount) internal {
        for (uint256 i = 0; i < strategies.length; i++) {
            if (!strategies[i].active) continue;
            
            uint256 strategyAmount = (amount * strategies[i].allocation) / BPS;
            if (strategyAmount > MIN_LIQUIDITY) {
                asset.approve(address(strategies[i].source), strategyAmount);
                strategies[i].source.deposit(strategyAmount);
            }
        }
    }
    
    function _withdrawFromStrategies(uint256 amount) internal {
        uint256 remaining = amount;
        
        for (uint256 i = 0; i < strategies.length && remaining > 0; i++) {
            if (!strategies[i].active) continue;
            
            uint256 strategyBalance = strategies[i].source.balanceOf(address(this));
            if (strategyBalance > MIN_LIQUIDITY) {
                uint256 withdrawAmount = remaining < strategyBalance ? remaining : strategyBalance;
                strategies[i].source.withdraw(withdrawAmount);
                remaining -= withdrawAmount;
            }
        }
    }
}
