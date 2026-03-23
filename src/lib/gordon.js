// ═══════════════════════════════════════════════
//  Gordon — GPT-4.1 direct API client
//  Used when gateway is offline or for on-demand analysis
// ═══════════════════════════════════════════════

const GORDON_MODEL = 'gpt-4.1'

const GORDON_SYSTEM = `You are Gordon, a sharp and efficient AI assistant specializing in research, document creation, and reasoning. You produce well-structured, thorough responses. When asked to research topics, use your web search capability to find current information. When analyzing documents or images, be precise and extract the most relevant details.`

// Fetch a file URL and return raw base64 string
async function urlToBase64(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch attachment: ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // FileReader gives "data:mime;base64,XXXX" — extract just the base64 part
      const result = reader.result
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Build OpenAI Responses API content blocks from task attachments
async function buildAttachmentBlocks(attachments = []) {
  const blocks = []
  for (const att of attachments) {
    try {
      const base64 = await urlToBase64(att.url)
      if (att.type.startsWith('image/')) {
        blocks.push({
          type: 'input_image',
          image_url: `data:${att.type};base64,${base64}`
        })
      } else if (att.type === 'application/pdf') {
        blocks.push({
          type: 'input_file',
          filename: att.name,
          file_data: `data:application/pdf;base64,${base64}`
        })
      }
    } catch (e) {
      console.warn(`Gordon: could not load attachment "${att.name}":`, e)
    }
  }
  return blocks
}

// Run Gordon on a task message, optionally with file attachments
// Returns { text, raw }
export async function runGordon({ message, attachments = [], webSearch = true }) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('VITE_OPENAI_API_KEY is not set in .env.local')

  const attachmentBlocks = await buildAttachmentBlocks(attachments)

  const userContent = [
    { type: 'input_text', text: message },
    ...attachmentBlocks
  ]

  const input = [
    { role: 'system', content: [{ type: 'input_text', text: GORDON_SYSTEM }] },
    { role: 'user', content: userContent }
  ]

  const tools = webSearch ? [{ type: 'web_search_preview' }] : []

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: GORDON_MODEL, tools, input })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API error ${res.status}`)
  }

  const data = await res.json()

  // The Responses API returns an output array — find the message output
  const msgOutput = data.output?.find(o => o.type === 'message')
  const text = msgOutput?.content?.find(c => c.type === 'output_text')?.text || ''

  return { text, raw: data }
}

// Check if the OpenAI API key is configured
export function gordonAvailable() {
  return !!import.meta.env.VITE_OPENAI_API_KEY
}
