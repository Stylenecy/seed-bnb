.PHONY: core test-core contracts test-contracts deploy deploy-conviction deploy-inft deploy-link upgrade skill gates discover mint-agent store-evidence status agent-info record-outcome clean all test

BSC_DEFAULT_RPC ?= https://data-seed-prebsc-1-s1.bnbchain.org:8545

core:
	cd scripts/musashi-core && go build -o musashi-core ./cmd/musashi/
	@echo "Built: scripts/musashi-core/musashi-core"

test-core:
	cd scripts/musashi-core && go test ./...

contracts:
	cd contracts && forge build

test-contracts:
	cd contracts && forge test -vvv

deploy:
	@echo "=== Deploying UUPS-upgradeable stack to BNB Chain (BSC testnet 97 by default; set BSC_RPC_URL for mainnet 56) ==="
	@echo "Runs contracts/script/deploy-and-verify.sh — deploys impl+proxy for each"
	@echo "contract, initializes, links, sets the oracle, and verifies the impls."
	@echo "Requires BSC_PRIVATE_KEY (project-root .env or contracts/.env.local); ETHERSCAN_API_KEY optional for verify."
	@echo ""
	cd contracts && ./script/deploy-and-verify.sh

# Resolve signer: prefer --account (keystore), fall back to --private-key (env var)
ifdef ACCOUNT
SIGNER_FLAG = --account $(ACCOUNT)
else ifdef USE_KEY
SIGNER_FLAG = --private-key $${BSC_PRIVATE_KEY}
else
SIGNER_FLAG = --account musashi-deployer
endif

# For a first-time deployment use `make deploy` (impl + proxy + initialize + link).
# These targets deploy a fresh IMPLEMENTATION only — used for UUPS upgrades:
# deploy a new impl here, then `make upgrade PROXY=<proxy> NEW_IMPL=<impl>`.
deploy-conviction:
	cd contracts && forge create src/ConvictionLog.sol:ConvictionLog \
		--rpc-url $${BSC_RPC_URL:-$(BSC_DEFAULT_RPC)} \
		$(SIGNER_FLAG) --legacy --broadcast

deploy-inft:
	cd contracts && forge create src/MusashiINFT.sol:MusashiINFT \
		--rpc-url $${BSC_RPC_URL:-$(BSC_DEFAULT_RPC)} \
		$(SIGNER_FLAG) --legacy --broadcast --gas-limit 3000000

# Link ConvictionLog proxy → MusashiINFT proxy (one-time, post first deploy).
deploy-link:
	@test -n "$(CONVICTION_LOG)" || (echo "Usage: make deploy-link CONVICTION_LOG=0x... INFT=0x... [ACCOUNT=name]" && exit 1)
	@test -n "$(INFT)" || (echo "Usage: make deploy-link CONVICTION_LOG=0x... INFT=0x... [ACCOUNT=name]" && exit 1)
	cast send $(CONVICTION_LOG) "setINFT(address)" $(INFT) \
		--rpc-url $${BSC_RPC_URL:-$(BSC_DEFAULT_RPC)} \
		$(SIGNER_FLAG) --legacy

# Upgrade a UUPS proxy to a freshly-deployed implementation (owner only).
#   make upgrade PROXY=0x<proxy> NEW_IMPL=0x<newImpl>
upgrade:
	@test -n "$(PROXY)" || (echo "Usage: make upgrade PROXY=0x... NEW_IMPL=0x..." && exit 1)
	@test -n "$(NEW_IMPL)" || (echo "Usage: make upgrade PROXY=0x... NEW_IMPL=0x..." && exit 1)
	cast send $(PROXY) "upgradeToAndCall(address,bytes)" $(NEW_IMPL) 0x \
		--rpc-url $${BSC_RPC_URL:-$(BSC_DEFAULT_RPC)} \
		$(SIGNER_FLAG) --legacy

skill:
	@test -f SKILL.md && echo "SKILL.md exists" || (echo "SKILL.md missing!" && exit 1)
	@head -1 SKILL.md | grep -q "^---" && echo "SKILL.md has frontmatter" || (echo "SKILL.md missing frontmatter!" && exit 1)

