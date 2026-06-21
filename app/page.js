"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Preset mengubah state secara spesifik
const PRESETS = {
  ringan: { label: "RINGAN", res: 360, fps: 24, vQuality: 3, aQuality: 3, pixel: 1, stretch: 1 },
  sedang: { label: "SEDANG", res: 240, fps: 15, vQuality: 2, aQuality: 2, pixel: 1, stretch: 1 },
  parah: { label: "PARAH", res: 144, fps: 8, vQuality: 1, aQuality: 1, pixel: 2, stretch: 1 },
};

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
  const pixelCanvasRef = useRef(null); // Canvas tersembunyi untuk efek kotak-kotak
  const audioCtxRef = useRef(null);
  const heroCanvasRef = useRef(null);

  // States dasar
  const [fileName, setFileName] = useState("");
  const [videoURL, setVideoURL] = useState(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [outputURL, setOutputURL] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fileExt, setFileExt] = useState("mp4");
  const [visitorCount, setVisitorCount] = useState(null);
  const [presetKey, setPresetKey] = useState("sedang");

  // States Parameter Lanjutan (Kualitas)
  const [resHeight, setResHeight] = useState(240); // 144, 240, 360, 480, 0
  const [fpsTarget, setFpsTarget] = useState(15); 
  const [videoQuality, setVideoQuality] = useState(2); 
  const [audioQuality, setAudioQuality] = useState(2); 
  
  // States Parameter Tambahan (Efek Lucu)
  const [pixelScale, setPixelScale] = useState(1); // 1, 2, 4, 8, 16 (Ukuran kotak piksel)
  const [stretchFactor, setStretchFactor] = useState(1); // 0.5 (Tinggi), 1 (Normal), 2 (Gepeng), 3 (Super Gepeng)

  // Hitung ulang ukuran canvas tiap kali resHeight atau stretchFactor berubah
  const updateCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let vh = video.videoHeight || 360;
    let vw = video.videoWidth || 640;

    let targetH = resHeight === 0 ? vh : resHeight;
    if (targetH > vh) targetH = vh;

    const baseRatio = vw / vh;
    // Terapkan stretch factor di sini untuk efek GEPENG wkwk
    let targetW = targetH * baseRatio * stretchFactor;

    // Batasi lebar maksimum agar browser tidak crash kalau terlalu gepeng
    if (targetW > 1920) {
      targetW = 1920;
      targetH = targetW / (baseRatio * stretchFactor);
    }

    // ATURAN WAJIB MP4: Harus angka genap
    canvas.width = Math.round(targetW) & ~1;
    canvas.height = Math.round(targetH) & ~1;
  }, [resHeight, stretchFactor]);

  // Efek ganti preset
  const applyPreset = (key) => {
    setPresetKey(key);
    if (PRESETS[key]) {
      setResHeight(PRESETS[key].res);
      setFpsTarget(PRESETS[key].fps);
      setVideoQuality(PRESETS[key].vQuality);
      setAudioQuality(PRESETS[key].aQuality);
      setPixelScale(PRESETS[key].pixel);
      setStretchFactor(PRESETS[key].stretch);
    }
  };

  // Ubah tombol preset jadi off kalau diatur manual
  useEffect(() => {
    if (PRESETS[presetKey]) {
      const p = PRESETS[presetKey];
      if (
        resHeight !== p.res ||
        fpsTarget !== p.fps ||
        videoQuality !== p.vQuality ||
        audioQuality !== p.aQuality ||
        pixelScale !== p.pixel ||
        stretchFactor !== p.stretch
      ) {
        setPresetKey("custom");
      }
    }
  }, [resHeight, fpsTarget, videoQuality, audioQuality, pixelScale, stretchFactor, presetKey]);

  // Update canvas kalau resolusi/bentuk diubah saat preview jalan
  useEffect(() => {
    if (status === "previewing" || status === "idle") {
      updateCanvasSize();
    }
  }, [resHeight, stretchFactor, updateCanvasSize, status]);

  useEffect(() => {
    fetch("https://api.counterapi.dev/v1/burikin-zals-app/visitor/up")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.count) setVisitorCount(data.count);
      })
      .catch((err) => console.error("Gagal load visitor counter", err));
  }, []);

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

  const drawFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const pCanvas = pixelCanvasRef.current;
    if (!video || !canvas || !pCanvas) return;
    
    const ctx = canvas.getContext("2d");
    const pCtx = pCanvas.getContext("2d");
    
    const contrast = videoQuality === 1 ? 1.15 : videoQuality === 2 ? 1.05 : 1;
    const saturate = videoQuality === 1 ? 1.2 : videoQuality === 2 ? 1.1 : 1;

    // Jika mode kotak-kotak piksel aktif
    if (pixelScale > 1) {
      const pw = Math.max(2, Math.floor(canvas.width / pixelScale));
      const ph = Math.max(2, Math.floor(canvas.height / pixelScale));
      
      if (pCanvas.width !== pw || pCanvas.height !== ph) {
        pCanvas.width = pw;
        pCanvas.height = ph;
      }

      // Gambar ke ukuran super kecil
      pCtx.drawImage(video, 0, 0, pw, ph);

      // Tarik kembali ke ukuran besar TANPA image smoothing (menghasilkan kotak-kotak tajam/Minecraft)
      ctx.imageSmoothingEnabled = false;
      ctx.filter = `contrast(${contrast}) saturate(${saturate})`;
      ctx.drawImage(pCanvas, 0, 0, pw, ph, 0, 0, canvas.width, canvas.height);
    } else {
      // Jika mode normal (burik smearing alami)
      ctx.imageSmoothingEnabled = true;
      ctx.filter = `contrast(${contrast}) saturate(${saturate})`;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  }, [videoQuality, pixelScale]);

  const onLoadedMeta = () => {
    updateCanvasSize();
    setReady(true);
    setStatus("previewing");
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(0.2, videoRef.current.duration || 0);
    }
  };

  useEffect(() => {
    if (status !== "previewing") return;
    let raf;
    let lastDraw = 0;
    const loop = (timestamp) => {
      raf = requestAnimationFrame(loop);
      const interval = 1000 / fpsTarget;
      if (timestamp - lastDraw >= interval) {
        drawFrame();
        lastDraw = timestamp;
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, drawFrame, fpsTarget]);

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

      const canvasStream = canvas.captureStream(30); 
      const audioStream = video.captureStream();
      let audioTracks = audioStream.getAudioTracks();

      if (audioTracks.length > 0) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx({ sampleRate: 44100 });
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));

        let cutoff = 20000;
        let dist = 0;
        if (audioQuality === 1) { cutoff = 1500; dist = 30; } 
        else if (audioQuality === 2) { cutoff = 3000; dist = 5; } 
        else if (audioQuality === 3) { cutoff = 8000; dist = 0; } 

        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = cutoff;

        let lastNode = lowpass;

        if (dist > 0) {
          const distortion = audioCtx.createWaveShaper();
          distortion.curve = makeDistortionCurve(dist);
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

      let mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      let ext = "mp4";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8,opus";
        ext = "webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
      }

      setFileExt(ext);

      let targetVBitrate = 1_000_000;
      if (videoQuality === 1) targetVBitrate = 80_000; // Aman dari korup
      else if (videoQuality === 2) targetVBitrate = 200_000; 
      else if (videoQuality === 3) targetVBitrate = 500_000; 

      recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond: targetVBitrate,
        audioBitsPerSecond: 64_000, 
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const stopped = new Promise(resolve => recorder.onstop = resolve);
      recorder.start(); 

      const duration = video.duration || 0;
      let lastDraw = 0;
      
      const tick = (timestamp) => {
        const interval = 1000 / fpsTarget;
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

  const getOutputFilename = () => {
    if (!fileName) return `burik.${fileExt}`;
    const dotIndex = fileName.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
    
    let affix = "_burik";
    if (stretchFactor > 1) affix += "_gepeng";
    
    return `${baseName}${affix}.${fileExt}`;
  };

  return (
    <main style={styles.main}>
      <header style={styles.headerBar}>
        <div style={styles.credits}>
          <span style={styles.visitorBadge}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {visitorCount !== null ? visitorCount : "--"} Total Pengunjung
          </span>
        </div>
        <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={styles.waLink}>
          JOIN SALURAN WA
        </a>
      </header>

      <section style={styles.hero}>
        <canvas ref={heroCanvasRef} style={styles.heroNoise} />
        <div style={styles.heroInner}>
          <div style={styles.eyebrow}>// NO SIGNAL — PROSES LOKAL DI PERANGKATMU</div>
          <h1 style={styles.h1}>BURIKIN-AJA<span style={{ color: "var(--amber)" }}>.</span></h1>
          <p style={styles.tagline}>
            Bikin video burik kaya direpost berkali-kali, atau bikin videonya gepeng absurd buat meme dengan mudah.
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
              <canvas ref={pixelCanvasRef} style={{ display: "none" }} />
              <div style={styles.recBadge}>{status === "processing" ? "● BURIK" : "● PREVIEW"}</div>
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
              <button 
                style={{ ...styles.presetBtn, ...(presetKey === "custom" ? styles.presetBtnActive : {}) }}
                onClick={() => setPresetKey("custom")}
              >
                KUSTOM
              </button>
            </div>

            {/* PARAMETER EDIT LANJUTAN */}
            <div style={styles.settingsGrid}>
              
              <div style={styles.setSectionGroup}>
                <div style={styles.setSectionTitle}>🛠️ VISUAL & AUDIO</div>
                
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>Resolusi Output</span>
                  <select style={styles.setSelect} value={resHeight} onChange={(e) => setResHeight(Number(e.target.value))}>
                    <option value={144}>140p / 144p (Sangat Buram)</option>
                    <option value={240}>240p (Buram)</option>
                    <option value={360}>360p (Standar)</option>
                    <option value={480}>480p (Lumayan)</option>
                    <option value={0}>Sesuai Ukuran Asli</option>
                  </select>
                </label>

                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>Frame Rate (FPS)</span>
                  <select style={styles.setSelect} value={fpsTarget} onChange={(e) => setFpsTarget(Number(e.target.value))}>
                    <option value={8}>8 FPS (Sangat Patah-patah)</option>
                    <option value={12}>12 FPS (Patah-patah)</option>
                    <option value={15}>15 FPS (Kurang Lancar)</option>
                    <option value={24}>24 FPS (Normal Film)</option>
                    <option value={30}>30 FPS (Lancar)</option>
                  </select>
                </label>

                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>Kompresi Video (Bitrate)</span>
                  <select style={styles.setSelect} value={videoQuality} onChange={(e) => setVideoQuality(Number(e.target.value))}>
                    <option value={1}>Parah (Artefak Kompresi)</option>
                    <option value={2}>Sedang (Sedikit Artefak)</option>
                    <option value={3}>Bagus (Normal)</option>
                    <option value={4}>Sangat Bagus (Jernih)</option>
                  </select>
                </label>

                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>Kualitas Suara (Audio)</span>
                  <select style={styles.setSelect} value={audioQuality} onChange={(e) => setAudioQuality(Number(e.target.value))}>
                    <option value={1}>Hancur (Pecah & Kresek)</option>
                    <option value={2}>Mendem (Kaya HP Jadul)</option>
                    <option value={3}>Biasa (Sedikit Teredam)</option>
                    <option value={4}>Normal (Jernih Asli)</option>
                  </select>
                </label>
              </div>

              <div style={styles.setSectionGroup}>
                <div style={styles.setSectionTitle}>👽 EFEK ABSURD</div>
                
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>Kotak-Kotak (Pixel)</span>
                  <select style={styles.setSelect} value={pixelScale} onChange={(e) => setPixelScale(Number(e.target.value))}>
                    <option value={1}>Mulus (Asli)</option>
                    <option value={2}>Kotak Halus</option>
                    <option value={4}>Kotak Sedang</option>
                    <option value={8}>Kotak Besar (Retro 8-bit)</option>
                    <option value={16}>Kotak Raksasa (Minecraft)</option>
                  </select>
                </label>

                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>Rasio Video (Gepengin Wkwk)</span>
                  <select style={styles.setSelect} value={stretchFactor} onChange={(e) => setStretchFactor(Number(e.target.value))}>
                    <option value={0.5}>Kurus Kering (Tinggi)</option>
                    <option value={1}>Normal (Sesuai Asli)</option>
                    <option value={1.5}>Lumayan Lebar</option>
                    <option value={2}>Gepeng (Wide)</option>
                    <option value={3}>Super Gepeng Parah</option>
                  </select>
                </label>
              </div>

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
                <a href={outputURL} download={getOutputFilename()} style={styles.downloadLink}>
                  ⬇ DOWNLOAD HASIL (.{fileExt})
                </a>
              </div>
            )}
          </>
        )}
      </section>

      <footer style={styles.footer}>
        Dibuat oleh <strong>zals</strong> — Diproses 100% di perangkatmu, tanpa server. <br/>
        <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={{color: "var(--amber)", textDecoration: "none"}}>Gabung Saluran WhatsApp</a>
      </footer>
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 60px" },
  headerBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px dashed var(--line)" },
  credits: { display: "flex", alignItems: "center", gap: "12px", fontSize: 13, color: "var(--dim)" },
  visitorBadge: { display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--panel)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: "4px", fontSize: 11, color: "var(--amber)", fontFamily: "var(--mono-display)" },
  waLink: { background: "var(--amber)", color: "#000", textDecoration: "none", padding: "6px 12px", fontSize: 11, fontWeight: "bold", borderRadius: 4 },
  hero: { position: "relative", padding: "40px 0 28px", overflow: "hidden", borderBottom: "1px solid var(--line)" },
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
  
  // Gaya baru untuk Grid Parameter Edit
  settingsGrid: { marginTop: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr", gap: 24, background: "var(--panel)", border: "1px solid var(--line)", padding: 20 },
  setSectionGroup: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 },
  setSectionTitle: { gridColumn: "1 / -1", fontSize: 14, fontWeight: "bold", color: "var(--text)", borderBottom: "1px solid var(--line)", paddingBottom: 8, marginBottom: 4 },
  
  setLabel: { display: "flex", flexDirection: "column", gap: 6 },
  setTitle: { fontSize: 12, color: "var(--amber)", fontWeight: "bold" },
  setSelect: { background: "#000", color: "#fff", border: "1px solid var(--line)", padding: "10px", fontSize: 13, fontFamily: "inherit" },
  
  processBtn: { width: "100%", background: "var(--green)", color: "#000", border: "none", padding: "16px", fontWeight: 800, fontSize: 14 },
  error: { color: "var(--danger)", fontSize: 13, marginTop: 12 },
  resultBox: { marginTop: 26, border: "1px solid var(--line)", padding: 16, background: "var(--panel)" },
  resultVideo: { width: "100%", height: "auto", maxHeight: "65vh", objectFit: "contain", display: "block", background: "#000" },
  downloadLink: { display: "inline-block", marginTop: 14, color: "var(--amber)", fontFamily: "var(--mono-display)", fontSize: 13, textDecoration: "none", border: "1px solid var(--amber)", padding: "10px 16px" },
  footer: { marginTop: 50, color: "var(--dim)", fontSize: 12, textAlign: "center", lineHeight: 1.6 }
};
