// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EquinoxRegistry} from "./EquinoxRegistry.sol";
import {PriceOracle} from "./PriceOracle.sol";
import {NativePool} from "./NativePool.sol";
import {IStrategyAdapter} from "./interfaces/IStrategyAdapter.sol";
import {EquinoxMath} from "./libraries/EquinoxMath.sol";

/// @title EquinoxVaults
/// @notice User positions, per-position agent state, the skim (borrow) leg and
///         permissionless auto-defense. Port of `equinox::vault`, `equinox::agent`,
///         `equinox::defense` and `equinox::strategy` (Sui Move) to one contract.
///
///         A vault has collateral in token `C` and debt in token `Q` (a stablecoin,
///         e.g. USDT on BSC). All tokens are custodied by this contract; per-vault
///         balances are tracked in storage (the Sui version used per-object
///         `Balance<T>`s).
///
///         Trust model is unchanged: an AGENT_ROLE holder may only run the
///         in-bounds actions below; withdrawals are owner-gated; `defend` is
///         permissionless because it can only improve a position's safety.
contract EquinoxVaults is ReentrancyGuard {
    using SafeERC20 for IERC20;
    using EquinoxMath for uint256;

    // Modes
    uint8 public constant MODE_FOREVER_INCOME = 0;
    uint8 public constant MODE_LOAN_AUTOREPAY = 1;
    uint8 public constant MODE_YIELD_MAX = 2;
    // Risk profiles / strategy templates
    uint8 public constant RISK_CONSERVATIVE = 0;
    uint8 public constant RISK_BALANCED = 1;
    uint8 public constant RISK_AGGRESSIVE = 2;

    struct Vault {
        address owner;
        address collateralToken; // C
        address debtToken; // Q
        uint256 collateral; // idle C
        uint256 buffer; // reserve fund in Q
        uint256 debt; // outstanding debt in Q
        uint256 totalDeployed; // C deployed to venues
    }

    struct Deployment {
        bool active;
        address adapter;
        uint256 positionRef;
        uint256 amount; // C value credited at entry
    }

    struct AgentState {
        bool exists;
        uint8 mode;
        uint8 risk;
        uint16 targetLtvBps;
        uint16 recycleRatioBps;
        uint32 minHfBps;
        uint64 lastActionAt;
        uint64 actionCount;
        bytes32 logHead;
        string borrowVenue;
        string lendVenue;
    }

    error NotOwner();
    error NotAgent();
    error NotAdmin();
    error AmountZero();
    error InsufficientIdle();
    error VenueOccupied();
    error PositionMissing();
    error Slippage();
    error BadParams();
    error WrongAsset();
    error NoAgentState();
    error AgentExists();
    error NoLender();
    error VaultMissing();
    error Undercollateralized();

    /// Max price age used by the owner `withdraw` solvency check while debt is open.
    uint256 public constant WITHDRAW_MAX_PRICE_AGE = 1 hours;

    event VaultCreated(uint256 indexed vaultId, address indexed owner, address collateralToken, address debtToken);
    event Deposited(uint256 indexed vaultId, uint256 amount, uint256 newCollateral);
    event Withdrawn(uint256 indexed vaultId, uint256 amount, uint256 newCollateral);
    event BufferFunded(uint256 indexed vaultId, uint256 amount);
    event ReserveWithdrawn(uint256 indexed vaultId, uint256 amount);
    event StrategyEntered(uint256 indexed vaultId, string venue, uint256 amount);
    event StrategyExited(uint256 indexed vaultId, string venue, uint256 returned);
    event SpreadCaptured(uint256 indexed vaultId, uint256 amount);
    event DefenseTriggered(uint256 indexed vaultId, uint256 healthFactorBps, uint256 repaid);
    event AgentOpened(uint256 indexed vaultId, uint8 mode, uint8 risk);
    event AgentConfigured(uint256 indexed vaultId);
    event ActionRecorded(uint256 indexed vaultId, uint8 actionCode, bytes32 payloadHash, bytes32 logHead);
    event LenderSet(address indexed debtToken, address pool);

    EquinoxRegistry public immutable registry;
    PriceOracle public immutable oracle;

    uint256 public nextVaultId = 1;
    mapping(uint256 => Vault) public vaults;
    mapping(uint256 => mapping(string => Deployment)) public deployments;
    mapping(uint256 => AgentState) internal _agents;
    /// Trusted NativePool lender per debt token (replaces passing `&mut NativePool<Q>`).
    mapping(address => NativePool) public lenderOf;

    constructor(EquinoxRegistry _registry, PriceOracle _oracle) {
        registry = _registry;
        oracle = _oracle;
    }

    // === Modifiers ===

    modifier onlyAgent() {
        if (!registry.hasRole(registry.AGENT_ROLE(), msg.sender)) revert NotAgent();
        _;
    }

    modifier onlyVaultOwner(uint256 vaultId) {
        if (vaults[vaultId].owner != msg.sender) revert NotOwner();
        _;
    }

    // === Admin ===

    function setLender(address debtToken, NativePool pool) external {
        if (!registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), msg.sender)) revert NotAdmin();
        if (address(pool) != address(0) && pool.asset() != debtToken) revert WrongAsset();
        lenderOf[debtToken] = pool;
        emit LenderSet(debtToken, address(pool));
    }

    // === Vault lifecycle (owner-facing) ===

    function openVault(address collateralToken, address debtToken) external returns (uint256 vaultId) {
        registry.assertAssetEnabled(collateralToken);
        registry.assertAssetEnabled(debtToken);
        vaultId = nextVaultId++;
        Vault storage v = vaults[vaultId];
        v.owner = msg.sender;
        v.collateralToken = collateralToken;
        v.debtToken = debtToken;
        emit VaultCreated(vaultId, msg.sender, collateralToken, debtToken);
    }

    /// Add collateral. Permissionless top-up.
    function deposit(uint256 vaultId, uint256 amount) external nonReentrant {
        Vault storage v = _vault(vaultId);
        if (amount == 0) revert AmountZero();
        IERC20(v.collateralToken).safeTransferFrom(msg.sender, address(this), amount);
        v.collateral += amount;
        emit Deposited(vaultId, amount, collateralValue(vaultId));
    }

    /// Withdraw idle collateral to the owner.
    function withdraw(uint256 vaultId, uint256 amount) external nonReentrant onlyVaultOwner(vaultId) {
        Vault storage v = vaults[vaultId];
        if (amount == 0) revert AmountZero();
        if (v.collateral < amount) revert InsufficientIdle();
        v.collateral -= amount;
        // EVM hardening (not in the Move original): with debt open, the remaining
        // collateral must still cover it at the asset's max LTV, otherwise the owner
        // could pull all collateral and leave the NativePool lender unbacked.
        if (v.debt > 0) {
            (uint256 collateralUsd, uint256 debtUsd) = _usdLegs(vaultId, WITHDRAW_MAX_PRICE_AGE);
            if (debtUsd > collateralUsd.applyBps(registry.maxLtvBps(v.collateralToken))) {
                revert Undercollateralized();
            }
        }
        IERC20(v.collateralToken).safeTransfer(msg.sender, amount);
        emit Withdrawn(vaultId, amount, collateralValue(vaultId));
    }

    /// Top up the reserve fund / defense buffer (debt token). Permissionless.
    function fundBuffer(uint256 vaultId, uint256 amount) external nonReentrant {
        Vault storage v = _vault(vaultId);
        IERC20(v.debtToken).safeTransferFrom(msg.sender, address(this), amount);
        v.buffer += amount;
        emit BufferFunded(vaultId, amount);
    }

    /// Owner withdraws spendable from the reserve fund.
    function withdrawReserve(uint256 vaultId, uint256 amount) external nonReentrant onlyVaultOwner(vaultId) {
        Vault storage v = vaults[vaultId];
        if (amount == 0) revert AmountZero();
        if (v.buffer < amount) revert InsufficientIdle();
        v.buffer -= amount;
        IERC20(v.debtToken).safeTransfer(msg.sender, amount);
        emit ReserveWithdrawn(vaultId, amount);
    }

    // === Strategy round-trip (agent) ===

    /// Deploy idle collateral to a registered venue. Atomic replacement for the
    /// Sui enter_strategy -> venue call -> record_position -> settle PTB.
    function enterStrategy(uint256 vaultId, string calldata venue, uint256 amount, uint256 minReturn)
        external
        nonReentrant
        onlyAgent
    {
        registry.assertNotPaused();
        address adapter = registry.assertVenueEnabled(venue);
        Vault storage v = _vault(vaultId);
        if (amount == 0) revert AmountZero();
        if (v.collateral < amount) revert InsufficientIdle();
        if (deployments[vaultId][venue].active) revert VenueOccupied();
        if (IStrategyAdapter(adapter).asset() != v.collateralToken) revert WrongAsset();

        v.collateral -= amount;
        IERC20(v.collateralToken).forceApprove(adapter, amount);
        (uint256 positionRef, uint256 realized) = IStrategyAdapter(adapter).deposit(amount);
        if (realized < minReturn) revert Slippage();

        deployments[vaultId][venue] =
            Deployment({active: true, adapter: adapter, positionRef: positionRef, amount: realized});
        v.totalDeployed += realized;
        emit StrategyEntered(vaultId, venue, amount);
    }

    /// Redeem a venue position back into idle collateral.
    function exitStrategy(uint256 vaultId, string calldata venue, uint256 minReturn)
        external
        nonReentrant
        onlyAgent
    {
        registry.assertNotPaused();
        Vault storage v = _vault(vaultId);
        Deployment memory d = deployments[vaultId][venue];
        if (!d.active) revert PositionMissing();
        delete deployments[vaultId][venue];
        v.totalDeployed -= d.amount;

        IERC20 c = IERC20(v.collateralToken);
        uint256 before = c.balanceOf(address(this));
        IStrategyAdapter(d.adapter).withdraw(d.positionRef);
        uint256 realized = c.balanceOf(address(this)) - before;
        if (realized < minReturn) revert Slippage();

        v.collateral += realized;
        emit StrategyExited(vaultId, venue, realized);
    }

    // === Agent state (owner config) ===

    function openAgent(
        uint256 vaultId,
        uint8 mode,
        uint8 risk,
        uint16 targetLtvBps,
        uint16 recycleRatioBps,
        uint32 minHfBps
    ) external onlyVaultOwner(vaultId) {
        if (_agents[vaultId].exists) revert AgentExists();
        if (mode > MODE_YIELD_MAX || risk > RISK_AGGRESSIVE) revert BadParams();
        if (targetLtvBps > 10_000 || recycleRatioBps > 10_000) revert BadParams();
        AgentState storage s = _agents[vaultId];
        s.exists = true;
        s.mode = mode;
        s.risk = risk;
        s.targetLtvBps = targetLtvBps;
        s.recycleRatioBps = recycleRatioBps;
        s.minHfBps = minHfBps;
        emit AgentOpened(vaultId, mode, risk);
    }

    function setMode(uint256 vaultId, uint8 mode) external onlyVaultOwner(vaultId) {
        if (mode > MODE_YIELD_MAX) revert BadParams();
        _agent(vaultId).mode = mode;
        emit AgentConfigured(vaultId);
    }

    function setRisk(uint256 vaultId, uint8 risk) external onlyVaultOwner(vaultId) {
        if (risk > RISK_AGGRESSIVE) revert BadParams();
        _agent(vaultId).risk = risk;
        emit AgentConfigured(vaultId);
    }

    function setTargets(uint256 vaultId, uint16 targetLtvBps, uint16 recycleRatioBps, uint32 minHfBps)
        external
        onlyVaultOwner(vaultId)
    {
        if (targetLtvBps > 10_000 || recycleRatioBps > 10_000) revert BadParams();
        AgentState storage s = _agent(vaultId);
        s.targetLtvBps = targetLtvBps;
        s.recycleRatioBps = recycleRatioBps;
        s.minHfBps = minHfBps;
        emit AgentConfigured(vaultId);
    }

    /// Conservative / Balanced / Aggressive templates (same numbers as on Sui).
    function applyTemplate(uint256 vaultId, uint8 template) external onlyVaultOwner(vaultId) {
        if (template > RISK_AGGRESSIVE) revert BadParams();
        AgentState storage s = _agent(vaultId);
        s.risk = template;
        if (template == RISK_CONSERVATIVE) {
            (s.targetLtvBps, s.recycleRatioBps, s.minHfBps) = (4_000, 5_000, 15_000);
        } else if (template == RISK_BALANCED) {
            (s.targetLtvBps, s.recycleRatioBps, s.minHfBps) = (5_500, 7_000, 13_000);
        } else {
            (s.targetLtvBps, s.recycleRatioBps, s.minHfBps) = (6_500, 8_500, 11_500);
        }
        emit AgentConfigured(vaultId);
    }

    function setVenues(uint256 vaultId, string calldata borrowVenue, string calldata lendVenue)
        external
        onlyVaultOwner(vaultId)
    {
        registry.assertVenueEnabled(borrowVenue);
        registry.assertVenueEnabled(lendVenue);
        AgentState storage s = _agent(vaultId);
        s.borrowVenue = borrowVenue;
        s.lendVenue = lendVenue;
        emit AgentConfigured(vaultId);
    }

    // === Agent action log (hash chain; payload stored off-chain) ===

    function recordAction(uint256 vaultId, uint8 actionCode, bytes32 payloadHash) external onlyAgent {
        AgentState storage s = _agent(vaultId);
        uint64 ts = uint64(block.timestamp);
        s.logHead = keccak256(abi.encodePacked(s.logHead, actionCode, payloadHash, ts));
        s.lastActionAt = ts;
        s.actionCount += 1;
        emit ActionRecorded(vaultId, actionCode, payloadHash, s.logHead);
    }

    // === Skim (borrow leg) ===

    /// Borrow debt token against collateral up to min(target LTV, asset max LTV),
    /// valued in USD, into the vault's reserve fund. Returns the amount borrowed.
    function skimToReserve(uint256 vaultId, uint256 maxAgeSecs)
        external
        nonReentrant
        onlyAgent
        returns (uint256 amount)
    {
        registry.assertNotPaused();
        Vault storage v = _vault(vaultId);
        AgentState storage s = _agent(vaultId);
        NativePool pool = _lender(v.debtToken);

        (uint256 collateralUsd, uint256 debtUsd) = _usdLegs(vaultId, maxAgeSecs);
        uint256 capUsd = EquinoxMath.min(
            collateralUsd.applyBps(s.targetLtvBps), collateralUsd.applyBps(registry.maxLtvBps(v.collateralToken))
        );
        uint256 headroomUsd = capUsd > debtUsd ? capUsd - debtUsd : 0;
        uint256 headroomQ =
            oracle.amountFromUsd(v.debtToken, headroomUsd, registry.assetDecimals(v.debtToken), maxAgeSecs);
        amount = EquinoxMath.min(headroomQ, pool.reserve());
        if (amount == 0) return 0;

        pool.borrow(amount, address(this));
        v.debt += amount;
        v.buffer += amount;
        emit SpreadCaptured(vaultId, amount);
    }

    // === Defense (permissionless) ===

    /// If HF is below the agent's `minHfBps`, repay just enough debt from the
    /// reserve fund to restore it (capped by buffer and debt). Anyone may call.
    function defend(uint256 vaultId, uint256 maxAgeSecs) external nonReentrant {
        Vault storage v = _vault(vaultId);
        AgentState storage s = _agent(vaultId);

        uint256 lt = registry.liqThresholdBps(v.collateralToken);
        (uint256 collateralUsd, uint256 debtUsd) = _usdLegs(vaultId, maxAgeSecs);
        uint256 hf = EquinoxMath.healthFactorBps(collateralUsd, lt, debtUsd);
        if (hf >= s.minHfBps) {
            emit DefenseTriggered(vaultId, hf, 0);
            return;
        }

        // Round the repay up by one unit so flooring never leaves HF below the line.
        uint256 targetDebtUsd = EquinoxMath.mulDiv(collateralUsd, lt, s.minHfBps);
        uint256 repayUsd = debtUsd > targetDebtUsd ? debtUsd - targetDebtUsd : 0;
        uint256 want = EquinoxMath.min(
            oracle.amountFromUsd(v.debtToken, repayUsd, registry.assetDecimals(v.debtToken), maxAgeSecs) + 1,
            v.debt
        );
        uint256 repay = EquinoxMath.min(want, v.buffer);
        if (repay > 0) {
            NativePool pool = _lender(v.debtToken);
            v.buffer -= repay;
            v.debt -= repay;
            IERC20(v.debtToken).forceApprove(address(pool), repay);
            pool.repayLoan(repay);
        }
        emit DefenseTriggered(vaultId, healthFactorPriced(vaultId, maxAgeSecs), repay);
    }

    // === Views ===

    /// Idle + deployed collateral (C units). Buffer is in Q and not counted.
    function collateralValue(uint256 vaultId) public view returns (uint256) {
        Vault storage v = vaults[vaultId];
        return v.collateral + v.totalDeployed;
    }

    /// Cross-asset health factor (bps), both legs valued in USD by the oracle.
    function healthFactorPriced(uint256 vaultId, uint256 maxAgeSecs) public view returns (uint256) {
        (uint256 collateralUsd, uint256 debtUsd) = _usdLegs(vaultId, maxAgeSecs);
        return EquinoxMath.healthFactorBps(
            collateralUsd, registry.liqThresholdBps(vaults[vaultId].collateralToken), debtUsd
        );
    }

    function agentState(uint256 vaultId) external view returns (AgentState memory) {
        return _agents[vaultId];
    }

    // === Internal ===

    function _vault(uint256 vaultId) internal view returns (Vault storage v) {
        v = vaults[vaultId];
        if (v.owner == address(0)) revert VaultMissing();
    }

    function _agent(uint256 vaultId) internal view returns (AgentState storage s) {
        s = _agents[vaultId];
        if (!s.exists) revert NoAgentState();
    }

    function _lender(address debtToken) internal view returns (NativePool pool) {
        pool = lenderOf[debtToken];
        if (address(pool) == address(0)) revert NoLender();
    }

    function _usdLegs(uint256 vaultId, uint256 maxAgeSecs)
        internal
        view
        returns (uint256 collateralUsd, uint256 debtUsd)
    {
        Vault storage v = vaults[vaultId];
        collateralUsd = oracle.usdValue(
            v.collateralToken, collateralValue(vaultId), registry.assetDecimals(v.collateralToken), maxAgeSecs
        );
        debtUsd = oracle.usdValue(v.debtToken, v.debt, registry.assetDecimals(v.debtToken), maxAgeSecs);
    }
}
