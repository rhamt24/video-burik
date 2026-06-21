# BURIKIN

Web app sederhana untuk bikin video jadi "burik" — grain/noise, scanline VHS,
chromatic aberration, jitter, sampai gaya **video 3GP jadul 144p-ke-bawah**
(pixelated + warna nge-band + audio ikut digilas bitrate-nya). Semua
**diproses langsung di perangkat/browser pengguna** lewat Canvas API,
Web Audio API, dan MediaRecorder. Tidak ada file video yang diunggah ke
server mana pun.

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
2. Pilih preset:
   - **RINGAN / SEDANG / BERAT** — grain, scanline, chromatic aberration,
     jitter, vignette dengan intensitas naik bertahap.
   - **3GP JADUL** — pixelated kaya resolusi 144p ke bawah, warna nge-band
     (posterize), plus audio ikut digilas turun bitrate-nya.
   - **CUSTOM** — geser slider manual, otomatis pindah ke mode ini.
3. Slider yang tersedia:
   - **Noise** — butiran grain di seluruh frame
   - **Scanline** — garis horizontal ala TV tabung
   - **Chromatic aberration** — pergeseran warna merah/cyan, kesan VHS rusak
   - **Jitter** — getaran tracking VHS
   - **Vignette** — gelap di tepi frame
   - **Pixelated (144p--)** — makin besar nilainya, makin gede juga blok
     pixel-nya (gaya video resolusi sangat rendah)
   - **Posterize warna** — makin kecil nilainya, makin sedikit gradasi warna
     (kesan codec jadul/3GP)
   - **Audio burik** — me-lo-fi-kan suara: sample-and-hold downsample +
     lowpass + bitcrush, sekaligus menurunkan bitrate audio hasil rekaman
4. Preview live langsung tampil di canvas sebelum diproses.
5. Klik **BIKIN BURIK & DOWNLOAD** — video akan diputar sekali (kalau audio
   burik diaktifkan, suaranya kedengaran sudah lo-fi saat proses) lalu
   hasilnya otomatis bisa diunduh sebagai `.webm`.

## Catatan teknis

- Video: `canvas.captureStream()` menangkap hasil olahan canvas (efek + mode
  pixelated digambar dengan `imageSmoothingEnabled = false` lalu di-upscale
  supaya bloknya tetap tajam, bukan blur).
- Audio: `video.captureStream()` menarik track audio asli. Kalau slider
  **AUDIO BURIK** > 0, audio dialirkan lewat `AudioContext` →
  `ScriptProcessorNode` (sample-and-hold) → `BiquadFilter` lowpass → hasilnya
  ditangkap lewat `MediaStreamDestination`, lalu digabung dengan video stream.
- Saat preset **3GP JADUL** atau audio burik aktif, `MediaRecorder` juga
  dipaksa pakai bitrate rendah (≈250 kbps video / 24 kbps audio) supaya
  artefak kompresinya kerasa asli, bukan cuma efek visual.
- Output berformat `.webm`. Browser yang disarankan: Chrome, Edge, atau
  browser Chromium lain terbaru (dukungan `captureStream` + `MediaRecorder`
  + Web Audio paling stabil di sana). Safari punya dukungan terbatas.
- Karena prosesnya merekam ulang secara real-time, lama proses ≈ durasi asli
  video.