gates:
	@test -n "$(TOKEN)" || (echo "Usage: make gates TOKEN=0x... CHAIN=56" && exit 1)
	./scripts/gate_check.sh "$(TOKEN)" "$(or $(CHAIN),56)"

scan:
	scripts/musashi-core/musashi-core scan --chain "$(or $(CHAIN),0)" --limit "$(or $(LIMIT),10)" $(if $(GATES),--gates,)

discover:
	scripts/musashi-core/musashi-core discover --chain "$(or $(CHAIN),56)" --limit "$(or $(LIMIT),20)"

seal-intelligence:
	@test -n "$(INPUT)" || (echo "Usage: make seal-intelligence INPUT=/path/to/intelligence.tar.gz" && exit 1)
	scripts/musashi-core/musashi-core seal-intelligence --input "$(INPUT)"

# Mint a MUSASHI agent as an ERC-7857 INFT. Run `make seal-intelligence` first
# to produce STORAGE_ROOT (0G Storage merkle root; storage stays on 0G, the INFT lives on BSC) and SEALED_KEY_FILE (ECIES
# wrapped AES key), then:
#   make mint-agent STORAGE_ROOT=0x… SEALED_KEY_FILE=/tmp/foo.sealed.hex
mint-agent:
	@test -n "$(STORAGE_ROOT)" || (echo "Usage: make mint-agent STORAGE_ROOT=0x… SEALED_KEY_FILE=path [METADATA_HASH=0x…]" && exit 1)
	@test -n "$(SEALED_KEY_FILE)" || (echo "Usage: make mint-agent STORAGE_ROOT=0x… SEALED_KEY_FILE=path [METADATA_HASH=0x…]" && exit 1)
	scripts/musashi-core/musashi-core mint-agent \
		--name "$(or $(NAME),MUSASHI)" \
		--storage-root "$(STORAGE_ROOT)" \
		--metadata-hash "$(or $(METADATA_HASH),0x0000000000000000000000000000000000000000000000000000000000000000)" \
		--sealed-key-file "$(SEALED_KEY_FILE)"

update-agent:
	@test -n "$(TOKEN_ID)" || (echo "Usage: make update-agent TOKEN_ID=0 STORAGE_ROOT=0x… SEALED_KEY_FILE=path" && exit 1)
	@test -n "$(STORAGE_ROOT)" || (echo "Usage: make update-agent TOKEN_ID=0 STORAGE_ROOT=0x… SEALED_KEY_FILE=path" && exit 1)
	@test -n "$(SEALED_KEY_FILE)" || (echo "Usage: make update-agent TOKEN_ID=0 STORAGE_ROOT=0x… SEALED_KEY_FILE=path" && exit 1)
	scripts/musashi-core/musashi-core update-agent \
		--token-id "$(TOKEN_ID)" \
		--storage-root "$(STORAGE_ROOT)" \
		--sealed-key-file "$(SEALED_KEY_FILE)"

verify-strike:
	@test -n "$(STRIKE_ID)" || (echo "Usage: make verify-strike STRIKE_ID=0" && exit 1)
	scripts/musashi-core/musashi-core verify --strike-id "$(STRIKE_ID)"

store-evidence:
	@test -n "$(EVIDENCE)" || (echo "Usage: make store-evidence EVIDENCE='{...}'" && exit 1)
	scripts/musashi-core/musashi-core store "$(EVIDENCE)"

status:
	scripts/musashi-core/musashi-core status

agent-info:
	scripts/musashi-core/musashi-core agent-info --token-id "$(or $(TOKEN_ID),0)"

record-outcome:
	@test -n "$(STRIKE_ID)" || (echo "Usage: make record-outcome STRIKE_ID=0 RETURN_BPS=500" && exit 1)
	scripts/musashi-core/musashi-core record-outcome --strike-id "$(STRIKE_ID)" --return-bps "$(or $(RETURN_BPS),0)"

clean:
	rm -f scripts/musashi-core/musashi-core
	rm -rf contracts/out contracts/cache

all: core contracts skill
	@echo "All components built"

test: test-core test-contracts
	@echo "All tests passed"
