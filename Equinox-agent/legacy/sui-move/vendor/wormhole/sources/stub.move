/// Linkage-only stub. No real Wormhole code — equinox never calls Wormhole; this
/// module just gives the package a module so it can carry the `published-at` id.
module wormhole::stub;

public fun linkage_only() {}
