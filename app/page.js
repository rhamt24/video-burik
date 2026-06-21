"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const PRESETS = {
  ringan: { label: "RINGAN", intensity: 3 },
  sedang: { label: "SEDANG", intensity: 6 },
  parah: { label: "PARAH", intensity: 9 },
  custom: { label: "CUSTOM", intensity: 6 },
};

function computeParams(intensity) {
  const i = Math.min(10, Math.max(0.5, intensity));
  return {
    // FPS patah-patah khas video repost (turun ke 12 - 24 fps)
    fps: Math.max(12, Math.round(30 - (i * 1.8))),
    
    // INI KUNCINYA: Bitrate dicekik parah (20kbps - 300kbps) 
    // agar encoder MediaRecorder menghasilkan efek kotak-kotak kompresi (macroblocking) natural.
    videoBitrate: Math.max(20_000, Math.round(350_000 - (i * 33_000))),
    
    // Audio bitrate ditahan di batas aman 32kbps agar TIDAK dibuang/di-mute oleh WhatsApp
    audioBitrate: Math.max(32_000, Math.round(64_000 - (i * 3_000))),
    
    // Memotong frekuensi tinggi agar suara mendem
    audioCutoff: Math.max(2000, Math.round(10000 - (i * 800))),
    
    // Distorsi (suara pecah kresek-kresek)
    audioDistortion: i > 5 ? (i - 4) * 12 : 0,

    // Efek warna: video repost biasanya makin kontras & warnanya sedikit kacau
    contrast: 1 + (i * 0.02),
    saturate: 1 + (i * 0.04),
  };
}

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
  const audioCtxRef = useRef(null);
  const heroCanvasRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [videoURL, setVideoURL] = useState(null);
  const [ready, setReady] = useState(false);
  const [presetKey, setPresetKey] = useState("sedang");
  const [intensity, setIntensity] = useState(PRESETS.sedang.intensity);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [outputURL, setOutputURL] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [fileExt, setFileExt] = useState("mp4");
  
  // State untuk menyimpan jumlah visitor
  const [visitorCount, setVisitorCount] = useState(null);

  // Efek untuk mengambil & menambah jumlah visitor saat web pertama kali dimuat
  useEffect(() => {
    // Menggunakan API gratis dari counterapi.dev dengan namespace unik "burikin-zals"
    fetch("https://api.counterapi.dev/v1/burikin-zals-app/visitor/up")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.count) {
          setVisitorCount(data.count);
        }
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
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    const { contrast, saturate } = computeParams(intensity);

    ctx.filter = `contrast(${contrast}) saturate(${saturate})`;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, [intensity]);

  const onLoadedMeta = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    // Turunkan resolusi ke sekitar 360p atau 240p untuk membantu efek burik
    let vw = video.videoWidth || 640;
    let vh = video.videoHeight || 360;
    
    const maxHeight = 360; 
    if (vh > maxHeight) {
      const ratio = maxHeight / vh;
      vh = maxHeight;
      vw = vw * ratio;
    }

    // Pastikan resolusi genap (syarat wajib MP4 H.264)
    canvas.width = Math.round(vw) & ~1;
    canvas.height = Math.round(vh) & ~1;
    
    setReady(true);
    setStatus("previewing");
    video.currentTime = Math.min(0.2, video.duration || 0);
  };

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
      const canvasStream = canvas.captureStream(params.fps);
      const audioStream = video.captureStream();
      let audioTracks = audioStream.getAudioTracks();

      if (audioTracks.length > 0) {
        // Paksa sample rate ke 44100 agar WA tidak menganggapnya file aneh/korup
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx({ sampleRate: 44100 });
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));

        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = params.audioCutoff;

        let lastNode = lowpass;

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

      // Aturan ketat MIME Type untuk WA
      let mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"'; // H264 + AAC
      let ext = "mp4";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback ke webm jika browser tidak support H.264
        mimeType = "video/webm;codecs=vp8,opus";
        ext = "webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
      }

      setFileExt(ext);

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

  // Fungsi untuk mendapatkan nama file output yang dinamis
  const getOutputFilename = () => {
    if (!fileName) return `burik.${fileExt}`;
    const dotIndex = fileName.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
    return `${baseName}_burik.${fileExt}`;
  };

  return (
    <main style={styles.main}>
      <header style={styles.headerBar}>
        <div style={styles.credits}>
          Created by <strong>zals</strong>
          <span style={styles.visitorBadge}>
            👁️ {visitorCount !== null ? visitorCount : "--"} views
          </span>
        </div>
        <a 
          href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={styles.waLink}
        >
          JOIN SALURAN WA
        </a>
      </header>

      <section style={styles.hero}>
        <canvas ref={heroCanvasRef} style={styles.heroNoise} />
        <div style={styles.heroInner}>
          <div style={styles.eyebrow}>// NO SIGNAL — PROSES LOKAL DI PERANGKATMU</div>
          <h1 style={styles.h1}>
            BURIKIN-AJA<span style={{ color: "var(--amber)" }}>.</span>
          </h1>
          <p style={styles.tagline}>
            Burikin aja, bikin video burik kaya status wa yang di repost berkali-kali 
            dengan mudah.
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
              <div style={styles.recBadge}>{status === "processing" ? "● BURIK" : "● PREVIEW"}</div>
            </div>

            <div style={styles.presetRow}>
              {Object.keys(PRESETS).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setPresetKey(key);
                    if (key !== "custom") setIntensity(PRESETS[key].intensity);
                  }}
                  style={{ ...styles.presetBtn, ...(presetKey === key ? styles.presetBtnActive : {}) }}
                >
                  {PRESETS[key].label}
                </button>
              ))}
            </div>

            <div style={styles.sliders}>
              <label style={styles.sliderLabel}>
                <div style={styles.sliderTop}>
                  <span>TINGKAT BURIK (Kompresi, Patah-patah, Suara Pecah)</span>
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
  visitorBadge: { background: "var(--panel)", border: "1px solid var(--line)", padding: "4px 8px", borderRadius: "4px", fontSize: 11, color: "var(--amber)", fontFamily: "var(--mono-display)" },
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
  sliders: { marginTop: 20, marginBottom: 20, display: "grid", gap: 14, background: "var(--panel)", border: "1px solid var(--line)", padding: 18 },
  sliderLabel: { display: "block", fontSize: 12, color: "var(--text)" },
  sliderTop: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  slider: { width: "100%" },
  processBtn: { width: "100%", background: "var(--green)", color: "#000", border: "none", padding: "16px", fontWeight: 800, fontSize: 14 },
  error: { color: "var(--danger)", fontSize: 13, marginTop: 12 },
  resultBox: { marginTop: 26, border: "1px solid var(--line)", padding: 16, background: "var(--panel)" },
  resultVideo: { width: "100%", height: "auto", maxHeight: "65vh", objectFit: "contain", display: "block", background: "#000" },
  downloadLink: { display: "inline-block", marginTop: 14, color: "var(--amber)", fontFamily: "var(--mono-display)", fontSize: 13, textDecoration: "none", border: "1px solid var(--amber)", padding: "10px 16px" },
  footer: { marginTop: 50, color: "var(--dim)", fontSize: 12, textAlign: "center", lineHeight: 1.6 }
};
