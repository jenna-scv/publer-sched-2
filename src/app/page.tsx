'use client'

import { useState, useEffect, useCallback } from 'react'
import styles from './page.module.css'

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly & warm' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'community', label: 'Community' },
  { id: 'urgent', label: 'Promotional' },
  { id: 'educational', label: 'Educational' },
]

const CTA_TYPES = [
  { id: 'BOOK', label: 'Book a tour' },
  { id: 'LEARN_MORE', label: 'Learn more' },
  { id: 'SIGN_UP', label: 'Sign up' },
  { id: 'GET_OFFER', label: 'Get offer' },
  { id: 'CALL', label: 'Call now' },
  { id: 'ORDER_ONLINE', label: 'Order online' },
]

interface Client {
  id: string
  clientName: string
  location: string
  description: string
  promos: string
  ctaUrl: string
  publerProfileId: string
  tone: string
  ctaType: string
  keywords: string[]
  photoUrls: string[]
}

interface GeneratedPost {
  text: string
  scheduledAt: string
  photoUrl: string | null
  status: 'pending' | 'scheduling' | 'scheduled' | 'error'
  errorMsg?: string
}

function getScheduledDates(count: number, startDate: string, postTime: string): string[] {
  const dates: string[] = []
  const start = new Date(`${startDate}T${postTime}`)
  for (let i = 0; i < count; i++) {
    const offset = count === 1 ? 0 : Math.round((i / (count - 1)) * 28)
    const d = new Date(start.getTime() + offset * 24 * 60 * 60 * 1000)
    dates.push(d.toISOString())
  }
  return dates
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function Home() {
  const [publerKey, setPublerKey] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [clientName, setClientName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [promos, setPromos] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [publerProfileId, setPublerProfileId] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [photoUrls, setPhotoUrls] = useState([''])
  const [postCount, setPostCount] = useState(4)
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [postTime, setPostTime] = useState('10:00')
  const [tone, setTone] = useState('professional')
  const [ctaType, setCtaType] = useState('BOOK')
  const [clients, setClients] = useState<Client[]>([])
  const [showClientPanel, setShowClientPanel] = useState(false)
  const [savingClient, setSavingClient] = useState(false)
  const [clientSaved, setClientSaved] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info')
  const [posts, setPosts] = useState<GeneratedPost[]>([])

  const loadClients = useCallback(async () => {
    try {
      const res = await fetch('/api/clients')
      const data = await res.json()
      setClients(Array.isArray(data) ? data : [])
    } catch { setClients([]) }
  }, [])

  useEffect(() => { loadClients() }, [loadClients])

  function loadClient(client: Client) {
    setSelectedClientId(client.id)
    setClientName(client.clientName)
    setLocation(client.location || '')
    setDescription(client.description || '')
    setPromos(client.promos || '')
    setCtaUrl(client.ctaUrl || '')
    setPublerProfileId(client.publerProfileId || '')
    setTone(client.tone || 'professional')
    setCtaType(client.ctaType || 'BOOK')
    setKeywords(client.keywords || [])
    setPhotoUrls(client.photoUrls?.length ? client.photoUrls : [''])
    setPosts([])
    setStatusMsg('')
    setShowClientPanel(false)
  }

  function newClient() {
    setSelectedClientId(null)
    setClientName(''); setLocation(''); setDescription(''); setPromos('')
    setCtaUrl(''); setPublerProfileId(''); setTone('professional')
    setCtaType('BOOK'); setKeywords([]); setKeywordInput(''); setPhotoUrls([''])
    setPosts([]); setStatusMsg('')
    setShowClientPanel(false)
  }

  async function saveClient() {
    if (!clientName) { setStatusMsg('Enter a client name to save.'); setStatusType('error'); return }
    setSavingClient(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedClientId || '',
          clientName, location, description, promos, ctaUrl,
          publerProfileId, tone, ctaType, keywords,
          photoUrls: photoUrls.filter(u => u.trim()),
        }),
      })
      const saved = await res.json()
      setSelectedClientId(saved.id)
      await loadClients()
      setClientSaved(true)
      setTimeout(() => setClientSaved(false), 2000)
    } catch { setStatusMsg('Failed to save client.'); setStatusType('error') }
    setSavingClient(false)
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client?')) return
    await fetch('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await loadClients()
    if (selectedClientId === id) newClient()
  }

  function addKeyword() {
    const kw = keywordInput.trim()
    if (kw && !keywords.includes(kw)) setKeywords([...keywords, kw])
    setKeywordInput('')
  }

  function addPhotoUrl() { setPhotoUrls([...photoUrls, '']) }
  function removePhotoUrl(i: number) { if (photoUrls.length > 1) setPhotoUrls(photoUrls.filter((_, idx) => idx !== i)) }
  function updatePhotoUrl(i: number, val: string) { const u = [...photoUrls]; u[i] = val; setPhotoUrls(u) }

  const validPhotos = photoUrls.map(u => u.trim()).filter(Boolean)

  async function generatePosts() {
    if (!clientName || !description) { setStatusMsg('Please fill in client name and property description.'); setStatusType('error'); return }
    setGenerating(true); setPosts([]); setStatusMsg('Writing posts with AI...'); setStatusType('info')
    try {
      const res = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, location, description, promos, ctaType, tone, postCount, keywords }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      const dates = getScheduledDates(data.posts.length, startDate, postTime)
      setPosts(data.posts.map((p: { post: string }, i: number) => ({
        text: p.post,
        scheduledAt: dates[i],
        photoUrl: validPhotos.length ? validPhotos[i % validPhotos.length] : null,
        status: 'pending',
      })))
      setStatusMsg(`${data.posts.length} posts ready. Review below then schedule.`)
      setStatusType('success')
    } catch (err) { setStatusMsg(err instanceof Error ? err.message : 'Failed'); setStatusType('error') }
    setGenerating(false)
  }

  async function scheduleAll() {
    if (!publerKey) { setStatusMsg('Enter your Publer API key at the top.'); setStatusType('error'); return }
    if (!publerProfileId) { setStatusMsg('Enter the Publer profile ID for this client.'); setStatusType('error'); return }
    setScheduling(true); setStatusMsg('Scheduling in Publer...'); setStatusType('info')
    let successCount = 0
    const updated = [...posts]
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status === 'scheduled') continue
      updated[i] = { ...updated[i], status: 'scheduling' }; setPosts([...updated])
      try {
        const res = await fetch('/api/schedule-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            publerApiKey: publerKey, profileId: publerProfileId,
            text: updated[i].text, scheduledAt: updated[i].scheduledAt,
            ctaType, ctaUrl, photoUrl: updated[i].photoUrl,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) { updated[i] = { ...updated[i], status: 'scheduled' }; successCount++ }
        else updated[i] = { ...updated[i], status: 'error', errorMsg: data.error || 'Failed' }
      } catch (err) { updated[i] = { ...updated[i], status: 'error', errorMsg: err instanceof Error ? err.message : 'Network error' } }
      setPosts([...updated])
      await new Promise(r => setTimeout(r, 500))
    }
    const allGood = successCount === updated.filter(p => p.status !== 'error' || updated.indexOf(p) < successCount + (updated.length - successCount)).length
    setStatusMsg(successCount === updated.length ? `All ${successCount} posts scheduled in Publer!` : `${successCount} of ${updated.length} scheduled. Check errors below.`)
    setStatusType(successCount === updated.length ? 'success' : 'error')
    setScheduling(false)
  }

  const pendingCount = posts.filter(p => p.status === 'pending' || p.status === 'error').length

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>P</span>
            <span className={styles.logoText}>Publer <em>AI</em></span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.apiKeyRow}>
              <label className={styles.apiLabel}>Publer API key</label>
              <input type="password" className={styles.apiKeyInput} value={publerKey} onChange={e => setPublerKey(e.target.value)} placeholder="pk_live_..." />
            </div>
            <button className={styles.clientsBtn} onClick={() => setShowClientPanel(!showClientPanel)}>
              {showClientPanel ? 'Close' : `Saved clients (${clients.length})`}
            </button>
          </div>
        </div>

        {showClientPanel && (
          <div className={styles.clientPanel}>
            <div className={styles.clientPanelInner}>
              <button className={styles.newClientBtn} onClick={newClient}>+ New client</button>
              {clients.length === 0 && <p className={styles.noClients}>No saved clients yet. Fill in the form and click Save Client.</p>}
              {clients.map(c => (
                <div key={c.id} className={`${styles.clientRow} ${selectedClientId === c.id ? styles.clientRowActive : ''}`}>
                  <button className={styles.clientLoadBtn} onClick={() => loadClient(c)}>
                    <span className={styles.clientRowName}>{c.clientName}</span>
                    <span className={styles.clientRowLocation}>{c.location}</span>
                  </button>
                  <button className={styles.clientDeleteBtn} onClick={() => deleteClient(c.id)}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className={styles.main}>
        <div className={styles.layout}>
          <div className={styles.formCol}>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardLabel}><span className={styles.stepNum}>01</span><span>Client & property info</span></div>
                <button className={`${styles.saveClientBtn} ${clientSaved ? styles.saveClientBtnSaved : ''}`} onClick={saveClient} disabled={savingClient}>
                  {clientSaved ? '✓ Saved' : savingClient ? 'Saving...' : selectedClientId ? 'Update client' : 'Save client'}
                </button>
              </div>
              <div className={styles.fieldGrid}>
                <div>
                  <label>Property / client name</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Maple Ridge Apartments" />
                </div>
                <div>
                  <label>City, state</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Denver, CO" />
                </div>
                <div className={styles.fieldFull}>
                  <label>Property description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="200-unit luxury community. 1–3 bed, $1,500–$3,200/mo. Pool, gym, dog park, coworking lounge. Near light rail. Target: young professionals & families." rows={4} />
                </div>
                <div>
                  <label>Promotions / special offers</label>
                  <input type="text" value={promos} onChange={e => setPromos(e.target.value)} placeholder="First month free on select units" />
                </div>
                <div>
                  <label>CTA destination URL</label>
                  <input type="url" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} placeholder="https://yourproperty.com" />
                </div>
                <div className={styles.fieldFull}>
                  <label>Publer profile ID (this client&apos;s Google Business)</label>
                  <input type="text" value={publerProfileId} onChange={e => setPublerProfileId(e.target.value)} placeholder="e.g. 12345678" />
                  <p className={styles.hint}>Publer → Connected Accounts → click the profile → ID is in the URL</p>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardLabel}><span className={styles.stepNum}>02</span><span>Target keywords</span></div>
              <p className={styles.sectionDesc}>Keywords the AI will naturally weave into posts to help with Google search targeting.</p>
              <div className={styles.keywordRow}>
                <input type="text" value={keywordInput} onChange={e => setKeywordInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword() } }} placeholder="e.g. apartments near downtown Denver" />
                <button className={styles.addKwBtn} onClick={addKeyword} type="button">Add</button>
              </div>
              {keywords.length > 0 && (
                <div className={styles.kwTags}>
                  {keywords.map(kw => (
                    <span key={kw} className={styles.kwTag}>{kw}<button onClick={() => setKeywords(keywords.filter(k => k !== kw))}>×</button></span>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.card}>
              <div className={styles.cardLabel}><span className={styles.stepNum}>03</span><span>Post settings</span></div>
              <div className={styles.fieldGrid}>
                <div>
                  <label>Number of posts</label>
                  <input type="number" min={1} max={30} value={postCount} onChange={e => setPostCount(parseInt(e.target.value) || 4)} />
                </div>
                <div>
                  <label>Start date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label>Posting time</label>
                  <input type="time" value={postTime} onChange={e => setPostTime(e.target.value)} />
                </div>
                <div className={styles.fieldFull}>
                  <label>Tone</label>
                  <div className={styles.chipGrid}>{TONES.map(t => <button key={t.id} type="button" className={`${styles.chip} ${tone === t.id ? styles.chipActive : ''}`} onClick={() => setTone(t.id)}>{t.label}</button>)}</div>
                </div>
                <div className={styles.fieldFull}>
                  <label>CTA button</label>
                  <div className={styles.chipGrid}>{CTA_TYPES.map(c => <button key={c.id} type="button" className={`${styles.chip} ${ctaType === c.id ? styles.chipActive : ''}`} onClick={() => setCtaType(c.id)}>{c.label}</button>)}</div>
                </div>
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardLabel}><span className={styles.stepNum}>04</span><span>Photo links (Dropbox)</span></div>
              <div className={styles.photoList}>
                {photoUrls.map((url, i) => (
                  <div key={i} className={styles.photoRow}>
                    <input type="url" value={url} onChange={e => updatePhotoUrl(i, e.target.value)} placeholder="https://www.dropbox.com/s/..." />
                    <button className={styles.removeBtn} onClick={() => removePhotoUrl(i)} type="button">×</button>
                  </div>
                ))}
              </div>
              <button className={styles.addPhotoBtn} onClick={addPhotoUrl} type="button">+ Add photo URL</button>
              <p className={styles.hint} style={{ marginTop: 8 }}>Photos cycle if fewer URLs than posts. Links auto-convert to direct download URLs.</p>
            </section>

            <button className={styles.primaryBtn} onClick={generatePosts} disabled={generating || scheduling} type="button">
              {generating ? <><span className={styles.spinner} /> Writing posts with AI...</> : 'Generate posts with AI →'}
            </button>

            {statusMsg && <div className={`${styles.statusBar} ${styles[statusType]}`}>{statusMsg}</div>}
          </div>

          <div className={styles.previewCol}>
            <div className={styles.previewHeader}>
              <div>
                <h2 className={styles.previewTitle}>{posts.length > 0 ? `${posts.length} posts` : 'Posts preview'}</h2>
                {posts.length > 0 && (
                  <p className={styles.previewSub}>
                    {posts.filter(p => p.status === 'scheduled').length} scheduled · {posts.filter(p => p.status === 'error').length} errors · {pendingCount} pending
                  </p>
                )}
              </div>
              {posts.length > 0 && (
                <button className={styles.scheduleBtn} onClick={scheduleAll} disabled={!posts.length || scheduling || generating} type="button">
                  {scheduling ? <><span className={styles.spinnerWhite} /> Scheduling...</> : `Schedule ${pendingCount > 0 ? pendingCount : 'all'} in Publer →`}
                </button>
              )}
            </div>

            {posts.length === 0 && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>✦</div>
                <p>Fill in the form and click Generate. Posts appear here for review before scheduling.</p>
              </div>
            )}

            <div className={styles.postList}>
              {posts.map((post, i) => (
                <div key={i} className={`${styles.postCard} ${post.status === 'scheduled' ? styles.postScheduled : post.status === 'error' ? styles.postError : post.status === 'scheduling' ? styles.postScheduling : ''}`}>
                  <div className={styles.postCardTop}>
                    <span className={styles.postBadge}>Post {i + 1}</span>
                    <span className={styles.postDate}>{formatDate(post.scheduledAt)}</span>
                  </div>
                  <p className={styles.postText}>{post.text}</p>
                  <p className={styles.postCharCount}>{post.text.length} / 300 characters</p>
                  <div className={styles.postMeta}>
                    <span className={styles.ctaTag}>{ctaType.replace(/_/g, ' ')}</span>
                    {post.photoUrl && <span className={styles.photoTag}>📷 Photo linked</span>}
                    {keywords.length > 0 && <span className={styles.kwIndicator}>🎯 {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}</span>}
                  </div>
                  {post.status === 'scheduling' && <div className={styles.postStatusTag} style={{ background: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', gap: 6 }}><span className={styles.spinnerAmber} /> Scheduling...</div>}
                  {post.status === 'scheduled' && <div className={`${styles.postStatusTag} ${styles.statusSuccess}`}>✓ Scheduled in Publer</div>}
                  {post.status === 'error' && <div className={`${styles.postStatusTag} ${styles.statusError}`}>✗ {post.errorMsg}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
