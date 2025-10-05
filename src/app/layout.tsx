import React from 'react';
export const metadata = { title: 'ResumeRAG' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui', maxWidth: 960, margin: '0 auto', padding: 24 }}>
        <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <a href="/upload">Upload</a>
          <a href="/search">Search</a>
          <a href="/jobs">Jobs</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
