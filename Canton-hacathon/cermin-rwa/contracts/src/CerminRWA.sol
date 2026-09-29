// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {RwaPriceFeed} from "./RwaPriceFeed.sol";

/// @title CerminRWA — Solidity port of the Daml `Cermin.Credit`, `Cermin.Guard`
///        and `Cermin.Coupon` templates (originally on Canton Network).
///
/// @notice Borrowers post tokenized-Treasury collateral (mUST), borrow mUSD from
///         the pool, and fund a Shadow Vault. The Guard Agent may repay from the
///         vault ONLY through `guardRepay`, which recomputes the Health Ratio
///         on-chain and refuses unless it is below the borrower's Guard Trigger
///         — the same narrow delegation the Daml `ShadowVault.GuardRepay` choice
///         enforced.
///
///         Mapping from Daml (one live loan / vault / policy per borrower, as in
///         the original backend and agent):
///           LendingPoolOffer        -> createOffer / acceptOffer / withdrawOffer
///           Loan (Repay, ApplyRepayment, TopUpCollateral, LastResortDefault)
///                                   -> repay / _applyRepayment / topUpCollateral / lastResortDefault
///           TreasuryToken Lock/Unlock -> collateral escrowed in this contract; closeLoan releases it
///           GuardPolicy             -> setGuardPolicy
///           ShadowVault (TopUp, Withdraw, GuardRepay, StartGracePeriod)
///                                   -> openShadowVault / topUpVault / withdrawVault / guardRepay / startGracePeriod
///           RescueEvent             -> RescueEvent struct + event
///           GracePeriod             -> GracePeriod struct (72h window)
///           CouponDistribution (ClaimCoupon, SweepToLoan) -> payCoupon / claimCoupon / sweepToLoan
///
///         IMPORTANT DIFFERENCE: Canton's sub-transaction privacy (only named
///         parties see a contract) does not exist on a public EVM chain. All
///         state and events here are publicly readable on BNB Chain.
///
///         Units: all amounts are 18-decimal token units; price is 1e18-scaled;
///         ratios are integer basis points (13000 = 130%).
contract CerminRWA is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS = 10_000;
    uint256 public constant PRICE_PRECISION = 1e18;
    uint64 public constant GRACE_WINDOW = 72 hours;

    // ── Immutable wiring (Daml parties + instrument) ─────────────────────────
    IERC20 public immutable COLLATERAL; // mUST (TreasuryToken)
    IERC20 public immutable STABLE; // mUSD (StableCoin)
    RwaPriceFeed public immutable PRICE_FEED;
    bytes32 public immutable INSTRUMENT_ID; // e.g. "mUST-2030"
    uint256 public immutable COUPON_RATE_BPS; // e.g. 450
    uint64 public immutable MATURITY; // unix seconds
    address public immutable ISSUER;
    address public immutable POOL_OPERATOR;

    // ── Types ────────────────────────────────────────────────────────────────
    struct Offer {
        address guardAgent;
        uint256 principal;
        uint256 rateBps;
        uint256 collateralAmount;
        string loanId;
        bool active;
    }

    struct Loan {
        address guardAgent;
        uint256 principal;
        uint256 outstanding;
        uint256 rateBps;
        uint256 collateralAmount;
        string loanId;
        bool active;
    }

    struct GuardPolicy {
        address guardAgent;
        uint256 triggerRatioBps;
        uint256 targetRatioBps;
        uint256 maxRepayPerEvent;
        bool couponSweep;
        bool active;
    }

    struct ShadowVault {
        address guardAgent;
        uint256 balance;
        bool active;
    }

    struct GracePeriod {
        string loanId;
        uint64 startedAt;
        uint64 expiresAt;
        bool active;
    }

    struct RescueEvent {
        string loanId;
        string description;
        uint256 amount;
        uint256 healthBefore;
        uint256 healthAfter;
        uint64 at;
    }

    struct Coupon {
        address owner;
        address guardAgent;
        uint256 amount;
        bool active;
    }

    // ── State ────────────────────────────────────────────────────────────────
    mapping(address borrower => Offer) public offers;
    mapping(address borrower => Loan) public loans;
    mapping(address borrower => GuardPolicy) public policies;
    mapping(address borrower => ShadowVault) public vaults;
    mapping(address borrower => GracePeriod) public gracePeriods;
    mapping(address borrower => RescueEvent[]) private _rescues;
    mapping(address borrower => bool) private _known;
    address[] private _borrowers;
    Coupon[] public coupons;

    // ── Events ───────────────────────────────────────────────────────────────
    event OfferCreated(address indexed borrower, string loanId, uint256 principal, uint256 collateralAmount);
    event OfferWithdrawn(address indexed borrower);
    event LoanOpened(address indexed borrower, string loanId, uint256 principal, uint256 collateralAmount);
    event Repaid(address indexed borrower, uint256 amount, uint256 outstanding);
    event CollateralToppedUp(address indexed borrower, uint256 amount, uint256 collateralAmount);
    event LoanClosed(address indexed borrower, uint256 collateralReturned);
    event LoanDefaulted(address indexed borrower, uint256 collateralSeized);
    event GuardPolicySet(address indexed borrower, uint256 triggerRatioBps, uint256 targetRatioBps, bool couponSweep);
    event VaultBalanceChanged(address indexed borrower, uint256 balance);
    event Rescued(
        address indexed borrower, string description, uint256 amount, uint256 healthBefore, uint256 healthAfter
    );
    event GracePeriodStarted(address indexed borrower, uint64 expiresAt);
    event CouponPaid(uint256 indexed couponId, address indexed owner, uint256 amount);
    event CouponClaimed(uint256 indexed couponId, address indexed owner, uint256 amount);
    event CouponSwept(uint256 indexed couponId, address indexed owner, uint256 amount);

    // ── Errors (mirror the Daml assertMsg texts) ─────────────────────────────
    error NotPoolOperator();
    error NotIssuer();
    error NotGuardAgent();
    error NoOffer();
    error LoanAlreadyActive();
    error NoActiveLoan();
    error NoPolicy();
    error NoVault();
    error VaultAlreadyOpen();
    error InvalidAmount();
    error ExceedsOutstanding();
    error ExceedsBalance();
    error InvalidPolicy();
    error HealthyLoan(); // "Health Ratio is at/above the Guard Trigger; auto-repay refused"
    error NothingToRepay();
    error VaultSufficient(); // "vault balance is sufficient; run GuardRepay instead of opening grace"
    error GraceAlreadyActive();
    error GraceNotExpired();
    error OutstandingDebt();
    error CouponInactive();
    error NotCouponOwner();
    error CouponSweepDisabled();

    constructor(
        address collateral_,
        address stable_,
        address priceFeed_,
        bytes32 instrumentId_,
        uint256 couponRateBps_,
        uint64 maturity_,
        address issuer_,
        address poolOperator_
    ) {
        COLLATERAL = IERC20(collateral_);
        STABLE = IERC20(stable_);
        PRICE_FEED = RwaPriceFeed(priceFeed_);
        INSTRUMENT_ID = instrumentId_;
        COUPON_RATE_BPS = couponRateBps_;
        MATURITY = maturity_;
        ISSUER = issuer_;
        POOL_OPERATOR = poolOperator_;
    }

    modifier onlyPool() {
        if (msg.sender != POOL_OPERATOR) revert NotPoolOperator();
        _;
    }

    // ═════════════════════════════ Math (Cermin.Credit) ══════════════════════

    /// @notice Health Ratio in bps = collateralAmount * price / outstanding, rounded half-up.
    function healthRatioBps(uint256 collateralAmount, uint256 price, uint256 outstanding)
        public
        pure
        returns (uint256)
    {
        if (outstanding == 0) return type(uint256).max;
        uint256 num = collateralAmount * price * BPS;
        uint256 den = PRICE_PRECISION * outstanding;
        return (num * 2 + den) / (den * 2);
    }

    /// @notice Repayment that lifts the Health Ratio back to `targetBps` (0 if already there).
    function amountToReachTarget(uint256 collateralAmount, uint256 price, uint256 outstanding, uint256 targetBps)
        public
        pure
        returns (uint256)
    {
        uint256 targetOutstanding = (collateralAmount * price * BPS) / (PRICE_PRECISION * targetBps);
        return outstanding > targetOutstanding ? outstanding - targetOutstanding : 0;
    }

    function currentPrice() public view returns (uint256 price) {
        (price,,) = PRICE_FEED.getPrice(INSTRUMENT_ID);
    }

    function currentHealthRatioBps(address borrower) external view returns (uint256) {
        Loan storage loan = loans[borrower];
        if (!loan.active) revert NoActiveLoan();
        return healthRatioBps(loan.collateralAmount, currentPrice(), loan.outstanding);
    }

    // ═════════════════════════ Origination (LendingPoolOffer) ════════════════

    /// @notice Pool's private origination offer. The pool must have approved
    ///         this contract for `principal` mUSD (the Daml disbursement proposal).
    function createOffer(
        address borrower,
        address guardAgent,
        string calldata loanId,
        uint256 principal,
        uint256 rateBps,
        uint256 collateralAmount
    ) external onlyPool {
        if (principal == 0 || collateralAmount == 0) revert InvalidAmount();
        offers[borrower] = Offer(guardAgent, principal, rateBps, collateralAmount, loanId, true);
        emit OfferCreated(borrower, loanId, principal, collateralAmount);
    }

    function withdrawOffer(address borrower) external onlyPool {
        if (!offers[borrower].active) revert NoOffer();
        delete offers[borrower];
        emit OfferWithdrawn(borrower);
    }

    /// @notice Daml `AcceptOffer`: lock (escrow) the collateral, take delivery of
    ///         the principal, and open the Loan — atomically.
    function acceptOffer() external nonReentrant {
        Offer memory offer = offers[msg.sender];
        if (!offer.active) revert NoOffer();
        if (loans[msg.sender].active) revert LoanAlreadyActive();
        delete offers[msg.sender];

        loans[msg.sender] = Loan({
            guardAgent: offer.guardAgent,
            principal: offer.principal,
            outstanding: offer.principal,
            rateBps: offer.rateBps,
            collateralAmount: offer.collateralAmount,
            loanId: offer.loanId,
            active: true
        });
        if (!_known[msg.sender]) {
            _known[msg.sender] = true;
            _borrowers.push(msg.sender);
        }

        COLLATERAL.safeTransferFrom(msg.sender, address(this), offer.collateralAmount);
        STABLE.safeTransferFrom(POOL_OPERATOR, msg.sender, offer.principal);
        emit LoanOpened(msg.sender, offer.loanId, offer.principal, offer.collateralAmount);
    }

    // ═════════════════════════════════ Loan ══════════════════════════════════

    /// @notice Borrower's manual paydown (Daml `Repay`); cash goes to the pool.
    function repay(uint256 amount) external nonReentrant {
        _applyRepayment(msg.sender, amount);
        STABLE.safeTransferFrom(msg.sender, POOL_OPERATOR, amount);
    }

    /// @notice Daml `TopUpCollateral`: pledge more mUST, raising the Health Ratio.
    function topUpCollateral(uint256 amount) external nonReentrant {
        Loan storage loan = loans[msg.sender];
        if (!loan.active) revert NoActiveLoan();
        if (amount == 0) revert InvalidAmount();
        loan.collateralAmount += amount;
        COLLATERAL.safeTransferFrom(msg.sender, address(this), amount);
        emit CollateralToppedUp(msg.sender, amount, loan.collateralAmount);
    }

    /// @notice Close a fully repaid loan and release the escrowed collateral
    ///         (EVM equivalent of TreasuryToken `Unlock` after payoff).
    function closeLoan() external nonReentrant {
        Loan storage loan = loans[msg.sender];
        if (!loan.active) revert NoActiveLoan();
        if (loan.outstanding != 0) revert OutstandingDebt();
        uint256 coll = loan.collateralAmount;
        delete loans[msg.sender];
        delete gracePeriods[msg.sender];
        COLLATERAL.safeTransfer(msg.sender, coll);
        emit LoanClosed(msg.sender, coll);
    }

    /// @notice Last-resort default — only after an EXPIRED GracePeriod for this
    ///         borrower. The Cermin demo never reaches it. On Canton, seizure was an
    ///         off-ledger process; here the escrowed collateral goes to the pool.
    function lastResortDefault(address borrower) external onlyPool nonReentrant {
        Loan storage loan = loans[borrower];
        if (!loan.active) revert NoActiveLoan();
        GracePeriod storage grace = gracePeriods[borrower];
        if (!grace.active || block.timestamp <= grace.expiresAt) revert GraceNotExpired();
        uint256 coll = loan.collateralAmount;
        delete loans[borrower];
        delete gracePeriods[borrower];
        COLLATERAL.safeTransfer(POOL_OPERATOR, coll);
        emit LoanDefaulted(borrower, coll);
    }

    /// @dev Daml `Loan.ApplyRepayment` — the delegation primitive shared by
    ///      repay, guardRepay and sweepToLoan.
    function _applyRepayment(address borrower, uint256 amount) private {
        Loan storage loan = loans[borrower];
        if (!loan.active) revert NoActiveLoan();
        if (amount == 0) revert InvalidAmount();
        if (amount > loan.outstanding) revert ExceedsOutstanding();
        loan.outstanding -= amount;
        emit Repaid(borrower, amount, loan.outstanding);
    }

    // ══════════════════════════ GuardPolicy + ShadowVault ════════════════════

    /// @notice Borrower sets (or replaces) their Guard Policy.
    function setGuardPolicy(
        address guardAgent,
        uint256 triggerRatioBps,
        uint256 targetRatioBps,
        uint256 maxRepayPerEvent,
        bool couponSweep
    ) external {
        if (triggerRatioBps == 0 || targetRatioBps < triggerRatioBps || maxRepayPerEvent == 0) {
            revert InvalidPolicy();
        }
        policies[msg.sender] =
            GuardPolicy(guardAgent, triggerRatioBps, targetRatioBps, maxRepayPerEvent, couponSweep, true);
        emit GuardPolicySet(msg.sender, triggerRatioBps, targetRatioBps, couponSweep);
    }

    /// @notice Borrower creates their Shadow Vault, naming the Guard Agent as delegate.
    function openShadowVault(address guardAgent, uint256 initialDeposit) external nonReentrant {
        ShadowVault storage v = vaults[msg.sender];
        if (v.active) revert VaultAlreadyOpen();
        v.guardAgent = guardAgent;
        v.balance = initialDeposit;
        v.active = true;
        if (initialDeposit > 0) STABLE.safeTransferFrom(msg.sender, address(this), initialDeposit);
        emit VaultBalanceChanged(msg.sender, initialDeposit);
    }

    function topUpVault(uint256 amount) external nonReentrant {
        ShadowVault storage v = vaults[msg.sender];
        if (!v.active) revert NoVault();
        if (amount == 0) revert InvalidAmount();
        v.balance += amount;
        STABLE.safeTransferFrom(msg.sender, address(this), amount);
        emit VaultBalanceChanged(msg.sender, v.balance);
    }

    function withdrawVault(uint256 amount) external nonReentrant {
        ShadowVault storage v = vaults[msg.sender];
        if (!v.active) revert NoVault();
        if (amount == 0) revert InvalidAmount();
        if (amount > v.balance) revert ExceedsBalance();
        v.balance -= amount;
        STABLE.safeTransfer(msg.sender, amount);
        emit VaultBalanceChanged(msg.sender, v.balance);
    }

    /// @notice The Guard Agent's ONLY power over vault money (Daml `GuardRepay`).
    ///         Refuses unless the live Health Ratio is below the borrower's trigger.
    ///         Repays min(needed-to-target, maxRepayPerEvent, balance) to the pool.
    function guardRepay(address borrower) external nonReentrant returns (uint256 repayAmount) {
        (Loan storage loan, GuardPolicy storage policy, ShadowVault storage vault) = _guardWitnesses(borrower);
        uint256 price = currentPrice();

        uint256 healthBefore = healthRatioBps(loan.collateralAmount, price, loan.outstanding);
        if (healthBefore >= policy.triggerRatioBps) revert HealthyLoan();

        uint256 needed = amountToReachTarget(loan.collateralAmount, price, loan.outstanding, policy.targetRatioBps);
        repayAmount = _min(needed, _min(policy.maxRepayPerEvent, vault.balance));
        if (repayAmount == 0) revert NothingToRepay();

        vault.balance -= repayAmount;
        _applyRepayment(borrower, repayAmount);
        uint256 healthAfter = healthRatioBps(loan.collateralAmount, price, loan.outstanding);
        _recordRescue(
            borrower,
            loan.loanId,
            "Auto-repay from Shadow Vault restored the Health Ratio",
            repayAmount,
            healthBefore,
            healthAfter
        );
        emit VaultBalanceChanged(borrower, vault.balance);

        STABLE.safeTransfer(POOL_OPERATOR, repayAmount);
    }

    /// @notice Daml `StartGracePeriod`: trigger breached AND vault can't reach target.
    function startGracePeriod(address borrower) external {
        (Loan storage loan, GuardPolicy storage policy, ShadowVault storage vault) = _guardWitnesses(borrower);
        uint256 price = currentPrice();
        if (healthRatioBps(loan.collateralAmount, price, loan.outstanding) >= policy.triggerRatioBps) {
            revert HealthyLoan();
        }
        uint256 needed = amountToReachTarget(loan.collateralAmount, price, loan.outstanding, policy.targetRatioBps);
        if (vault.balance >= needed) revert VaultSufficient();
        if (gracePeriods[borrower].active) revert GraceAlreadyActive();

        uint64 nowTs = uint64(block.timestamp);
        gracePeriods[borrower] = GracePeriod(loan.loanId, nowTs, nowTs + GRACE_WINDOW, true);
        emit GracePeriodStarted(borrower, nowTs + GRACE_WINDOW);
    }

    /// @dev Pins every witness to this borrower and the calling Guard Agent —
    ///      the same assertions GuardRepay made on its fetched cids.
    function _guardWitnesses(address borrower)
        private
        view
        returns (Loan storage loan, GuardPolicy storage policy, ShadowVault storage vault)
    {
        loan = loans[borrower];
        policy = policies[borrower];
        vault = vaults[borrower];
        if (!loan.active) revert NoActiveLoan();
        if (!policy.active) revert NoPolicy();
        if (!vault.active) revert NoVault();
        if (msg.sender != vault.guardAgent || msg.sender != policy.guardAgent || msg.sender != loan.guardAgent) {
            revert NotGuardAgent();
        }
    }

    // ══════════════════════════════ Coupons ══════════════════════════════════

    /// @notice Quarterly coupon = faceValue * couponRateBps / 10000 / 4.
    function quarterlyCouponAmount(uint256 faceValue) public view returns (uint256) {
        return (faceValue * COUPON_RATE_BPS) / BPS / 4;
    }

    /// @notice Issuer pays a quarterly coupon on `faceValue` of mUST held by
    ///         `owner`, funding it in mUSD up front (issuer must approve).
    function payCoupon(address owner, address guardAgent, uint256 faceValue)
        external
        nonReentrant
        returns (uint256 couponId)
    {
        if (msg.sender != ISSUER) revert NotIssuer();
        uint256 amount = quarterlyCouponAmount(faceValue);
        if (amount == 0) revert InvalidAmount();
        couponId = coupons.length;
        coupons.push(Coupon(owner, guardAgent, amount, true));
        STABLE.safeTransferFrom(msg.sender, address(this), amount);
        emit CouponPaid(couponId, owner, amount);
    }

    /// @notice Owner's manual claim (Daml `ClaimCoupon`).
    function claimCoupon(uint256 couponId) external nonReentrant {
        Coupon storage c = coupons[couponId];
        if (!c.active) revert CouponInactive();
        if (msg.sender != c.owner) revert NotCouponOwner();
        c.active = false;
        STABLE.safeTransfer(c.owner, c.amount);
        emit CouponClaimed(couponId, c.owner, c.amount);
    }

    /// @notice Guard Agent's coupon sweep (Daml `SweepToLoan`): routes the full
    ///         coupon into loan repayment. Requires couponSweep on the policy.
    ///         No health threshold — it's a proactive paydown.
    function sweepToLoan(uint256 couponId) external nonReentrant {
        Coupon storage c = coupons[couponId];
        if (!c.active) revert CouponInactive();
        if (msg.sender != c.guardAgent) revert NotGuardAgent();
        GuardPolicy storage policy = policies[c.owner];
        Loan storage loan = loans[c.owner];
        if (!policy.active) revert NoPolicy();
        if (policy.guardAgent != msg.sender || loan.guardAgent != msg.sender) revert NotGuardAgent();
        if (!policy.couponSweep) revert CouponSweepDisabled();
        if (!loan.active) revert NoActiveLoan();

        uint256 price = currentPrice();
        uint256 healthBefore = healthRatioBps(loan.collateralAmount, price, loan.outstanding);
        c.active = false;
        _applyRepayment(c.owner, c.amount);
        uint256 healthAfter = healthRatioBps(loan.collateralAmount, price, loan.outstanding);
        _recordRescue(c.owner, loan.loanId, "Coupon swept into loan repayment", c.amount, healthBefore, healthAfter);

        STABLE.safeTransfer(POOL_OPERATOR, c.amount);
        emit CouponSwept(couponId, c.owner, c.amount);
    }

    // ══════════════════════════════ Views ════════════════════════════════════

    function getBorrowers() external view returns (address[] memory) {
        return _borrowers;
    }

    function getRescueEvents(address borrower) external view returns (RescueEvent[] memory) {
        return _rescues[borrower];
    }

    function couponCount() external view returns (uint256) {
        return coupons.length;
    }

    /// @notice Ids of all unclaimed / unswept coupons (demo scale — linear scan).
    function activeCouponIds() external view returns (uint256[] memory ids) {
        uint256 n;
        for (uint256 i; i < coupons.length; ++i) {
            if (coupons[i].active) ++n;
        }
        ids = new uint256[](n);
        n = 0;
        for (uint256 i; i < coupons.length; ++i) {
            if (coupons[i].active) ids[n++] = i;
        }
    }

    // ══════════════════════════════ Internal ═════════════════════════════════

    function _recordRescue(
        address borrower,
        string memory loanId,
        string memory description,
        uint256 amount,
        uint256 healthBefore,
        uint256 healthAfter
    ) private {
        _rescues[borrower].push(
            RescueEvent(loanId, description, amount, healthBefore, healthAfter, uint64(block.timestamp))
        );
        emit Rescued(borrower, description, amount, healthBefore, healthAfter);
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }
}
