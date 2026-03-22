import { useState, useCallback } from 'react'
import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo } from '../lib/utils'
import { loadTrackers, saveTrackers, loadTrackerArticles, saveTrackerArticles, loadSavedArticles, saveSavedArticles } from '../lib/storage'
import { supabase, SUPABASE_URL, sbHeaders } from '../lib/supabase'

export default function TrackerPage({ ctx }) {
  const { toast, setTrackerModalOpen, setEditingTrackerId, user } = ctx
  const [activeTrackerId, setActiveTrackerId] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [keywordFilters, setKeywordFilters] = useState(new Set())
  const [sortNewest, setSortNewest] = useState(true)
  const [showingSaved, setShowingSaved] = useState(false)
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const trackers = loadTrackers()
  const allArticles = loadTrackerArticles()
  const trackerId = activeTrackerId || trackers[0]?.id
  const tracker = trackers.find(t => t.id === trackerId)
  const articles = trackerId ? (allArticles[trackerId] || []) : []

  const fetchArticles = async (tId) => {
    const t = trackers.find(tr => tr.id === tId)
    if (!t) return
    setFetching(true)
    refresh()

    const fetchedArticles = []
    for (const keyword of t.keywords) {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=10`
        const res = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) })
        if (!res.ok) continue
        const data = await res.json()
        if (data.status !== 'ok' || !Array.isArray(data.items)) continue

        data.items.slice(0, 10).forEach(item => {
          const title = item.title || ''
          let source = '', cleanTitle = title
          const dashIdx = title.lastIndexOf(' - ')
          if (dashIdx > 0) { source = title.slice(dashIdx + 3).trim(); cleanTitle = title.slice(0, dashIdx).trim() }

          // Favicon
          let favicon = ''
          if (source) {
            const knownDomains = { 'politico': 'politico.com', 'reuters': 'reuters.com', 'cnn': 'cnn.com', 'nytimes': 'nytimes.com', 'washingtonpost': 'washingtonpost.com', 'bbc': 'bbc.com', 'foxnews': 'foxnews.com', 'apnews': 'apnews.com', 'npr': 'npr.org', 'axios': 'axios.com' }
            const key = source.toLowerCase().replace(/[\s.\-'"]+/g, '')
            const domain = knownDomains[key] || key + '.com'
            favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
          }

          // Snippet
          const desc = item.description || ''
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = desc
          const snippet = (tempDiv.textContent || '').slice(0, 200)

          fetchedArticles.push({
            id: 'art-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            title: cleanTitle, source, snippet, url: item.link || '', thumbnail: item.thumbnail || '',
            favicon, publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(), keyword
          })
        })
      } catch (e) { console.warn(`Fetch failed for "${keyword}":`, e) }
    }

    // Deduplicate
    const seen = new Set()
    const deduped = fetchedArticles.filter(a => { const k = a.title.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true })

    // Round-robin interleave
    const byKeyword = {}
    deduped.forEach(a => { if (!byKeyword[a.keyword]) byKeyword[a.keyword] = []; byKeyword[a.keyword].push(a) })
    Object.values(byKeyword).forEach(g => g.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)))
    const balanced = []
    const keys = Object.keys(byKeyword)
    const indices = keys.map(() => 0)
    let remaining = true
    while (remaining) {
      remaining = false
      for (let i = 0; i < keys.length; i++) {
        const group = byKeyword[keys[i]]
        if (indices[i] < group.length) { balanced.push(group[indices[i]]); indices[i]++; remaining = true }
      }
    }

    const all = loadTrackerArticles()
    all[tId] = balanced
    saveTrackerArticles(all)

    // Update lastFetched - also sync to Supabase
    const updatedTrackers = loadTrackers()
    const ut = updatedTrackers.find(tr => tr.id === tId)
    if (ut) { ut.lastFetched = Date.now(); saveTrackers(updatedTrackers) }

    // Sync tracker to Supabase
    try {
      const { data: existing } = await supabase.from('trackers').select('id').eq('id', tId).single()
      const trackerData = { id: tId, user_id: user?.id, name: ut?.name, keywords: ut?.keywords, color: ut?.color, created_at: ut?.createdAt, updated_at: Date.now(), last_fetched: Date.now() }
      if (existing) {
        await supabase.from('trackers').update(trackerData).eq('id', tId)
      } else {
        await supabase.from('trackers').insert(trackerData)
      }
    } catch (e) { console.warn('Tracker Supabase sync failed:', e) }

    setFetching(false)
    refresh()
  }

  const deleteTracker = (id) => {
    const updated = loadTrackers().filter(t => t.id !== id)
    saveTrackers(updated)
    const arts = loadTrackerArticles()
    delete arts[id]
    saveTrackerArticles(arts)
    if (activeTrackerId === id) setActiveTrackerId(updated[0]?.id || null)
    toast('Tracker deleted', 'success')
    refresh()
  }

  const isArticleSaved = (articleId) => loadSavedArticles().some(s => s.id === articleId)

  const toggleSave = (articleId) => {
    const saved = loadSavedArticles()
    const idx = saved.findIndex(s => s.id === articleId)
    if (idx >= 0) { saved.splice(idx, 1) }
    else {
      const article = articles.find(a => a.id === articleId)
      if (article) saved.unshift({ ...article, savedAt: Date.now(), fromTracker: trackerId })
    }
    saveSavedArticles(saved)
    refresh()
  }

  const toggleKeywordFilter = (keyword) => {
    const next = new Set(keywordFilters)
    if (next.has(keyword)) next.delete(keyword)
    else next.add(keyword)
    setKeywordFilters(next)
  }

  // Filter and sort
  let filteredArticles = keywordFilters.size > 0 ? articles.filter(a => keywordFilters.has(a.keyword)) : [...articles]
  if (!sortNewest) filteredArticles.reverse()

  if (trackers.length === 0) {
    return (
      <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="section-header anim anim-1">
          <div>
            <div className="section-title"><span className="title-ico"><SvgIcon id="ico-rss" size={22} /></span>Tracker</div>
            <div className="section-sub">Track keywords and topics across the web</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingTrackerId(null); setTrackerModalOpen(true) }}><SvgIcon id="ico-plus" size={16} /> New Tracker</button>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <SvgIcon id="ico-rss" size={28} className="" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>No trackers yet</div>
          <div style={{ color: 'var(--muted-fg)', fontSize: 13, marginBottom: 20 }}>Create a tracker to monitor keywords and topics across the web</div>
          <button className="btn btn-primary" onClick={() => { setEditingTrackerId(null); setTrackerModalOpen(true) }}><SvgIcon id="ico-plus" size={16} /> Create Your First Tracker</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-rss" size={22} /></span>Tracker</div>
          <div className="section-sub">Track keywords and topics across the web</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTrackerId(null); setTrackerModalOpen(true) }}><SvgIcon id="ico-plus" size={16} /> New Tracker</button>
      </div>

      {/* Tabs */}
      <div className="anim anim-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {trackers.map(t => (
          <button key={t.id} className={`tracker-tab ${t.id === trackerId ? 'active' : ''}`} onClick={() => { setActiveTrackerId(t.id); setKeywordFilters(new Set()); setShowingSaved(false) }}>
            <span className="tracker-tab-dot" style={{ background: t.color || 'var(--accent)' }} />
            {t.name}
            <span className="tracker-tab-count">{(allArticles[t.id] || []).length}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="anim anim-3">
        {tracker && (
          <div className="card">
            <div className="tracker-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: tracker.color || 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{tracker.name}</span>
                </div>
                <div className="tracker-keywords">
                  <span className={`tracker-keyword ${keywordFilters.size === 0 ? 'active' : 'dimmed'}`} onClick={() => setKeywordFilters(new Set())}>
                    <SvgIcon id="ico-rss" size={11} /><span>All</span><span className="tracker-tab-count">{articles.length}</span>
                  </span>
                  {tracker.keywords.map((k, i) => {
                    const count = articles.filter(a => a.keyword === k).length
                    return (
                      <span key={i} className={`tracker-keyword ${keywordFilters.has(k) ? 'active' : (keywordFilters.size > 0 ? 'dimmed' : '')}`} onClick={() => toggleKeywordFilter(k)}>
                        <SvgIcon id="ico-tag" size={11} /><span>{k}</span><span className="tracker-tab-count">{count}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm" onClick={() => setSortNewest(!sortNewest)}><SvgIcon id="ico-sort" size={14} />{sortNewest ? 'Newest' : 'Oldest'}</button>
                  <button className="btn btn-sm" onClick={() => fetchArticles(trackerId)} disabled={fetching}><SvgIcon id="ico-refresh" size={14} />{fetching ? 'Fetching...' : 'Refresh'}</button>
                  <button className="btn btn-sm" onClick={() => { setEditingTrackerId(trackerId); setTrackerModalOpen(true) }}><SvgIcon id="ico-pencil" size={14} />Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTracker(trackerId)}><SvgIcon id="ico-trash" size={14} />Delete</button>
                </div>
                <div className="tracker-meta">
                  <SvgIcon id="ico-clock" size={12} />
                  <span>Last updated: {tracker.lastFetched ? new Date(tracker.lastFetched).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' }) : 'Never'}</span>
                </div>
              </div>
            </div>

            {fetching ? (
              <div className="tracker-loading"><div className="tracker-loading-spinner" /><div>Searching for articles...</div></div>
            ) : filteredArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}><SvgIcon id="ico-search" size={28} /></div>
                <div style={{ color: 'var(--muted-fg)', fontSize: 13, marginBottom: 16 }}>No articles found yet</div>
                <button className="btn btn-primary btn-sm" onClick={() => fetchArticles(trackerId)}><SvgIcon id="ico-search" size={14} /> Search Now</button>
              </div>
            ) : (
              <div className="article-list">
                {filteredArticles.map(a => {
                  const saved = isArticleSaved(a.id)
                  return (
                    <div key={a.id} className="article-card" style={{ position: 'relative' }}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border)', overflow: 'hidden' }}>
                          {a.favicon ? <img src={a.favicon} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} onError={e => { e.target.style.display = 'none' }} /> : <SvgIcon id="ico-rss" size={16} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="article-source">{a.source || 'Web'}</div>
                          <div className="article-title">{a.title}</div>
                          {a.snippet && <div className="article-snippet">{a.snippet}</div>}
                          <div className="article-time">{a.keyword} · {a.publishedAt ? getTimeAgo(a.publishedAt) : ''}</div>
                        </div>
                      </a>
                      <button onClick={() => toggleSave(a.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: saved ? 'var(--accent)' : 'var(--muted)', padding: 4, transition: 'color 0.15s' }} title={saved ? 'Unsave' : 'Save'}>
                        <SvgIcon id={saved ? 'ico-bookmark-fill' : 'ico-bookmark'} size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
