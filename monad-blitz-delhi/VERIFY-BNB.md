# VERIFY-BNB: monad-blitz-delhi

Docs only (README). **PASS:** all chain facts were checked live on 2026-09-25. Chain ids 97/56 match both RPCs (`cast chain-id`). USDT `0x55d3…7955` and USDC `0x8AC7…580d` are 18 decimals on BSC mainnet. `viem/chains` exports `bsc` and `bscTestnet`. The faucet and docs URLs return 200. BscScan returns 403 to curl because of bot protection, which is fine in a browser. Nothing to build or deploy. The only open item is the organizer fork link, still marked TODO in step 1.
