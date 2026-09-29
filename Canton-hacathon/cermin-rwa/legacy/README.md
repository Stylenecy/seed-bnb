# legacy/ — original Canton Network implementation (reference only)

Cermin-RWA was built for Canton Network (Daml). After the migration to BNB Chain
(see `../MIGRATION-BNB.md`) these files are **not used** by the running app; they
are kept because the Daml templates are the specification the Solidity port
(`../contracts/src/CerminRWA.sol`) mirrors choice-by-choice.

- `daml/` — Daml templates (Assets, Oracle, Credit, Guard, Coupon), setup/demo scripts, Daml Script tests.
- `scripts/` — Canton sandbox / CN Quickstart LocalNet / DevNet orchestration (`dev.sh`, `localnet.sh`, seeders).
- `deploy/devnet/` — Canton DevNet validator bundle helpers.
