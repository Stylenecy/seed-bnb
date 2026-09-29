/// Test BTC (8 decimals) — collateral marker priced by Pyth BTC/USD.
module testcoins::tbtc;

use sui::coin::{Self, TreasuryCap};

public struct TBTC has drop {}

fun init(witness: TBTC, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        witness, 8, b"TBTC", b"Test BTC", b"Equinox testnet wrapped BTC", option::none(), ctx,
    );
    transfer::public_freeze_object(metadata);
    transfer::public_transfer(treasury, ctx.sender());
}

public fun mint(cap: &mut TreasuryCap<TBTC>, amount: u64, recipient: address, ctx: &mut TxContext) {
    coin::mint_and_transfer(cap, amount, recipient, ctx);
}
