/// Test ETH (8 decimals) — collateral marker priced by Pyth ETH/USD.
module testcoins::teth;

use sui::coin::{Self, TreasuryCap};

public struct TETH has drop {}

fun init(witness: TETH, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        witness, 8, b"TETH", b"Test ETH", b"Equinox testnet wrapped ETH", option::none(), ctx,
    );
    transfer::public_freeze_object(metadata);
    transfer::public_transfer(treasury, ctx.sender());
}

public fun mint(cap: &mut TreasuryCap<TETH>, amount: u64, recipient: address, ctx: &mut TxContext) {
    coin::mint_and_transfer(cap, amount, recipient, ctx);
}
