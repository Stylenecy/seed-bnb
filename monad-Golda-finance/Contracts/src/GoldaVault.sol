// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {IUniswapV3Pool} from "./interfaces/IUniswapV3Pool.sol";
import {OracleLibrary} from "./libraries/OracleLibrary.sol";

contract GoldaVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;
    using Math for uint256;

    IERC20 public immutable paxg;
    address public uniV3Pool;
    address public lifiDiamond;
    address public agentWallet;
    uint32 public constant TWAP_INTERVAL = 300;
    mapping(bytes4 => bool) public allowedSelectors;

    uint8 private immutable _paxgDecimals;
    uint8 private immutable _usdcDecimals;

    event AgentWalletUpdated(address indexed oldAgent, address indexed newAgent);
    event UniV3PoolUpdated(address indexed oldPool, address indexed newPool);
    event LifiDiamondUpdated(address indexed oldDiamond, address indexed newDiamond);
    event SelectorUpdated(bytes4 indexed selector, bool allowed);
    event RebalanceExecuted(address indexed agent, bytes4 selector, bool success);
    event ProRataWithdrawal(address indexed receiver, uint256 usdcAmount, uint256 paxgAmount, uint256 sharesBurned);

    error OnlyAgent();
    error SelectorNotAllowed(bytes4 selector);
    error RebalanceFailed();
    error ZeroAddress();
    error CalldataTooShort();
    error PoolNotSet();

    constructor(
        IERC20 _usdc,
        IERC20 _paxg,
        address _uniV3Pool,
        address _lifiDiamond,
        address _agentWallet
    )
        ERC4626(_usdc)
        ERC20("Golda Safe-Haven Vault", "gVAULT")
        Ownable(msg.sender)
    {
        if (address(_paxg) == address(0)) revert ZeroAddress();
        if (_lifiDiamond == address(0)) revert ZeroAddress();
        if (_agentWallet == address(0)) revert ZeroAddress();

        paxg = _paxg;
        uniV3Pool = _uniV3Pool;
        lifiDiamond = _lifiDiamond;
        agentWallet = _agentWallet;
        _paxgDecimals = IERC20Metadata(address(_paxg)).decimals();
        _usdcDecimals = IERC20Metadata(address(_usdc)).decimals();
    }

    // USDC balance + PAXG converted via TWAP
    function totalAssets() public view override returns (uint256 total) {
        uint256 usdcBalance = IERC20(asset()).balanceOf(address(this));
        uint256 paxgBalance = paxg.balanceOf(address(this));

        if (paxgBalance == 0 || uniV3Pool == address(0)) {
            return usdcBalance;
        }

        total = usdcBalance + _getPaxgValueInUsdc(paxgBalance);
    }

    // Pro-rata distribution of USDC and PAXG, no swaps on withdraw
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override {
        uint256 totalShares = totalSupply();
        uint256 usdcAmount = IERC20(asset()).balanceOf(address(this)).mulDiv(shares, totalShares);
        uint256 paxgAmount = paxg.balanceOf(address(this)).mulDiv(shares, totalShares);

        _burn(owner, shares);

        if (usdcAmount > 0) IERC20(asset()).safeTransfer(receiver, usdcAmount);
        if (paxgAmount > 0) paxg.safeTransfer(receiver, paxgAmount);

        emit ProRataWithdrawal(receiver, usdcAmount, paxgAmount, shares);
        emit Withdraw(caller, receiver, owner, assets, shares);
    }

    // Agent executes rebalance via LI.FI, selector must be whitelisted
    function executeRebalance(bytes calldata _calldata) external {
        if (msg.sender != agentWallet) revert OnlyAgent();
        if (_calldata.length < 4) revert CalldataTooShort();

        bytes4 selector = bytes4(_calldata[:4]);
        if (!allowedSelectors[selector]) revert SelectorNotAllowed(selector);

        (bool success,) = lifiDiamond.call(_calldata);
        if (!success) revert RebalanceFailed();

        emit RebalanceExecuted(msg.sender, selector, success);
    }

    function approveForRebalance(IERC20 token, uint256 amount) external {
        if (msg.sender != agentWallet && msg.sender != owner()) revert OnlyAgent();
        token.forceApprove(lifiDiamond, amount);
    }

    function setAgentWallet(address _agentWallet) external onlyOwner {
        if (_agentWallet == address(0)) revert ZeroAddress();
        emit AgentWalletUpdated(agentWallet, _agentWallet);
        agentWallet = _agentWallet;
    }

    function setUniV3Pool(address _uniV3Pool) external onlyOwner {
        emit UniV3PoolUpdated(uniV3Pool, _uniV3Pool);
        uniV3Pool = _uniV3Pool;
    }

    function setLifiDiamond(address _lifiDiamond) external onlyOwner {
        if (_lifiDiamond == address(0)) revert ZeroAddress();
        emit LifiDiamondUpdated(lifiDiamond, _lifiDiamond);
        lifiDiamond = _lifiDiamond;
    }

    function setAllowedSelector(bytes4 selector, bool allowed) external onlyOwner {
        allowedSelectors[selector] = allowed;
        emit SelectorUpdated(selector, allowed);
    }

    function _getPaxgValueInUsdc(uint256 paxgAmount) internal view returns (uint256 usdcValue) {
        if (uniV3Pool == address(0)) revert PoolNotSet();

        int24 meanTick = OracleLibrary.consult(uniV3Pool, TWAP_INTERVAL);
        address paxgAddr = address(paxg);
        address usdcAddr = asset();
        address token0 = IUniswapV3Pool(uniV3Pool).token0();
        address token1 = IUniswapV3Pool(uniV3Pool).token1();

        if (token0 == paxgAddr || token1 == paxgAddr) {
            usdcValue = OracleLibrary.getQuoteAtTick(meanTick, uint128(paxgAmount), paxgAddr, usdcAddr);
        }
    }

    function getAllocation()
        external
        view
        returns (uint256 usdcBalance, uint256 paxgBalance, uint256 paxgValueUsdc)
    {
        usdcBalance = IERC20(asset()).balanceOf(address(this));
        paxgBalance = paxg.balanceOf(address(this));
        if (paxgBalance > 0 && uniV3Pool != address(0)) {
            paxgValueUsdc = _getPaxgValueInUsdc(paxgBalance);
        }
    }

    // Price of 1 PAXG in USDC via TWAP
    function getTwapPrice() external view returns (uint256 price) {
        if (uniV3Pool == address(0)) revert PoolNotSet();
        price = _getPaxgValueInUsdc(10 ** _paxgDecimals);
    }
}
