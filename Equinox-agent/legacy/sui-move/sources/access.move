/// Capability-based access control for Equinox.
///
/// Trust model (post-Nautilus): there is NO off-chain verifiable-compute proof.
/// The off-chain executor (the "agent") acts under a plain `AgentCap` that the
/// protocol admin issues and can revoke. On-chain modules verify the cap; the
/// agent can never move user funds outside the invariants the Move code enforces.
module equinox::access;

/// Root capability, minted once to the publisher on `init`. Gates admin actions
/// (registering venues, issuing/revoking agent caps, emergency pause).
public struct AdminCap has key, store { id: UID }

/// Authorizes an off-chain executor to submit agent actions for positions.
/// Held by the protocol's executor key (ideally a multisig). Revocable.
public struct AgentCap has key, store { id: UID }

/// Published once: the deployer receives the single `AdminCap`.
fun init(ctx: &mut TxContext) {
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
}

/// Mint an `AgentCap`. Composable — caller decides where it goes.
public fun new_agent_cap(_admin: &AdminCap, ctx: &mut TxContext): AgentCap {
    AgentCap { id: object::new(ctx) }
}

/// Convenience endpoint: mint an `AgentCap` and send it to `executor`.
entry fun issue_agent_cap(admin: &AdminCap, executor: address, ctx: &mut TxContext) {
    transfer::transfer(new_agent_cap(admin, ctx), executor);
}

/// Permanently revoke an agent capability by destroying it.
public fun revoke_agent_cap(cap: AgentCap) {
    let AgentCap { id } = cap;
    id.delete();
}

#[test_only]
/// Mint an `AdminCap` directly for tests (bypasses `init`).
public fun new_admin_cap_for_testing(ctx: &mut TxContext): AdminCap {
    AdminCap { id: object::new(ctx) }
}

#[test_only]
public fun destroy_admin_cap_for_testing(cap: AdminCap) {
    let AdminCap { id } = cap;
    id.delete();
}
