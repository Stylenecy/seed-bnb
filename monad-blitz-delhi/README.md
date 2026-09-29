# BNB Chain Hackathon Submission Process

1. Fork the hackathon submission repo provided by the organizers (TODO: add the link).

2. Give the fork your project name and a one-line description, make sure you are forking the `main` branch, then click `Create Fork`.

3. In your fork you can change anything you want: add your project's code, create branches, update `README.md`, and so on.

## Building on BNB Chain

| Network | Chain ID | RPC | Explorer |
|---|---|---|---|
| BSC Testnet | 97 | https://data-seed-prebsc-1-s1.bnbchain.org:8545 | https://testnet.bscscan.com |
| BSC Mainnet | 56 | https://bsc-dataseed.bnbchain.org | https://bscscan.com |

- Gas token: BNB (18 decimals). Get testnet BNB from https://www.bnbchain.org/en/testnet-faucet
- viem / wagmi: `import { bsc, bscTestnet } from 'viem/chains'`
- Stablecoins on BSC mainnet use **18 decimals**: USDT `0x55d398326f99059fF775485246999027B3197955`, USDC `0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d`
- Docs: https://docs.bnbchain.org
