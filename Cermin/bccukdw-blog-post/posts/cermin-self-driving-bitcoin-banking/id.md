---
title: "Cermin: Self-Driving Bitcoin Banking yang Juara 1 di Hackathon Mezo"
date: "2026-07-01"
author: "yeheskieltame"
authorName: "Yeheskiel Yunus Tame"
authorAvatar: "https://github.com/yeheskieltame.png"
category: "Blockchain"
tags: ["bitcoin", "mezo", "defi", "solidity", "hackathon"]
excerpt: "Bagaimana dua smart contract dan satu agent deterministik membuat pemegang Bitcoin bisa meminjam, menabung, dan mempertahankan posisinya secara otomatis, tanpa pernah menjual satu satoshi pun."
cover: "https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/cover.jpg"
---

Saya baru saja merilis dua smart contract, satu keeper agent deterministik, dan satu aplikasi banking di atas Bitcoin. Supernormal Foundation dan Mezo baru saja mengumumkan ini juara 1 di global hackathon mereka, dengan hadiah $5.000 (setara sekitar Rp90 juta).

Ini catatan pembangunannya. Masalah, solusi, bagian yang saya banggakan, dan bagian yang sengaja tidak kami bangun.

![Yang Cermin rilis: juara 1, hadiah $5.000, dua contract on-chain, dan keeper ~200 baris tanpa LLM](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/at-a-glance.png)
*Juara 1 di global hackathon Supernormal dan Mezo. Dua contract, satu keeper, tanpa LLM.*

## Trade-off yang selalu dihadapi pemegang Bitcoin

Kalau kamu pegang Bitcoin dan butuh uang tunai, kamu cuma punya dua pilihan buruk.

Jual, kamu dapat likuiditas tapi kehilangan upside selamanya. Hold, kamu pegang upside tapi tidak punya apa-apa untuk dibelanjakan.

![Jual dan upside hilang. Hold dan dananya beku. Cermin meminjam pakai BTC sebagai jaminan, jadi kamu dapat dua-duanya](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/sell-or-hold.png)
*Jual dan upside hilang. Hold dan tidak ada yang bisa dibelanjakan. Cermin meminjam, jadi kamu dapat dua-duanya.*

Mezo menyelesaikan separuh masalah ini. Mezo membiarkan kamu meminjam MUSD, stablecoin yang di-backing Bitcoin, dengan jaminan BTC-mu, di bunga tetap 1% APR, tanpa menjual apa pun. Itu unlock yang nyata. Tapi Mezo memberimu primitive lending mentah, bukan produk jadi. Untuk memakainya dengan aman, kamu harus melakukan kerja treasury profesional sendiri, terus-menerus:

Memantau rasio kolateral biar tidak ter-likuidasi. Memutuskan berapa banyak yang dipinjam dan kapan. Menempatkan dolar yang dipinjam ke tempat yang produktif, bukan dibiarkan menganggur. Membayar utang secepatnya begitu harga turun.

Sebagian besar orang tidak akan melakukan itu. Mereka akan menghindari pinjam sama sekali, atau ter-likuidasi di minggu pertama BTC turun.

## Cermin: BTC-mu tetap utuh, Shadow yang kamu hidupi

Cermin adalah autopilot untuk posisi Mezo. Kamu kasih BTC dan goal-mu. Cermin yang menjalankan kerja treasury-nya untukmu, otomatis dan transparan di on-chain.

Saat kamu buka vault, Cermin membuka trove Mezo dengan BTC-mu dan meminjam MUSD sampai target loan-to-value-mu. MUSD itu dibagi jadi dua: bucket spendable yang bisa ditarik kapan saja, dan posisi tabungan (sMUSD) yang menghasilkan kira-kira 5% APR. Dari sana, dua aksi otomatis berjalan terus, sampai kamu menutup vault dan mengambil kembali BTC-mu secara utuh.

Saldo dolar yang benar-benar kamu hidupi, saya sebut **Shadow**. Shadow = MUSD spendable + nilai tabungan sMUSD-mu. Kolateral BTC-mu tidak pernah dijual, bahkan satu satoshi pun. Pendapatannya datang dari spread suku bunga (kamu pinjam di 1%, kamu menabung di kira-kira 5%), ditambah kapasitas pinjam baru yang Cermin tangkap setiap kali BTC naik.

