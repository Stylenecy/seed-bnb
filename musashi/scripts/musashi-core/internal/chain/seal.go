package chain

// Sealing primitives for ERC-7857 intelligence payloads.
//
// Concept: the MUSASHI agent's "intelligence" (prompts, config, weights
// bundle) is sensitive. Per ERC-7857 it must be stored encrypted so only the
// current INFT owner can read it. This file provides:
//
//   - SealBundle:   AES-256-GCM encrypts a file (authenticated), ECIES-wraps the
//                   AES key to the recipient's secp256k1 pubkey. Returns ciphertext + sealed key.
//   - UnsealKey:    Reverses the ECIES wrap given a private key.
//   - SignDigest:   Produces an ECDSA signature matching
//                   MusashiINFT.transferDigest().toEthSignedMessageHash().
//
// For the hackathon the oracle is just the deployer's own key: the Go binary
// reads BSC_PRIVATE_KEY, derives the pubkey, and signs attestations.
// In production this logic would run inside a TEE (or be replaced by a ZKP).

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdsa"
	"crypto/rand"
	"fmt"
	"io"
	"math/big"
	"os"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/crypto/ecies"
)

func leftPad(b []byte, n int) []byte { return common.LeftPadBytes(b, n) }

func bigFromUint64(v uint64) *big.Int { return new(big.Int).SetUint64(v) }

// SealedBundle is the output of SealBundle — a pair of artifacts produced in
// lock-step: the encrypted file (ready to upload to 0G Storage) and the sealed
// symmetric key (destined for MusashiINFT.sealedKey).
type SealedBundle struct {
	CiphertextPath string // path to AES-256-GCM ciphertext (12-byte nonce prefix || ciphertext||tag)
	SealedKey      []byte // ECIES-wrapped AES key for the recipient pubkey
	AESKey         []byte // plaintext AES key — only returned for debugging/verification
}

// SealBundle reads `inputPath`, generates a random AES-256 key, encrypts the
// file to `outputPath` using AES-256-GCM (authenticated) with a random nonce
// prefixed to the ciphertext, and ECIES-wraps the AES key to `recipientPub`.
func SealBundle(inputPath, outputPath string, recipientPub *ecdsa.PublicKey) (*SealedBundle, error) {
	plaintext, err := os.ReadFile(inputPath)
	if err != nil {
		return nil, fmt.Errorf("read plaintext: %w", err)
	}

	aesKey := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, aesKey); err != nil {
		return nil, fmt.Errorf("generate AES key: %w", err)
	}

	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return nil, fmt.Errorf("aes cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("aes-gcm: %w", err)
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, fmt.Errorf("generate nonce: %w", err)
	}

	// AES-256-GCM (authenticated). File layout: 12-byte nonce || ciphertext||tag.
	// GCM provides integrity — a tampered blob fails to decrypt instead of
	// silently producing garbage (the failure mode of the previous AES-CTR).
	sealedCT := gcm.Seal(nil, nonce, plaintext, nil)
	out := make([]byte, 0, len(nonce)+len(sealedCT))
	out = append(out, nonce...)
	out = append(out, sealedCT...)
	if err := os.WriteFile(outputPath, out, 0600); err != nil {
		return nil, fmt.Errorf("write ciphertext: %w", err)
	}

	eciesPub := ecies.ImportECDSAPublic(recipientPub)
	sealed, err := ecies.Encrypt(rand.Reader, eciesPub, aesKey, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("ecies encrypt aes key: %w", err)
	}

	return &SealedBundle{
		CiphertextPath: outputPath,
		SealedKey:      sealed,
		AESKey:         aesKey,
	}, nil
}

// UnsealKey recovers the AES-256 key from a sealed payload using the owner's
// secp256k1 private key. Kept for symmetry (used by `verify`).
func UnsealKey(sealed []byte, priv *ecdsa.PrivateKey) ([]byte, error) {
	eciesPriv := ecies.ImportECDSA(priv)
	return eciesPriv.Decrypt(sealed, nil, nil)
}

