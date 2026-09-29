package chain

import (
	"context"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// ConvictionLog ABI — only the functions the binary calls. Using the abi package
// (Pack/Unpack) eliminates the hand-rolled calldata + two's-complement encoding
// the old version carried (and which had no tests).
const convictionLogABI = `[
  {"type":"function","name":"logStrike","stateMutability":"nonpayable","inputs":[
    {"name":"_agentId","type":"uint256"},
    {"name":"_token","type":"address"},
    {"name":"_chainId","type":"uint64"},
    {"name":"_convergence","type":"uint8"},
    {"name":"_evidenceHash","type":"bytes32"}
  ],"outputs":[{"name":"id","type":"uint256"}]},

  {"type":"function","name":"recordOutcome","stateMutability":"nonpayable","inputs":[
    {"name":"_id","type":"uint256"},
    {"name":"_returnBps","type":"int128"}
  ],"outputs":[]},

  {"type":"function","name":"setINFT","stateMutability":"nonpayable","inputs":[
    {"name":"_inft","type":"address"}
  ],"outputs":[]},

  {"type":"function","name":"strikeCount","stateMutability":"view","inputs":[],
   "outputs":[{"name":"","type":"uint256"}]},

  {"type":"function","name":"reputation","stateMutability":"view","inputs":[],
   "outputs":[
    {"name":"filled","type":"uint256"},
    {"name":"w","type":"uint256"},
    {"name":"l","type":"uint256"},
    {"name":"totalReturn","type":"int256"}
  ]},

  {"type":"function","name":"agentReputation","stateMutability":"view","inputs":[
    {"name":"_agentId","type":"uint256"}
  ],"outputs":[
    {"name":"strikes","type":"uint256"},
    {"name":"filled","type":"uint256"},
    {"name":"w","type":"uint256"},
    {"name":"l","type":"uint256"},
    {"name":"totalReturn","type":"int256"}
  ]},

  {"type":"function","name":"getStrike","stateMutability":"view","inputs":[
    {"name":"_id","type":"uint256"}
  ],"outputs":[{"name":"","type":"tuple","components":[
    {"name":"token","type":"address"},
    {"name":"convergence","type":"uint8"},
    {"name":"outcomeFilled","type":"bool"},
    {"name":"evidenceHash","type":"bytes32"},
    {"name":"chainId","type":"uint64"},
    {"name":"timestamp","type":"uint48"},
    {"name":"outcomeBps","type":"int128"},
    {"name":"agentId","type":"uint256"}
  ]}]}
]`

var convictionABI = mustParseABI(convictionLogABI)

// BNB Chain defaults — BSC Testnet (97) by default. For BSC mainnet (56) set
// BSC_RPC_URL=https://bsc-dataseed.bnbchain.org and BSC_EXPLORER_URL=https://bscscan.com.
const (
	DefaultBSCRPC     = "https://data-seed-prebsc-1-s1.bnbchain.org:8545"
	BSCTestnetChainID = 97
	BSCMainnetChainID = 56
	defaultExplorer   = "https://testnet.bscscan.com"
)

// ExplorerBase returns the BscScan explorer URL, configurable via BSC_EXPLORER_URL.
func ExplorerBase() string {
	if url := os.Getenv("BSC_EXPLORER_URL"); url != "" {
		return url
	}
	return defaultExplorer
}

// convictionAddr resolves the ConvictionLog (proxy) address from env.
func convictionAddr() (common.Address, error) {
	a := os.Getenv("CONVICTION_LOG_ADDRESS")
	if a == "" {
		return common.Address{}, fmt.Errorf("CONVICTION_LOG_ADDRESS not set")
	}
	return common.HexToAddress(a), nil
}

// StrikeResult is the output after a ConvictionLog write.
type StrikeResult struct {
	TxHash          string `json:"tx_hash"`
	BlockNumber     uint64 `json:"block_number"`
	ContractAddress string `json:"contract_address"`
	StrikeID        string `json:"strike_id,omitempty"`
	AgentID         uint64 `json:"agent_id,omitempty"`
	ExplorerURL     string `json:"explorer_url"`
	Status          string `json:"status,omitempty"`
}

// PublishStrike logs a conviction STRIKE to ConvictionLog. Without a private key
// it returns an analysis_only result instead of erroring.
func PublishStrike(agentID uint64, tokenAddress string, tokenChainID int64, convergence uint8, evidenceHash string) (string, error) {
	if os.Getenv(PrivateKeyEnv) == "" {
		result := StrikeResult{Status: "analysis_only", AgentID: agentID}
		b, _ := json.MarshalIndent(result, "", "  ")
		return string(b), nil
	}

	contract, err := convictionAddr()
	if err != nil {
		return "", err
	}

	calldata, err := convictionABI.Pack(
		"logStrike",
		new(big.Int).SetUint64(agentID),
		common.HexToAddress(tokenAddress),
		uint64(tokenChainID),
		convergence,
		[32]byte(common.HexToHash(evidenceHash)),
	)
	if err != nil {
		return "", fmt.Errorf("pack logStrike: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	txHash, blockNumber, err := sendTx(ctx, contract, calldata)
	if err != nil {
		return "", err
	}

	return marshalStrikeResult(StrikeResult{
		TxHash:          txHash,
		BlockNumber:     blockNumber,
		ContractAddress: contract.Hex(),
		AgentID:         agentID,
		ExplorerURL:     fmt.Sprintf("%s/tx/%s", ExplorerBase(), txHash),
	}), nil
}

// SetINFT links the MusashiINFT contract to ConvictionLog (one-time).
func SetINFT(inftAddress string) (string, error) {
	contract, err := convictionAddr()
	if err != nil {
		return "", err
	}
	calldata, err := convictionABI.Pack("setINFT", common.HexToAddress(inftAddress))
	if err != nil {
		return "", fmt.Errorf("pack setINFT: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	txHash, blockNumber, err := sendTx(ctx, contract, calldata)
	if err != nil {
		return "", err
	}

	return marshalStrikeResult(StrikeResult{
		TxHash:          txHash,
		BlockNumber:     blockNumber,
		ContractAddress: contract.Hex(),
		ExplorerURL:     fmt.Sprintf("%s/tx/%s", ExplorerBase(), txHash),
	}), nil
}

// RecordOutcome records a STRIKE's realized return (owner only). int128 encoding
// is handled by abi.Pack from a signed *big.Int — no hand-rolled two's complement.
func RecordOutcome(strikeID uint64, returnBps int64) (string, error) {
	contract, err := convictionAddr()
	if err != nil {
		return "", err
	}
	calldata, err := convictionABI.Pack("recordOutcome", new(big.Int).SetUint64(strikeID), big.NewInt(returnBps))
	if err != nil {
		return "", fmt.Errorf("pack recordOutcome: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	txHash, blockNumber, err := sendTx(ctx, contract, calldata)
	if err != nil {
		return "", err
	}

	return marshalStrikeResult(StrikeResult{
		TxHash:          txHash,
		BlockNumber:     blockNumber,
		ContractAddress: contract.Hex(),
		ExplorerURL:     fmt.Sprintf("%s/tx/%s", ExplorerBase(), txHash),
	}), nil
}

func marshalStrikeResult(r StrikeResult) string {
	b, _ := json.MarshalIndent(r, "", "  ")
	return string(b)
}

// ReputationResult holds global on-chain reputation.
type ReputationResult struct {
	StrikeCount    uint64 `json:"strike_count"`
	TotalFilled    uint64 `json:"total_filled"`
	Wins           uint64 `json:"wins"`
	Losses         uint64 `json:"losses"`
	TotalReturnBps int64  `json:"total_return_bps"`
	ContractAddr   string `json:"contract_address"`
	ExplorerURL    string `json:"explorer_url"`
}

// QueryReputation reads strikeCount() + reputation() from ConvictionLog.
func QueryReputation() (string, error) {
	contract, err := convictionAddr()
	if err != nil {
		return "", err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	scData, _ := convictionABI.Pack("strikeCount")
	scRes, err := callRead(ctx, contract, scData)
	if err != nil {
		return "", fmt.Errorf("strikeCount() call failed: %w", err)
	}
	strikeCount := new(big.Int).SetBytes(scRes).Uint64()

	repData, _ := convictionABI.Pack("reputation")
	repRes, err := callRead(ctx, contract, repData)
	if err != nil {
		return "", fmt.Errorf("reputation() call failed: %w", err)
	}
	vals, err := convictionABI.Unpack("reputation", repRes)
	if err != nil || len(vals) < 4 {
		return "", fmt.Errorf("unpack reputation: %w", err)
	}

	result := ReputationResult{
		StrikeCount:    strikeCount,
		TotalFilled:    bigU64(vals[0]),
		Wins:           bigU64(vals[1]),
		Losses:         bigU64(vals[2]),
		TotalReturnBps: bigI64(vals[3]),
		ContractAddr:   contract.Hex(),
		ExplorerURL:    fmt.Sprintf("%s/address/%s", ExplorerBase(), contract.Hex()),
	}
	b, _ := json.MarshalIndent(result, "", "  ")
	return string(b), nil
}

// AgentReputationResult holds per-agent on-chain reputation.
type AgentReputationResult struct {
	AgentID        uint64 `json:"agent_id"`
	Strikes        uint64 `json:"strikes"`
	TotalFilled    uint64 `json:"total_filled"`
	Wins           uint64 `json:"wins"`
	Losses         uint64 `json:"losses"`
	TotalReturnBps int64  `json:"total_return_bps"`
	ContractAddr   string `json:"contract_address"`
	ExplorerURL    string `json:"explorer_url"`
}

// QueryAgentReputation reads per-agent reputation from ConvictionLog.
func QueryAgentReputation(agentID uint64) (string, error) {
	contract, err := convictionAddr()
	if err != nil {
		return "", err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	data, _ := convictionABI.Pack("agentReputation", new(big.Int).SetUint64(agentID))
	res, err := callRead(ctx, contract, data)
	if err != nil {
		return "", fmt.Errorf("agentReputation() call failed: %w", err)
	}
	vals, err := convictionABI.Unpack("agentReputation", res)
	if err != nil || len(vals) < 5 {
		return "", fmt.Errorf("unpack agentReputation: %w", err)
	}

	result := AgentReputationResult{
		AgentID:        agentID,
		Strikes:        bigU64(vals[0]),
		TotalFilled:    bigU64(vals[1]),
		Wins:           bigU64(vals[2]),
		Losses:         bigU64(vals[3]),
		TotalReturnBps: bigI64(vals[4]),
		ContractAddr:   contract.Hex(),
		ExplorerURL:    fmt.Sprintf("%s/address/%s", ExplorerBase(), contract.Hex()),
	}
	b, _ := json.MarshalIndent(result, "", "  ")
	return string(b), nil
}

// StrikeData holds a single on-chain strike record.
type StrikeData struct {
	ID            uint64 `json:"id"`
	Token         string `json:"token"`
	Convergence   uint8  `json:"convergence"`
	OutcomeFilled bool   `json:"outcome_filled"`
	EvidenceHash  string `json:"evidence_hash"`
	ChainID       uint64 `json:"chain_id"`
	Timestamp     uint64 `json:"timestamp"`
	OutcomeBps    int64  `json:"outcome_bps"`
	AgentID       uint64 `json:"agent_id"`
}

// HistoryResult holds strike history + reputation context.
type HistoryResult struct {
	Strikes    []StrikeData          `json:"strikes"`
	Reputation AgentReputationResult `json:"reputation"`
}

// QueryStrike reads a single strike by ID.
func QueryStrike(id uint64) (*StrikeData, error) {
	contract, err := convictionAddr()
	if err != nil {
		return nil, err
	}
	client, err := dial()
	if err != nil {
		return nil, err
	}
	defer client.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	return queryStrikeOn(ctx, client, contract, id)
}

// queryStrikeOn decodes one strike using an existing client, so QueryHistory can
// reuse a single connection across the whole scan (no dial-per-strike).
func queryStrikeOn(ctx context.Context, client *ethclient.Client, contract common.Address, id uint64) (*StrikeData, error) {
	data, _ := convictionABI.Pack("getStrike", new(big.Int).SetUint64(id))
	result, err := callOn(ctx, client, contract, data)
	if err != nil {
		return nil, fmt.Errorf("getStrike(%d) call failed: %w", id, err)
	}
	return decodeStrike(id, result)
}

// decodeStrike decodes the ABI-encoded Strike tuple (8 fields, 32 bytes each).
// Pure (no network) so it can be unit-tested against constructed vectors.
func decodeStrike(id uint64, result []byte) (*StrikeData, error) {
	if len(result) < 256 {
		return nil, fmt.Errorf("getStrike(%d) returned %d bytes, expected 256", id, len(result))
	}

	outcomeBpsVal := new(big.Int).SetBytes(result[192:224])
	if outcomeBpsVal.Bit(255) == 1 { // negative int128 → two's complement
		outcomeBpsVal.Sub(outcomeBpsVal, new(big.Int).Lsh(big.NewInt(1), 256))
	}

	return &StrikeData{
		ID:            id,
		Token:         common.BytesToAddress(result[0:32]).Hex(),
		Convergence:   uint8(new(big.Int).SetBytes(result[32:64]).Uint64()),
		OutcomeFilled: new(big.Int).SetBytes(result[64:96]).Uint64() != 0,
		EvidenceHash:  common.BytesToHash(result[96:128]).Hex(),
		ChainID:       new(big.Int).SetBytes(result[128:160]).Uint64(),
		Timestamp:     new(big.Int).SetBytes(result[160:192]).Uint64(),
		OutcomeBps:    outcomeBpsVal.Int64(),
		AgentID:       new(big.Int).SetBytes(result[224:256]).Uint64(),
	}, nil
}

// QueryHistory reads up to `limit` strikes for an agent (newest first) plus the
// agent's reputation. Reuses a single connection and keeps scanning older
// strikes until `limit` matching ones are collected (or the log is exhausted).
func QueryHistory(agentID uint64, limit int) (string, error) {
	contract, err := convictionAddr()
	if err != nil {
		return "", err
	}
	client, err := dial()
	if err != nil {
		return "", err
	}
	defer client.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	scData, _ := convictionABI.Pack("strikeCount")
	scRes, err := callOn(ctx, client, contract, scData)
	if err != nil {
		return "", fmt.Errorf("strikeCount() call failed: %w", err)
	}
	total := new(big.Int).SetBytes(scRes).Uint64()

	var strikes []StrikeData
	for i := int64(total) - 1; i >= 0 && len(strikes) < limit; i-- {
		s, err := queryStrikeOn(ctx, client, contract, uint64(i))
		if err != nil {
			continue // skip individual failures
		}
		if s.AgentID == agentID {
			strikes = append(strikes, *s)
		}
	}

	repJSON, err := QueryAgentReputation(agentID)
	if err != nil {
		return "", fmt.Errorf("agent reputation query failed: %w", err)
	}
	var rep AgentReputationResult
	_ = json.Unmarshal([]byte(repJSON), &rep)

	b, _ := json.MarshalIndent(HistoryResult{Strikes: strikes, Reputation: rep}, "", "  ")
	return string(b), nil
}