![Cara Shadow terbentuk: BTC terkunci sebagai kolateral sementara MUSD yang dipinjam dibagi jadi dolar spendable dan tabungan sMUSD](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/the-shadow.png)
*BTC-mu terkunci sebagai kolateral dan tidak pernah dijual. Dolar yang dipinjam, spendable plus tabungan sMUSD, itulah Shadow yang kamu hidupi.*

## Loop autopilot

Dua fungsi permissionless yang melakukan semua kerjanya. Keduanya bisa dipanggil oleh user, oleh keeper Cermin, atau oleh siapa pun yang mengamati chain. Tidak ada peran istimewa yang bisa memindahkan dana siapa pun.

**Skim**, saat BTC naik melewati ambang batas, menarik headroom pinjam baru yang baru saja dibuka oleh kolateralmu yang naik, lalu membaginya jadi dolar spendable dan tabungan. Shadow-mu tumbuh. Kamu tidak menjual apa pun.

**Defend**, saat rasio kolateralmu turun mendekati zona bahaya, otomatis membayar utang, menguras posisi tabungan dulu, baru bucket spendable, untuk menarik rasiomu kembali ke aman. BTC-mu tetap persis di tempatnya.

![Loop autopilot Cermin: skim saat naik, defend saat turun](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/skim-defend-flow.png)
*BTC naik, skim menumbuhkan Shadow. BTC turun, defend melindungi posisi. Apa pun arahnya, BTC itu sendiri tidak pernah bergerak.*

Kedua fungsi ini membaca debt, kolateral, dan harga langsung dari kontrak Mezo, jadi trove-mu tetap jadi satu-satunya sumber kebenaran. Tidak ada state off-chain yang harus dipercaya.

## Strategi sebagai angka, bukan kode

Setiap vault membawa satu struct, `VaultParams`: target LTV, ICR yang memicu defense, batas ICR darurat, pergerakan harga yang memicu skim, dan pembagian spendable versus tabungan. Lima field `uint16`, dipadatkan jadi satu storage slot.

Tidak ada enum risk-level, tidak ada strategy branch, tidak ada mode switch di dalam contract. Keragaman perilaku datang murni dari lima angka ini, divalidasi on-chain saat vault dibuat. Frontend menyediakan tiga preset yang mengarah ke contract yang sama:

| Preset | Target LTV | Defend ICR | Emergency ICR | Skim threshold | Spendable share |
|---|---|---|---|---|---|
| Conservative | 40% | 170% | 140% | 8% | 30% |
| Balanced | 50% | 140% | 120% | 5% | 50% |
| Aggressive | 70% | 125% | 118% | 3% | 70% |

Validasi on-chain memberlakukan batas yang nyata, bukan cuma default yang masuk akal: emergency ICR harus minimal 115%, defend ICR harus ketat di atasnya, dan ambang defend harus punya buffer minimal 1000 bps di bawah ICR saat vault dibuka. Kamu tidak bisa mengonfigurasi vault yang sudah berdiri di tepi likuidasi sejak detik pertama dibuka.

## Dua contract, tidak lebih

Ini bagian dari pembangunan ini yang paling saya kukuh-pegang. Mezo sudah meng-audit dan merilis trove, stablecoin, price feed, dan mesin likuidasi. Tugas Cermin adalah mengorkestrasi, bukan menciptakan ulang. Jadi seluruh permukaan on-chain-nya cuma dua contract.

`CerminFactory` adalah singleton. Ia meng-clone EIP-1167 minimal proxy dari `CerminVault` untuk setiap user baru, karena Mezo mengunci satu trove per address dan kami butuh satu vault per user untuk mencocokkannya. `CerminVault` adalah implementasinya, memegang persis satu trove, satu saldo MUSD spendable, dan satu posisi sMUSD. Aksi owner-only adalah `deposit`, `withdrawSpendable`, dan `close`. Aksi permissionless adalah `skim` dan `defend`. Sisanya cuma view.

