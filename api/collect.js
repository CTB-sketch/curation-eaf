import Parser from 'rss-parser'

const UA = 'Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0'

const parser = new Parser({
  timeout: 15000,
  headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' }
})

async function getText(url) {
  const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': UA, Accept: '*/*' } })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return { text: await r.text(), type: r.headers.get('content-type') || '' }
}

function isXml(body, type) {
  return /xml|rss|atom/i.test(type) || /^\s*(<\?xml|<rss|<feed)/i.test(body)
}

/* Découvre le flux RSS déclaré dans une page HTML (cas Radio France) */
function discoverFeed(html, base) {
  const link = html.match(/<link[^>]*type=["']application\/(?:rss|atom)\+xml["'][^>]*>/i)
    || html.match(/<link[^>]*href=["'][^"']*(?:rss|feed)[^"']*["'][^>]*>/i)
  if (!link) return null
  const href = (link[0].match(/href=["']([^"']+)["']/i) || [])[1]
  if (!href) return null
  return new URL(href, base).toString()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const { feed, limit } = req.query
  if (!feed) return res.status(400).json({ error: "Paramètre 'feed' requis" })
  const max = Math.min(parseInt(limit || '30', 10) || 30, 100)   // ✅ limite configurable

  try {
    let url = feed
    const first = await getText(url)
    let body
    if (isXml(first.text, first.type)) {
      body = first.text                       // c'est déjà un flux
    } else {
      const disc = discoverFeed(first.text, url)   // c'est une page → on cherche le flux
      if (!disc) return res.status(200).json({ feed, error: 'Aucun flux RSS détecté sur cette page' })
      url = disc
      body = (await getText(url)).text
    }
    const parsed = await parser.parseString(body)
    const items = (parsed.items || []).slice(0, max).map(it => ({
      titre: it.title || '(sans titre)',
      url: it.link || it.guid || null,
      desc: (it.contentSnippet || it.content || '').replace(/<[^>]*>/g, '').slice(0, 220),
      date: it.isoDate || it.pubDate || null
    }))
    return res.status(200).json({ feed: url, titre: parsed.title, items })
  } catch (e) {
    return res.status(200).json({ feed, error: e.message || 'flux inaccessible' })
  }
}
