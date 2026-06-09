import { AppRouter } from '@family-tree/tree-lib'

const RELEASES = 'https://github.com/nguyen-tri-nhan/family-tree/releases/latest'

function DownloadSection() {
  if (navigator.userAgent.includes('Electron')) return null
  return (
    <div style={{ textAlign: 'center', borderTop: '1px solid #e5e7eb', paddingTop: 20 }}>
      <a href={RELEASES} target="_blank" rel="noreferrer" style={downloadBtn}>
        ⬇ Tải về máy tính
      </a>
    </div>
  )
}

const downloadBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 14px', borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 13, fontWeight: 600,
  color: '#374151', textDecoration: 'none',
  background: '#f9fafb',
}

export default function WebApp() {
  return <AppRouter welcomeFooter={<DownloadSection />} />
}