![Arsitektur dua-contract Cermin di atas protokol native Mezo](https://raw.githubusercontent.com/bcc-ukdw/blog-bccukdw/main/posts/cermin-self-driving-bitcoin-banking/images/architecture.png)
*CerminFactory meng-clone satu CerminVault per user. Setiap vault bicara langsung ke BorrowerOperations, TroveManager, PriceFeed, dan MUSD milik Mezo yang sudah teraudit.*

Tidak ada contract Guardian, tidak ada Treasury, tidak ada library StrategyEngine, tidak ada proxy yang upgradeable. Setiap implementasi sengaja dibuat non-upgradeable. Kalau kami merilis v2, itu factory baru dan implementasi baru, dan user yang memilih sendiri untuk pindah, bukan admin key yang diam-diam mengubah apa yang dilakukan contract mereka. Tidak ada siapa pun selain pemilik vault yang bisa menarik dana. Tim Cermin tidak pernah memegang aset siapa pun.

## Keeper agent tidak punya opini

Bagian off-chain-nya adalah service TypeScript deterministik, sekitar 200 baris logika inti, berjalan di cron loop. Setiap siklus, ia membaca harga BTC dari PriceFeed Mezo, mendaftar semua vault dari factory, dan untuk masing-masing menjalankan persis ini: kalau ICR di bawah ambang defend, panggil `defend()`. Kalau tidak, dan harga sudah lewat ambang skim, panggil `skim()`. Kalau tidak juga, diam.

Itu saja seluruh decision tree-nya. Tidak ada LLM, tidak ada debat multi-agent, tidak ada reasoning loop. Saya sempat mempertimbangkan membungkus ini dengan sesuatu yang lebih canggih, dan sengaja memutuskan tidak. Keputusannya cuma `if (icr < threshold) defend()`, dan membungkusnya dengan pemanggilan model cuma menambah biaya, latensi, dan cara baru untuk gagal, tanpa nilai judgment tambahan. Pengalaman "kenapa ini terjadi" yang sebenarnya diinginkan user, ditangani dengan reason string bertemplate, kira-kira seperti ini:

> BTC turun ke $87,200. ICR turun ke 132%, di bawah ambang defend-mu 140%. Membayar 850 MUSD dari tabungan. ICR baru: 148%.

Terasa seperti reasoning, tanpa biaya tambahan, dan akurat setiap saat karena ini bukan di-generate. Ini di-template dari angka yang sama yang baru saja dipakai contract.

Karena `defend()` dan `skim()` bersifat publik, keeper bukan operator terpercaya dengan kekuatan khusus. Ia cuma kemudahan. Siapa pun, termasuk kamu, bisa memanggil fungsi yang sama dengan yang dia panggil.

## Apa yang nyata, apa yang mock, dan kenapa

Satu contract di testnet di-mock: savings vault-nya. Mezo belum merilis contract savings produksinya (`MUSDSavingsRate`) di Matsnet, jadi tidak ada tempat untuk men-deposit sMUSD ke sana. Saya membangun `MockSavingsVault` sebagai cermin perilaku yang ketat dari contract asli Mezo: deposit dan withdraw 1:1 yang sama, indeks yield pro-rata yang sama, interface `claimYield()` yang sama. Di testnet, keeper mengalirkan sedikit MUSD secara proporsional terhadap waktu ke dalamnya untuk mensimulasikan yield yang seharusnya dihasilkan oleh protocol-controlled value milik Mezo.

Karena interface-nya cocok persis, peluncuran mainnet cuma satu baris swap, address savings vault jadi argumen konstruktor yang diarahkan ke `MUSDSavingsRate` asli milik Mezo. Tidak ada yang lain di `CerminVault` yang berubah.

Sisanya, trove-nya, peminjamannya, pelunasannya, price feed-nya, stablecoin-nya sendiri, adalah infrastruktur Mezo yang nyata dan teraudit di Matsnet. Open, skim, defend, dan close semuanya sudah dijalankan end to end melawan contract live, bukan fork lokal.

## Posisinya sekarang

Dua contract sudah live di Mezo Matsnet. Keeper berjalan sebagai daemon yang always-on, deterministik, dikeraskan dengan antrian transaksi, pemeriksaan gas preflight, penghitung kegagalan beruntun per vault, dan health endpoint. Dashboard Next.js membaca kolateral BTC, saldo Shadow, dan ICR, dengan activity feed yang dibangun langsung dari event on-chain, tanpa butuh indexer.

Milestone berikutnya adalah audit keamanan pihak ketiga dan peluncuran mainnet, di mana savings vault yang di-mock ditukar dengan yang asli. Seluruh arsitekturnya sengaja dibangun supaya swap itu cuma butuh satu argumen konstruktor, bukan rewrite.

Kalau kamu mau menyelami contract-nya, logika keeper-nya, atau deploy script-nya, repository-nya publik. Dan kalau kamu pemegang Bitcoin yang pernah merasakan langsung trade-off jual-atau-hold itu, itu memang masalah yang ingin dihilangkan oleh proyek ini.

> **BTC-mu tetap utuh. Shadow yang kamu hidupi.**
