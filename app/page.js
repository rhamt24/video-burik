"use client";

import { useEffect, useRef, useState, useCallback } from "react";

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

// Komponen Khusus Penampil Iklan AdSense
function AdBanner({ slotId }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense Error: ", err);
    }
  }, []);

  return (
    <div style={styles.adContainer}>
      <span style={styles.adLabel}>- Advertisement -</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-6307870813026612" 
        data-ad-slot={slotId} 
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
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

  // States Parameter Lanjutan
  const [resHeight, setResHeight] = useState(240); 
  const [fpsTarget, setFpsTarget] = useState(15); 
  const [videoQuality, setVideoQuality] = useState(2); 
  const [audioQuality, setAudioQuality] = useState(2); 
  
  const [pixelScale, setPixelScale] = useState(1); 
  const [stretchFactor, setStretchFactor] = useState(1); 
  const [colorFilter, setColorFilter] = useState(0);

  // States untuk Burikin Gambar
  const [imageURL, setImageURL] = useState(null);
  const [imageName, setImageName] = useState("");
  const [imagePixel, setImagePixel] = useState(8);
  const [imageFilter, setImageFilter] = useState(0);

  const updateCanvasSize = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let vh = video.videoHeight || 360;
    let vw = video.videoWidth || 640;

    let targetH = resHeight === 0 ? vh : resHeight;
    if (targetH > vh) targetH = vh;

    const baseRatio = vw / vh;
    let targetW = targetH * baseRatio * stretchFactor;

    if (targetW > 1920) {
      targetW = 1920;
      targetH = targetW / (baseRatio * stretchFactor);
    }

    canvas.width = Math.round(targetW) & ~1;
    canvas.height = Math.round(targetH) & ~1;
  }, [resHeight, stretchFactor]);

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
        resHeight !== p.res ||
        fpsTarget !== p.fps ||
        videoQuality !== p.vQuality ||
        audioQuality !== p.aQuality ||
        pixelScale !== p.pixel ||
        stretchFactor !== p.stretch ||
        colorFilter !== p.color
      ) {
        setPresetKey("custom");
      }
    }
  }, [resHeight, fpsTarget, videoQuality, audioQuality, pixelScale, stretchFactor, colorFilter, presetKey]);

  useEffect(() => {
    if (status !== "processing") {
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

      // apply color filter via imageData
      if (imageFilter > 0) {
        const imageData = ctx.getImageData(0, 0, W, H);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i+1], b = d[i+2];
          if (imageFilter === 1) {
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            d[i] = d[i+1] = d[i+2] = gray;
          } else if (imageFilter === 2) {
            d[i]   = Math.min(255, r * 0.9 + 60);
            d[i+1] = Math.min(255, g * 0.75 + 20);
            d[i+2] = Math.min(255, b * 0.5);
          } else if (imageFilter === 3) {
            d[i]   = Math.min(255, r * 1.8 + 50);
            d[i+1] = Math.min(255, g * 0.5);
            d[i+2] = Math.min(255, b * 1.8 + 50);
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }
    };
    img.src = imageURL;
  }, [imageURL, imagePixel, imageFilter]);

  useEffect(() => {
    renderBurikImage();
  }, [renderBurikImage]);

  const downloadBurikImage = () => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    const baseName = imageName ? imageName.replace(/\.[^.]+$/, "") : "gambar";
    link.download = `${baseName}_burik.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
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

    let filterStr = `contrast(${contrast}) saturate(${saturate})`;
    if (colorFilter === 1) filterStr += ' grayscale(100%) contrast(1.2)'; 
    else if (colorFilter === 2) filterStr += ' sepia(80%) hue-rotate(-10deg) saturate(1.5)'; 
    else if (colorFilter === 3) filterStr += ' saturate(3) contrast(1.5) hue-rotate(20deg)'; 

    if (pixelScale > 1) {
      const pw = Math.max(2, Math.floor(canvas.width / pixelScale));
      const ph = Math.max(2, Math.floor(canvas.height / pixelScale));
      
      if (pCanvas.width !== pw || pCanvas.height !== ph) {
        pCanvas.width = pw;
        pCanvas.height = ph;
      }

      pCtx.drawImage(video, 0, 0, pw, ph);

      ctx.imageSmoothingEnabled = false;
      ctx.filter = filterStr;
      ctx.drawImage(pCanvas, 0, 0, pw, ph, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.imageSmoothingEnabled = true;
      ctx.filter = filterStr;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  }, [videoQuality, pixelScale, colorFilter]);

  const onLoadedMeta = () => {
    updateCanvasSize();
    setReady(true);
    setStatus("previewing");
    
    if (videoRef.current) {
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(e => console.log("Auto-play preview tertahan browser", e));
    }
  };

  useEffect(() => {
    if (status !== "previewing" && status !== "processing") return;
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
      const watchdogId = setTimeout(finish, dur ? dur * 1000 + 10000 : 5 * 60 * 1000);
      
      let lastTime = video.currentTime;
      let stuckTicks = 0;
      const stallId = setInterval(() => {
        if (video.ended || video.paused) return;
        if (Math.abs(video.currentTime - lastTime) < 0.01) stuckTicks++;
        else { stuckTicks = 0; lastTime = video.currentTime; }
        
        if (stuckTicks >= 15) finish(); 
      }, 1000);
    });
  };

  const handleProcess = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    updateCanvasSize();

    setStatus("processing");
    setProgress(0);
    setOutputURL(null);
    setErrorMsg(null);

    let recorder = null;

    try {
      video.pause();
      video.loop = false; 
      
      await new Promise((res) => {
        let resolved = false;
        const finish = () => {
          if (resolved) return;
          resolved = true;
          video.removeEventListener("seeked", finish);
          res();
        };
        video.addEventListener("seeked", finish);
        setTimeout(finish, 500); 
        video.currentTime = 0;
      });

      drawFrame(); 

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
      if (videoQuality === 1) targetVBitrate = 80_000; 
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

      const progressTimer = setInterval(() => {
        if (video.duration > 0) {
          setProgress(Math.min(99, Math.round((video.currentTime / video.duration) * 100)));
        }
      }, 500);

      await video.play();
      await waitForVideoToFinish(video);

      clearInterval(progressTimer);

      if (recorder.state !== "inactive") recorder.stop();
      await stopped;

      if (audioCtxRef.current) {
        await audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      if (chunks.length === 0) throw new Error("Gagal merekam data. Pastikan kamu tidak pindah tab.");

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setOutputURL(url);
      setProgress(100);
      setStatus("done");

      video.loop = true;
      video.muted = true;
      video.play().catch(()=>{});

    } catch (err) {
      console.error(err);
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
    if (colorFilter === 1) affix += "_majapahit";
    if (stretchFactor > 1) affix += "_gepeng";
    
    return `${baseName}${affix}.${fileExt}`;
  };

  // Fungsi Helper untuk Konten Modal
  const renderModalContent = () => {
    switch (activeModal) {
      case "privacy":
        return (
          <>
            <h2 style={styles.modalTitle}>Privacy Policy</h2>
            <p style={styles.modalText}>
              Privasi Anda sangat penting bagi kami. Aplikasi <strong>Burikin Aja</strong> dirancang untuk memproses seluruh manipulasi video secara 100% lokal di perangkat Anda (client-side). 
            </p>
            <p style={styles.modalText}>
              Kami <strong>tidak pernah</strong> mengunggah, menyimpan, atau membagikan file video Anda ke server kami atau pihak ketiga mana pun. Semua pemrosesan menggunakan tenaga CPU dan GPU browser Anda secara langsung. Oleh karena itu, data Anda terjamin keamanannya dan tidak akan meninggalkan perangkat Anda.
            </p>
          </>
        );
      case "tos":
        return (
          <>
            <h2 style={styles.modalTitle}>Terms of Service</h2>
            <p style={styles.modalText}>
              Dengan menggunakan layanan <strong>Burikin Aja</strong>, Anda setuju untuk menggunakan alat ini secara bertanggung jawab.
            </p>
            <p style={styles.modalText}>
              Layanan ini disediakan "sebagaimana adanya" (as is) tanpa jaminan apa pun, baik tersurat maupun tersirat. Kami tidak bertanggung jawab atas hasil editan video yang diubah pengguna atau kerusakan file yang terjadi selama proses rendering di perangkat Anda. Pengguna dilarang memproses materi ilegal atau yang melanggar hukum hak cipta.
            </p>
          </>
        );
      case "contact":
        return (
          <>
            <h2 style={styles.modalTitle}>Contact Us</h2>
            <p style={styles.modalText}>
              Punya pertanyaan, saran, atau menemukan bug? Kami sangat terbuka untuk menerima *feedback* dari Anda!
            </p>
            <p style={styles.modalText}>
              Silakan hubungi kami atau bergabung ke komunitas melalui Saluran WhatsApp resmi kami:
            </p>
            <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={{...styles.waLink, display: "inline-block", marginTop: 10}}>
              Bergabung ke Komunitas WhatsApp
            </a>
          </>
        );
      case "about":
        return (
          <>
            <h2 style={styles.modalTitle}>About Us</h2>
            <p style={styles.modalText}>
              <strong>Burikin Aja</strong> adalah proyek independen yang dibangun oleh <strong>zals</strong>. 
            </p>
            <p style={styles.modalText}>
              Terinspirasi dari tren meme video dengan kualitas rendah (buram, patah-patah, gepeng), alat ini diciptakan untuk memudahkan siapa saja membuat video "shitpost" atau retro tanpa perlu menggunakan software editing berat. Semua dapat dilakukan langsung dari browser web favorit Anda secara gratis.
            </p>
          </>
        );
      default:
        return null;
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
        <span style={styles.sidebarBlogLabel}>BLOG</span>
      </a>
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

      <AdBanner slotId="9626464764" />

      <section style={styles.panel}>
        {/* KARTU PILIH MEDIA */}
        <div style={styles.mediaCardRow}>
          {/* Kartu Video */}
          <button
            style={{
              ...styles.mediaCard,
              borderColor: videoURL ? "var(--amber)" : "var(--line)",
              background: videoURL ? "rgba(255,186,0,0.06)" : "var(--panel)",
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={styles.mediaCardIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                stroke={videoURL ? "var(--amber)" : "var(--dim)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <div style={styles.mediaCardLabel}>
              {fileName ? (
                <>
                  <span style={{ color: "var(--amber)", fontWeight: 700, fontSize: 13 }}>✓ VIDEO DIPILIH</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4, wordBreak: "break-all", maxWidth: 120, textAlign: "center" }}>{fileName}</span>
                </>
              ) : (
                <>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>PILIH VIDEO</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4 }}>mp4, webm, dll</span>
                </>
              )}
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={onPickFile} style={{ display: "none" }} />

          {/* Kartu Gambar */}
          <button
            style={{
              ...styles.mediaCard,
              borderColor: imageURL ? "var(--green)" : "var(--line)",
              background: imageURL ? "rgba(0,255,136,0.05)" : "var(--panel)",
            }}
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
                  <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>✓ GAMBAR DIPILIH</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4, wordBreak: "break-all", maxWidth: 120, textAlign: "center" }}>{imageName}</span>
                </>
              ) : (
                <>
                  <span style={{ color: "var(--text)", fontWeight: 700, fontSize: 13 }}>BURIKIN GAMBAR</span>
                  <span style={{ color: "var(--dim)", fontSize: 11, marginTop: 4 }}>jpg, png, webp, dll</span>
                </>
              )}
            </div>
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
        </div>

        {videoURL && (
          <>
            <video ref={videoRef} src={videoURL} onLoadedMetadata={onLoadedMeta} style={{ display: "none" }} playsInline muted />

            <div style={styles.previewWrap}>
              {status === "processing" && (
                <div style={styles.processingOverlay}>
                  <div style={styles.spinner}></div>
                  <h3 style={{ color: "var(--amber)", margin: "10px 0 5px" }}>MEMPROSES: {progress}%</h3>
                  <p style={{ color: "#fff", fontSize: 12, lineHeight: 1.5 }}>
                    ⚠️ <b>PENTING:</b> Jangan pindah tab browser atau mematikan layar HP selama proses ini berjalan. <br/> Jika dipindah, durasi video akan terpotong / menjadi 1 detik.
                  </p>
                </div>
              )}
              <canvas ref={canvasRef} style={styles.previewCanvas} />
              <canvas ref={pixelCanvasRef} style={{ display: "none" }} />
              <div style={styles.recBadge}>{status === "processing" ? "● REC" : "● LIVE PREVIEW"}</div>
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
                  <span style={styles.setTitle}>Filter Warna</span>
                  <select style={styles.setSelect} value={colorFilter} onChange={(e) => setColorFilter(Number(e.target.value))}>
                    <option value={0}>Normal (Asli)</option>
                    <option value={1}>Majapahit (Hitam Putih)</option>
                    <option value={2}>Vintage (Sepia Usang)</option>
                    <option value={3}>Deep Fried (Ngejreng Parah)</option>
                  </select>
                </label>
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
                  <span style={styles.setTitle}>Rasio Video (Gepengin)</span>
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
              <>
                <div style={styles.resultBox}>
                  <video src={outputURL} controls style={styles.resultVideo} />
                  <a href={outputURL} download={getOutputFilename()} style={styles.downloadLink}>
                    ⬇ DOWNLOAD HASIL (.{fileExt})
                  </a>
                </div>
                <AdBanner slotId="9626464764" />
              </>
            )}
          </>
        )}

        {/* ===== SECTION BURIKIN GAMBAR ===== */}
        {imageURL && (
          <div style={styles.imageBurikSection}>
            {/* Header */}
            <div style={styles.imageBurikHeader}>
              <span style={styles.imageBurikTitle}>🖼️ BURIKIN GAMBAR</span>
              <span style={styles.imageBurikBadge}>● LIVE PREVIEW</span>
            </div>

            {/* Layout: Preview + Kontrol side by side */}
            <div style={styles.imageBurikBody}>
              {/* Kiri: Preview Canvas */}
              <div style={styles.imageBurikPreviewWrap}>
                <canvas ref={imageCanvasRef} style={styles.imageBurikCanvas} />
              </div>

              {/* Kanan: Kontrol */}
              <div style={styles.imageBurikControls}>

                {/* Slider Level Burik */}
                <div style={styles.sliderGroup}>
                  <div style={styles.sliderLabelRow}>
                    <span style={styles.setTitle}>TINGKAT BURIK</span>
                    <span style={styles.sliderValue}>{
                      imagePixel === 1 ? "JERNIH" :
                      imagePixel <= 4 ? "DIKIT" :
                      imagePixel <= 8 ? "LUMAYAN" :
                      imagePixel <= 16 ? "PARAH" :
                      imagePixel <= 32 ? "8-BIT" : "MINECRAFT"
                    }</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={[1,4,8,16,32,64].indexOf(imagePixel) === -1 ? 0 : [1,4,8,16,32,64].indexOf(imagePixel)}
                    onChange={(e) => {
                      const levels = [1,4,8,16,32,64];
                      setImagePixel(levels[Number(e.target.value)]);
                    }}
                    style={styles.burikSlider}
                  />
                  <div style={styles.sliderTicks}>
                    <span>😇</span>
                    <span>😬</span>
                    <span>🤢</span>
                    <span>💀</span>
                    <span>👾</span>
                    <span>🧱</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px dashed var(--line)", margin: "14px 0" }} />

                {/* Filter Warna */}
                <div style={styles.setLabel}>
                  <span style={styles.setTitle}>FILTER WARNA</span>
                  <div style={styles.filterBtnRow}>
                    {[
                      { val: 0, label: "NORMAL" },
                      { val: 1, label: "B&W" },
                      { val: 2, label: "SEPIA" },
                      { val: 3, label: "FRIED" },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => setImageFilter(val)}
                        style={{
                          ...styles.filterBtn,
                          ...(imageFilter === val ? styles.filterBtnActive : {}),
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Download Button */}
                <button
                  style={styles.imageDlBtn}
                  onClick={downloadBurikImage}
                >
                  ⬇ DOWNLOAD
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section style={styles.seoArticle}>
        <div style={styles.seoContent}>
          <h2 style={styles.seoH2}>Tentang Burikin Aja</h2>
          <p style={styles.seoP}>
            <strong>Burikin Aja</strong> adalah sebuah *web app* gratis untuk mengedit dan menurunkan kualitas video secara sengaja. 
            Ingin membuat video terlihat seperti direkam menggunakan HP jadul, hasil kiriman WhatsApp yang di-<em>forward</em> berkali-kali, atau membuat meme absurd dengan rasio layar gepeng? Kamu berada di tempat yang tepat.
          </p>
          <p style={styles.seoP}>
            Aplikasi ini berjalan <strong>100% secara lokal di browser (client-side)</strong>. Kami tidak pernah mengunggah, menyimpan, atau menyebarkan video Anda ke server mana pun, sehingga <strong>privasi dan keamanan data Anda terjamin sepenuhnya</strong>.
          </p>

          <h3 style={styles.seoH3}>Fitur Utama & Kustomisasi</h3>
          <ul style={styles.seoUl}>
            <li style={styles.seoLi}><strong>Turunkan Resolusi & Bitrate:</strong> Paksa video resolusi tinggi menjadi buram, patah-patah, dan penuh kotak pixel art (kompresi parah).</li>
            <li style={styles.seoLi}><strong>Efek Audio Rusak:</strong> Buat suara video terdengar "mendem", pecah, atau seperti kualitas rekaman kaset rusak.</li>
            <li style={styles.seoLi}><strong>Gepengin Video (Aspect Ratio):</strong> Ubah bentuk video normal menjadi super lebar (wide) atau sangat kurus memanjang untuk kebutuhan konten meme.</li>
            <li style={styles.seoLi}><strong>Filter Visual Majapahit:</strong> Terapkan filter *grayscale* ekstrem atau *Deep Fried* yang mencolok langsung saat diproses.</li>
          </ul>

          <h3 style={styles.seoH3}>Cara Penggunaan</h3>
          <ol style={styles.seoOl}>
            <li style={styles.seoLi}>Klik tombol <strong>PILIH VIDEO</strong> dan masukkan video dari galeri HP atau komputer Anda.</li>
            <li style={styles.seoLi}>Perhatikan <strong>Live Preview</strong> untuk melihat efek secara langsung.</li>
            <li style={styles.seoLi}>Pilih *Preset* (Ringan, Sedang, Parah, Majapahit) atau atur sendiri parameter di bagian bawah sesuka hati.</li>
            <li style={styles.seoLi}>Klik <strong>BIKININ & DOWNLOAD</strong>. <em>Catatan: Tetap berada di halaman ini selama proses berjalan agar durasi video tidak terpotong.</em></li>
          </ol>

          <h3 style={styles.seoH3}>Pertanyaan Umum (FAQ)</h3>
          <div style={styles.faqBox}>
            <p style={styles.seoP}><strong>T: Mengapa durasi video hasil download saya hanya 1 detik?</strong><br/>
            J: Hal ini terjadi karena Anda memindahkan *tab browser* atau menutup layar saat video sedang diproses. Browser modern akan menghentikan perekaman kanvas saat aplikasi berjalan di *background* untuk menghemat baterai.</p>
            
            <p style={styles.seoP}><strong>T: Apakah layanan ini gratis? Apakah ada batas durasi?</strong><br/>
            J: Sepenuhnya gratis! Namun disarankan memproses video berdurasi di bawah 3 menit, karena proses *encoding* mengandalkan tenaga GPU dan CPU dari perangkat yang Anda gunakan.</p>
          </div>
        </div>
      </section>

      {/* FOOTER NAVIGASI LEGAL (BISA DI-KLIK SEKARANG) */}
      <footer style={styles.footer}>
        <div style={styles.footerNav}>
          <a href="/privacy" style={styles.footerLink}>Privacy Policy</a>
          <span style={styles.footerDot}>•</span>
          <a href="/tos" style={styles.footerLink}>Terms of Service</a>
          <span style={styles.footerDot}>•</span>
          <a href="/contact" style={styles.footerLink}>Contact Us</a>
          <span style={styles.footerDot}>•</span>
          <a href="/about" style={styles.footerLink}>About</a>
          <span style={styles.footerDot}>•</span>
          <a href="/blog" style={styles.footerLink}>Blog</a>
        </div>
        <p style={{ marginTop: 16 }}>
          Dibuat oleh <strong>zals</strong> — Diproses 100% di perangkatmu, tanpa server. <br/>
          <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={{color: "var(--amber)", textDecoration: "none"}}>Gabung Saluran WhatsApp</a>
        </p>
        <p style={{ marginTop: 8, fontSize: 10, color: "var(--dim)", opacity: 0.7 }}>© {new Date().getFullYear()} Burikin Aja. All rights reserved.</p>
      </footer>

      {/* MODAL POPUP UNTUK HALAMAN LEGAL */}
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
  
  // SIDEBAR BLOG
  sidebarBlog: {
    position: "fixed",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
    background: "var(--panel)",
    border: "1px solid var(--line)",
    borderLeft: "none",
    borderRadius: "0 6px 6px 0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "14px 10px",
    textDecoration: "none",
    color: "var(--dim)",
    zIndex: 100,
    transition: "color 0.15s, borderColor 0.15s",
  },
  sidebarBlogLabel: {
    fontFamily: "var(--mono-display)",
    fontSize: 10,
    letterSpacing: "0.12em",
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    transform: "rotate(180deg)",
  },

  // MEDIA CARDS
  mediaCardRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginBottom: 22,
  },
  mediaCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "28px 16px",
    border: "2px dashed var(--line)",
    borderRadius: 8,
    background: "var(--panel)",
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    minHeight: 140,
  },
  mediaCardIcon: { lineHeight: 1 },
  mediaCardLabel: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },

  // IMAGE BURIK SECTION
  imageBurikSection: {
    marginTop: 32,
    border: "1px solid var(--line)",
    background: "var(--panel)",
    borderRadius: 8,
    overflow: "hidden",
  },
  imageBurikHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid var(--line)",
    background: "rgba(255,255,255,0.02)",
  },
  imageBurikTitle: {
    fontFamily: "var(--mono-display)",
    fontSize: 13,
    fontWeight: 700,
    color: "var(--text)",
  },
  imageBurikBadge: {
    fontFamily: "var(--mono-display)",
    fontSize: 11,
    color: "var(--danger)",
    background: "rgba(0,0,0,0.4)",
    padding: "2px 8px",
    borderRadius: 4,
  },
  imageBurikBody: {
    display: "flex",
    flexDirection: "row",
    gap: 0,
  },
  imageBurikPreviewWrap: {
    flex: "0 0 55%",
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRight: "1px solid var(--line)",
    minHeight: 220,
  },
  imageBurikCanvas: {
    width: "100%",
    height: "auto",
    maxHeight: 320,
    objectFit: "contain",
    display: "block",
    imageRendering: "pixelated",
  },
  imageBurikControls: {
    flex: 1,
    padding: "16px 14px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  // Slider styles
  sliderGroup: { display: "flex", flexDirection: "column", gap: 8 },
  sliderLabelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sliderValue: {
    fontFamily: "var(--mono-display)",
    fontSize: 10,
    color: "var(--amber)",
    background: "rgba(255,186,0,0.1)",
    border: "1px solid var(--amber)",
    padding: "2px 6px",
    borderRadius: 3,
    letterSpacing: "0.05em",
  },
  burikSlider: {
    width: "100%",
    accentColor: "var(--amber)",
    cursor: "pointer",
    height: 4,
  },
  sliderTicks: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    paddingTop: 2,
  },
  // Filter buttons
  filterBtnRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    marginTop: 8,
  },
  filterBtn: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--line)",
    color: "var(--dim)",
    padding: "8px 4px",
    fontSize: 11,
    fontFamily: "var(--mono-display)",
    fontWeight: 700,
    letterSpacing: "0.05em",
    cursor: "pointer",
    borderRadius: 4,
    transition: "all 0.1s",
  },
  filterBtnActive: {
    background: "rgba(0,255,136,0.1)",
    borderColor: "var(--green)",
    color: "var(--green)",
  },
  imageDlBtn: {
    marginTop: "auto",
    paddingTop: 14,
    width: "100%",
    background: "var(--green)",
    color: "#000",
    border: "none",
    padding: "12px 8px",
    fontWeight: 800,
    fontSize: 13,
    fontFamily: "var(--mono-display)",
    cursor: "pointer",
    borderRadius: 4,
    letterSpacing: "0.05em",
  },

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
  
  adContainer: { marginTop: 24, marginBottom: 8, padding: 12, background: "rgba(255,255,255,0.03)", border: "1px dashed var(--line)", textAlign: "center", borderRadius: 8 },
  adLabel: { display: "block", fontSize: 10, color: "var(--dim)", marginBottom: 8, letterSpacing: "0.05em" },

  panel: { paddingTop: 28 },
  row: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" },
  uploadBtn: { background: "var(--amber)", color: "#000", border: "none", padding: "12px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  fileName: { color: "var(--dim)", fontSize: 13, wordBreak: "break-all" },
  previewWrap: { position: "relative", marginTop: 22, border: "1px solid var(--line)", background: "#000", display: "flex", justifyContent: "center", overflow: "hidden" },
  previewCanvas: { width: "100%", height: "auto", maxHeight: "65vh", objectFit: "contain", display: "block" },
  recBadge: { position: "absolute", top: 8, right: 10, fontFamily: "var(--mono-display)", fontSize: 11, color: "var(--danger)", background: "rgba(0,0,0,0.6)", padding: "2px 6px", borderRadius: 4 },
  
  processingOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, textAlign: "center", padding: 20 },
  spinner: { width: 40, height: 40, border: "4px solid rgba(255,255,255,0.2)", borderTopColor: "var(--amber)", borderRadius: "50%", animation: "spin 1s linear infinite" },

  presetRow: { display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" },
  presetBtn: { background: "var(--panel)", border: "1px solid var(--line)", color: "var(--dim)", padding: "8px 14px", fontSize: 12, cursor: "pointer" },
  presetBtnActive: { borderColor: "var(--amber)", color: "var(--amber)" },
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

  // Style untuk Modal Popup
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", justifyContent: "center", alignItems: "center", padding: 20, backdropFilter: "blur(4px)" },
  modalContent: { background: "var(--panel)", border: "1px solid var(--amber)", borderRadius: 8, padding: "30px 24px", maxWidth: 500, width: "100%", maxHeight: "80vh", overflowY: "auto", position: "relative", textAlign: "left" },
  closeBtn: { position: "absolute", top: 12, right: 16, background: "transparent", border: "none", color: "var(--dim)", fontSize: 28, cursor: "pointer", lineHeight: 1 },
  modalTitle: { fontSize: 20, color: "var(--amber)", marginBottom: 16, fontFamily: "var(--mono-display)", borderBottom: "1px solid var(--line)", paddingBottom: 10 },
  modalText: { fontSize: 14, color: "var(--text)", lineHeight: 1.7, marginBottom: 14 }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
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

