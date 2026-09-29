# Audio & Voiceover Plan

~3-minute demo video. **English voiceover, optional English captions** (PLAN.md §10
decision flipped — see [[demo-video-voiceover-language]]).
Total runtime: **186s · 5580 frames @ 30fps · 14 scenes**. (Problem and Advantages extended for narration room; prize pool scaled to demo-impressive 100,000 0G.)

> The Indonesian voiceover script kept below for reference only — the production
> audio is English, generated via Fish Audio S1. See **`AUDIO_PROMPTS.md`** for
> the ready-to-copy English prompts (formatted with Fish audio tags). Captions
> become optional / for accessibility only since speech and caption language now
> match.

---

## 1. Voiceover script (Bahasa Indonesia)

Per scene, with frame range. Target pace: ~3 kata/detik (conversational, jelas). Naskah ini sudah dikalibrasi supaya muat di durasi scene + ada jeda untuk napas/visual breathing.

### Scene 01 · Hook · 0–8s (f 0–240)
> Setiap hari di linimasa, agen AI trading pamer ROI ratusan persen.
> Win-rate sembilan puluh, dua belas kali lipat dalam sebulan.
> Tidak satu pun yang bisa diverifikasi.

*(Voice mulai di ~f30, biar tweet collage punya satu detik untuk berdiri sendiri. Beat terakhir mendarat tepat di "UNVERIFIED" stamp di f195.)*

### Scene 02 · Problem · 8–19s (f 240–570) — *extended to 11s*
> Tiga masalah klasik yang selalu sama.
> Strategi yang di-open-source-kan pasti dicuri kompetitor dalam semalam.
> Backtest terlalu mudah di-cherry-pick — screenshot dua ratus persen tanpa dataset publik, tanpa run log, tanpa cara verifikasi.
> Dan track record live? Selalu di server pribadi. Tidak ada catatan publik yang append-only.

### Scene 03 · SolutionIntro · 19–29s (f 570–870)
> Inilah Zero Arena.
> Arena on-chain untuk agen AI trading.
> Backtest menentukan kamu layak masuk. Season membuktikan kamu benar-benar menang.

### Scene 04 · Architecture · 29–42s (f 870–1260)
> Alurnya lima tahap.
> Tulis agent di laptop kamu — strategi tetap pribadi.
> Backtest deterministik menghasilkan runHash, ter-anchor di 0G Galileo.
> Mint sebagai iNFT lewat ERC-7857.
> Paper daemon menjalankan agent di candle Binance asli — setiap epoch hash-chained on-chain.

### Scene 05 · Install · 42–52s (f 1260–1560)
> Mulai dari satu perintah.
> `npx zeroarena init`. Pilih strategi, jawab beberapa pertanyaan, agent siap.

### Scene 06 · Backtest · 52–66s (f 1560–1980)
> Backtest dijalankan.
> Dataset yang sama, agent yang sama, hash yang sama.
> Itu kunci T2 — owner berbagi agent terenkripsi dan kunci AES, verifier menjalankan ulang, hash wajib cocok.

### Scene 07 · CertifyMint · 66–84s (f 1980–2520)
> Hasil di-certify ke AgentCertificate.
> Lalu mint jadi iNFT.
> Setiap transaksi muncul di Chainscan Galileo — event log dan owner, semuanya publik.
> iNFT inilah identitas permanen agen kamu. Strategi tetap pribadi, hash tetap publik.

### Scene 08 · Frontend · 84–104s (f 2520–3120)
> Di dashboard, semua agent terdaftar terlihat.
> Sort berdasarkan ROI, Sharpe, atau win-rate.
> Klik agent untuk detail lengkap — sertifikat, dataset, owner, semua dibaca langsung dari chain.
> Tidak ada izin yang diminta. Tidak ada decryption. Yang kamu lihat, semuanya publik.

### Scene 09 · Enroll · 104–119s (f 3120–3570)
> Untuk bersaing, enrol ke season aktif. Kali ini Perp Mayhem — leverage sampai sepuluh kali.
> Prize pool seratus ribu 0G menanti pemenang.
> Satu transaksi on-chain, agent kamu masuk leaderboard.
> Paper daemon akan mengeksekusi strategi setiap epoch — entah di server kamu, atau didelegasikan ke Zero Arena.

### Scene 10 · ArenaLive · 119–144s (f 3570–4320)
> Season berjalan. Perp candle BTC, leverage maksimal.
> Setiap epoch, setiap commit, tercatat di LiveCertificate.
> Hash chain memastikan tidak ada epoch yang bisa dipalsukan.
> Leaderboard re-order live — yang pump ke +147%, yang rungkad ke minus 68. Semuanya kelihatan.
> Tidak ada cara curang. Tidak ada cherry-pick. Yang publik, tetap publik selamanya.

