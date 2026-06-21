"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Satu efek aja: "burik kayak video yang direpost berkali-kali"
const PRESETS = {
  ringan: { label: "RINGAN", intensity: 3 },
  sedang: { label: "SEDANG", intensity: 6 },
  parah: { label: "PARAH", intensity: 9 },
  custom: { label: "CUSTOM", intensity: 6 },
};

function computeParams(intensity) {
  const i = Math.min(10, Math.max(0.5, intensity));
  return {
    blockDivisor: 2 + i * 1.3,
    posterizeLevels: Math.max(4, 26 - i * 2),
    blurPx: 0.2 + i * 0.18,
    noiseAlpha: 0.02 + i * 0.012,
    audioCrush: Math.min(1, i / 10),
  };
}

export default function Page() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mosaicRef = useRef(null);
  const noiseRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const heroCanvasRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [ready, setReady] = useState(false);
  const [presetKey, setPresetKey] = useState("sedang");
  const [intensity, setIntensity] = useState(PRESETS.sedang.intensity);
  const [status, setStatus] = useState("idle"); 
  const [progress, setProgress] = useState(0);
  const [outputURL, setOutputURL] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fileExt, setFileExt] = useState("mp4"); // Menyimpan info ekstensi akhir

  // ---- hero static noise (dekorasi halaman saja) ----
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const w = 160, h = 90;
    canvas.width = w;
    canvas.height = h;
    const draw = () => {
      const imgData = ctx.createImageData(w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 35;
      }
      ctx.putImageData(imgData, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setOutputURL(null);
    setStatus("idle");
    setErrorMsg(null);
    setFileName(f.name);
    const url = URL.createObjectURL(f);
    setVideoURL(url);
    setReady(false);
  };

  const applyPreset = (key) => {
    setPresetKey(key);
    if (key !== "custom") setIntensity(PRESETS[key].intensity);
  };

  const updateIntensity = (v) => {
    setPresetKey("custom");
    setIntensity(v);
  };

  // ---- render satu frame: mosaic blur + posterize + grain ----
  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const { blockDivisor, posterizeLevels, blurPx, noiseAlpha } = computeParams(intensity);

    const mosaic = mosaicRef.current;
    const mw = Math.max(8, Math.floor(w / blockDivisor));
    const mh = Math.max(8, Math.floor(h / blockDivisor));
    if (mosaic.width !== mw || mosaic.height !== mh) {
      mosaic.width = mw;
      mosaic.height = mh;
    }
    const mctx = mosaic.getContext("2d");
    mctx.imageSmoothingEnabled = true;
    mctx.drawImage(video, 0, 0, mw, mh);

    if (posterizeLevels < 24) {
      const levels = Math.max(4, Math.round(posterizeLevels));
      const step = 255 / (levels - 1);
      const imgData = mctx.getImageData(0, 0, mw, mh);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.round(Math.round(d[i] / step) * step);
        d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
        d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
      }
      mctx.putImageData(imgData, 0, 0);
    }

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.filter = `blur(${blurPx}px)`;
    ctx.drawImage(mosaic, 0, 0, w, h);
    ctx.filter = "none";

    if (noiseAlpha > 0) {
      const noiseCanvas = noiseRef.current;
      const nw = Math.max(1, Math.floor(w / 2));
      const nh = Math.max(1, Math.floor(h / 2));
      if (noiseCanvas.width !== nw || noiseCanvas.height !== nh) {
        noiseCanvas.width = nw;
        noiseCanvas.height = nh;
      }
      const nctx = noiseCanvas.getContext("2d");
      const imgData = nctx.createImageData(nw, nh);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.random() * 255;
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
      }
      nctx.putImageData(imgData, 0, 0);
      ctx.globalAlpha = noiseAlpha;
      ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(noiseCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.restore();
  }, [intensity]);

  const onLoadedMeta = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    // PENTING: MP4 (H.264 codec) MENGHARUSKAN dimensi angka genap.
    // Bitwise "& ~1" akan membulatkan angka ganjil ke genap terdekat ke bawah.
    // Ini juga tetap menjaga rasio asli video pengguna.
    canvas.width = (video.videoWidth || 640) & ~1;
    canvas.height = (video.videoHeight || 360) & ~1;
    
    setReady(true);
    setStatus("previewing");
    video.currentTime = Math.min(0.2, video.duration || 0);
  };

  useEffect(() => {
    if (status !== "previewing") return;
    let raf;
    const loop = () => {
      drawFrame();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, drawFrame]);

  const waitForVideoToFinish = (video) => {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(watchdogId);
        clearInterval(stallId);
        video.removeEventListener("ended", finish);
        resolve();
      };

      video.addEventListener("ended", finish);

      const dur = isFinite(video.duration) && video.duration > 0 ? video.duration : null;
      const watchdogMs = dur ? dur * 1000 + 6000 : 3 * 60 * 1000;
      const watchdogId = setTimeout(finish, watchdogMs);

      let lastTime = video.currentTime;
      let stuckTicks = 0;
      const stallId = setInterval(() => {
        if (video.ended || video.paused) return;
        if (Math.abs(video.currentTime - lastTime) < 0.01) {
          stuckTicks += 1;
        } else {
          stuckTicks = 0;
          lastTime = video.currentTime;
        }
        if (stuckTicks >= 4) finish();
      }, 1000);
    });
  };

  const handleProcess = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (typeof canvas.captureStream !== "function" || typeof video.captureStream !== "function") {
      setErrorMsg("Browser ini tidak mendukung pemrosesan video langsung di perangkat.");
      setStatus("error");
      return;
    }

    setStatus("processing");
    setProgress(0);
    setOutputURL(null);
    setErrorMsg(null);

    let recorder = null;
    let localRaf = null;

    try {
      video.pause();
      video.currentTime = 0;
      await new Promise((res) => {
        const h = () => { video.removeEventListener("seeked", h); res(); };
        video.addEventListener("seeked", h);
      });

      const fps = 30;
      const canvasStream = canvas.captureStream(fps);
      const audioStream = video.captureStream();
      let audioTracks = audioStream.getAudioTracks();

      const { audioCrush } = computeParams(intensity);

      if (audioCrush > 0 && audioTracks.length > 0) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));

        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 8000 - audioCrush * 6500;

        const holdFactor = Math.max(1, Math.round(audioCrush * 10));
        const crusher = audioCtx.createScriptProcessor(4096, 1, 1);
        let holdCounter = 0;
        let lastSample = 0;
        const bitLevels = Math.max(4, Math.round(64 - audioCrush * 56));
        crusher.onaudioprocess = (e) => {
          const input = e.inputBuffer.getChannelData(0);
          const output = e.outputBuffer.getChannelData(0);
          for (let i = 0; i < input.length; i++) {
            if (holdCounter % holdFactor === 0) {
              lastSample = Math.round(input[i] * bitLevels) / bitLevels;
            }
            output[i] = lastSample;
            holdCounter++;
          }
        };

        const dest = audioCtx.createMediaStreamDestination();
        source.connect(lowpass);
        lowpass.connect(crusher);
        crusher.connect(dest);
        audioTracks = dest.stream.getAudioTracks();
      }

      const combined = new MediaStream([
        canvasStream.getVideoTracks()[0],
        ...audioTracks,
      ]);

      // PRIORITASKAN MP4
      let mimeType = "video/mp4";
      let ext = "mp4";

      // Cek apakah browser mendukung MP4 via MediaRecorder (Chrome/Edge terbaru, Safari)
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Coba dengan format MP4 + H.264 spesifik (sering dipakai di Chrome)
        mimeType = 'video/mp4; codecs="avc1.424028, mp4a.40.2"';
      }
      
      // Jika MP4 benar-benar tidak didukung sama sekali (misal Firefox), fallback ke webm
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp9,opus";
        ext = "webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
        }
      }

      setFileExt(ext);

      recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond: 1_500_000, // Dinaikkan sedikit untuk MP4 agar artifaknya dari efek kita saja, bukan karena kompresor
        audioBitsPerSecond: 32_000,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const stopped = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      recorder.start(500);

      const duration = video.duration || 0;
      const tick = () => {
        drawFrame();
        if (duration > 0) {
          setProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }
        localRaf = requestAnimationFrame(tick);
      };
      localRaf = requestAnimationFrame(tick);

      await video.play();
      await waitForVideoToFinish(video);

      cancelAnimationFrame(localRaf);
      localRaf = null;

      if (recorder.state !== "inactive") recorder.stop();
      await stopped;

      if (audioCtxRef.current) {
        await audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      if (chunks.length === 0) {
        throw new Error("Tidak ada data yang terekam. Coba ulangi lagi.");
      }

      // Gunakan mimeType yang terpilih (entah itu mp4 atau webm)
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setOutputURL(url);
      setProgress(100);
      setStatus("done");
    } catch (err) {
      console.error(err);
      if (localRaf) cancelAnimationFrame(localRaf);
      if (recorder && recorder.state !== "inactive") {
        try { recorder.stop(); } catch (_) {}
      }
      if (audioCtxRef.current) {
        try { await audioCtxRef.current.close(); } catch (_) {}
        audioCtxRef.current = null;
      }
      setErrorMsg("Gagal memproses video: " + (err?.message || "error tidak diketahui") + ". Coba lagi.");
      setStatus("error");
    }
  };

  return (
    <main style={styles.main}>
      <section style={styles.hero}>
        <canvas ref={heroCanvasRef} style={styles.heroNoise} />
        <div style={styles.heroInner}>
          <div style={styles.eyebrow}>// NO SIGNAL — PROSES LOKAL DI PERANGKATMU</div>
          <h1 style={styles.h1}>
            BURIKIN<span style={{ color: "var(--amber)" }}>.</span>
          </h1>
          <p style={styles.tagline}>
            Bikin video jadi burik kayak udah direpost ke grup WhatsApp berkali-kali. 
            Menjaga rasio asli dan mengekspor ke MP4 (didukung di Chrome/Safari terbaru).
          </p>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.row}>
          <button style={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
            {fileName ? "GANTI VIDEO" : "PILIH VIDEO"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={onPickFile}
            style={{ display: "none" }}
          />
          <span style={styles.fileName}>{fileName || "belum ada video dipilih"}</span>
        </div>

        {videoURL && (
          <>
            <video
              ref={videoRef}
              src={videoURL}
              onLoadedMetadata={onLoadedMeta}
              style={{ display: "none" }}
              playsInline
            />

            <div style={styles.previewWrap}>
              <canvas ref={canvasRef} style={styles.previewCanvas} />
              <canvas ref={mosaicRef} style={{ display: "none" }} />
              <canvas ref={noiseRef} style={{ display: "none" }} />
              <div style={styles.recBadge}>
                {status === "processing" ? "● REC" : "● PREVIEW"}
              </div>
            </div>

            <div style={styles.presetRow}>
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  style={{
                    ...styles.presetBtn,
                    ...(presetKey === key ? styles.presetBtnActive : {}),
                  }}
                >
                  {PRESETS[key].label}
                </button>
              ))}
            </div>

            <div style={styles.sliders}>
              <label style={styles.sliderLabel}>
                <div style={styles.sliderTop}>
                  <span>TINGKAT BURIK</span>
                  <span style={{ color: "var(--amber)" }}>{intensity.toFixed(1)} / 10</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.1}
                  value={intensity}
                  onChange={(e) => updateIntensity(parseFloat(e.target.value))}
                  style={styles.slider}
                />
              </label>
            </div>

            <p style={styles.note}>
              Saat tombol proses ditekan, video diputar sekali dari awal sampai
              akhir untuk direkam ulang dengan efeknya. Jangan tutup atau pindah tab selama
              proses berjalan.
            </p>

            <button
              style={{
                ...styles.processBtn,
                opacity: status === "processing" ? 0.6 : 1,
                cursor: status === "processing" ? "not-allowed" : "pointer",
              }}
              disabled={!ready || status === "processing"}
              onClick={handleProcess}
            >
              {status === "processing" ? `MEMPROSES... ${progress}%` : `BIKININ & DOWNLOAD`}
            </button>

            {errorMsg && <p style={styles.error}>{errorMsg}</p>}

            {outputURL && (
              <div style={styles.resultBox}>
                <video src={outputURL} controls style={styles.resultVideo} />
                <a href={outputURL} download={`burikin.${fileExt}`} style={styles.downloadLink}>
                  ⬇ DOWNLOAD HASIL (.{fileExt})
                </a>
              </div>
            )}
          </>
        )}
      </section>

      <footer style={styles.footer}>
        diproses 100% di perangkatmu — tidak ada video yang dikirim ke server manapun
      </footer>
    </main>
  );
}

