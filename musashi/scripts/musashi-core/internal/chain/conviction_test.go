package chain

import (
	"bytes"
	"math/big"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// The ABI must match the deployed ConvictionLog selectors. If a signature ever
// drifts, calldata silently targets the wrong function — this locks it.
func TestLogStrikeSelector(t *testing.T) {
	data, err := convictionABI.Pack("logStrike", big.NewInt(0), common.HexToAddress("0x1"), uint64(1), uint8(4), [32]byte{})
	if err != nil {
		t.Fatalf("pack logStrike: %v", err)
	}
	want := crypto.Keccak256([]byte("logStrike(uint256,address,uint64,uint8,bytes32)"))[:4]
	if !bytes.Equal(data[:4], want) {
		t.Fatalf("logStrike selector = %x, want %x", data[:4], want)
	}
}

func TestRecordOutcomeSelector(t *testing.T) {
	data, err := convictionABI.Pack("recordOutcome", big.NewInt(0), big.NewInt(1))
	if err != nil {
		t.Fatalf("pack recordOutcome: %v", err)
	}
	want := crypto.Keccak256([]byte("recordOutcome(uint256,int128)"))[:4]
	if !bytes.Equal(data[:4], want) {
		t.Fatalf("recordOutcome selector = %x, want %x", data[:4], want)
	}
}

// The old code hand-rolled int128 two's-complement for negative returns. abi.Pack
// must encode it correctly (sign-extended) and round-trip back to the value.
func TestRecordOutcomeNegativeInt128(t *testing.T) {
	data, err := convictionABI.Pack("recordOutcome", big.NewInt(0), big.NewInt(-500))
	if err != nil {
		t.Fatalf("pack: %v", err)
	}
	if len(data) != 4+32+32 {
		t.Fatalf("calldata len = %d, want %d", len(data), 4+32+32)
	}
	// The int128 slot must be sign-extended (leading 0xff bytes) for a negative.
	slot := data[4+32:]
	if slot[0] != 0xff {
		t.Fatalf("negative int128 not sign-extended: slot starts %x", slot[:4])
	}
	// Round-trip decode.
	vals, err := convictionABI.Methods["recordOutcome"].Inputs.Unpack(data[4:])
	if err != nil {
		t.Fatalf("unpack: %v", err)
	}
	if got := vals[1].(*big.Int).Int64(); got != -500 {
		t.Fatalf("decoded returnBps = %d, want -500", got)
	}
}

// reputation() returns a signed int256 total return; decoding must handle negatives.
func TestReputationUnpackSignedReturn(t *testing.T) {
	packed, err := convictionABI.Methods["reputation"].Outputs.Pack(
		big.NewInt(2), big.NewInt(1), big.NewInt(1), big.NewInt(-500),
	)
	if err != nil {
		t.Fatalf("pack outputs: %v", err)
	}
	vals, err := convictionABI.Unpack("reputation", packed)
	if err != nil {
		t.Fatalf("unpack: %v", err)
	}
	if bigU64(vals[0]) != 2 || bigU64(vals[1]) != 1 || bigU64(vals[2]) != 1 || bigI64(vals[3]) != -500 {
		t.Fatalf("decoded (%d,%d,%d,%d), want (2,1,1,-500)", bigU64(vals[0]), bigU64(vals[1]), bigU64(vals[2]), bigI64(vals[3]))
	}
}

// decodeStrike must parse the 256-byte tuple, including a negative int128 outcome.
func TestDecodeStrike(t *testing.T) {
	tok := common.HexToAddress("0x00000000000000000000000000000000000000aa")
	ev := crypto.Keccak256([]byte("evidence"))

	var buf []byte
	word := func(b []byte) {
		w := make([]byte, 32)
		copy(w[32-len(b):], b)
		buf = append(buf, w...)
	}
	word(tok.Bytes())                       // token
	word([]byte{4})                         // convergence
	word([]byte{1})                         // outcomeFilled = true
	buf = append(buf, ev...)                // evidenceHash (already 32 bytes)
	word(big.NewInt(8453).Bytes())          // chainId
	word(big.NewInt(1_700_000_000).Bytes()) // timestamp
	// outcomeBps = -500 as a sign-extended 256-bit word.
	word(new(big.Int).Sub(new(big.Int).Lsh(big.NewInt(1), 256), big.NewInt(500)).Bytes())
	word([]byte{0}) // agentId

	s, err := decodeStrike(7, buf)
	if err != nil {
		t.Fatalf("decodeStrike: %v", err)
	}
	if s.ID != 7 || s.Convergence != 4 || !s.OutcomeFilled || s.ChainID != 8453 ||
		s.Timestamp != 1_700_000_000 || s.OutcomeBps != -500 || s.AgentID != 0 {
		t.Fatalf("decoded %+v", s)
	}
	if s.Token != tok.Hex() {
		t.Fatalf("token = %s, want %s", s.Token, tok.Hex())
	}
}

func TestDecodeStrikeRejectsShort(t *testing.T) {
	if _, err := decodeStrike(0, make([]byte, 100)); err == nil {
		t.Fatal("expected error for short result")
	}
}
