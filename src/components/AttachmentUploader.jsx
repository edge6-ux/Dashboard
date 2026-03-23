import { useState, useRef } from 'react'
import { SvgIcon } from './IconSprite'
import { uploadAttachment, deleteAttachment } from '../lib/supabase'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const MAX_MB = 20

export default function AttachmentUploader({ attachments = [], onChange, userId, taskId }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = async (files) => {
    const valid = Array.from(files).filter(f => {
      if (!ACCEPTED.includes(f.type)) return false
      if (f.size > MAX_MB * 1024 * 1024) return false
      return true
    })
    if (!valid.length) return

    setUploading(true)
    try {
      const uploaded = await Promise.all(valid.map(f => uploadAttachment(userId, taskId, f)))
      onChange([...attachments, ...uploaded])
    } catch (e) {
      console.warn('Attachment upload failed:', e)
    } finally {
      setUploading(false)
    }
  }

  const remove = async (att) => {
    onChange(attachments.filter(a => a.id !== att.id))
    await deleteAttachment(att.path).catch(() => {})
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const isPdf = (att) => att.type === 'application/pdf'

  return (
    <div>
      <div
        className={`attach-zone ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)}
        />
        {uploading ? (
          <><div className="tracker-loading-spinner" style={{ width: 18, height: 18, margin: 0 }} /><span>Uploading…</span></>
        ) : (
          <><SvgIcon id="ico-arrow-down-tray" size={16} /><span>Drop PDFs or images here, or <u>browse</u></span><span className="attach-zone-hint">PDF, PNG, JPG, GIF, WEBP — max {MAX_MB}MB</span></>
        )}
      </div>

      {attachments.length > 0 && (
        <div className="attach-list">
          {attachments.map(att => (
            <div key={att.id} className={`attach-chip ${isPdf(att) ? 'pdf' : 'img'}`}>
              <SvgIcon id={isPdf(att) ? 'ico-file' : 'ico-external'} size={13} />
              <span className="attach-chip-name">{att.name}</span>
              <span className="attach-chip-size">{(att.size / 1024).toFixed(0)}KB</span>
              <button
                type="button"
                className="attach-chip-remove"
                onClick={() => remove(att)}
                title="Remove"
              >
                <SvgIcon id="ico-x" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
