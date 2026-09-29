package pipeline

import (
	"encoding/json"

	"github.com/yeheskieltame/musashi/scripts/musashi-core/internal/data"
)

// searchResult is the public shape returned by token search (address + chain
// resolution). Shared by the CLI `search` command and the HTTP daemon so both
// emit byte-identical output.
type searchResult struct {
	Address   string  `json:"address"`
	Name      string  `json:"name"`
	Symbol    string  `json:"symbol"`
	Chain     string  `json:"chain"`
	PriceUsd  string  `json:"price_usd"`
	Liquidity float64 `json:"liquidity_usd"`
	Volume24h float64 `json:"volume_24h"`
	FDV       float64 `json:"fdv"`
	PairURL   string  `json:"pair_url"`
}

// SearchTokensJSON resolves a name/ticker to candidate tokens via DexScreener,
// de-duplicates by (address, chain), caps to `limit`, and returns a JSON string.
// Empty results return a stable {"results": [], ...} object (preserved from the
// original CLI behavior so existing consumers don't break).
func SearchTokensJSON(query string, limit int) (string, error) {
	if limit < 1 {
		limit = 1
	}
	dex := data.NewDexScreenerClient()
	result, err := dex.SearchTokens(query)
	if err != nil {
		return "", err
	}
	if result == nil || len(result.Pairs) == 0 {
		return `{"results": [], "message": "no tokens found"}`, nil
	}

	seen := make(map[string]bool)
	var results []searchResult
	for _, p := range result.Pairs {
		key := p.BaseToken.Address + p.ChainID
		if seen[key] {
			continue
		}
		seen[key] = true
		results = append(results, searchResult{
			Address:   p.BaseToken.Address,
			Name:      p.BaseToken.Name,
			Symbol:    p.BaseToken.Symbol,
			Chain:     p.ChainID,
			PriceUsd:  p.PriceUsd,
			Liquidity: p.Liquidity.Usd,
			Volume24h: p.Volume.H24,
			FDV:       p.FDV,
			PairURL:   p.URL,
		})
		if len(results) >= limit {
			break
		}
	}

	b, _ := json.MarshalIndent(results, "", "  ")
	return string(b), nil
}
