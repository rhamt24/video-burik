"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LANGUAGES, DEFAULT_LANG, getTranslations } from "./i18n";
import fixWebmDuration from "fix-webm-duration";

// Preset mengubah state secara spesifik
const PRESETS = {
  ringan: { label: "RINGAN", res: 360, fps: 24, vQuality: 3, aQuality: 3, pixel: 1, stretch: 1, color: 0 },
  sedang: { label: "SEDANG", res: 240, fps: 15, vQuality: 2, aQuality: 2, pixel: 1, stretch: 1, color: 0 },
  parah: { label: "PARAH", res: 144, fps: 8, vQuality: 1, aQuality: 1, pixel: 2, stretch: 1, color: 0 },
  majapahit: { label: "MAJAPAHIT", res: 144, fps: 12, vQuality: 1, aQuality: 2, pixel: 1, stretch: 1, color: 1 },
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

// Helper: render watermark di pojok kanan bawah canvas.
// Dipanggil SETELAH ctx.filter di-reset ke "none", sehingga teks ini
// tidak ikut terkena blur/pixelated/color filter dari efek burik.
function drawWatermark(ctx, w, h) {
  const text = "burikinaja.web.id";
  const margin = Math.max(6, Math.round(w * 0.018));
  const fontSize = Math.max(10, Math.round(w * 0.028));
  ctx.save();
  ctx.font = `700 ${fontSize}px monospace`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "right";
  const textW = ctx.measureText(text).width;
  const padX = fontSize * 0.55;
  const padY = fontSize * 0.4;
  const boxW = textW + padX * 2;
  const boxH = fontSize + padY * 2;
  const x = w - margin;
  const y = h - margin;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(x - boxW, y - boxH, boxW, boxH);
  ctx.fillStyle = "rgba(255,186,0,0.95)";
  ctx.fillText(text, x - padX, y - padY);
  ctx.restore();
}

// Helper: inject script tag sekali saja
function useScript(src, attrs = {}) {
  useEffect(() => {
    if (!src) return;
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    document.head.appendChild(s);
  }, [src]);
}

// AdSense banner (existing)
function AdBanner({ slotId }) {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);
  return (
    <div style={styles.adContainer}>
      <span style={styles.adLabel}>- Advertisement -</span>
      <ins className="adsbygoogle" style={{ display: "block" }}
        data-ad-client="ca-pub-6307870813026612" data-ad-slot={slotId}
        data-ad-format="auto" data-full-width-responsive="true" />
    </div>
  );
}

// EffectiveCPM — native/invoke banner (container style)
// Muat script invoke.js + render container div
function AdEffectiveCPMNative() {
  useScript(
    "https://pl30087445.effectivecpmnetwork.com/4357f30a7ce316369e54e9b449b4699b/invoke.js",
    { "data-cfasync": "false" }
  );
  return (
    <div style={styles.adContainer}>
      <span style={styles.adLabel}>- Advertisement -</span>
      <div id="container-4357f30a7ce316369e54e9b449b4699b" />
    </div>
  );
}

// EffectiveCPM — direct JS banner (pl30087444)
function AdEffectiveCPMDirect() {
  useScript("https://pl30087444.effectivecpmnetwork.com/07/a3/3f/07a33fee4a04d3d83f52cbd6617bb55a.js");
  return null; // script self-renders
}

