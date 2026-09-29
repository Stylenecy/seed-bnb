// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EquinoxRegistry} from "./EquinoxRegistry.sol";
import {IStrategyAdapter} from "./interfaces/IStrategyAdapter.sol";

/// @title NativePool
/// @notice Equinox's own lending pool for one ERC-20. Port of `equinox::native_pool`.
///         It is both a strategy venue (deposit/withdraw receipts, `IStrategyAdapter`)
///         and the lender the agent borrows from (`borrow` / `repayLoan`).
///
///         `borrow` / `repayLoan` were `public(package)` on Sui; here only the
///         `operator` (the EquinoxVaults contract, set by the admin) may call them.
contract NativePool is IStrategyAdapter, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Position {
        address owner;
        uint256 principal;
    }

    error AmountZero();
    error InsufficientReserve();
    error NotOperator();
    error NotAdmin();
    error NotPositionOwner();

    event OperatorSet(address operator);
    event Deposited(uint256 indexed positionId, address indexed owner, uint256 principal);
    event Withdrawn(uint256 indexed positionId, address indexed owner, uint256 payout);
    event RewardsFunded(address indexed from, uint256 amount);
    event Borrowed(address indexed to, uint256 amount);
    event Repaid(address indexed from, uint256 amount);

    EquinoxRegistry public immutable registry;
    IERC20 public immutable token;
    address public operator;

    /// Liquidity held by the pool (principal + rewards - borrowed).
    uint256 public reserve;
    /// Total principal deposited (excludes injected rewards).
    uint256 public totalPrincipal;
    /// Liquidity currently lent out.
    uint256 public totalBorrowed;

    uint256 public nextPositionId = 1;
    mapping(uint256 => Position) public positions;

    constructor(EquinoxRegistry _registry, IERC20 _token) {
        registry = _registry;
        token = _token;
    }

    function setOperator(address _operator) external {
        if (!registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), msg.sender)) revert NotAdmin();
        operator = _operator;
        emit OperatorSet(_operator);
    }

    function asset() external view returns (address) {
        return address(token);
    }

    // === Deposits (strategy venue) ===

    function deposit(uint256 amount) external nonReentrant returns (uint256 positionId, uint256 realized) {
        if (amount == 0) revert AmountZero();
        token.safeTransferFrom(msg.sender, address(this), amount);
        reserve += amount;
        totalPrincipal += amount;
        positionId = nextPositionId++;
        positions[positionId] = Position({owner: msg.sender, principal: amount});
        emit Deposited(positionId, msg.sender, amount);
        return (positionId, amount);
    }

    /// Redeem a position. Pro-rata value = principal * reserve / totalPrincipal
    /// (same formula as the Move version).
    function withdraw(uint256 positionId) external nonReentrant returns (uint256 payout) {
        Position memory p = positions[positionId];
        if (p.owner != msg.sender) revert NotPositionOwner();
        delete positions[positionId];

        payout = totalPrincipal == 0 ? p.principal : (p.principal * reserve) / totalPrincipal;
        if (reserve < payout) revert InsufficientReserve();
        totalPrincipal = p.principal >= totalPrincipal ? 0 : totalPrincipal - p.principal;
        reserve -= payout;
        token.safeTransfer(msg.sender, payout);
        emit Withdrawn(positionId, msg.sender, payout);
    }

    function positionValue(uint256 positionId) external view returns (uint256) {
        return positions[positionId].principal;
    }

    /// Inject yield / liquidity. Permissionless.
    function fundRewards(uint256 amount) external nonReentrant {
        token.safeTransferFrom(msg.sender, address(this), amount);
        reserve += amount;
        emit RewardsFunded(msg.sender, amount);
    }

    // === Lending leg (operator only) ===

    function borrow(uint256 amount, address to) external nonReentrant {
        if (msg.sender != operator) revert NotOperator();
        if (reserve < amount) revert InsufficientReserve();
        reserve -= amount;
        totalBorrowed += amount;
        token.safeTransfer(to, amount);
        emit Borrowed(to, amount);
    }

    function repayLoan(uint256 amount) external nonReentrant {
        if (msg.sender != operator) revert NotOperator();
        token.safeTransferFrom(msg.sender, address(this), amount);
        totalBorrowed = amount >= totalBorrowed ? 0 : totalBorrowed - amount;
        reserve += amount;
        emit Repaid(msg.sender, amount);
    }
}
