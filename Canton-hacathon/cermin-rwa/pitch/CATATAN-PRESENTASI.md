# Catatan Presentasi — Cermin-RWA (Practice Encode, malam ini)

Script lengkap per slide sudah ada di **speaker notes PPT** (buka Presenter View). Total ~4 menit 50 detik — pas untuk slot 5 menit. JANGAN sebut track apa pun; biarkan juri menempatkan kita di track mana saja. Kalau butuh buffer, potong kalimat ISDA (slide 2) + grace-period (slide 6) = hemat ~25 detik.

## Struktur cerita (hafalkan alurnya, bukan kalimatnya)

1. **Apa**: agent otonom pelindung likuidasi untuk loan RWA — live di DevNet.
2. **Problem**: RWA lending mewarisi forced liquidation (slide 2) + di chain publik posisi diburu bot (slide 3).
3. **Solusi**: guard agent + Shadow Vault privat — repay otomatis sebelum margin call (slide 4-5).
4. **Mekanisme**: angka nyata DevNet — drop 24% → repay $758.62 dalam 1 poll 5 detik → health 145% (slide 6).
5. **Inovasi**: (a) privasi struktural Daml — pool lihat 0 vault/0 rescue (slide 7), (b) Coupon Sweep — yield Treasury bayar loan sendiri, hanya RWA yang bisa (slide 8).
6. **Bukti**: 277 tes hijau, live 24/7, CIP-56, $335B Treasuries di Canton (slide 9).

## 3 kalimat yang WAJIB keluar

- "Live on Canton DevNet right now — not a mockup."
- "The ledger never ships the private contracts to the pool's node — privacy by construction, impossible on EVM."
- "Other teams built private places to trade; we built an agent that privately protects you."

## Antisipasi pertanyaan juri

**"Semua party kalian di satu participant node kan?"**
→ Ya, seperti semua finalist lain. Privasi Daml stakeholder-level sudah nyata dan teruji; multi-participant adalah langkah deployment, bukan re-architecture. Template kami tidak berubah.

**"CIP-56 kalian asli atau subset?"**
→ Faithful subset (holding + allocation pattern) — jujur di submission. Arsitektur agent menempel ke interface, bukan ke pool kami, jadi asset CIP-56 apa pun bisa dilindungi tanpa kerja custom.

**"Kalau Shadow Vault kosong?"**
→ Jujur: agent notifikasi + buka GracePeriod contract on-ledger. Lapisan proteksi: coupon yield → vault → grace period → remediasi negosiasi. `LastResortDefault` ada tapi tidak pernah terpakai di demo.

**"Kenapa bikin lending pool sendiri?"**
→ Venue produksi Canton (ACME, Alpend) permissioned, tidak ada devnet API publik. Pool kami reference venue untuk demo; produknya adalah protection layer. Roadmap: partnership Alpend/ACME — positioning privacy mereka identik dengan kami.

**"Bedanya sama liquidation bot?"**
→ Kebalikannya: bot melikuidasi orang, Cermin mencegah likuidasi. Dan strateginya privat — di EVM strategi agent akan publik dan bisa dieksploitasi.

**"Kenapa harus Canton, bukan L2 privacy?"**
→ Kami butuh privasi antar-counterparty ekonomi (pool tidak boleh lihat vault) DAN collateral institusional nyata. Canton satu-satunya yang punya keduanya: Daml visibility model + $335B Treasuries yang sudah ada.

## Checklist sebelum mulai

- [ ] Buka cermin-rwa.vercel.app, pastikan backend Railway & agent hidup (cek rescue jalan di simulasi)
- [ ] Video fallback (youtu.be/fNKD4S2iWVw) siap di tab kalau live demo gagal
- [ ] Presenter View aktif — notes terbaca
- [ ] Timer: 4 menit; latih minimal 2x sebelum sesi

## Cheat sheet: "node" itu apa (buat slide 7)

- EVM = grup WhatsApp raksasa: semua transaksi di satu grup, semua orang bisa baca.
- Canton = kumpulan DM: tiap organisasi punya node (server) sendiri, isinya HANYA kontrak yang melibatkan dia.
- Tiap kontrak Daml punya daftar pihak. Ledger cuma kirim kontrak ke node pihak di daftar itu.
- ShadowVault daftar pihaknya: kamu + agent. Pool tidak di daftar → node pool TIDAK PERNAH menerima datanya. Bukan disembunyikan/enkripsi — memang tidak pernah dikirim.
- Slide 7: kiri = isi node kamu (4 kontrak), kanan = isi node pool (cuma Loan).

**Jawaban kalau juri tanya "semua party kalian kan di 1 validator?":**
"Yes, for the demo all parties share one DevNet validator — like every finalist. But visibility is enforced by the ledger: query as the pool operator and you get zero vaults, zero rescues. In production each org runs its own node, so private data physically never reaches them. Our Daml templates don't change."
