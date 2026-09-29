/// Test USD stablecoin (6 decimals) — the debt/quote asset for testnet demos.
module testcoins::tusd;

use sui::coin::{Self, TreasuryCap};

public struct TUSD has drop {}

fun init(witness: TUSD, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        witness, 6, b"TUSD", b"Test USD", b"Equinox testnet stablecoin", option::none(), ctx,
    );
    transfer::public_freeze_object(metadata);
    transfer::public_transfer(treasury, ctx.sender());
}

/// Mint test stablecoin to anyone (testnet faucet).
public fun mint(cap: &mut TreasuryCap<TUSD>, amount: u64, recipient: address, ctx: &mut TxContext) {
    coin::mint_and_transfer(cap, amount, recipient, ctx);
}
