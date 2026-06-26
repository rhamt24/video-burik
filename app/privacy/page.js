import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Burikin Aja",
  description: "Kebijakan privasi Burikin Aja. Semua pemrosesan video dilakukan 100% lokal di perangkat Anda, kami tidak pernah menyimpan atau mengunggah video Anda.",
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
      <header style={{ padding: "20px 0", borderBottom: "1px dashed #2a2a30" }}>
        <Link href="/" style={{ color: "#ffb000", textDecoration: "none", fontSize: 13, fontFamily: "monospace" }}>
          ← Kembali ke Burikin Aja
        </Link>
      </header>

      <article style={{ marginTop: 40 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#ffb000", marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: "#84848c", fontSize: 12, marginBottom: 32 }}>Terakhir diperbarui: Juni 2026</p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Pendahuluan</h2>
          <p style={pStyle}>
            Selamat datang di <strong>Burikin Aja</strong> (<a href="https://burikinaja.web.id" style={linkStyle}>burikinaja.web.id</a>). 
            Kebijakan Privasi ini menjelaskan bagaimana kami menangani informasi Anda ketika Anda menggunakan layanan web app kami. 
            Kami sangat menghormati privasi pengguna dan berkomitmen untuk melindunginya.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Data yang TIDAK Kami Kumpulkan</h2>
          <p style={pStyle}>
            Burikin Aja dirancang dengan prinsip <strong>privacy-by-design</strong>. Secara teknis, kami <strong>tidak pernah</strong>:
          </p>
          <ul style={ulStyle}>
            <li style={liStyle}>Mengunggah file video Anda ke server kami</li>
            <li style={liStyle}>Menyimpan salinan video Anda di cloud atau database manapun</li>
            <li style={liStyle}>Membaca metadata file video Anda (nama file, tanggal, lokasi)</li>
            <li style={liStyle}>Membagikan konten video Anda kepada pihak ketiga</li>
            <li style={liStyle}>Memproses video Anda di server kami</li>
          </ul>
          <p style={pStyle}>
            Seluruh pemrosesan video — mulai dari penurunan resolusi, pengubahan frame rate, efek audio, hingga filter visual — 
            dilakukan <strong>100% secara lokal di browser perangkat Anda</strong> menggunakan teknologi Web API (Canvas API, MediaRecorder API, Web Audio API). 
            Video Anda tidak pernah meninggalkan perangkat Anda.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Data yang Kami Kumpulkan</h2>

          <h3 style={h3Style}>3.1 Data Penggunaan Anonim (Visitor Counter)</h3>
          <p style={pStyle}>
            Kami menggunakan layanan pihak ketiga <strong>CounterAPI</strong> (counterapi.dev) untuk menghitung jumlah total pengunjung website. 
            Data yang dikirimkan hanya berupa permintaan HTTP standar (IP address Anda dapat ter-log di sisi CounterAPI sesuai kebijakan mereka), 
            namun kami tidak menyimpan atau memproses IP address tersebut di sisi kami.
          </p>

          <h3 style={h3Style}>3.2 Iklan (Google AdSense)</h3>
          <p style={pStyle}>
            Website ini menampilkan iklan dari <strong>Google AdSense</strong>. Google dapat menggunakan cookie dan teknologi serupa untuk 
            menampilkan iklan yang relevan berdasarkan kunjungan Anda sebelumnya ke website ini atau website lain. Penggunaan cookie oleh Google 
            tunduk pada <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={linkStyle}>Kebijakan Privasi Google</a>.
          </p>
          <p style={pStyle}>
            Anda dapat menonaktifkan penggunaan cookie oleh Google untuk iklan berbasis minat dengan mengunjungi 
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={linkStyle}> Google Ads Settings</a>.
          </p>

          <h3 style={h3Style}>3.3 Log Server & Hosting</h3>
          <p style={pStyle}>
            Penyedia hosting kami mungkin secara otomatis mengumpulkan log standar seperti alamat IP, jenis browser, halaman yang dikunjungi, 
            dan waktu kunjungan. Data ini digunakan semata-mata untuk tujuan keamanan dan pemeliharaan teknis.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Keamanan</h2>
          <p style={pStyle}>
            Karena video Anda diproses sepenuhnya di perangkat Anda dan tidak dikirim ke server kami, risiko kebocoran data video secara 
            inheren sangat rendah. Koneksi ke website ini dilindungi dengan enkripsi SSL/TLS (HTTPS).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Hak Anda</h2>
          <p style={pStyle}>Anda memiliki hak untuk:</p>
          <ul style={ulStyle}>
            <li style={liStyle}>Mengetahui data apa yang kami kumpulkan (dijelaskan di atas)</li>
            <li style={liStyle}>Meminta penghapusan data jika ada (hubungi kami)</li>
            <li style={liStyle}>Menonaktifkan cookie iklan melalui pengaturan browser Anda</li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Perubahan Kebijakan</h2>
          <p style={pStyle}>
            Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan diinformasikan melalui 
            pembaruan tanggal di bagian atas halaman ini. Kami menyarankan Anda untuk meninjau halaman ini secara berkala.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Kontak</h2>
          <p style={pStyle}>
            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui{" "}
            <Link href="/contact" style={linkStyle}>halaman Kontak</Link> atau bergabung ke{" "}
            <a href="https://whatsapp.com/channel/0029VaYuIQT2v1IjZmqTNG3x" target="_blank" rel="noopener noreferrer" style={linkStyle}>
              Saluran WhatsApp resmi kami
            </a>.
          </p>
        </section>
      </article>
    </main>
  );
}

const sectionStyle = { marginBottom: 36, paddingBottom: 28, borderBottom: "1px solid #2a2a30" };
const h2Style = { fontFamily: "monospace", fontSize: 16, color: "#e8e6df", marginBottom: 12 };
const h3Style = { fontFamily: "monospace", fontSize: 14, color: "#ffb000", marginBottom: 8, marginTop: 20 };
const pStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 12 };
const ulStyle = { paddingLeft: 20, marginBottom: 12 };
const liStyle = { fontSize: 14, color: "#84848c", lineHeight: 1.8, marginBottom: 6 };
const linkStyle = { color: "#ffb000", textDecoration: "none" };
