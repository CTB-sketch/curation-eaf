// api/save-data.js — Sauvegarde l'état dans Supabase (upsert de la ligne unique)
import { supabase } from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const newData = req.body
    if (!newData || typeof newData !== 'object') {
      return res.status(400).json({ error: 'Corps JSON invalide' })
    }

    // Récupérer l'ID de la ligne unique existante
    const { data: existing, error: fetchErr } = await supabase
      .from('curation_state')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (fetchErr) {
      return res.status(500).json({ error: fetchErr.message })
    }

    let op
    if (existing && existing.id) {
      op = await supabase
        .from('curation_state')
        .update({ data: newData, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      op = await supabase
        .from('curation_state')
        .insert({ data: newData })
    }

    if (op.error) {
      return res.status(500).json({ error: op.error.message })
    }

    return res.status(200).json({ success: true, updated_at: new Date().toISOString() })
  } catch (e) {
    console.error('[save-data]', e)
    return res.status(500).json({ error: e.message || 'exception' })
  }
}
