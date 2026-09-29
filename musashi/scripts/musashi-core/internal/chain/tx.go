package chain

// Shared BNB Chain (BSC) transaction plumbing. Every read/write path in this package
// goes through these helpers so the dial / nonce / gas / sign / send / wait flow
// lives in exactly one place (previously copy-pasted across conviction.go).

import (
	"context"
	"fmt"
	"math/big"
	"os"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

// PrivateKeyEnv is the env var holding the publisher / oracle key for BSC writes.
const PrivateKeyEnv = "BSC_PRIVATE_KEY"

// rpcURL resolves the BSC RPC endpoint (BSC_RPC_URL or the BSC testnet default).
func rpcURL() string {
	if u := os.Getenv("BSC_RPC_URL"); u != "" {
		return u
	}
	return DefaultBSCRPC
}

// ChainID returns the chain id reported by the configured BSC RPC (97 testnet,
// 56 mainnet). Used for the MusashiINFT transfer digest, which binds block.chainid.
func ChainID(ctx context.Context) (uint64, error) {
	client, err := dial()
	if err != nil {
		return 0, err
	}
	defer client.Close()
	id, err := client.ChainID(ctx)
	if err != nil {
		return 0, fmt.Errorf("get chain ID: %w", err)
	}
	return id.Uint64(), nil
}

// stripHexPrefix removes a leading 0x/0X.
func stripHexPrefix(s string) string {
	if len(s) >= 2 && (s[:2] == "0x" || s[:2] == "0X") {
		return s[2:]
	}
	return s
}

// dial opens an ethclient to the BSC RPC. Callers must Close().
func dial() (*ethclient.Client, error) {
	c, err := ethclient.Dial(rpcURL())
	if err != nil {
		return nil, fmt.Errorf("connect to BNB Chain: %w", err)
	}
	return c, nil
}

// callOn performs an eth_call (latest block) on an existing client — used by the
// history loop to reuse a single connection instead of dialing per strike.
func callOn(ctx context.Context, client *ethclient.Client, to common.Address, calldata []byte) ([]byte, error) {
	return client.CallContract(ctx, ethereum.CallMsg{To: &to, Data: calldata}, nil)
}

// callRead is a single-shot eth_call: dial, call, close.
func callRead(ctx context.Context, to common.Address, calldata []byte) ([]byte, error) {
	client, err := dial()
	if err != nil {
		return nil, err
	}
	defer client.Close()
	return callOn(ctx, client, to, calldata)
}

// sendTx signs and submits a legacy transaction carrying `calldata` to `to`,
// waits for the receipt, and returns (txHash, blockNumber). Requires
// BSC_PRIVATE_KEY. Uses legacy gas (BSC accepts legacy txs), hence types.NewEIP155Signer.
func sendTx(ctx context.Context, to common.Address, calldata []byte) (txHash string, blockNumber uint64, err error) {
	priv, _, from, err := LoadDeployerKey()
	if err != nil {
		return "", 0, err
	}

	client, err := dial()
	if err != nil {
		return "", 0, err
	}
	defer client.Close()

	nonce, err := client.PendingNonceAt(ctx, from)
	if err != nil {
		return "", 0, fmt.Errorf("get nonce: %w", err)
	}
	gasPrice, err := client.SuggestGasPrice(ctx)
	if err != nil {
		return "", 0, fmt.Errorf("get gas price: %w", err)
	}
	chainID, err := client.ChainID(ctx)
	if err != nil {
		return "", 0, fmt.Errorf("get chain ID: %w", err)
	}

	// Estimate with a 20% buffer; fall back to a value that covers dynamic-bytes calls.
	gasLimit, err := client.EstimateGas(ctx, ethereum.CallMsg{From: from, To: &to, Data: calldata})
	if err != nil {
		gasLimit = 500000
	} else {
		gasLimit = gasLimit * 120 / 100
	}

	tx := types.NewTransaction(nonce, to, big.NewInt(0), gasLimit, gasPrice, calldata)
	signedTx, err := types.SignTx(tx, types.NewEIP155Signer(chainID), priv)
	if err != nil {
		return "", 0, fmt.Errorf("sign transaction: %w", err)
	}
	if err := client.SendTransaction(ctx, signedTx); err != nil {
		return "", 0, fmt.Errorf("send transaction: %w", err)
	}
	receipt, err := bind.WaitMined(ctx, client, signedTx)
	if err != nil {
		return "", 0, fmt.Errorf("transaction not mined: %w", err)
	}
	if receipt.Status == 0 {
		return "", 0, fmt.Errorf("transaction reverted (tx: %s) — check contract state and parameters", signedTx.Hash().Hex())
	}
	return signedTx.Hash().Hex(), receipt.BlockNumber.Uint64(), nil
}

// bigU64 / bigI64 coerce abi.Unpack outputs (uint256/int256 → *big.Int) to Go ints.
func bigU64(v interface{}) uint64 {
	if b, ok := v.(*big.Int); ok {
		return b.Uint64()
	}
	return 0
}

func bigI64(v interface{}) int64 {
	if b, ok := v.(*big.Int); ok {
		return b.Int64()
	}
	return 0
}