const styles = {
  main: {
    minHeight: "100vh",
    maxWidth: 760,
    margin: "0 auto",
    padding: "0 18px 60px",
  },
  hero: {
    position: "relative",
    padding: "56px 0 28px",
    overflow: "hidden",
    borderBottom: "1px solid var(--line)",
  },
  heroNoise: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    opacity: 0.5,
    filter: "contrast(1.4)",
  },
  heroInner: { position: "relative", zIndex: 1 },
  eyebrow: {
    fontFamily: "var(--mono-display)",
    fontSize: 12,
    letterSpacing: "0.08em",
    color: "var(--green)",
    marginBottom: 14,
  },
  h1: {
    fontFamily: "var(--mono-display)",
    fontSize: "clamp(40px, 10vw, 72px)",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    margin: 0,
    lineHeight: 1,
  },
  tagline: {
    marginTop: 14,
    color: "var(--dim)",
    fontSize: 14,
    lineHeight: 1.6,
    maxWidth: 480,
  },
  panel: { paddingTop: 28 },
  row: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  uploadBtn: {
    background: "var(--amber)",
    color: "#000",
    border: "none",
    padding: "12px 18px",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: "0.04em",
    cursor: "pointer",
  },
  fileName: { color: "var(--dim)", fontSize: 13, wordBreak: "break-all" },
  previewWrap: {
    position: "relative",
    marginTop: 22,
    border: "1px solid var(--line)",
    background: "#000",
    display: "flex",
    justifyContent: "center", // Pusatkan jika videonya vertikal
    alignItems: "center"
  },
  previewCanvas: { 
    width: "100%", 
    height: "auto",      // Penting: Cegah rasio rusak / gepeng / jadi 9:16
    maxHeight: "65vh",   // Penting: Cegah video vertikal menutupi layar sepenuhnya
    objectFit: "contain",
    display: "block" 
  },
  recBadge: {
    position: "absolute",
    top: 8,
    right: 10,
    fontFamily: "var(--mono-display)",
    fontSize: 11,
    color: "var(--danger)",
    letterSpacing: "0.05em",
  },
  presetRow: { display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" },
  presetBtn: {
    background: "var(--panel)",
    border: "1px solid var(--line)",
    color: "var(--dim)",
    padding: "8px 14px",
    fontSize: 12,
    letterSpacing: "0.04em",
    cursor: "pointer",
  },
  presetBtnActive: {
    borderColor: "var(--amber)",
    color: "var(--amber)",
  },
  sliders: {
    marginTop: 20,
    display: "grid",
    gap: 14,
    background: "var(--panel)",
    border: "1px solid var(--line)",
    padding: 18,
  },
  sliderLabel: { display: "block", fontSize: 12, color: "var(--text)" },
  sliderTop: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  slider: { width: "100%" },
  note: { color: "var(--dim)", fontSize: 12, lineHeight: 1.6, marginTop: 18 },
  processBtn: {
    width: "100%",
    marginTop: 8,
    background: "var(--green)",
    color: "#000",
    border: "none",
    padding: "16px",
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: "0.05em",
  },
  error: { color: "var(--danger)", fontSize: 13, marginTop: 12 },
  resultBox: {
    marginTop: 26,
    border: "1px solid var(--line)",
    padding: 16,
    background: "var(--panel)",
  },
  resultVideo: { 
    width: "100%", 
    height: "auto", 
    maxHeight: "65vh", 
    objectFit: "contain", 
    display: "block", 
    background: "#000" 
  },
  downloadLink: {
    display: "inline-block",
    marginTop: 14,
    color: "var(--amber)",
    fontFamily: "var(--mono-display)",
    fontSize: 13,
    textDecoration: "none",
    border: "1px solid var(--amber)",
    padding: "10px 16px",
  },
  footer: {
    marginTop: 50,
    color: "var(--dim)",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: "0.04em",
  },
};
