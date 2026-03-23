import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aupepgdjxsckilkywdzs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1cGVwZ2RqeHNja2lsa3l3ZHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDc5NjgsImV4cCI6MjA4OTcyMzk2OH0.UUTHoQ5Dc5MU2Xf02bzK7aYBR_ha-MEtuM8QUFO234M'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export { SUPABASE_URL, SUPABASE_KEY }

// ── Attachment storage helpers ──

export async function uploadAttachment(userId, taskId, file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${taskId}/${Date.now()}-${safeName}`
  const { error } = await supabase.storage.from('task-attachments').upload(path, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('task-attachments').getPublicUrl(path)
  return {
    id: 'att-' + Date.now().toString(36),
    name: file.name,
    url: publicUrl,
    type: file.type,
    size: file.size,
    path
  }
}

export async function deleteAttachment(path) {
  if (!path) return
  await supabase.storage.from('task-attachments').remove([path])
}

// Raw headers for direct fetch calls (e.g. job_queue)
export const sbHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
}
