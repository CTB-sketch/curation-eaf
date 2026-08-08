import { supabase } from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    // Étape 1 : récupérer la ligne la plus récente
    const { data: rows, error: fetchErr } = await supabase
      .from('curation_state')
      .select('id, data, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)

    if (fetchErr) {
      console.error('[load-data] fetch error:', fetchErr)
      return res.status(500).json({ error: fetchErr.message, code: fetchErr.code })
    }

    // Cas 1 : aucune ligne → créer une ligne initiale
    if (!rows || rows.length === 0) {
      const initialState = {
        version: 3,
        role: 'admin',
        settings: {
          freq: 30, actif: false, autoCollect: true, autoLinks: true,
          testMode: true, currentProgram: '2025-2026', nextProgram: '2026-2027',
          lastDigest: null
        },
        liens: [], inbox: [], fingerprints: {}, collectes: [],
        watch: [], candidats: [], rapports: [], audit: [], log: []
      }
      const { data: inserted, error: insertErr } = await supabase
        .from('curation_state')
        .insert({ data: initialState })
        .select('data, updated_at')
        .single()

      if (insertErr) {
        console.error('[load-data] insert error:', insertErr)
        return res.status(500).json({ error: insertErr.message })
      }
      return res.status(200).json({ state: inserted.data, updated_at: inserted.updated_at })
    }

    // Cas 2 : ligne trouvée
    return res.status(200).json({
      state: rows[0].data,
      updated_at: rows[0].updated_at
    })
  } catch (e) {
    console.error('[load-data] exception:', e)
    return res.status(500).json({ error: e.message || 'exception' })
  }
}
