"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const PRESETS = {
  ringan: { label: "RINGAN", intensity: 3 },
  sedang: { label: "SEDANG", intensity: 6 },
  parah: { label: "PARAH", intensity: 9 },
  custom: { label: "CUSTOM", intensity: 6 },
};

// Menghitung parameter burik berdasarkan intensitas (0.5 - 10)
function computeParams(intensity) {
  const i = Math.min(10, Math.max(0.5, intensity));
  
  return {
    // Seberapa kecil resolusi internalnya (1 = ukuran asli, 0.1 = 10% dari asli)
    // Semakin kecil, makin buram dan warnanya "meleber" (smearing)
    scaleFactor: Math.max(0.08, 1 - (i * 0.09)),
    
    // FPS khas video HP jadul (turun dari 30 ke 8 fps)
    fps: Math.max(8, Math.round(30 - (i * 2.2))),
    
    // Mencekik bitrate video (menghasilkan efek kotak-kotak kompresi / macroblocking alami)
    videoBitrate: Math.max(10_000, Math.round(500_000 - (i * 49_000))),
    
    // Mencekik bitrate audio (menghasilkan suara kresek-kresek robotik khas kompresi)
    audioBitrate: Math.max(6_000, Math.round(64_000 - (i * 5_800))),
    
    // Memotong frekuensi tinggi audio (suara makin mendem kayak direkam di kaleng)
    audioCutoff: Math.max(1500, Math.round(10000 - (i * 850))),
    
    // Distorsi suara (pecah)
    audioDistortion: i > 5 ? (i - 5) * 10 : 0
  };
}

