import { useState, useEffect } from 'react'
import { SvgIcon } from '../components/IconSprite'

export default function DocumentViewer({ ctx }) {
  const { docPage, showPage, toast } = ctx
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

  const filename = docPage?.filename
  const title = docPage?.title || filename
  const returnPage = docPage?.returnPage || 'tasks'

  useEffect(() => {
    if (!filename) return
    setLoading(true)
    fetch(`./output/${filename}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.text() })
      .then(html => {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
        setContent(bodyMatch ? bodyMatch[1] : html)
        setLoading(false)
      })
      .catch(() => {
        setContent(null)
        setLoading(false)
      })
  }, [filename])

  const copyContent = () => {
    const el = document.getElementById('docPageBody')
    const text = el?.innerText || el?.textContent || ''
    navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard', 'success')).catch(() => toast('Failed to copy', 'error'))
  }

  const printDoc = () => {
    const el = document.getElementById('docPageBody')
    if (!el) return
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Print Document</title>
      <style>body{font-family:'Segoe UI',system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1a1a2e;line-height:1.7}h1{font-size:24px;margin-bottom:8px;border-bottom:2px solid #b9a9ff;padding-bottom:12px}h2{font-size:18px;margin-top:28px;color:#333}p{margin:10px 0}strong{font-weight:700}ul,ol{margin:10px 0;padding-left:24px}li{margin:4px 0}table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}th,td{padding:8px 12px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5;font-weight:700}</style>
      </head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    win.print()
  }

  const downloadDoc = () => {
    const a = document.createElement('a')
    a.href = `./output/${filename}`
    a.download = filename
    a.click()
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-file" size={22} /></span>{title}</div>
          <div className="section-sub">{filename}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={copyContent}><SvgIcon id="ico-clipboard" size={14} /> Copy</button>
          <button className="btn btn-sm" onClick={downloadDoc}><SvgIcon id="ico-arrow-down-tray" size={14} /> Download HTML</button>
          <button className="btn btn-sm" onClick={printDoc}><SvgIcon id="ico-printer" size={14} /> Print</button>
          <button className="btn btn-sm" onClick={() => showPage(returnPage)}><SvgIcon id="ico-x" size={14} /> Back</button>
        </div>
      </div>
      <div className="anim anim-2">
        <div className="card" id="docPageBody" style={{ padding: 32, lineHeight: 1.8, color: 'var(--text)', fontSize: '0.95rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Loading document...</div>
          ) : content ? (
            <div className="doc-content" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>📄</div>
              <div style={{ color: 'var(--muted-fg)', fontSize: 14 }}>Could not load document</div>
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{filename}</div>
              <a href={`./output/${filename}`} download className="btn btn-sm" style={{ marginTop: 16, display: 'inline-flex', textDecoration: 'none' }}>⬇ Download Instead</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