// HighPerformanceFormat — iframe banner 468x60
function AdHighPerformance() {
  useEffect(() => {
    if (window._hpfLoaded) return;
    window._hpfLoaded = true;
    window.atOptions = {
      key: "ab33fad339c32cb68a3d74a345e9be0a",
      format: "iframe",
      height: 60,
      width: 468,
      params: {},
    };
    const s = document.createElement("script");
    s.src = "https://www.highperformanceformat.com/ab33fad339c32cb68a3d74a345e9be0a/invoke.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);
  return (
    <div style={{ ...styles.adContainer, overflow: "hidden" }}>
      <span style={styles.adLabel}>- Advertisement -</span>
    </div>
  );
}

// EffectiveCPM — popunder/onclick (pl30087448)
function AdEffectiveCPMPopunder() {
  useScript("https://pl30087448.effectivecpmnetwork.com/db/6b/21/db6b216e120ac6cfff8fd67c8cf8ba43.js");
  return null; // script-only, tidak perlu elemen
}

// EffectiveCPM — direct link tracker (dipanggil sekali di level page)
function useEffectiveCPMTracker() {
  useEffect(() => {
    if (window._ecpmTracked) return;
    window._ecpmTracked = true;
    const img = new Image();
    img.src = "https://www.effectivecpmnetwork.com/b4yirwu9c?key=6938c85dbfc09b80aac0b87fb209b0f0";
  }, []);
}

export default function Page() {
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const pixelCanvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const heroCanvasRef = useRef(null);
  const imageInputRef = useRef(null);
  const imageCanvasRef = useRef(null);

  // Refs untuk proses recording — tidak perlu re-render
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(null);
  const drawIntervalRef = useRef(null);
  const isCancelledRef = useRef(false);
  const recordStartRef = useRef(0); // waktu mulai recording (performance.now), untuk fix durasi webm

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

  // State untuk Popup Legal
  const [activeModal, setActiveModal] = useState(null);

  // State bahasa (language switcher)
  const [lang, setLang] = useState(DEFAULT_LANG);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("burikin_lang");
      if (saved && LANGUAGES.some((l) => l.code === saved)) setLang(saved);
    } catch (_) {}
  }, []);
  const changeLang = (code) => {
    setLang(code);
    try { window.localStorage.setItem("burikin_lang", code); } catch (_) {}
  };
  const t = getTranslations(lang);

  // States Parameter Lanjutan
  const [resHeight, setResHeight] = useState(240);
  const [fpsTarget, setFpsTarget] = useState(15);
  const [videoQuality, setVideoQuality] = useState(2);
  const [audioQuality, setAudioQuality] = useState(2);
  const [audioEffect, setAudioEffect] = useState("none");
  const [pixelScale, setPixelScale] = useState(1);
  const [stretchFactor, setStretchFactor] = useState(1);
  const [colorFilter, setColorFilter] = useState(0);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true); // default ON

  // States untuk Burikin Gambar
  const [imageURL, setImageURL] = useState(null);
  const [imageName, setImageName] = useState("");
  const [imagePixel, setImagePixel] = useState(8);
  const [imageFilter, setImageFilter] = useState(0);

  // Aktifkan tracker link EffectiveCPM sekali saat page load
  useEffectiveCPMTracker();

  // Simpan setting saat ini ke ref agar bisa dibaca di dalam handler async tanpa stale closure
  const settingRef = useRef({});
  useEffect(() => {
    settingRef.current = { resHeight, fpsTarget, videoQuality, audioQuality, audioEffect, pixelScale, stretchFactor, colorFilter, watermarkEnabled };
  }, [resHeight, fpsTarget, videoQuality, audioQuality, audioEffect, pixelScale, stretchFactor, colorFilter, watermarkEnabled]);

  const updateCanvasSize = useCallback((vw, vh) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { resHeight: rh, stretchFactor: sf } = settingRef.current;

    let targetH = rh === 0 ? vh : Math.min(rh, vh);
    const baseRatio = vw / vh;
    let targetW = targetH * baseRatio * sf;

    if (targetW > 1920) {
      targetW = 1920;
      targetH = targetW / (baseRatio * sf);
    }

    canvas.width = Math.round(targetW) & ~1 || 2;
    canvas.height = Math.round(targetH) & ~1 || 2;
  }, []);

  const applyPreset = (key) => {
    setPresetKey(key);
    if (PRESETS[key]) {
      setResHeight(PRESETS[key].res);
      setFpsTarget(PRESETS[key].fps);
      setVideoQuality(PRESETS[key].vQuality);
      setAudioQuality(PRESETS[key].aQuality);
      setPixelScale(PRESETS[key].pixel);
      setStretchFactor(PRESETS[key].stretch);
      setColorFilter(PRESETS[key].color);
    }
  };

  useEffect(() => {
    if (PRESETS[presetKey]) {
      const p = PRESETS[presetKey];
      if (
        resHeight !== p.res || fpsTarget !== p.fps || videoQuality !== p.vQuality ||
        audioQuality !== p.aQuality || pixelScale !== p.pixel ||
        stretchFactor !== p.stretch || colorFilter !== p.color
      ) {
        setPresetKey("custom");
      }
    }
  }, [resHeight, fpsTarget, videoQuality, audioQuality, pixelScale, stretchFactor, colorFilter, presetKey]);

  // Update canvas size saat setting berubah (hanya di luar proses)
  useEffect(() => {
    if (status === "processing") return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    updateCanvasSize(video.videoWidth, video.videoHeight);
  }, [resHeight, stretchFactor, updateCanvasSize, status]);

  useEffect(() => {
    fetch("https://api.counterapi.dev/v1/burikin-zals-app/visitor/up")
      .then((res) => res.json())
      .then((data) => { if (data && data.count) setVisitorCount(data.count); })
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
        imgData.data[i] = v; imgData.data[i + 1] = v;
        imgData.data[i + 2] = v; imgData.data[i + 3] = 35;
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
    // Batalkan proses yang sedang berjalan jika ada
    isCancelledRef.current = true;
    setOutputURL(null);
    setStatus("idle");
    setErrorMsg(null);
    setFileName(f.name);
    const url = URL.createObjectURL(f);
    setVideoURL(url);
    setReady(false);
  };

  const onPickImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageName(f.name);
    const url = URL.createObjectURL(f);
    setImageURL(url);
  };

  const renderBurikImage = useCallback(() => {
    const canvas = imageCanvasRef.current;
    if (!canvas || !imageURL) return;
    const img = new window.Image();
    img.onload = () => {
      const W = img.naturalWidth;
      const H = img.naturalHeight;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      if (imagePixel > 1) {
        const pw = Math.max(1, Math.floor(W / imagePixel));
        const ph = Math.max(1, Math.floor(H / imagePixel));
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, pw, ph);
        ctx.drawImage(canvas, 0, 0, pw, ph, 0, 0, W, H);
      } else {
        ctx.drawImage(img, 0, 0, W, H);
      }

      if (imageFilter > 0) {
        const imageData = ctx.getImageData(0, 0, W, H);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          if (imageFilter === 1) { const gray = 0.299 * r + 0.587 * g + 0.114 * b; d[i] = d[i + 1] = d[i + 2] = gray; }
          else if (imageFilter === 2) { d[i] = Math.min(255, r * 0.9 + 60); d[i + 1] = Math.min(255, g * 0.75 + 20); d[i + 2] = Math.min(255, b * 0.5); }
          else if (imageFilter === 3) { d[i] = Math.min(255, r * 1.8 + 50); d[i + 1] = Math.min(255, g * 0.5); d[i + 2] = Math.min(255, b * 1.8 + 50); }
        }
        ctx.putImageData(imageData, 0, 0);
      }
    };
    img.src = imageURL;
  }, [imageURL, imagePixel, imageFilter]);

  useEffect(() => { renderBurikImage(); }, [renderBurikImage]);

  const downloadBurikImage = () => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const baseName = imageName ? imageName.replace(/\.[^.]+$/, "") : "gambar";
    link.download = `${baseName}_burik.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ─── DRAW FRAME (dipakai preview & recording) ────────────────────────────
  const drawFrameToCanvas = useCallback((video, canvas, pCanvas, settings) => {
    if (!video || !canvas || !pCanvas) return;
    if (video.readyState < 2) return; // HAVE_CURRENT_DATA

    const ctx = canvas.getContext("2d");
    const pCtx = pCanvas.getContext("2d");

    const { videoQuality: vq, pixelScale: ps, colorFilter: cf } = settings;
    const contrast = vq === 1 ? 1.15 : vq === 2 ? 1.05 : 1;
    const saturate = vq === 1 ? 1.2 : vq === 2 ? 1.1 : 1;

    let filterStr = `contrast(${contrast}) saturate(${saturate})`;
    if (cf === 1) filterStr += ' grayscale(100%) contrast(1.2)';
    else if (cf === 2) filterStr += ' sepia(80%) hue-rotate(-10deg) saturate(1.5)';
    else if (cf === 3) filterStr += ' saturate(3) contrast(1.5) hue-rotate(20deg)';

    if (ps > 1) {
      const pw = Math.max(2, Math.floor(canvas.width / ps));
      const ph = Math.max(2, Math.floor(canvas.height / ps));
      if (pCanvas.width !== pw || pCanvas.height !== ph) {
        pCanvas.width = pw; pCanvas.height = ph;
      }
      pCtx.imageSmoothingEnabled = false;
      pCtx.drawImage(video, 0, 0, pw, ph);
      ctx.imageSmoothingEnabled = false;
      ctx.filter = filterStr;
      ctx.drawImage(pCanvas, 0, 0, pw, ph, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.imageSmoothingEnabled = true;
      ctx.filter = filterStr;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    ctx.filter = "none";

    // Watermark digambar SETELAH filter direset, jadi selalu tajam
    // tidak terpengaruh blur/pixelated/grain/color filter apapun.
    if (settings.watermarkEnabled) {
      drawWatermark(ctx, canvas.width, canvas.height);
    }
  }, []);

  const onLoadedMeta = () => {
    const video = videoRef.current;
    if (!video) return;
    updateCanvasSize(video.videoWidth, video.videoHeight);
    setReady(true);
    setStatus("previewing");
    video.loop = true;
    video.muted = true;
    video.play().catch((e) => console.log("Auto-play preview tertahan browser", e));
  };

  // Preview loop — hanya saat previewing, bukan saat processing
  useEffect(() => {
    if (status !== "previewing") return;
    let lastDraw = 0;
    const loop = (ts) => {
      rafRef.current = requestAnimationFrame(loop);
      const interval = 1000 / (settingRef.current.fpsTarget || 15);
      if (ts - lastDraw >= interval) {
        drawFrameToCanvas(videoRef.current, canvasRef.current, pixelCanvasRef.current, settingRef.current);
        lastDraw = ts;
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [status, drawFrameToCanvas]);

  // ─── MAIN PROCESS ────────────────────────────────────────────────────────
  const handleProcess = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const pCanvas = pixelCanvasRef.current;
    if (!video || !canvas || !pCanvas) return;

    // Hentikan preview RAF
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    // Freeze setting saat proses dimulai
    const settings = { ...settingRef.current };

    isCancelledRef.current = false;
    setStatus("processing");
    setProgress(0);
    setOutputURL(null);
    setErrorMsg(null);
    chunksRef.current = [];

    let recorder = null;
    let audioCtx = null;
    let drawTimer = null;

    try {
      // ── 1. Reset video ke awal ──────────────────────────────────────────
      video.pause();
      video.loop = false;
      video.muted = true; // Harus muted agar captureStream tidak konflik AudioContext

      await new Promise((resolve) => {
        const onSeeked = () => { video.removeEventListener("seeked", onSeeked); resolve(); };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = 0;
        // Fallback timeout untuk seek
        setTimeout(resolve, 1000);
      });

      // ── 2. Update canvas size berdasarkan video asli ────────────────────
      updateCanvasSize(video.videoWidth, video.videoHeight);

      // Draw frame pertama sebelum recorder dimulai
      drawFrameToCanvas(video, canvas, pCanvas, settings);

      // ── 3. Buat stream dari canvas ──────────────────────────────────────
      // Gunakan fpsTarget sebagai frame rate canvas stream
      const canvasStream = canvas.captureStream(settings.fpsTarget);

      // ── 4. Setup audio via AudioContext ─────────────────────────────────
      // Sumber audio dari element video, BUKAN dari captureStream audio track
      // karena captureStream audio sering lost saat video di-seek / play ulang
      let finalAudioTracks = [];

      // Cek apakah video punya audio dengan mencoba captureStream
      const testStream = video.captureStream ? video.captureStream() : null;
      const hasAudio = testStream && testStream.getAudioTracks().length > 0;

      if (hasAudio) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioCtx({ sampleRate: 44100 });
        audioCtxRef.current = audioCtx;

        // Gunakan MediaElementSourceNode — lebih stable dari captureStream audio
        const source = audioCtx.createMediaElementSource(video);

        // Agar video masih bisa didengar selama proses (opsional)
        // source.connect(audioCtx.destination); // nonaktifkan agar tidak double audio

        // ── 4a. Filter degradasi dasar ────────────────────────────────────
        const lowpass = audioCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        let cutoff = 20000;
        let dist = 0;
        if (settings.audioQuality === 1) { cutoff = 1500; dist = 30; }
        else if (settings.audioQuality === 2) { cutoff = 3000; dist = 5; }
        else if (settings.audioQuality === 3) { cutoff = 8000; dist = 0; }
        lowpass.frequency.value = cutoff;

        source.connect(lowpass);
        let lastNode = lowpass;

        if (dist > 0) {
          const distortion = audioCtx.createWaveShaper();
          distortion.curve = makeDistortionCurve(dist);
          distortion.oversample = "none";
          lastNode.connect(distortion);
          lastNode = distortion;
        }

        // ── 4b. Efek Audio Spesial ────────────────────────────────────────
        const effect = settings.audioEffect;

        if (effect === "tupai") {
          const gainCompensate = audioCtx.createGain();
          gainCompensate.gain.value = 0.8;
          lastNode.connect(gainCompensate);
          const hipass = audioCtx.createBiquadFilter();
          hipass.type = "highpass";
          hipass.frequency.value = 800;
          hipass.Q.value = 1.5;
          gainCompensate.connect(hipass);
          const boostHi = audioCtx.createBiquadFilter();
          boostHi.type = "peaking";
          boostHi.frequency.value = 3500;
          boostHi.gain.value = 14;
          boostHi.Q.value = 0.8;
          hipass.connect(boostHi);
          lastNode = boostHi;

        } else if (effect === "setan") {
          const bassBoost = audioCtx.createBiquadFilter();
          bassBoost.type = "lowshelf";
          bassBoost.frequency.value = 200;
          bassBoost.gain.value = 18;
          lastNode.connect(bassBoost);
          const lopass2 = audioCtx.createBiquadFilter();
          lopass2.type = "lowpass";
          lopass2.frequency.value = 900;
          lopass2.Q.value = 2;
          bassBoost.connect(lopass2);
          const devilDist = audioCtx.createWaveShaper();
          devilDist.curve = makeDistortionCurve(120);
          devilDist.oversample = "none";
          lopass2.connect(devilDist);
          lastNode = devilDist;

        } else if (effect === "bass") {
          const sub = audioCtx.createBiquadFilter();
          sub.type = "peaking"; sub.frequency.value = 60; sub.gain.value = 16; sub.Q.value = 1.2;
          lastNode.connect(sub);
          const mid = audioCtx.createBiquadFilter();
          mid.type = "peaking"; mid.frequency.value = 140; mid.gain.value = 12; mid.Q.value = 1.0;
          sub.connect(mid);
          const hiCut = audioCtx.createBiquadFilter();
          hiCut.type = "highshelf"; hiCut.frequency.value = 3000; hiCut.gain.value = -8;
          mid.connect(hiCut);
          lastNode = hiCut;

        } else if (effect === "megaphone") {
          const band = audioCtx.createBiquadFilter();
          band.type = "bandpass"; band.frequency.value = 1800; band.Q.value = 0.7;
          lastNode.connect(band);
          const clip = audioCtx.createWaveShaper();
          clip.curve = makeDistortionCurve(40);
          band.connect(clip);
          const presence = audioCtx.createBiquadFilter();
          presence.type = "peaking"; presence.frequency.value = 2400; presence.gain.value = 10; presence.Q.value = 1.5;
          clip.connect(presence);
          lastNode = presence;

        } else if (effect === "cave") {
          const bufLen = audioCtx.sampleRate * 2.5;
          const irBuf = audioCtx.createBuffer(2, bufLen, audioCtx.sampleRate);
          for (let ch = 0; ch < 2; ch++) {
            const d = irBuf.getChannelData(ch);
            for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 2.5);
          }
          const convolver = audioCtx.createConvolver();
          convolver.buffer = irBuf;
          lastNode.connect(convolver);
          const wetGain = audioCtx.createGain(); wetGain.gain.value = 0.6;
          convolver.connect(wetGain);
          const dryGain = audioCtx.createGain(); dryGain.gain.value = 0.5;
          lastNode.connect(dryGain);
          const merger = audioCtx.createGain(); merger.gain.value = 1;
          wetGain.connect(merger); dryGain.connect(merger);
          lastNode = merger;

        } else if (effect === "robot") {
          const ringOsc = audioCtx.createOscillator();
          ringOsc.frequency.value = 50; ringOsc.type = "sine";
          const ringGain = audioCtx.createGain(); ringGain.gain.value = 0;
          ringOsc.connect(ringGain.gain);
          lastNode.connect(ringGain);
          ringOsc.start();
          const robotDist = audioCtx.createWaveShaper();
          robotDist.curve = makeDistortionCurve(20);
          ringGain.connect(robotDist);
          const notch = audioCtx.createBiquadFilter();
          notch.type = "notch"; notch.frequency.value = 1000; notch.Q.value = 5;
          robotDist.connect(notch);
          lastNode = notch;

        } else if (effect === "vhs") {
          const vhsDist = audioCtx.createWaveShaper();
          vhsDist.curve = makeDistortionCurve(15);
          lastNode.connect(vhsDist);
          const wow = audioCtx.createGain(); wow.gain.value = 1;
          const lfo = audioCtx.createOscillator();
          lfo.frequency.value = 2.8; lfo.type = "sine";
          const lfoGain = audioCtx.createGain(); lfoGain.gain.value = 0.08;
          lfo.connect(lfoGain); lfoGain.connect(wow.gain); lfo.start();
          vhsDist.connect(wow);
          const hiss = audioCtx.createBiquadFilter();
          hiss.type = "highshelf"; hiss.frequency.value = 6000; hiss.gain.value = -12;
          wow.connect(hiss);
          lastNode = hiss;

        } else if (effect === "telephone") {
          const hp = audioCtx.createBiquadFilter();
          hp.type = "highpass"; hp.frequency.value = 300; hp.Q.value = 0.5;
          lastNode.connect(hp);
          const lp2 = audioCtx.createBiquadFilter();
          lp2.type = "lowpass"; lp2.frequency.value = 3400; lp2.Q.value = 0.5;
          hp.connect(lp2);
          const telDist = audioCtx.createWaveShaper();
          telDist.curve = makeDistortionCurve(8);
          lp2.connect(telDist);
          lastNode = telDist;
        }

        const dest = audioCtx.createMediaStreamDestination();
        lastNode.connect(dest);
        finalAudioTracks = dest.stream.getAudioTracks();
      }

      // ── 5. Buat MediaRecorder ───────────────────────────────────────────
      const combined = new MediaStream([
        canvasStream.getVideoTracks()[0],
        ...finalAudioTracks,
      ]);

      let mimeType = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      let ext = "mp4";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8,opus";
        ext = "webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) { mimeType = "video/webm"; }
      }
      setFileExt(ext);

      let targetVBitrate = 1_000_000;
      if (settings.videoQuality === 1) targetVBitrate = 80_000;
      else if (settings.videoQuality === 2) targetVBitrate = 200_000;
      else if (settings.videoQuality === 3) targetVBitrate = 500_000;

      recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond: targetVBitrate,
        audioBitsPerSecond: 64_000,
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      // ── 6. Mulai recording & draw loop ──────────────────────────────────
      // KRITIS: recorder.start() TANPA argumen = timeslice besar = lebih reliable.
      // Kita request data setiap 1 detik agar tidak kehilangan data saat video panjang.
      // Catat waktu mulai recording secara presisi untuk fix metadata durasi nanti.
      recordStartRef.current = performance.now();
      recorder.start(1000);

      // ── 7. Draw loop via setInterval (tidak bergantung pada rAF visibility) ──
      // setInterval tidak di-throttle oleh browser saat tab background (berbeda dengan rAF)
      const frameInterval = Math.max(1000 / settings.fpsTarget, 33); // min 33ms = max ~30fps
      drawTimer = setInterval(() => {
        if (isCancelledRef.current) return;
        drawFrameToCanvas(video, canvas, pCanvas, settings);
      }, frameInterval);

      // ── 8. Play video & tunggu selesai ──────────────────────────────────
      // KRITIS: unmute video agar MediaElementSource bisa mengambil audio
      video.muted = false;
      video.volume = 1.0;

      await video.play();

      const videoDuration = video.duration;

      // Tunggu video selesai dengan cara paling robust:
      // Polling currentTime via Promise, dengan multiple fallback
      await new Promise((resolve) => {
        let resolved = false;

        const finish = (reason) => {
          if (resolved) return;
          resolved = true;
          console.log(`[Burikin] Video selesai via: ${reason}`);
          video.removeEventListener("ended", onEnded);
          video.removeEventListener("pause", onPause);
          clearInterval(pollingId);
          clearTimeout(watchdogId);
          resolve();
        };

        // Event listener utama
        const onEnded = () => finish("ended event");
        video.addEventListener("ended", onEnded);

        // Fallback 1: jika video di-pause di akhir (beberapa browser)
        const onPause = () => {
          const remaining = videoDuration - video.currentTime;
          if (remaining < 0.5) finish("pause near end");
        };
        video.addEventListener("pause", onPause);

        // Fallback 2: polling currentTime — ini yang paling robust untuk semua skenario
        const pollingId = setInterval(() => {
          if (isCancelledRef.current) { finish("cancelled"); return; }
          if (!video.paused && !video.ended) {
            // Update progress bar
            if (videoDuration > 0) {
              const pct = Math.min(99, Math.round((video.currentTime / videoDuration) * 100));
              setProgress(pct);
            }
          }
          // Cek apakah sudah di akhir
          if (video.ended || (videoDuration > 0 && video.currentTime >= videoDuration - 0.2)) {
            finish("polling reached end");
          }
        }, 250); // poll setiap 250ms — presisi cukup, tidak boros CPU

        // Fallback 3: watchdog timer = durasi video + buffer 15 detik
        const watchdogMs = (isFinite(videoDuration) && videoDuration > 0)
          ? (videoDuration * 1000 + 15000)
          : 10 * 60 * 1000; // 10 menit jika durasi tidak diketahui
        const watchdogId = setTimeout(() => finish("watchdog timeout"), watchdogMs);
      });

      // ── 9. Selesai, stop semua ──────────────────────────────────────────
      clearInterval(drawTimer); drawTimer = null;

      // Draw frame terakhir untuk memastikan recorder dapat frame
      drawFrameToCanvas(video, canvas, pCanvas, settings);

      // Minta data terakhir sebelum stop
      if (recorder.state === "recording") {
        recorder.requestData();
        await new Promise(r => setTimeout(r, 200)); // beri waktu data masuk
      }

      const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
      if (recorder.state !== "inactive") recorder.stop();
      await stopped;

      // Tutup AudioContext
      if (audioCtx && audioCtx.state !== "closed") {
        await audioCtx.close();
        audioCtxRef.current = null;
      }

      // Cek apakah ada data
      if (chunksRef.current.length === 0) {
        throw new Error("Tidak ada data terekam. Coba lagi dan tetap di halaman ini.");
      }

      // ── 10. Patch durasi metadata yang sering salah (bug Chromium) ──────
      // MediaRecorder dengan timeslice kadang menulis durasi header WebM yang
      // jauh lebih kecil dari durasi rekaman aslinya (mis. kebaca 6s padahal
      // sebenarnya 24s). Frame-nya tetap lengkap, hanya metadata-nya salah.
      // Kita hitung durasi aktual dari waktu elapsed (performance.now), lalu
      // patch ulang header durasinya dengan fix-webm-duration.
      const actualDurationMs = performance.now() - recordStartRef.current;
      let blob = new Blob(chunksRef.current, { type: mimeType });

      if (mimeType.includes("webm")) {
        try {
          blob = await fixWebmDuration(blob, actualDurationMs, { logger: false });
        } catch (fixErr) {
          console.warn("[Burikin] Gagal patch durasi webm, lanjut pakai blob asli:", fixErr);
        }
      }

      const url = URL.createObjectURL(blob);
      setOutputURL(url);
      setProgress(100);
      setStatus("done");

      // Kembalikan video ke mode preview
      video.muted = true;
      video.loop = true;
      video.currentTime = 0;
      video.play().catch(() => {});
      setStatus((prev) => prev === "done" ? "done" : "previewing");
      // Restart preview RAF
      setStatus("done");

    } catch (err) {
      console.error("[Burikin] Error:", err);

      if (drawTimer) { clearInterval(drawTimer); drawTimer = null; }

      if (recorder && recorder.state !== "inactive") {
        try { recorder.stop(); } catch (_) {}
      }

      if (audioCtx && audioCtx.state !== "closed") {
        try { await audioCtx.close(); } catch (_) {}
        audioCtxRef.current = null;
      }

      // Kembalikan video ke mode normal
      const video = videoRef.current;
      if (video) {
        video.muted = true;
        video.loop = true;
        try { video.play(); } catch (_) {}
      }

      setErrorMsg(`${t.errorPrefix}: ` + (err?.message || t.errorUnknown));
      setStatus("previewing"); // kembali ke preview
    }
  };

  const getOutputFilename = () => {
    if (!fileName) return `burik.${fileExt}`;
    const dotIndex = fileName.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
    let affix = "_burik";
    if (colorFilter === 1) affix += "_majapahit";
    if (stretchFactor > 1) affix += "_gepeng";
    return `${baseName}${affix}.${fileExt}`;
  };

  // Helper: render string template berisi placeholder {appName} menjadi JSX
  // dengan nama app dibungkus <strong>. Contoh: "Privasi penting bagi {appName}."
  const withAppName = (template) => {
    const appName = "Burikin Aja";
    const parts = template.split("{appName}");
    return (
      <>
        {parts[0]}
        <strong>{appName}</strong>
        {parts[1]}
      </>
    );
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case "privacy":
        return (
          <>
            <h2 style={styles.modalTitle}>{t.modalPrivacyTitle}</h2>
            <p style={styles.modalText}>{withAppName(t.modalPrivacyP1)}</p>
            <p style={styles.modalText}>{t.modalPrivacyP2}</p>
          </>
        );
      case "tos":
        return (
          <>
            <h2 style={styles.modalTitle}>{t.modalTosTitle}</h2>
            <p style={styles.modalText}>{withAppName(t.modalTosP1)}</p>
            <p style={styles.modalText}>{t.modalTosP2}</p>
          </>
        );
      case "contact":
        return (
          <>
            <h2 style={styles.modalTitle}>{t.modalContactTitle}</h2>
            <p style={styles.modalText}>{t.modalContactP1}</p>
            <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={{ ...styles.waLink, display: "inline-block", marginTop: 10 }}>
              {t.modalContactBtn}
            </a>
          </>
        );
      case "about":
        return (
          <>
            <h2 style={styles.modalTitle}>{t.modalAboutTitle}</h2>
            <p style={styles.modalText}>{withAppName(t.modalAboutP1)}</p>
            <p style={styles.modalText}>{t.modalAboutP2}</p>
          </>
        );
      default: return null;
    }
  };

  return (
    <main style={styles.main}>
      {/* SIDEBAR BLOG */}
      <a href="/blog" style={styles.sidebarBlog}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span style={styles.sidebarBlogLabel}>{t.blogLabel}</span>
      </a>

      <header style={styles.headerBar}>
        <div style={styles.credits}>
          <span style={styles.visitorBadge}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {visitorCount !== null ? visitorCount : "--"} {t.totalVisitor}
          </span>
          <div style={styles.langSwitcher}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                style={{ ...styles.langBtn, ...(lang === l.code ? styles.langBtnActive : {}) }}
                title={l.name}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
        <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={styles.waLink}>
          {t.joinWaChannel}
        </a>
      </header>

      <section style={styles.hero}>
        <canvas ref={heroCanvasRef} style={styles.heroNoise} />
        <div style={styles.heroInner}>
          <div style={styles.eyebrow}>{t.eyebrow}</div>
          <h1 style={styles.h1}>BURIKIN-AJA<span style={{ color: "var(--amber)" }}>.</span></h1>
          <p style={styles.tagline}>{t.tagline}</p>
        </div>
      </section>

      <AdBanner slotId="9626464764" />
      <AdEffectiveCPMNative />
      <AdHighPerformance />
      {/* Script-only ads (tidak render DOM, hanya inject script) */}
      <AdEffectiveCPMDirect />
      <AdEffectiveCPMPopunder />

      <section style={styles.panel}>
        {/* KARTU PILIH MEDIA */}
        <div style={styles.mediaCardRow}>
          <button
            style={{ ...styles.mediaCard, borderColor: videoURL ? "var(--amber)" : "var(--line)", background: videoURL ? "rgba(255,186,0,0.06)" : "var(--panel)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={styles.mediaCardIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke={videoURL ? "var(--amber)" : "var(--dim)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <div style={styles.mediaCardLabel}>
              {fileName ? (
                <>
                  <span style={{ color: "var(--amber)", fontWeight: 700, fontSize: 13 }}>{t.videoSelected}</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4, wordBreak: "break-all", maxWidth: 120, textAlign: "center" }}>{fileName}</span>
                </>
              ) : (
                <>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{t.pickVideo}</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4 }}>{t.pickVideoHint}</span>
                </>
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={onPickFile} style={{ display: "none" }} />

          <button
            style={{ ...styles.mediaCard, borderColor: imageURL ? "var(--green)" : "var(--line)", background: imageURL ? "rgba(0,255,136,0.05)" : "var(--panel)" }}
            onClick={() => imageInputRef.current?.click()}
          >
            <div style={styles.mediaCardIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke={imageURL ? "var(--green)" : "var(--dim)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <div style={styles.mediaCardLabel}>
              {imageName ? (
                <>
                  <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>{t.imageSelected}</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4, wordBreak: "break-all", maxWidth: 120, textAlign: "center" }}>{imageName}</span>
                </>
              ) : (
                <>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>{t.burikinImage}</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4 }}>{t.burikinImageHint}</span>
                </>
              )}
            </div>
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
        </div>

        {videoURL && (
          <>
            <video ref={videoRef} src={videoURL} onLoadedMetadata={onLoadedMeta} style={{ display: "none" }} playsInline />
            {/* Video tidak di-mute permanen di sini — akan diatur saat proses */}

            <div style={styles.previewWrap}>
              {status === "processing" && (
                <div style={styles.processingOverlay}>
                  <div style={styles.spinner}></div>
                  <h3 style={{ color: "var(--amber)", margin: "10px 0 5px" }}>{t.processing}: {progress}%</h3>
                  <p style={{ color: "#fff", fontSize: 12, lineHeight: 1.5 }}>
                    {t.processingWarning}
                  </p>
                </div>
              )}
              <canvas ref={canvasRef} style={styles.previewCanvas} />
              <canvas ref={pixelCanvasRef} style={{ display: "none" }} />
              <div style={styles.recBadge}>{status === "processing" ? t.rec : t.livePreview}</div>
            </div>

            <div style={styles.presetRow}>
              {Object.keys(PRESETS).map((key) => (
                <button key={key} onClick={() => applyPreset(key)}
                  style={{ ...styles.presetBtn, ...(presetKey === key ? styles.presetBtnActive : {}) }}>
                  {t[`preset${key.charAt(0).toUpperCase()}${key.slice(1)}`] || PRESETS[key].label}
                </button>
              ))}
              <button style={{ ...styles.presetBtn, ...(presetKey === "custom" ? styles.presetBtnActive : {}) }}
                onClick={() => setPresetKey("custom")}>{t.presetCustom}</button>
            </div>

            {/* TOGGLE WATERMARK */}
            <label style={styles.watermarkToggleRow}>
              <input
                type="checkbox"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                style={styles.watermarkCheckbox}
              />
              <span style={styles.watermarkToggleLabel}>
                Watermark <strong>burikinaja.web.id</strong> (pojok kanan bawah)
              </span>
            </label>

            <div style={styles.settingsGrid}>
              <div style={styles.setSectionGroup}>
                <div style={styles.setSectionTitle}>{t.sectionVisualAudio}</div>
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.outputResolution}</span>
                  <select style={styles.setSelect} value={resHeight} onChange={(e) => setResHeight(Number(e.target.value))}>
                    <option value={144}>{t.res144}</option>
                    <option value={240}>{t.res240}</option>
                    <option value={360}>{t.res360}</option>
                    <option value={480}>{t.res480}</option>
                    <option value={0}>{t.resOriginal}</option>
                  </select>
                </label>
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.frameRate}</span>
                  <select style={styles.setSelect} value={fpsTarget} onChange={(e) => setFpsTarget(Number(e.target.value))}>
                    <option value={8}>{t.fps8}</option>
                    <option value={12}>{t.fps12}</option>
                    <option value={15}>{t.fps15}</option>
                    <option value={24}>{t.fps24}</option>
                    <option value={30}>{t.fps30}</option>
                  </select>
                </label>
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.videoCompression}</span>
                  <select style={styles.setSelect} value={videoQuality} onChange={(e) => setVideoQuality(Number(e.target.value))}>
                    <option value={1}>{t.vq1}</option>
                    <option value={2}>{t.vq2}</option>
                    <option value={3}>{t.vq3}</option>
                    <option value={4}>{t.vq4}</option>
                  </select>
                </label>
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.audioQualityLabel}</span>
                  <select style={styles.setSelect} value={audioQuality} onChange={(e) => setAudioQuality(Number(e.target.value))}>
                    <option value={1}>{t.aq1}</option>
                    <option value={2}>{t.aq2}</option>
                    <option value={3}>{t.aq3}</option>
                    <option value={4}>{t.aq4}</option>
                  </select>
                </label>
              </div>

              {/* EFEK AUDIO SPESIAL */}
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={styles.setSectionTitle}>{t.sectionAudioEffects}</div>
                <div style={styles.audioEffectGrid}>
                  {[
                    { key: "none", emoji: "🔇" },
                    { key: "tupai", emoji: "🐿️" },
                    { key: "setan", emoji: "😈" },
                    { key: "bass", emoji: "💥" },
                    { key: "megaphone", emoji: "📣" },
                    { key: "cave", emoji: "🏔️" },
                    { key: "robot", emoji: "🤖" },
                    { key: "vhs", emoji: "📼" },
                    { key: "telephone", emoji: "☎️" },
                  ].map(({ key, emoji }) => {
                    const capKey = key.charAt(0).toUpperCase() + key.slice(1);
                    return (
                      <button key={key} onClick={() => setAudioEffect(key)}
                        style={{ ...styles.audioEffectBtn, ...(audioEffect === key ? styles.audioEffectBtnActive : {}) }}>
                        <span style={styles.audioEffectEmoji}>{emoji}</span>
                        <span style={styles.audioEffectLabel}>{t[`eff${capKey}Label`]}</span>
                        <span style={styles.audioEffectDesc}>{t[`eff${capKey}Desc`]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={styles.setSectionGroup}>
                <div style={styles.setSectionTitle}>{t.sectionAbsurdEffects}</div>
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.colorFilterLabel}</span>
                  <select style={styles.setSelect} value={colorFilter} onChange={(e) => setColorFilter(Number(e.target.value))}>
                    <option value={0}>{t.cf0}</option>
                    <option value={1}>{t.cf1}</option>
                    <option value={2}>{t.cf2}</option>
                    <option value={3}>{t.cf3}</option>
                  </select>
                </label>
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.pixelScaleLabel}</span>
                  <select style={styles.setSelect} value={pixelScale} onChange={(e) => setPixelScale(Number(e.target.value))}>
                    <option value={1}>{t.px1}</option>
                    <option value={2}>{t.px2}</option>
                    <option value={4}>{t.px4}</option>
                    <option value={8}>{t.px8}</option>
                    <option value={16}>{t.px16}</option>
                  </select>
                </label>
                <label style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.stretchLabel}</span>
                  <select style={styles.setSelect} value={stretchFactor} onChange={(e) => setStretchFactor(Number(e.target.value))}>
                    <option value={0.5}>{t.stretch05}</option>
                    <option value={1}>{t.stretch1}</option>
                    <option value={1.5}>{t.stretch15}</option>
                    <option value={2}>{t.stretch2}</option>
                    <option value={3}>{t.stretch3}</option>
                  </select>
                </label>
              </div>
            </div>

            <button
              style={{ ...styles.processBtn, opacity: status === "processing" ? 0.6 : 1, cursor: status === "processing" ? "not-allowed" : "pointer" }}
              disabled={!ready || status === "processing"}
              onClick={handleProcess}
            >
              {status === "processing" ? `${t.processBtnProcessing}... ${progress}%` : t.processBtnIdle}
            </button>

            {errorMsg && <p style={styles.error}>{errorMsg}</p>}

            {outputURL && (
              <>
                <div style={styles.resultBox}>
                  <video src={outputURL} controls style={styles.resultVideo} />
                  <a href={outputURL} download={getOutputFilename()} style={styles.downloadLink}>
                    {t.downloadResult} (.{fileExt})
                  </a>
                </div>
                <AdBanner slotId="9626464764" />
                <AdEffectiveCPMNative />
              </>
            )}
          </>
        )}

        {/* ===== SECTION BURIKIN GAMBAR ===== */}
        {imageURL && (
          <div style={styles.imageBurikSection}>
            <div style={styles.imageBurikHeader}>
              <span style={styles.imageBurikTitle}>{t.imageSectionTitle}</span>
              <span style={styles.imageBurikBadge}>{t.livePreview}</span>
            </div>
            <div style={styles.imageBurikBody}>
              <div style={styles.imageBurikPreviewWrap}>
                <canvas ref={imageCanvasRef} style={styles.imageBurikCanvas} />
              </div>
              <div style={styles.imageBurikControls}>
                <div style={styles.sliderGroup}>
                  <div style={styles.sliderLabelRow}>
                    <span style={styles.setTitle}>{t.burikLevel}</span>
                    <span style={styles.sliderValue}>{imagePixel === 1 ? t.burikLevelClear : imagePixel <= 4 ? t.burikLevelLittle : imagePixel <= 8 ? t.burikLevelEnough : imagePixel <= 16 ? t.burikLevelSevere : imagePixel <= 32 ? t.burikLevel8bit : t.burikLevelMinecraft}</span>
                  </div>
                  <input type="range" min={0} max={5} step={1}
                    value={[1, 4, 8, 16, 32, 64].indexOf(imagePixel) === -1 ? 0 : [1, 4, 8, 16, 32, 64].indexOf(imagePixel)}
                    onChange={(e) => { const levels = [1, 4, 8, 16, 32, 64]; setImagePixel(levels[Number(e.target.value)]); }}
                    style={styles.burikSlider} />
                  <div style={styles.sliderTicks}>
                    <span>😇</span><span>😬</span><span>🤢</span><span>💀</span><span>👾</span><span>🧱</span>
                  </div>
                </div>
                <div style={{ borderTop: "1px dashed var(--line)", margin: "14px 0" }} />
                <div style={styles.setLabel}>
                  <span style={styles.setTitle}>{t.colorFilterTitle}</span>
                  <div style={styles.filterBtnRow}>
                    {[{ val: 0, label: t.filterNormal }, { val: 1, label: t.filterBW }, { val: 2, label: t.filterSepia }, { val: 3, label: t.filterFried }].map(({ val, label }) => (
                      <button key={val} onClick={() => setImageFilter(val)}
                        style={{ ...styles.filterBtn, ...(imageFilter === val ? styles.filterBtnActive : {}) }}>{label}</button>
                    ))}
                  </div>
                </div>
                <button style={styles.imageDlBtn} onClick={downloadBurikImage}>{t.downloadImage}</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section style={styles.seoArticle}>
        <div style={styles.seoContent}>
          <h2 style={styles.seoH2}>{t.seoTitle}</h2>
          <p style={styles.seoP}><strong>Burikin Aja</strong> {t.seoP1}</p>
          <p style={styles.seoP}>{t.seoP2}</p>
          <h3 style={styles.seoH3}>{t.seoFeaturesTitle}</h3>
          <ul style={styles.seoUl}>
            <li style={styles.seoLi}>{t.seoFeature1}</li>
            <li style={styles.seoLi}>{t.seoFeature2}</li>
            <li style={styles.seoLi}>{t.seoFeature3}</li>
            <li style={styles.seoLi}>{t.seoFeature4}</li>
          </ul>
          <h3 style={styles.seoH3}>{t.seoHowToTitle}</h3>
          <ol style={styles.seoOl}>
            <li style={styles.seoLi}>{t.seoStep1}</li>
            <li style={styles.seoLi}>{t.seoStep2}</li>
            <li style={styles.seoLi}>{t.seoStep3}</li>
            <li style={styles.seoLi}>{t.seoStep4}</li>
          </ol>
          <h3 style={styles.seoH3}>{t.seoFaqTitle}</h3>
          <div style={styles.faqBox}>
            <p style={styles.seoP}><strong>{t.seoFaqQ1}</strong><br />
              {t.seoFaqA1}</p>
            <p style={styles.seoP}><strong>{t.seoFaqQ2}</strong><br />
              {t.seoFaqA2}</p>
          </div>
        </div>
      </section>

      <footer style={styles.footer}>
        <div style={styles.footerNav}>
          <a href="/privacy" style={styles.footerLink}>{t.footerPrivacy}</a>
          <span style={styles.footerDot}>•</span>
          <a href="/tos" style={styles.footerLink}>{t.footerTos}</a>
          <span style={styles.footerDot}>•</span>
          <a href="/contact" style={styles.footerLink}>{t.footerContact}</a>
          <span style={styles.footerDot}>•</span>
          <a href="/about" style={styles.footerLink}>{t.footerAbout}</a>
          <span style={styles.footerDot}>•</span>
          <a href="/blog" style={styles.footerLink}>{t.footerBlog}</a>
        </div>
        <p style={{ marginTop: 16 }}>
          {t.footerMadeBy} <strong>zals</strong> {t.footerProcessedLocally} <br />
          <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={{ color: "var(--amber)", textDecoration: "none" }}>{t.footerJoinWa}</a>
        </p>
        <p style={{ marginTop: 8, fontSize: 10, color: "var(--dim)", opacity: 0.7 }}>© {new Date().getFullYear()} Burikin Aja. {t.footerCopyright}</p>
      </footer>

      {activeModal && (
        <div style={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={() => setActiveModal(null)}>×</button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </main>
  );
}

const styles = {
  main: { minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 60px", position: "relative" },
  sidebarBlog: { position: "fixed", left: 0, top: "50%", transform: "translateY(-50%)", background: "var(--panel)", border: "1px solid var(--line)", borderLeft: "none", borderRadius: "0 6px 6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "14px 10px", textDecoration: "none", color: "var(--dim)", zIndex: 100, transition: "color 0.15s, borderColor 0.15s" },
  sidebarBlogLabel: { fontFamily: "var(--mono-display)", fontSize: 10, letterSpacing: "0.12em", writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" },
  mediaCardRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 22 },
  mediaCard: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: "28px 16px", border: "2px dashed var(--line)", borderRadius: 8, background: "var(--panel)", cursor: "pointer", transition: "border-color 0.15s, background 0.15s", minHeight: 140 },
  mediaCardIcon: { lineHeight: 1 },
  mediaCardLabel: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  imageBurikSection: { marginTop: 32, border: "1px solid var(--line)", background: "var(--panel)", borderRadius: 8, overflow: "hidden" },
  imageBurikHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "rgba(255,255,255,0.02)" },
  imageBurikTitle: { fontFamily: "var(--mono-display)", fontSize: 13, fontWeight: 700, color: "var(--text)" },
  imageBurikBadge: { fontFamily: "var(--mono-display)", fontSize: 11, color: "var(--danger)", background: "rgba(0,0,0,0.4)", padding: "2px 8px", borderRadius: 4 },
  imageBurikBody: { display: "flex", flexDirection: "row", gap: 0 },
  imageBurikPreviewWrap: { flex: "0 0 55%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", borderRight: "1px solid var(--line)", minHeight: 220 },
  imageBurikCanvas: { width: "100%", height: "auto", maxHeight: 320, objectFit: "contain", display: "block", imageRendering: "pixelated" },
  imageBurikControls: { flex: 1, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 0 },
  sliderGroup: { display: "flex", flexDirection: "column", gap: 8 },
  sliderLabelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sliderValue: { fontFamily: "var(--mono-display)", fontSize: 10, color: "var(--amber)", background: "rgba(255,186,0,0.1)", border: "1px solid var(--amber)", padding: "2px 6px", borderRadius: 3, letterSpacing: "0.05em" },
  burikSlider: { width: "100%", accentColor: "var(--amber)", cursor: "pointer", height: 4 },
  sliderTicks: { display: "flex", justifyContent: "space-between", fontSize: 14, paddingTop: 2 },
  filterBtnRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 },
  filterBtn: { background: "rgba(255,255,255,0.04)", border: "1px solid var(--line)", color: "var(--dim)", padding: "8px 4px", fontSize: 11, fontFamily: "var(--mono-display)", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", borderRadius: 4, transition: "all 0.1s" },
  filterBtnActive: { background: "rgba(0,255,136,0.1)", borderColor: "var(--green)", color: "var(--green)" },
  imageDlBtn: { marginTop: "auto", paddingTop: 14, width: "100%", background: "var(--green)", color: "#000", border: "none", padding: "12px 8px", fontWeight: 800, fontSize: 13, fontFamily: "var(--mono-display)", cursor: "pointer", borderRadius: 4, letterSpacing: "0.05em" },
  audioEffectGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 10 },
  audioEffectBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 6px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)", borderRadius: 6, cursor: "pointer", transition: "all 0.12s" },
  audioEffectBtnActive: { background: "rgba(255,186,0,0.1)", borderColor: "var(--amber)" },
  audioEffectEmoji: { fontSize: 22, lineHeight: 1 },
  audioEffectLabel: { fontFamily: "var(--mono-display)", fontSize: 10, fontWeight: 700, color: "var(--amber)", letterSpacing: "0.06em" },
  audioEffectDesc: { fontSize: 10, color: "var(--dim)", textAlign: "center", lineHeight: 1.3 },
  headerBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px dashed var(--line)", flexWrap: "wrap", gap: 10 },
  credits: { display: "flex", alignItems: "center", gap: "12px", fontSize: 13, color: "var(--dim)", flexWrap: "wrap" },
  langSwitcher: { display: "flex", gap: 4, border: "1px solid var(--line)", borderRadius: 4, padding: 2, background: "var(--panel)" },
  langBtn: { background: "transparent", border: "none", color: "var(--dim)", fontFamily: "var(--mono-display)", fontSize: 11, fontWeight: 700, padding: "4px 8px", cursor: "pointer", borderRadius: 3, letterSpacing: "0.04em" },
  langBtnActive: { background: "var(--amber)", color: "#000" },
  visitorBadge: { display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--panel)", border: "1px solid var(--line)", padding: "6px 10px", borderRadius: "4px", fontSize: 11, color: "var(--amber)", fontFamily: "var(--mono-display)" },
  waLink: { background: "var(--amber)", color: "#000", textDecoration: "none", padding: "6px 12px", fontSize: 11, fontWeight: "bold", borderRadius: 4 },
  hero: { position: "relative", padding: "40px 0 28px", overflow: "hidden", borderBottom: "1px solid var(--line)" },
  heroNoise: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5, filter: "contrast(1.4)" },
  heroInner: { position: "relative", zIndex: 1 },
  eyebrow: { fontFamily: "var(--mono-display)", fontSize: 12, letterSpacing: "0.08em", color: "var(--green)", marginBottom: 14 },
  h1: { fontFamily: "var(--mono-display)", fontSize: "clamp(40px, 10vw, 72px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0, lineHeight: 1 },
  tagline: { marginTop: 14, color: "var(--dim)", fontSize: 14, lineHeight: 1.6, maxWidth: 480 },
  adContainer: { marginTop: 24, marginBottom: 8, padding: 12, background: "rgba(255,255,255,0.03)", border: "1px dashed var(--line)", textAlign: "center", borderRadius: 8 },
  adLabel: { display: "block", fontSize: 10, color: "var(--dim)", marginBottom: 8, letterSpacing: "0.05em" },
  panel: { paddingTop: 28 },
  row: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  previewWrap: { position: "relative", marginTop: 22, border: "1px solid var(--line)", background: "#000", display: "flex", justifyContent: "center", overflow: "hidden" },
  previewCanvas: { width: "100%", height: "auto", maxHeight: "65vh", objectFit: "contain", display: "block" },
  recBadge: { position: "absolute", top: 8, right: 10, fontFamily: "var(--mono-display)", fontSize: 11, color: "var(--danger)", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4 },
  processingOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, textAlign: "center", padding: 20 },
  spinner: { width: 40, height: 40, border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "var(--amber)", borderRadius: "50%", animation: "spin 1s linear infinite" },
  presetRow: { display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" },
  presetBtn: { background: "var(--panel)", border: "1px solid var(--line)", color: "var(--dim)", padding: "8px 14px", fontSize: 12, cursor: "pointer" },
  presetBtnActive: { borderColor: "var(--amber)", color: "var(--amber)" },
  watermarkToggleRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12, color: "var(--dim)", cursor: "pointer", userSelect: "none" },
  watermarkCheckbox: { width: 16, height: 16, accentColor: "var(--amber)", cursor: "pointer" },
  watermarkToggleLabel: { fontFamily: "var(--mono-display)", letterSpacing: "0.02em" },
  settingsGrid: { marginTop: 20, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr", gap: 20, background: "var(--panel)", border: "1px solid var(--line)", padding: 20 },
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
  seoArticle: { marginTop: 40, borderTop: "1px solid var(--line)", paddingTop: 30 },
  seoContent: { background: "var(--panel)", border: "1px solid var(--line)", padding: 24, borderRadius: 8 },
  seoH2: { fontSize: 18, color: "var(--amber)", marginBottom: 12, fontFamily: "var(--mono-display)" },
  seoH3: { fontSize: 15, color: "var(--green)", marginTop: 24, marginBottom: 10, fontFamily: "var(--mono-display)" },
  seoP: { fontSize: 13, color: "var(--dim)", lineHeight: 1.6, marginBottom: 12 },
  seoUl: { paddingLeft: 20, marginBottom: 16 },
  seoOl: { paddingLeft: 20, marginBottom: 16 },
  seoLi: { fontSize: 13, color: "var(--dim)", lineHeight: 1.6, marginBottom: 6 },
  faqBox: { borderLeft: "3px solid var(--amber)", paddingLeft: 14, marginTop: 10 },
  footer: { marginTop: 50, color: "var(--dim)", fontSize: 12, textAlign: "center", lineHeight: 1.6, paddingBottom: 20 },
  footerNav: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 },
  footerLink: { color: "var(--text)", textDecoration: "none", fontWeight: "bold", cursor: "pointer" },
  footerDot: { color: "var(--line)" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20, backdropFilter: "blur(4px)" },
  modalContent: { background: "var(--panel)", border: "1px solid var(--amber)", borderRadius: 8, padding: "30px 24px", maxWidth: 500, width: "100%", maxHeight: "80vh", overflowY: "auto", position: "relative", textAlign: "left" },
  closeBtn: { position: "absolute", top: 12, right: 16, background: "transparent", border: "none", color: "var(--dim)", fontSize: 28, cursor: "pointer", lineHeight: 1 },
  modalTitle: { fontSize: 20, color: "var(--amber)", marginBottom: 16, fontFamily: "var(--mono-display)", borderBottom: "1px solid var(--line)", paddingBottom: 10 },
  modalText: { fontSize: 14, color: "var(--text)", lineHeight: 1.7, marginBottom: 14 },
};

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    input[type=range] { -webkit-appearance: none; appearance: none; background: transparent; }
    input[type=range]::-webkit-slider-runnable-track { background: var(--line); height: 4px; border-radius: 2px; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--amber); margin-top: -7px; border: 2px solid #000; cursor: pointer; }
    input[type=range]::-moz-range-track { background: var(--line); height: 4px; border-radius: 2px; }
    input[type=range]::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: var(--amber); border: 2px solid #000; cursor: pointer; }
    a[href="/blog"]:hover { color: var(--amber) !important; border-color: var(--amber) !important; }
  `;
  document.head.appendChild(style);
}