### Scene 11 · Settle · 144–159s (f 4320–4770)
> Saat season berakhir, settle berjalan otomatis.
> Perp Momentum sepuluh kali finish di peringkat satu — plus seratus empat puluh tujuh persen.
> Tiga peringkat teratas membagi seratus ribu 0G — lima puluh, tiga puluh, dua puluh ribu.
> Tidak ada admin yang bisa mengubah ranking.
> Transaksi final masuk di Chainscan — untuk siapapun yang ingin verifikasi.

### Scene 12 · Reputation · 159–172s (f 4770–5160)
> Setiap kemenangan adalah credential permanen.
> Live cert ini mencatat semua epoch, dari genesis hingga sekarang.
> Reputasi yang ter-compound — bukan screenshot, tapi bukti kriptografi.

### Scene 13 · Advantages · 172–180s (f 5160–5400) — *extended to 8s*
> Empat hal yang tidak ada di tempat lain.
> Strategi tetap privat — enkripsi end-to-end.
> Backtest reproducible — sama dataset, sama hash.
> Track record live publik — terangkat selamanya di chain.
> Tanpa SaaS lock-in — SDK, contract, semua open.

### Scene 14 · Closing · 180–186s (f 5400–5580)
> Zero Arena — dot vercel dot app.
> `npm install zeroarena`.
> Build. Certify. Compete.

---

## 2. English captions (baked overlay)

Caption ditampilkan **di bawah scene**, baris pendek, sinkron dengan beat voiceover. Bukan terjemahan kata-per-kata — versi tightened biar enak dibaca.

| Scene | Caption (EN) |
| - | - |
| Hook | Every day on the timeline: "+847% ROI" · "91% winrate" · "12× in a month". None of it verifiable. |
| Problem | Three classic problems: open-source = stolen alpha · backtests cherry-picked · no public live record. |
| SolutionIntro | **Zero Arena** — the on-chain arena for AI trading agents. Backtest qualifies. Seasons prove. |
| Architecture | Five stages. Write the agent. Backtest → runHash on 0G. Mint as iNFT. Live daemon commits every epoch. |
| Install | One command. `npx zeroarena init`. Pick a strategy, answer the prompts. Done. |
| Backtest | Same dataset · same encrypted agent → same hash. T2: anyone with the AES key can rerun and verify. |
| CertifyMint | Certify on-chain. Mint the iNFT. Strategy stays private — the hash is public forever. |
| Frontend | Every agent ranked by ROI · Sharpe · winrate. All data read straight from chain. No decryption needed. |
| Enroll | One tx to enroll. The paper daemon executes every epoch — your infra, or delegated to Zero Arena. |
| ArenaLive | Every commit hash-chained. No cheating. No cherry-picks. What's public stays public — forever. |
| Settle | At endTime, settle runs permissionlessly. Top 3 split the prize. No admin can re-rank. |
| Reputation | Every win is a permanent on-chain credential. Reputation that compounds — not screenshots. |
| Advantages | Strategy private · Backtests reproducible · Live record public · No SaaS lock-in. |
| Closing | **zero-arena-fe.vercel.app** · `npm install zeroarena` |

Implementasi: tambah komponen `<CaptionBar text="..." />` di setiap scene, atau buat single `<CaptionOverlay scene={key} />` di Main.tsx yang baca dari sebuah map. Saran: yang kedua biar timing-nya centralized.

---

## 3. Voiceover production

**Pilih satu**:

### Opsi A — Rekaman manusia (recommended, paling natural)
1. Pakai iPhone Voice Memos (default kualitasnya cukup untuk demo) atau mic apapun yang ada
2. Rekam **per-scene satu file** — `vo-01-hook.mp3`, `vo-02-problem.mp3`, ..., `vo-14-closing.mp3`. Lebih mudah re-take potongan tertentu nanti.
3. Buka di Audacity (gratis). Apply: Noise Reduction (sample 0.5s silence dulu), Compressor (default), Normalize ke −1 dB.
4. Export 192 kbps MP3 mono.

### Opsi B — TTS AI (paling cepat)
- **ElevenLabs** — voice ID untuk Bahasa Indonesia: cari yang `Multilingual v2` model, pilih voice yang punya tone laki-laki dewasa (mis. *Adam* atau *Charlotte* multilingual, atau cari "Indonesian" di voice library). Quality terbaik.
- **Murf.ai** — ada voice `Imani` / `Suryana` ID native, lebih flat tapi clear.
- **Google Cloud TTS** — `id-ID-Wavenet-B` (laki-laki) atau `id-ID-Wavenet-D` (perempuan). Murah, kualitas decent.
- **Suno** — bukan TTS murni; bisa generate "narration over ambient track" tapi hard to control timing.

Saya rekomen Opsi A kalau punya 1 jam free. Kalau gak, ElevenLabs Opsi B.

---

## 4. Background music (ambient electronic, royalty-free)

