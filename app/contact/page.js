import Link from "next/link";

export const metadata = {
  title: "Kontak — Burikin Aja",
  description: "Hubungi tim Burikin Aja untuk pertanyaan, saran, atau laporan bug. Bergabunglah ke komunitas WhatsApp kami.",
};

export default function ContactPage() {
  return (
    <main style={{ minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
      <header style={{ padding: "20px 0", borderBottom: "1px dashed #2a2a30" }}>
        <Link href="/" style={{ color: "#ffb000", textDecoration: "none", fontSize: 13, fontFamily: "monospace" }}>
          ← Kembali ke Burikin Aja
        </Link>
      </header>

      <article style={{ marginTop: 40 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#ffb000", marginBottom: 8 }}>Kontak & Komunitas</h1>
        <p style={{ color: "#84848c", fontSize: 14, marginBottom: 40, lineHeight: 1.7 }}>
          Ada pertanyaan, saran, atau bug yang mau dilaporkan? Kami terbuka untuk semua feedback!
        </p>

        <section style={{ marginBottom: 40, padding: 28, background: "#141417", border: "1px solid #2a2a30", borderRadius: 8 }}>
          <h2 style={{ fontFamily: "monospace", fontSize: 16, color: "#39ff14", marginBottom: 12 }}>
            💬 Saluran WhatsApp (Cara Tercepat)
          </h2>
          <p style={{ fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 20 }}>
            Cara paling mudah untuk menghubungi kami adalah melalui Saluran WhatsApp resmi Burikin Aja. 
            Di sana kamu bisa mengikuti update terbaru, melaporkan bug, dan memberikan saran fitur langsung ke pembuat aplikasi.
          </p>
          <a
            href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-block", background: "#25D366", color: "#fff", padding: "12px 24px", textDecoration: "none", fontFamily: "monospace", fontWeight: "bold", fontSize: 14, borderRadius: 4 }}
          >
            Buka Saluran WhatsApp →
          </a>
        </section>

        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: "monospace", fontSize: 16, color: "#e8e6df", marginBottom: 20 }}>FAQ Cepat</h2>

          <div style={faqStyle}>
            <h3 style={faqQStyle}>🐛 Mau laporkan bug?</h3>
            <p style={faqAStyle}>
              Ceritakan apa yang terjadi, browser apa yang kamu pakai, dan jenis/ukuran video yang kamu coba proses. 
              Kirim via saluran WhatsApp di atas.
            </p>
          </div>

          <div style={faqStyle}>
            <h3 style={faqQStyle}>💡 Punya ide fitur baru?</h3>
            <p style={faqAStyle}>
              Sangat welcome! Kami suka mendengar permintaan fitur dari pengguna. Beberapa fitur yang ada sekarang 
              (seperti efek Deep Fried dan mode Kustom) lahir dari saran komunitas.
            </p>
          </div>

          <div style={faqStyle}>
            <h3 style={faqQStyle}>🤝 Mau kolaborasi atau kemitraan?</h3>
            <p style={faqAStyle}>
              Hubungi kami melalui WhatsApp dengan subjek yang jelas. Kami terbuka untuk kolaborasi yang 
              sesuai dengan semangat Burikin Aja.
            </p>
          </div>

          <div style={faqStyle}>
            <h3 style={faqQStyle}>⚖️ Pertanyaan legal atau DMCA?</h3>
            <p style={faqAStyle}>
              Untuk permintaan legal, hubungi kami melalui saluran WhatsApp dan tandai sebagai "LEGAL INQUIRY". 
              Kami akan merespons secepat mungkin.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}

const faqStyle = { marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #2a2a30" };
const faqQStyle = { fontFamily: "monospace", fontSize: 14, color: "#ffb000", marginBottom: 8 };
const faqAStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, margin: 0 };
