// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EquinoxRegistry} from "./EquinoxRegistry.sol";

/// @title ShadowPool
/// @notice The "shadow wallet": per-user spendable balance for one token.
///         Port of `equinox::shadow`. Credits are agent-gated, withdrawals are
///         user-gated. `debitInternal` (was `public(package)`) is operator-only.
contract ShadowPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    error AmountZero();
    error Insufficient();
    error NotAgent();
    error NotOperator();
    error NotAdmin();

    event ShadowCredited(address indexed owner, uint256 amount);
    event ShadowWithdrawn(address indexed owner, uint256 amount);
    event OperatorSet(address operator);

    EquinoxRegistry public immutable registry;
    IERC20 public immutable token;
    address public operator;

    uint256 public reserve;
    mapping(address => uint256) public balanceOf;

    constructor(EquinoxRegistry _registry, IERC20 _token) {
        registry = _registry;
        token = _token;
    }

    function setOperator(address _operator) external {
        if (!registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), msg.sender)) revert NotAdmin();
        operator = _operator;
        emit OperatorSet(_operator);
    }

    /// Agent credits `user`, backed by `amount` pulled from the agent.
    function credit(address user, uint256 amount) external nonReentrant {
        if (!registry.hasRole(registry.AGENT_ROLE(), msg.sender)) revert NotAgent();
        if (amount == 0) revert AmountZero();
        token.safeTransferFrom(msg.sender, address(this), amount);
        reserve += amount;
        balanceOf[user] += amount;
        emit ShadowCredited(user, amount);
    }

    /// Owner withdraws their shadow balance to themselves.
    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert AmountZero();
        if (balanceOf[msg.sender] < amount) revert Insufficient();
        balanceOf[msg.sender] -= amount;
        reserve -= amount;
        emit ShadowWithdrawn(msg.sender, amount);
        token.safeTransfer(msg.sender, amount);
    }

    /// Protocol-internal debit (capped at the user's balance), paid to the operator.
    function debitInternal(address user, uint256 amount) external nonReentrant returns (uint256 taken) {
        if (msg.sender != operator) revert NotOperator();
        uint256 b = balanceOf[user];
        taken = amount > b ? b : amount;
        if (taken == 0) return 0;
        balanceOf[user] = b - taken;
        reserve -= taken;
        emit ShadowWithdrawn(user, taken);
        token.safeTransfer(msg.sender, taken);
    }
}
