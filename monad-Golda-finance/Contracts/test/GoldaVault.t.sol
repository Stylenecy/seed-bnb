// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {GoldaVault} from "../src/GoldaVault.sol";
import {MockPAXG} from "../src/MockPAXG.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract MockUniV3Pool {
    address public token0;
    address public token1;
    int56 public tickCumulative0;
    int56 public tickCumulative1;

    constructor(address _token0, address _token1) {
        if (_token0 < _token1) { token0 = _token0; token1 = _token1; }
        else { token0 = _token1; token1 = _token0; }
    }

    function setTickCumulatives(int56 _tick0, int56 _tick1) external {
        tickCumulative0 = _tick0;
        tickCumulative1 = _tick1;
    }

    function observe(uint32[] calldata)
        external view
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s)
    {
        tickCumulatives = new int56[](2);
        tickCumulatives[0] = tickCumulative0;
        tickCumulatives[1] = tickCumulative1;
        secondsPerLiquidityCumulativeX128s = new uint160[](2);
    }

    function slot0() external pure
        returns (uint160, int24, uint16, uint16, uint16, uint8, bool)
    { return (0, 0, 0, 0, 0, 0, true); }

    function tickSpacing() external pure returns (int24) { return 60; }
}

contract MockLifiDiamond {
    bool public shouldFail;
    bytes public lastCalldata;

    function setFail(bool _fail) external { shouldFail = _fail; }

    fallback() external payable {
        lastCalldata = msg.data;
        if (shouldFail) revert("MockLifi: fail");
    }
    receive() external payable {}
}

