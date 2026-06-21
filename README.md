# BURIK.FX

Web app sederhana untuk menambahkan efek "burik" (grain/noise, scanline VHS,
chromatic aberration, jitter) ke video — **semua diproses langsung di
perangkat/browser pengguna** lewat Canvas API + MediaRecorder. Tidak ada file
video yang diunggah ke server mana pun. Audio asli tetap ikut terekam.

## Cara jalanin di lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel

1. Push folder ini ke repo GitHub (atau pakai Vercel CLI: `npx vercel`).
2. Di Vercel dashboard: **New Project** → import repo ini.
3. Framework preset otomatis terdeteksi sebagai **Next.js**, biarkan default
   (build command `next build`, output otomatis).
4. Klik Deploy. Tidak perlu environment variable apa pun karena semua proses
   terjadi di browser pengguna.

Atau lewat CLI:

```bash
npm i -g vercel
vercel
```

## Cara pakai

1. Klik **PILIH VIDEO**, pilih file video dari perangkat.
2. Pilih preset **RINGAN / SEDANG / BERAT**, atau geser slider manual
   (otomatis pindah ke mode **CUSTOM**):
   - **Noise** — butiran grain di seluruh frame
   - **Scanline** — garis horizontal ala TV tabung
   - **Chromatic aberration** — pergeseran warna merah/cyan, kesan VHS rusak
   - **Jitter** — getaran tracking VHS
   - **Vignette** — gelap di tepi frame
3. Preview live langsung tampil di canvas sebelum diproses.
4. Klik **BIKIN BURIK & DOWNLOAD** — video akan diputar sekali (audio ikut
   terdengar, ini bagian dari proses perekaman ulang) lalu hasilnya otomatis
   bisa diunduh sebagai `.webm`.

## Catatan teknis

- Pakai `canvas.captureStream()` untuk video hasil efek + `video.captureStream()`
  untuk menarik track audio asli, digabung jadi satu `MediaStream`, lalu
  direkam dengan `MediaRecorder` (vp9/opus, fallback ke vp8).
- Output berformat `.webm`. Browser yang disarankan: Chrome, Edge, atau
  browser Chromium lain terbaru (dukungan `captureStream` + `MediaRecorder`
  paling stabil di sana). Safari punya dukungan terbatas.
- Karena prosesnya merekam ulang secara real-time, lama proses ≈ durasi asli
  video.
