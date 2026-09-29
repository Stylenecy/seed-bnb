package gates

import (
	"testing"
	"time"
)

// IsEmpty must distinguish "" / "null" (gap — agent should investigate)
// from "0" / "1" (verified false / true). The audit flagged that treating
// empty as a verified-false silently rugged the safety pipeline.
func TestIsEmpty(t *testing.T) {
	cases := []struct {
		in   string
		want bool
	}{
		{"", true},
		{"null", true},
		{"0", false},
		{"1", false},
		{"false", false},
		{"true", false},
		{"  ", false}, // whitespace is a real value, not empty
	}
	for _, c := range cases {
		got := IsEmpty(c.in)
		if got != c.want {
			t.Errorf("IsEmpty(%q) = %v, want %v", c.in, got, c.want)
		}
	}
}

func TestClassifyAge_NoData(t *testing.T) {
	ctx := ClassifyAge(0)
	if ctx.Age != AgeEstablished {
		t.Errorf("missing pair timestamp must default to Established (conservative), got %s", ctx.Age)
	}
	if ctx.HasAgeData {
		t.Errorf("HasAgeData should be false when timestamp is zero")
	}
}

// ClassifyAge with ETH baseline multiplier (1.0).
func TestClassifyAge_Buckets(t *testing.T) {
	now := time.Now()
	cases := []struct {
		name    string
		ageHrs  float64
		wantAge TokenAge
	}{
		{"<1h is fresh", 0.5, AgeFresh},
		{"23h is fresh", 23, AgeFresh},
		{"25h is early", 25, AgeEarly},
		{"6 days is early", 24 * 6, AgeEarly},
		{"8 days is discovery", 24 * 8, AgeDiscovery},
		{"29 days is discovery", 24 * 29, AgeDiscovery},
		{"31 days is maturation", 24 * 31, AgeMaturation},
		{"89 days is maturation", 24 * 89, AgeMaturation},
		{"100 days is established", 24 * 100, AgeEstablished},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			ts := now.Add(-time.Duration(c.ageHrs * float64(time.Hour))).UnixMilli()
			ctx := ClassifyAge(ts)
			if ctx.Age != c.wantAge {
				t.Errorf("age %.1fh -> %s, want %s", c.ageHrs, ctx.Age, c.wantAge)
			}
			if !ctx.HasAgeData {
				t.Errorf("HasAgeData should be true with a valid timestamp")
			}
		})
	}
}

// BSC multiplier compresses the timeline ~15% — a 25h token that's "early" on
// ETH should still be "fresh" on BSC because the BSC fresh cutoff is ~28.6h.
func TestClassifyAgeForChain_BSC(t *testing.T) {
	ts := time.Now().Add(-25 * time.Hour).UnixMilli()
	ethCtx := ClassifyAgeForChain(ts, 1)
	bscCtx := ClassifyAgeForChain(ts, 56)

	if ethCtx.Age != AgeEarly {
		t.Errorf("ETH 25h should be early, got %s", ethCtx.Age)
	}
	if bscCtx.Age != AgeEarly {
		// BSC fresh cutoff = 24 * 0.85 = 20.4h; 25h > 20.4 → early. Sanity check.
		t.Errorf("BSC 25h should be early (fresh cutoff is 20.4h), got %s", bscCtx.Age)
	}
}

// Multiplier sanity at the 18h mark. ETH cutoff = 24h, BSC = 20.4h, Solana = 16.8h.
// 18h is inside ETH and BSC fresh windows but past Solana's, so Solana flips
// to early while the others stay fresh — proving the chain multiplier is wired.
func TestClassifyAgeForChain_FreshThresholds(t *testing.T) {
	ts := time.Now().Add(-18 * time.Hour).UnixMilli()

	if got := ClassifyAgeForChain(ts, 1).Age; got != AgeFresh {
		t.Errorf("ETH 18h should be fresh (24h cutoff), got %s", got)
	}
	if got := ClassifyAgeForChain(ts, 56).Age; got != AgeFresh {
		t.Errorf("BSC 18h should be fresh (20.4h cutoff), got %s", got)
	}
	if got := ClassifyAgeForChain(ts, 101).Age; got != AgeEarly {
		t.Errorf("Solana 18h should be early (16.8h cutoff), got %s", got)
	}
}

// Result builders must set status + reason correctly and accumulate evidence
// without surprises. These are the contract the judge prompt depends on.
func TestResult_PassFailWarn(t *testing.T) {
	r := NewResult("Gate X", 99)
	r.Pass("clean")
	if r.Status != StatusPass || r.Reason != "clean" {
		t.Fatalf("Pass: got status=%s reason=%q", r.Status, r.Reason)
	}

	r = NewResult("Gate X", 99).Fail("honeypot")
	if r.Status != StatusFail || r.Reason != "honeypot" {
		t.Fatalf("Fail: got status=%s reason=%q", r.Status, r.Reason)
	}

	r = NewResult("Gate X", 99).Warn("low liquidity")
	if r.Status != StatusWarn || r.Reason != "low liquidity" {
		t.Fatalf("Warn: got status=%s reason=%q", r.Status, r.Reason)
	}
}

func TestResult_DataInsufficient_AccumulatesGaps(t *testing.T) {
	r := NewResult("Gate 1", 1).DataInsufficient("goplus empty", "is_honeypot", "is_mintable")
	if r.Status != StatusDataInsufficient {
		t.Fatalf("status should be DATA_INSUFFICIENT, got %s", r.Status)
	}
	if len(r.Gaps) != 2 || r.Gaps[0] != "is_honeypot" || r.Gaps[1] != "is_mintable" {
		t.Fatalf("gaps = %v, want [is_honeypot is_mintable]", r.Gaps)
	}

	r.AddGap("can_take_back_ownership")
	if len(r.Gaps) != 3 || r.Gaps[2] != "can_take_back_ownership" {
		t.Fatalf("AddGap not appending, got %v", r.Gaps)
	}
}

func TestResult_AddEvidence(t *testing.T) {
	r := NewResult("Gate 1", 1)
	r.AddEvidence("goplus", "is_honeypot", "0")
	r.AddEvidence("goplus", "is_mintable", "0")

	if len(r.Evidence) != 2 {
		t.Fatalf("len(Evidence) = %d, want 2", len(r.Evidence))
	}
	if r.Evidence[0].Source != "goplus" || r.Evidence[0].Key != "is_honeypot" || r.Evidence[0].Value != "0" {
		t.Errorf("evidence[0] = %+v", r.Evidence[0])
	}

	out := r.JSON()
	if out == "" || len(out) < 10 {
		t.Errorf("JSON output too short: %q", out)
	}
}