contract GoldaVaultTest is Test {
    GoldaVault public vault;
    MockUSDC public usdc;
    MockPAXG public paxg;
    MockUniV3Pool public pool;
    MockLifiDiamond public lifi;

    address public owner = address(this);
    address public agent = makeAddr("agent");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    address public randomUser = makeAddr("random");

    bytes4 public constant SWAP_SELECTOR = bytes4(keccak256("swapTokensGeneric(bytes32,string,string,address,uint256,(address,address,address,address,uint256,bytes,bool)[])"));

    function setUp() public {
        usdc = new MockUSDC();
        paxg = new MockPAXG();
        lifi = new MockLifiDiamond();
        pool = new MockUniV3Pool(address(usdc), address(paxg));

        // tick ~74959 -> ~$2000 PAXG/USDC
        pool.setTickCumulatives(0, int56(int24(74959)) * 300);

        vault = new GoldaVault(
            IERC20(address(usdc)),
            IERC20(address(paxg)),
            address(pool),
            address(lifi),
            agent
        );

        vault.setAllowedSelector(SWAP_SELECTOR, true);

        usdc.mint(user1, 100_000 * 1e6);
        usdc.mint(user2, 50_000 * 1e6);

        vm.prank(user1);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(user2);
        usdc.approve(address(vault), type(uint256).max);
    }

    function test_DepositUsdc() public {
        vm.prank(user1);
        uint256 shares = vault.deposit(10_000 * 1e6, user1);
        assertGt(shares, 0);
        assertEq(vault.balanceOf(user1), shares);
        assertEq(usdc.balanceOf(address(vault)), 10_000 * 1e6);
    }

    function test_DepositMultipleUsers() public {
        vm.prank(user1);
        uint256 shares1 = vault.deposit(10_000 * 1e6, user1);
        vm.prank(user2);
        uint256 shares2 = vault.deposit(5_000 * 1e6, user2);
        assertEq(shares1, 10_000 * 1e6);
        assertGt(shares2, 0);
    }

    function test_TotalAssetsOnlyUsdc() public {
        vm.prank(user1);
        vault.deposit(10_000 * 1e6, user1);
        assertEq(vault.totalAssets(), 10_000 * 1e6);
    }

    function test_TotalAssetsWithPaxg() public {
        vm.prank(user1);
        vault.deposit(10_000 * 1e6, user1);
        paxg.mint(address(vault), 1 * 1e18);
        assertGt(vault.totalAssets(), 10_000 * 1e6);
    }

    function test_TotalAssetsWithNoPool() public {
        GoldaVault vaultNoPool = new GoldaVault(
            IERC20(address(usdc)), IERC20(address(paxg)),
            address(0), address(lifi), agent
        );
        usdc.mint(address(vaultNoPool), 10_000 * 1e6);
        paxg.mint(address(vaultNoPool), 1 * 1e18);
        assertEq(vaultNoPool.totalAssets(), 10_000 * 1e6);
    }

    function test_ProRataWithdraw() public {
        vm.prank(user1);
        vault.deposit(10_000 * 1e6, user1);
        paxg.mint(address(vault), 2 * 1e18);

        uint256 shares = vault.balanceOf(user1);
        uint256 expectedPaxg = paxg.balanceOf(address(vault)) * shares / vault.totalSupply();

        vm.prank(user1);
        vault.redeem(shares, user1, user1);

        assertEq(usdc.balanceOf(user1), 100_000 * 1e6);
        assertEq(paxg.balanceOf(user1), expectedPaxg);
    }

    function test_ProRataWithdrawMultipleUsers() public {
        vm.prank(user1);
        vault.deposit(10_000 * 1e6, user1);
        vm.prank(user2);
        vault.deposit(5_000 * 1e6, user2);
        paxg.mint(address(vault), 3 * 1e18);

        vm.prank(user1);
        vault.redeem(vault.balanceOf(user1), user1, user1);
        assertEq(paxg.balanceOf(user1), 2 * 1e18);
    }

    function test_RebalanceValidSelector() public {
        bytes memory cd = abi.encodePacked(SWAP_SELECTOR, bytes32(0));
        vm.prank(agent);
        vault.executeRebalance(cd);
        assertEq(bytes4(lifi.lastCalldata()), SWAP_SELECTOR);
    }

    function test_RebalanceInvalidSelector() public {
        bytes4 bad = bytes4(keccak256("maliciousFunction()"));
        vm.prank(agent);
        vm.expectRevert(abi.encodeWithSelector(GoldaVault.SelectorNotAllowed.selector, bad));
        vault.executeRebalance(abi.encodePacked(bad, bytes32(0)));
    }

    function test_RebalanceUnauthorized() public {
        vm.prank(randomUser);
        vm.expectRevert(GoldaVault.OnlyAgent.selector);
        vault.executeRebalance(abi.encodePacked(SWAP_SELECTOR, bytes32(0)));
    }

    function test_RebalanceCalldataTooShort() public {
        vm.prank(agent);
        vm.expectRevert(GoldaVault.CalldataTooShort.selector);
        vault.executeRebalance(hex"aabb");
    }

    function test_RebalanceLifiFailure() public {
        lifi.setFail(true);
        vm.prank(agent);
        vm.expectRevert(GoldaVault.RebalanceFailed.selector);
        vault.executeRebalance(abi.encodePacked(SWAP_SELECTOR, bytes32(0)));
    }

    function test_SetAgentWallet() public {
        address n = makeAddr("newAgent");
        vault.setAgentWallet(n);
        assertEq(vault.agentWallet(), n);
    }

    function test_SetAgentWalletOnlyOwner() public {
        vm.prank(randomUser);
        vm.expectRevert();
        vault.setAgentWallet(makeAddr("x"));
    }

    function test_SetAgentWalletZeroAddress() public {
        vm.expectRevert(GoldaVault.ZeroAddress.selector);
        vault.setAgentWallet(address(0));
    }

    function test_SetUniV3Pool() public {
        address n = makeAddr("newPool");
        vault.setUniV3Pool(n);
        assertEq(vault.uniV3Pool(), n);
    }

    function test_SetLifiDiamond() public {
        address n = makeAddr("newDiamond");
        vault.setLifiDiamond(n);
        assertEq(vault.lifiDiamond(), n);
    }

    function test_SetAllowedSelector() public {
        bytes4 s = bytes4(keccak256("newFunction()"));
        vault.setAllowedSelector(s, true);
        assertTrue(vault.allowedSelectors(s));
        vault.setAllowedSelector(s, false);
        assertFalse(vault.allowedSelectors(s));
    }

    function test_ApproveForRebalanceByAgent() public {
        vm.prank(agent);
        vault.approveForRebalance(IERC20(address(usdc)), 1000 * 1e6);
        assertEq(usdc.allowance(address(vault), address(lifi)), 1000 * 1e6);
    }

    function test_ApproveForRebalanceByOwner() public {
        vault.approveForRebalance(IERC20(address(usdc)), 1000 * 1e6);
        assertEq(usdc.allowance(address(vault), address(lifi)), 1000 * 1e6);
    }

    function test_ApproveForRebalanceUnauthorized() public {
        vm.prank(randomUser);
        vm.expectRevert(GoldaVault.OnlyAgent.selector);
        vault.approveForRebalance(IERC20(address(usdc)), 1000 * 1e6);
    }

    function test_GetAllocation() public {
        vm.prank(user1);
        vault.deposit(10_000 * 1e6, user1);
        paxg.mint(address(vault), 1 * 1e18);

        (uint256 u, uint256 p, uint256 pv) = vault.getAllocation();
        assertEq(u, 10_000 * 1e6);
        assertEq(p, 1 * 1e18);
        assertGt(pv, 0);
    }

    function test_GetTwapPrice() public view {
        uint256 price = vault.getTwapPrice();
        assertGt(price, 0);
    }

    function testFuzz_Deposit(uint256 amount) public {
        amount = bound(amount, 1, 100_000 * 1e6);
        usdc.mint(user1, amount);
        vm.startPrank(user1);
        usdc.approve(address(vault), amount);
        uint256 shares = vault.deposit(amount, user1);
        vm.stopPrank();
        assertGt(shares, 0);
    }
}
