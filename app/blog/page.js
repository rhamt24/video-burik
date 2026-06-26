import Link from "next/link";

export const metadata = {
  title: "Blog — Tips & Tutorial Video Meme | Burikin Aja",
  description: "Artikel seputar cara bikin video meme viral, efek VHS nostalgia, video burik aesthetic, dan tips editing video unik langsung di browser.",
};

const posts = [
  {
    slug: "cara-buat-video-meme-viral",
    title: "Cara Bikin Video Meme yang Viral di 2025",
    date: "Juni 2026",
    excerpt: "Rahasia video meme yang viral bukan di kualitas tinggi — justru sebaliknya. Pelajari teknik dan psikologi di balik format meme video paling viral.",
    tag: "Tutorial",
  },
  {
    slug: "efek-vhs-nostalgia",
    title: "Efek VHS & Nostalgia: Kenapa Kita Suka Video Jadul?",
    date: "Juni 2026",
    excerpt: "Dari kaset VHS ke TikTok retro — ada apa dengan estetika video jadul yang bikin kita nostalgia? Eksplorasi fenomena lo-fi visual yang sedang tren.",
    tag: "Artikel",
  },
  {
    slug: "video-burik-aesthetic",
    title: "Video Burik sebagai Seni: Panduan Aesthetic Lo-Fi",
    date: "Juni 2026",
    excerpt: "Kualitas rendah bukan berarti tanpa nilai artistik. Panduan lengkap untuk menggunakan degradasi video sebagai gaya visual yang intentional dan estetik.",
    tag: "Panduan",
  },
];

export default function BlogPage() {
  return (
    <main style={{ minHeight: "100vh", maxWidth: 760, margin: "0 auto", padding: "0 18px 80px" }}>
      <header style={{ padding: "20px 0", borderBottom: "1px dashed #2a2a30" }}>
        <Link href="/" style={{ color: "#ffb000", textDecoration: "none", fontSize: 13, fontFamily: "monospace" }}>
          ← Kembali ke Burikin Aja
        </Link>
      </header>

      <div style={{ marginTop: 40, marginBottom: 40 }}>
        <h1 style={{ fontFamily: "monospace", fontSize: 28, color: "#ffb000", marginBottom: 8 }}>Blog</h1>
        <p style={{ color: "#84848c", fontSize: 14, lineHeight: 1.7 }}>
          Tips, tutorial, dan eksplorasi seputar video meme, estetika lo-fi, dan seni degradasi video.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {posts.map((post) => (
          <article key={post.slug} style={{ padding: 24, background: "#141417", border: "1px solid #2a2a30", borderRadius: 8 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
              <span style={{ background: "#ffb000", color: "#000", fontSize: 10, padding: "2px 8px", fontFamily: "monospace", fontWeight: "bold" }}>
                {post.tag}
              </span>
              <span style={{ color: "#84848c", fontSize: 12, fontFamily: "monospace" }}>{post.date}</span>
            </div>
            <h2 style={{ fontFamily: "monospace", fontSize: 17, color: "#e8e6df", marginBottom: 10, lineHeight: 1.4 }}>
              <Link href={`/blog/${post.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                {post.title}
              </Link>
            </h2>
            <p style={{ fontSize: 13, color: "#84848c", lineHeight: 1.7, marginBottom: 14 }}>{post.excerpt}</p>
            <Link href={`/blog/${post.slug}`} style={{ color: "#ffb000", fontSize: 13, fontFamily: "monospace", textDecoration: "none" }}>
              Baca selengkapnya →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
