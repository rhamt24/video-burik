"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const PRESETS = {
  ringan: { label: "RINGAN", noise: 0.10, scan: 0.10, chroma: 0, jitter: 0, vignette: 0.15, pixel: 0, posterize: 0, audioCrush: 0 },
  sedang: { label: "SEDANG", noise: 0.22, scan: 0.30, chroma: 1.5, jitter: 1, vignette: 0.30, pixel: 0, posterize: 0, audioCrush: 0 },
  berat: { label: "BERAT", noise: 0.38, scan: 0.55, chroma: 3.5, jitter: 2.5, vignette: 0.45, pixel: 0, posterize: 0, audioCrush: 0 },
  jadul3gp: { label: "3GP JADUL", noise: 0.18, scan: 0.15, chroma: 1, jitter: 0.8, vignette: 0.2, pixel: 10, posterize: 16, audioCrush: 0.75 },
  custom: { label: "CUSTOM", noise: 0.22, scan: 0.30, chroma: 1.5, jitter: 1, vignette: 0.30, pixel: 0, posterize: 0, audioCrush: 0 },
};

export default function Page() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const noiseRef = useRef(null);
  const pixelRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const heroCanvasRef = useRef(null);

  const [fileName, setFileName] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [ready, setReady] = useState(false);
  const [presetKey, setPresetKey] = useState("sedang");
  const [settings, setSettings] = useState(PRESETS.sedang);
  const [status, setStatus] = useState("idle"); // idle | previewing | processing | done | error
  const [progress, setProgress] = useState(0);
  const [outputURL, setOutputURL] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // ---- hero static noise (decorative, page chrome only) ----
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
    if (key !== "custom") setSettings(PRESETS[key]);
  };

  const updateCustom = (patch) => {
    setPresetKey("custom");
    setSettings((s) => ({ ...s, ...patch }));
  };

  // ---- live preview render loop on the working canvas ----
  const drawFrame = useCallback((bake) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();

    // jitter (VHS tracking wobble)
    const jx = settings.jitter ? (Math.random() - 0.5) * settings.jitter * 4 : 0;
    const jy = settings.jitter ? (Math.random() - 0.5) * settings.jitter * 1.5 : 0;
    ctx.translate(jx, jy);

    if (settings.pixel > 0) {
      // downscale to a tiny "144p-and-below" buffer, posterize it there
      // (cheap, since the buffer is small), then blow it back up with
      // smoothing disabled so the blocks stay hard-edged like an old codec.
      const pixelCanvas = pixelRef.current;
      const blockDivisor = Math.max(2, settings.pixel);
      const pw = Math.max(8, Math.floor(w / blockDivisor));
      const ph = Math.max(8, Math.floor(h / blockDivisor));
      if (pixelCanvas.width !== pw || pixelCanvas.height !== ph) {
        pixelCanvas.width = pw;
        pixelCanvas.height = ph;
      }
      const pctx = pixelCanvas.getContext("2d");
      pctx.imageSmoothingEnabled = false;
      pctx.drawImage(video, 0, 0, pw, ph);

      if (settings.posterize > 0) {
        const levels = Math.max(2, Math.round(settings.posterize));
        const step = 255 / (levels - 1);
        const imgData = pctx.getImageData(0, 0, pw, ph);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.round(Math.round(d[i] / step) * step);
          d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
          d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
        }
        pctx.putImageData(imgData, 0, 0);
      }

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pixelCanvas, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.drawImage(video, 0, 0, w, h);
    }

    // chromatic aberration: tinted offset copies, screen blend
    if (settings.chroma > 0) {
      const off = settings.chroma;
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.35;

      ctx.save();
      ctx.translate(off, 0);
      ctx.fillStyle = "rgba(255,0,60,1)";
      ctx.globalCompositeOperation = "multiply";
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      ctx.globalCompositeOperation = "screen";
      ctx.save();
      ctx.translate(-off, 0);
      if (settings.pixel > 0) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pixelRef.current, 0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
      } else {
        ctx.drawImage(video, 0, 0, w, h);
      }
      ctx.restore();

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    // grain / noise
    if (settings.noise > 0) {
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
      ctx.globalAlpha = settings.noise;
      ctx.globalCompositeOperation = "overlay";
      ctx.drawImage(noiseCanvas, 0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    // scanlines (baked into export, not just CSS decoration)
    if (settings.scan > 0) {
      ctx.globalAlpha = Math.min(settings.scan, 1);
      ctx.fillStyle = "#000000";
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.globalAlpha = 1;
    }

    // vignette
    if (settings.vignette > 0) {
      const grad = ctx.createRadialGradient(
        w / 2, h / 2, h * 0.25,
        w / 2, h / 2, h * 0.75
      );
      grad.addColorStop(0, "rgba(0,0,0,0)");
      grad.addColorStop(1, `rgba(0,0,0,${settings.vignette})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();

    if (bake) rafRef.current = requestAnimationFrame(() => drawFrame(true));
  }, [settings]);

  // start a lightweight preview loop once video metadata is ready
  const onLoadedMeta = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    setReady(true);
    setStatus("previewing");
    video.currentTime = Math.min(0.2, video.duration || 0);
  };

  useEffect(() => {
    if (status !== "previewing") return;
    const video = videoRef.current;
    if (!video) return;
    let raf;
    const loop = () => {
      drawFrame(false);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status, drawFrame]);

  const handleProcess = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (typeof canvas.captureStream !== "function" || typeof video.captureStream !== "function") {
      setErrorMsg("Browser ini tidak mendukung pemrosesan video langsung di perangkat. Coba pakai Chrome atau Edge versi terbaru.");
      setStatus("error");
      return;
    }

    setStatus("processing");
    setProgress(0);
    setOutputURL(null);
    setErrorMsg(null);

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

      // optionally route audio through a lo-fi chain so it sounds as
      // burik as the picture: sample-and-hold downsample -> lowpass -> bitcrush
      if (settings.audioCrush > 0 && audioTracks.length > 0) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));

        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 8000 - settings.audioCrush * 6500;

        const holdFactor = Math.max(1, Math.round(settings.audioCrush * 10));
        const crusher = audioCtx.createScriptProcessor(4096, 1, 1);
        let holdCounter = 0;
        let lastSample = 0;
        const bitLevels = Math.max(4, Math.round(64 - settings.audioCrush * 56));
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
        crusher.connect(audioCtx.destination); // so user can still hear it live
        audioTracks = dest.stream.getAudioTracks();
      }

      const combined = new MediaStream([
        canvasStream.getVideoTracks()[0],
        ...audioTracks,
      ]);

      let mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8,opus";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const lowBitrate = settings.pixel > 0 || settings.audioCrush > 0;
      const recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond: lowBitrate ? 250_000 : 6_000_000,
        audioBitsPerSecond: lowBitrate ? 24_000 : 128_000,
      });
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const finished = new Promise((resolve) => {
        recorder.onstop = resolve;
      });

      recorder.start();

      const duration = video.duration || 0;
      const tick = () => {
        drawFrame(false);
        if (duration > 0) {
          setProgress(Math.min(99, Math.round((video.currentTime / duration) * 100)));
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      await video.play();

      await new Promise((resolve) => {
        video.onended = resolve;
      });

      cancelAnimationFrame(rafRef.current);
      recorder.stop();
      await finished;

      if (audioCtxRef.current) {
        await audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setOutputURL(url);
      setProgress(100);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal memproses video: " + (err?.message || "error tidak diketahui"));
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
            Tambahin grain, scanline, jitter VHS, sampai tampilan video 3GP
            jadul 144p-ke-bawah lengkap dengan suara yang ikut burik. Semua
            diproses langsung di browser — tidak ada file yang diunggah ke
            server.
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
              <canvas ref={noiseRef} style={{ display: "none" }} />
              <canvas ref={pixelRef} style={{ display: "none" }} />
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
              <Slider label="NOISE" value={settings.noise} max={0.6} step={0.01}
                onChange={(v) => updateCustom({ noise: v })} />
              <Slider label="SCANLINE" value={settings.scan} max={1} step={0.01}
                onChange={(v) => updateCustom({ scan: v })} />
              <Slider label="CHROMATIC AB." value={settings.chroma} max={8} step={0.1}
                onChange={(v) => updateCustom({ chroma: v })} />
              <Slider label="JITTER" value={settings.jitter} max={6} step={0.1}
                onChange={(v) => updateCustom({ jitter: v })} />
              <Slider label="VIGNETTE" value={settings.vignette} max={0.7} step={0.01}
                onChange={(v) => updateCustom({ vignette: v })} />
              <Slider label="PIXELATED (144p--)" value={settings.pixel} max={20} step={1}
                onChange={(v) => updateCustom({ pixel: v })} />
              <Slider label="POSTERIZE WARNA" value={settings.posterize} max={32} step={1}
                onChange={(v) => updateCustom({ posterize: v })} />
              <Slider label="AUDIO BURIK (bitrate jadul)" value={settings.audioCrush} max={1} step={0.01}
                onChange={(v) => updateCustom({ audioCrush: v })} />
            </div>

            <p style={styles.note}>
              Saat tombol proses ditekan, video akan diputar sekali dari awal sampai
              akhir untuk direkam ulang dengan efeknya. Kalau slider AUDIO BURIK
              dinaikkan, suaranya juga ikut digilas turun bitrate-nya (lo-fi,
              kemriyek, kayak audio video 3GP jadul). Jangan tutup tab selama
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
              {status === "processing" ? `MEMPROSES... ${progress}%` : "BIKIN BURIK & DOWNLOAD"}
            </button>

            {errorMsg && <p style={styles.error}>{errorMsg}</p>}

            {outputURL && (
              <div style={styles.resultBox}>
                <video src={outputURL} controls style={styles.resultVideo} />
                <a href={outputURL} download="burik-fx.webm" style={styles.downloadLink}>
                  ⬇ DOWNLOAD HASIL (.webm)
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

function Slider({ label, value, max, step, onChange }) {
  return (
    <label style={styles.sliderLabel}>
      <div style={styles.sliderTop}>
        <span>{label}</span>
        <span style={{ color: "var(--amber)" }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={styles.slider}
      />
    </label>
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
  },
  previewCanvas: { width: "100%", display: "block" },
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
  resultVideo: { width: "100%", display: "block", background: "#000" },
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
