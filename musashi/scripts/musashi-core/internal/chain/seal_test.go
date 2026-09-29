package chain

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// Seal → ECIES-unwrap key → GCM-decrypt must round-trip to the original bytes.
func TestSealUnsealRoundtrip(t *testing.T) {
	priv, err := crypto.GenerateKey()
	if err != nil {
		t.Fatalf("GenerateKey: %v", err)
	}

	dir := t.TempDir()
	in := filepath.Join(dir, "intel.txt")
	out := filepath.Join(dir, "intel.enc")
	plaintext := []byte("MUSASHI intelligence bundle — prompts + config + weights")
	if err := os.WriteFile(in, plaintext, 0o600); err != nil {
		t.Fatalf("write input: %v", err)
	}

	bundle, err := SealBundle(in, out, &priv.PublicKey)
	if err != nil {
		t.Fatalf("SealBundle: %v", err)
	}

	recovered, err := UnsealKey(bundle.SealedKey, priv)
	if err != nil {
		t.Fatalf("UnsealKey: %v", err)
	}
	if !bytes.Equal(recovered, bundle.AESKey) {
		t.Fatalf("unsealed AES key does not match the key used to encrypt")
	}

	got, err := DecryptBundle(out, recovered)
	if err != nil {
		t.Fatalf("DecryptBundle: %v", err)
	}
	if !bytes.Equal(got, plaintext) {
		t.Fatalf("roundtrip mismatch:\n got: %q\nwant: %q", got, plaintext)
	}
}

// AES-256-GCM must reject a tampered ciphertext (this is the integrity property
// AES-CTR lacked — C6). A flipped byte should fail the auth-tag check.
func TestDecryptBundleDetectsTampering(t *testing.T) {
	priv, err := crypto.GenerateKey()
	if err != nil {
		t.Fatalf("GenerateKey: %v", err)
	}

	dir := t.TempDir()
	in := filepath.Join(dir, "intel.txt")
	out := filepath.Join(dir, "intel.enc")
	if err := os.WriteFile(in, []byte("sensitive intelligence"), 0o600); err != nil {
		t.Fatalf("write input: %v", err)
	}

	bundle, err := SealBundle(in, out, &priv.PublicKey)
	if err != nil {
		t.Fatalf("SealBundle: %v", err)
	}

	raw, err := os.ReadFile(out)
	if err != nil {
		t.Fatalf("read ciphertext: %v", err)
	}
	if len(raw) <= 13 { // 12-byte nonce + at least 1 ciphertext byte
		t.Fatalf("ciphertext too short to tamper: %d bytes", len(raw))
	}
	raw[len(raw)-1] ^= 0xFF // corrupt the last byte (within tag/ciphertext)
	if err := os.WriteFile(out, raw, 0o600); err != nil {
		t.Fatalf("write tampered: %v", err)
	}

	if _, err := DecryptBundle(out, bundle.AESKey); err == nil {
		t.Fatalf("expected GCM auth failure on tampered ciphertext, got nil error")
	}
}

// The oracle signature must recover to the signer when verified the way the
// MusashiINFT contract does (EIP-191 prefixed digest over the same fields), and v
// must be normalized to {27,28} for Solidity ECDSA.recover.
func TestSignTransferDigestRecovers(t *testing.T) {
	priv, err := crypto.GenerateKey()
	if err != nil {
		t.Fatalf("GenerateKey: %v", err)
	}
	want := crypto.PubkeyToAddress(priv.PublicKey)

	contract := common.HexToAddress("0x000000000000000000000000000000000000ce11")
	to := common.HexToAddress("0x00000000000000000000000000000000000000aa")
	var oldRoot, newRoot [32]byte
	copy(oldRoot[:], crypto.Keccak256([]byte("old")))
	copy(newRoot[:], crypto.Keccak256([]byte("new")))
	const version uint16 = 1

	sig, err := SignTransferDigest(priv, BSCTestnetChainID, contract, 0, version, oldRoot, newRoot, to)
	if err != nil {
		t.Fatalf("SignTransferDigest: %v", err)
	}
	if len(sig) != 65 {
		t.Fatalf("sig length = %d, want 65", len(sig))
	}
	if sig[64] != 27 && sig[64] != 28 {
		t.Fatalf("v = %d, want 27 or 28", sig[64])
	}

	// Rebuild the prefixed digest exactly as SignTransferDigest / the contract do.
	buf := make([]byte, 0, 32*7)
	buf = append(buf, leftPad(bigFromUint64(BSCTestnetChainID).Bytes(), 32)...)
	buf = append(buf, leftPad(contract.Bytes(), 32)...)
	buf = append(buf, leftPad(bigFromUint64(0).Bytes(), 32)...)
	buf = append(buf, leftPad([]byte{byte(version >> 8), byte(version)}, 32)...)
	buf = append(buf, oldRoot[:]...)
	buf = append(buf, newRoot[:]...)
	buf = append(buf, leftPad(to.Bytes(), 32)...)
	prefixed := crypto.Keccak256([]byte("\x19Ethereum Signed Message:\n32"), crypto.Keccak256(buf))

	rec := make([]byte, 65)
	copy(rec, sig)
	rec[64] -= 27 // SigToPub wants v in {0,1}
	pub, err := crypto.SigToPub(prefixed, rec)
	if err != nil {
		t.Fatalf("SigToPub: %v", err)
	}
	if got := crypto.PubkeyToAddress(*pub); got != want {
		t.Fatalf("recovered %s, want signer %s", got.Hex(), want.Hex())
	}
}
