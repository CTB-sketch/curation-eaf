// api/load-data.js — Récupère l'état le plus récent depuis Supabase
import { supabase } from './db.js'

export default async function handler(req, res) {
  // CORS pour les appels directs depuis le navigateur
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { data, error } = await supabase
      .from('curation_state')
      .select('data, updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[load-data]', error.message)
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'Aucun état en base' })
    }

    return res.status(200).json({
      state: data.data,
      updated_at: data.updated_at
    })
  } catch (e) {
    console.error('[load-data] exception', e)
    return res.status(500).json({ error: e.message || 'exception' })
  }
}
