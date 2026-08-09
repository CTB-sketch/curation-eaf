export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const key = process.env.YOUTUBE_API_KEY
  const { channel, limit } = req.query
  if (!key) return res.status(200).json({ error: 'YOUTUBE_API_KEY absente (Vercel > Settings > Environment Variables)' })
  if (!channel) return res.status(400).json({ error: 'Paramètre channel requis (ID UC…)' })
  const max = Math.min(parseInt(limit || '50', 10) || 50, 50)
  try {
    const uploads = 'UU' + channel.slice(2)   // playlist "uploads" = UU + reste de l'ID
    const url = 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=' + uploads + '&maxResults=' + max + '&key=' + key
    const r = await fetch(url)
    const d = await r.json()
    if (d.error) return res.status(200).json({ error: d.error.message })
    const items = (d.items || []).map(it => ({
      titre: it.snippet.title,
      url: 'https://www.youtube.com/watch?v=' + it.snippet.resourceId.videoId,
      desc: (it.snippet.description || '').slice(0, 220),
      date: it.snippet.publishedAt
    }))
    return res.status(200).json({ feed: 'yt:' + channel, titre: 'YouTube', items })
  } catch (e) { return res.status(200).json({ error: e.message }) }
}