| Source | Lisensi | Saran |
| - | - | - |
| **Pixabay Music** | Free, no attribution required | Search: `ambient electronic`, `tech background`, `cyberpunk minimal`. Filter durasi 3+ menit. |
| **YouTube Audio Library** | Free, beberapa req attribution | Tab "Music", filter genre "Ambient" + mood "Calm". |
| **Uppbeat.io** | Free tier (3 download/bulan, no watermark di free tier baru) | Search `ambient tech` — quality di atas Pixabay rata-rata. |
| **Epidemic Sound** | Paid sub (€10/bulan trial) | Library jauh lebih bersih. Saran kalau punya akun. |

**Kriteria pilih track:**
- Minimal melody, dominan pad/drone — supaya tidak fight dengan voiceover
- BPM 70–95, tidak ada drop yang loud
- Tidak ada vokal manusia
- Durasi minimal 3 menit (atau loop-able)

**Saran konkret di Pixabay** (per pencarian terakhir, nama mungkin berubah):
- "Tech Drone" by Top-Flow
- "Cyberpunk Ambient" by Lexin_Music
- "Future Tech" series — banyak yang fit

Volume final: musik **18–22%**, voiceover **80–100%**. Voiceover wajib paling depan.

---

## 5. Wiring ke Remotion

### Direktori
```
zero-arena-demo-video/
├── public/
│   └── audio/
│       ├── music-bed.mp3              ← ambient track
│       ├── vo-id.mp3                   ← single voiceover file
│       └── (optional) vo-01-hook.mp3, vo-02-problem.mp3, ...
```

### Single-file voiceover (paling simple)
Kalau bikin 1 file VO 178 detik (mixed di Audacity dari 14 segments dengan jeda yang sesuai scene), wiring-nya di `Main.tsx`:

```tsx
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';

export const Main: React.FC = () => (
  <AbsoluteFill>
    {/* Background music bed — loop kalau pendek */}
    <Audio src={staticFile('audio/music-bed.mp3')} volume={0.20} />

    {/* Voiceover */}
    <Audio src={staticFile('audio/vo-id.mp3')} volume={1.0} />

    {/* ...existing scene compositions... */}
  </AbsoluteFill>
);
```

### Per-scene voiceover (lebih kontrol)
Kalau ingin re-take 1 scene tanpa render ulang seluruh VO mix, simpan 14 file dan mount via Sequence:

```tsx
import {SCENE_START, SCENE_FRAMES} from './timing';

const VO_FILES: Record<string, string> = {
  hook: 'audio/vo-01-hook.mp3',
  problem: 'audio/vo-02-problem.mp3',
  solutionIntro: 'audio/vo-03-solution.mp3',
  // ...
};

<AbsoluteFill>
  <Audio src={staticFile('audio/music-bed.mp3')} volume={0.20} />
  {Object.entries(VO_FILES).map(([key, src]) => (
    <Sequence
      key={key}
      from={SCENE_START[key as keyof typeof SCENE_START]}
      durationInFrames={SCENE_FRAMES[key as keyof typeof SCENE_FRAMES]}
    >
      <Audio src={staticFile(src)} volume={1.0} />
    </Sequence>
  ))}
  {/* scenes */}
</AbsoluteFill>
```

### Volume ducking (optional)
Kalau musik kedengaran terlalu loud saat voiceover speaking, pakai `volume` sebagai function untuk frame-driven ducking:

```tsx
<Audio
  src={staticFile('audio/music-bed.mp3')}
  volume={(f) => isVoiceActive(f) ? 0.10 : 0.22}
/>
```

Implementasi `isVoiceActive(frame)` cek apakah frame berada dalam range scene yang punya VO. Untuk demo ini, semua scene punya VO, jadi cukup pakai volume konstan 0.20.

---

## 6. Captions overlay component

Tambahkan satu komponen ke `src/components/CaptionBar.tsx`:

```tsx
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {fonts, theme} from '../theme';

export const CaptionBar: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', pointerEvents: 'none'}}>
      <div
        style={{
          opacity: op,
          margin: '0 auto 60px',
          padding: '14px 28px',
          background: 'rgba(10, 10, 15, 0.78)',
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          fontFamily: fonts.sans,
          fontSize: 22,
          color: theme.text,
          maxWidth: 1200,
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
```

Pasang di tiap scene (atau lewat Main.tsx) dengan `text={EN_CAPTIONS[sceneKey]}`.

---

## 7. Order of operations (apa dulu)

1. **Lock script** — baca ulang naskah Indonesia di section 1, edit/revise sesuka kamu di file ini. Setiap revisi otomatis re-flow timing karena scene durations sudah fixed.
2. **Rekam / generate VO** — output: 1 file `vo-id.mp3` (atau 14 segments). Simpan di `public/audio/`.
3. **Pilih + download music bed** — output: `public/audio/music-bed.mp3`. Trim ke ~180 detik kalau perlu.
4. **Wire Audio components ke Main.tsx** — copy snippet section 5.
5. **Tambah CaptionBar component** + map EN_CAPTIONS — section 6.
6. **Preview di Remotion Studio** (`npm run dev`) → cek sync VO ↔ visual ↔ caption.
7. **Render final MP4** — `npm run build`.
