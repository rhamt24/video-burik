import "./globals.css";

export const metadata = {
  title: "BURIK.FX — Bikin video burik, langsung di browser",
  description:
    "Tambahin efek noise/grain/VHS ke video kamu. Diproses di perangkatmu sendiri, suara tetap aman.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