// Fungsi untuk membuat kurva distorsi audio agar suaranya "pecah" (clipping)
function makeDistortionCurve(amount) {
  const k = typeof amount === "number" ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export default function Page() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const lowResCanvasRef = useRef(null);
  const audioCtxRef = useRef(null);
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
  const [fileExt, setFileExt] = useState("mp4");

  // ---- Dekorasi TV statis di atas ----
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    canvas.width = 160; canvas.height = 90;
    const draw = () => {
      const imgData = ctx.createImageData(160, 90);
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

  // ---- RENDER FRAME NATURAL BURIK ----
  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const mainCanvas = canvasRef.current;
    const lowResCanvas = lowResCanvasRef.current;
    
    if (!video || !mainCanvas || !lowResCanvas) return;
    
    const ctx = mainCanvas.getContext("2d");
    const lowCtx = lowResCanvas.getContext("2d");
    
    const { scaleFactor } = computeParams(intensity);

    const w = mainCanvas.width;
    const h = mainCanvas.height;
    
    // 1. Hitung ukuran super kecil
    const lw = Math.max(16, Math.floor(w * scaleFactor));
    const lh = Math.max(16, Math.floor(h * scaleFactor));
    
    if (lowResCanvas.width !== lw || lowResCanvas.height !== lh) {
      lowResCanvas.width = lw;
      lowResCanvas.height = lh;
    }

    // 2. Gambar video ke ukuran kecil (menghilangkan detail tajam)
    lowCtx.drawImage(video, 0, 0, lw, lh);

    // 3. Tarik lagi ke ukuran asli dengan smoothing = true
    // Ini menghasilkan efek blur & "color smearing" khas resolusi kecil
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "low";
    ctx.drawImage(lowResCanvas, 0, 0, lw, lh, 0, 0, w, h);
    
  }, [intensity]);

  const onLoadedMeta = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    // Batasi resolusi max (misal tinggi 480px) agar efek kompresi lebih terasa
    // dan pastikan genap untuk codec H.264
    let vw = video.videoWidth || 640;
    let vh = video.videoHeight || 360;
    
    if (vh > 480) {
      const ratio = 480 / vh;
      vh = 480;
      vw = vw * ratio;
    }

    canvas.width = Math.round(vw) & ~1;
    canvas.height = Math.round(vh) & ~1;
    
    setReady(true);
    setStatus("previewing");
    video.currentTime = Math.min(0.2, video.duration || 0);
  };

  // Loop preview dengan membatasi FPS agar terlihat patah-patah
  useEffect(() => {
    if (status !== "previewing") return;
    
    let raf;
    let lastDraw = 0;
    const loop = (timestamp) => {
      raf = requestAnimationFrame(loop);
      const { fps } = computeParams(intensity);
      const interval = 1000 / fps;
      
      if (timestamp - lastDraw >= interval) {
        drawFrame();
        lastDraw = timestamp;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, drawFrame, intensity]);

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
      const watchdogId = setTimeout(finish, dur ? dur * 1000 + 5000 : 3 * 60 * 1000);
      let lastTime = video.currentTime;
      let stuckTicks = 0;
      const stallId = setInterval(() => {
        if (video.ended || video.paused) return;
        if (Math.abs(video.currentTime - lastTime) < 0.01) stuckTicks++;
        else { stuckTicks = 0; lastTime = video.currentTime; }
        if (stuckTicks >= 4) finish();
      }, 1000);
    });
  };

  const handleProcess = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

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

      const params = computeParams(intensity);
      
      // Ambil stream dari canvas sesuai FPS burik
      const canvasStream = canvas.captureStream(params.fps);
      const audioStream = video.captureStream();
      let audioTracks = audioStream.getAudioTracks();

      if (audioTracks.length > 0) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));

        // 1. Lowpass filter (Bikin suara mendem kayak direkam HP jadul)
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = params.audioCutoff;

        let lastNode = lowpass;

        // 2. Distortion (Bikin suara pecah jika intensitas parah)
        if (params.audioDistortion > 0) {
          const distortion = audioCtx.createWaveShaper();
          distortion.curve = makeDistortionCurve(params.audioDistortion);
          distortion.oversample = "none";
          lastNode.connect(distortion);
          lastNode = distortion;
        }

        const dest = audioCtx.createMediaStreamDestination();
        source.connect(lowpass);
        lastNode.connect(dest);
        audioTracks = dest.stream.getAudioTracks();
      }

      const combined = new MediaStream([
        canvasStream.getVideoTracks()[0],
        ...audioTracks,
      ]);

      let mimeType = "video/mp4";
      let ext = "mp4";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp9,opus";
        ext = "webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
      }

      setFileExt(ext);

      // Bitrate yang dicekik ini yang bikin artefak kompresi alami (kotak-kotak/blur)!
      recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond: params.videoBitrate,
        audioBitsPerSecond: params.audioBitrate,
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const stopped = new Promise(resolve => recorder.onstop = resolve);
      recorder.start(500);

      const duration = video.duration || 0;
      let lastDraw = 0;
      
      const tick = (timestamp) => {
        const interval = 1000 / params.fps;
        if (timestamp - lastDraw >= interval) {
          drawFrame();
          lastDraw = timestamp;
        }
        if (duration > 0) {
          setProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }
        localRaf = requestAnimationFrame(tick);
      };
      localRaf = requestAnimationFrame(tick);

      await video.play();
      await waitForVideoToFinish(video);

      cancelAnimationFrame(localRaf);
      if (recorder.state !== "inactive") recorder.stop();
      await stopped;

      if (audioCtxRef.current) {
        await audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      if (chunks.length === 0) throw new Error("Gagal merekam data");

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setOutputURL(url);
      setProgress(100);
      setStatus("done");

    } catch (err) {
      console.error(err);
      if (localRaf) cancelAnimationFrame(localRaf);
      if (recorder && recorder.state !== "inactive") try { recorder.stop(); } catch (_) {}
      if (audioCtxRef.current) {
        try { await audioCtxRef.current.close(); } catch (_) {}
        audioCtxRef.current = null;
      }
      setErrorMsg("Gagal memproses: " + (err?.message || "error tidak diketahui"));
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
            Bikin video burik natural kayak direpost di WhatsApp 100x. Resolusi blur, patah-patah, suaranya pecah & mendem. Ekspor ke MP4 rasio asli.
          </p>
        </div>
      </section>

      <section style={styles.panel}>
        <div style={styles.row}>
          <button style={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
            {fileName ? "GANTI VIDEO" : "PILIH VIDEO"}
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={onPickFile} style={{ display: "none" }} />
          <span style={styles.fileName}>{fileName || "belum ada video"}</span>
        </div>

        {videoURL && (
          <>
            <video ref={videoRef} src={videoURL} onLoadedMetadata={onLoadedMeta} style={{ display: "none" }} playsInline muted />

            <div style={styles.previewWrap}>
              <canvas ref={canvasRef} style={styles.previewCanvas} />
              <canvas ref={lowResCanvasRef} style={{ display: "none" }} />
              <div style={styles.recBadge}>{status === "processing" ? "● REC" : "● PREVIEW"}</div>
            </div>

            <div style={styles.presetRow}>
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  style={{ ...styles.presetBtn, ...(presetKey === key ? styles.presetBtnActive : {}) }}
                >
                  {PRESETS[key].label}
                </button>
              ))}
            </div>

            <div style={styles.sliders}>
              <label style={styles.sliderLabel}>
                <div style={styles.sliderTop}>
                  <span>TINGKAT BURIK (Blur, Patah-patah, Suara Pecah)</span>
                  <span style={{ color: "var(--amber)" }}>{intensity.toFixed(1)} / 10</span>
                </div>
                <input
                  type="range" min={0.5} max={10} step={0.1} value={intensity}
                  onChange={(e) => { setPresetKey("custom"); setIntensity(parseFloat(e.target.value)); }}
                  style={styles.slider}
                />
              </label>
            </div>

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
                <a href={outputURL} download={`burikin_natural.${fileExt}`} style={styles.downloadLink}>
                  ⬇ DOWNLOAD HASIL (.{fileExt})
                </a>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 60px" },
  hero: { position: "relative", padding: "56px 0 28px", overflow: "hidden", borderBottom: "1px solid var(--line)" },
  heroNoise: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5, filter: "contrast(1.4)" },
  heroInner: { position: "relative", zIndex: 1 },
  eyebrow: { fontFamily: "var(--mono-display)", fontSize: 12, letterSpacing: "0.08em", color: "var(--green)", marginBottom: 14 },
  h1: { fontFamily: "var(--mono-display)", fontSize: "clamp(40px, 10vw, 72px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 },
  tagline: { marginTop: 14, color: "var(--dim)", fontSize: 14, lineHeight: 1.6, maxWidth: 480 },
  panel: { paddingTop: 28 },
  row: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  uploadBtn: { background: "var(--amber)", color: "#000", border: "none", padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  fileName: { color: "var(--dim)", fontSize: 13, wordBreak: "break-all" },
  previewWrap: { position: "relative", marginTop: 22, border: "1px solid var(--line)", background: "#000", display: "flex", justifyContent: "center" },
  previewCanvas: { width: "100%", height: "auto", maxHeight: "65vh", objectFit: "contain", display: "block" },
  recBadge: { position: "absolute", top: 8, right: 10, fontFamily: "var(--mono-display)", fontSize: 11, color: "var(--danger)" },
  presetRow: { display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" },
  presetBtn: { background: "var(--panel)", border: "1px solid var(--line)", color: "var(--dim)", padding: "8px 14px", fontSize: 12, cursor: "pointer" },
  presetBtnActive: { borderColor: "var(--amber)", color: "var(--amber)" },
  sliders: { marginTop: 20, marginBottom: 20, display: "grid", gap: 14, background: "var(--panel)", border: "1px solid var(--line)", padding: 18 },
  sliderLabel: { display: "block", fontSize: 12, color: "var(--text)" },
  sliderTop: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  slider: { width: "100%" },
  processBtn: { width: "100%", background: "var(--green)", color: "#000", border: "none", padding: "16px", fontWeight: 800, fontSize: 14 },
  error: { color: "var(--danger)", fontSize: 13, marginTop: 12 },
  resultBox: { marginTop: 26, border: "1px solid var(--line)", padding: 16, background: "var(--panel)" },
  resultVideo: { width: "100%", height: "auto", maxHeight: "65vh", objectFit: "contain", display: "block", background: "#000" },
  downloadLink: { display: "inline-block", marginTop: 14, color: "var(--amber)", fontFamily: "var(--mono-display)", fontSize: 13, textDecoration: "none", border: "1px solid var(--amber)", padding: "10px 16px" },
};