// DecryptBundle reverses SealBundle: reads IV||ciphertext, decrypts with the
// provided AES key.
func DecryptBundle(ciphertextPath string, aesKey []byte) ([]byte, error) {
	buf, err := os.ReadFile(ciphertextPath)
	if err != nil {
		return nil, fmt.Errorf("read ciphertext: %w", err)
	}
	block, err := aes.NewCipher(aesKey)
	if err != nil {
		return nil, fmt.Errorf("aes cipher: %w", err)
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("aes-gcm: %w", err)
	}
	ns := gcm.NonceSize()
	if len(buf) < ns {
		return nil, fmt.Errorf("ciphertext too short")
	}
	nonce, ct := buf[:ns], buf[ns:]
	pt, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return nil, fmt.Errorf("decrypt failed (auth tag mismatch — tampered ciphertext or wrong key): %w", err)
	}
	return pt, nil
}

// LoadDeployerKey returns the private key + public key pair derived from
// BSC_PRIVATE_KEY. Used both as deployer wallet and (for the hackathon)
// as the trusted re-encryption oracle.
func LoadDeployerKey() (*ecdsa.PrivateKey, *ecdsa.PublicKey, common.Address, error) {
	hexKey := os.Getenv(PrivateKeyEnv)
	if hexKey == "" {
		return nil, nil, common.Address{}, fmt.Errorf("%s not set", PrivateKeyEnv)
	}
	priv, err := crypto.HexToECDSA(stripHexPrefix(hexKey))
	if err != nil {
		return nil, nil, common.Address{}, fmt.Errorf("invalid private key: %w", err)
	}
	pub, ok := priv.Public().(*ecdsa.PublicKey)
	if !ok {
		return nil, nil, common.Address{}, fmt.Errorf("error casting public key")
	}
	return priv, pub, crypto.PubkeyToAddress(*pub), nil
}

// SignTransferDigest produces an ECDSA signature over the
// MusashiINFT.transferDigest() EIP-191 hash. This is what the on-chain oracle
// check expects: the contract calls ECDSA.recover on the resulting signature.
func SignTransferDigest(
	priv *ecdsa.PrivateKey,
	chainID uint64,
	contract common.Address,
	tokenID uint64,
	version uint16,
	oldRoot, newRoot [32]byte,
	to common.Address,
) ([]byte, error) {
	// abi.encode(uint256 chainid, address contract, uint256 tokenId, uint16 version, bytes32 old, bytes32 new, address to)
	// Note: tokenId is uint256 (pad), version is uint16 (pad), addresses are 20 bytes in a 32-byte slot.
	buf := make([]byte, 0, 32*7)
	buf = append(buf, leftPad(bigFromUint64(chainID).Bytes(), 32)...)
	buf = append(buf, leftPad(contract.Bytes(), 32)...)
	buf = append(buf, leftPad(bigFromUint64(tokenID).Bytes(), 32)...)
	buf = append(buf, leftPad([]byte{byte(version >> 8), byte(version)}, 32)...)
	buf = append(buf, oldRoot[:]...)
	buf = append(buf, newRoot[:]...)
	buf = append(buf, leftPad(to.Bytes(), 32)...)

	digest := crypto.Keccak256(buf)

	// EIP-191 prefix to match MessageHashUtils.toEthSignedMessageHash()
	prefixed := crypto.Keccak256(
		[]byte("\x19Ethereum Signed Message:\n32"),
		digest,
	)

	sig, err := crypto.Sign(prefixed, priv)
	if err != nil {
		return nil, fmt.Errorf("sign: %w", err)
	}
	// go-ethereum returns v in {0,1}; Solidity ECDSA.recover wants {27,28}
	if sig[64] < 27 {
		sig[64] += 27
	}
	return sig, nil
}
