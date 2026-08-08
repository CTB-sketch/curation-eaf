import { supabase } from './db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method === 'POST') {
    // Test d'écriture forcée
    const testData = {
      version: 3,
      test: true,
      timestamp: new Date().toISOString(),
      message: "Test de persistance"
    }

    try {
      const { data: rows, error: fetchErr } = await supabase
        .from('curation_state')
        .select('id')
        .limit(1)

      if (fetchErr) {
        return res.status(500).json({ error: 'SELECT failed', detail: fetchErr.message })
      }

      if (rows && rows.length > 0) {
        const { error: updateErr } = await supabase
          .from('curation_state')
          .update({ data: testData, updated_at: new Date().toISOString() })
          .eq('id', rows[0].id)

        if (updateErr) {
          return res.status(500).json({ error: 'UPDATE failed', detail: updateErr.message })
        }

        return res.status(200).json({ success: true, action: 'update', id: rows[0].id })
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('curation_state')
          .insert({ data: testData })
          .select()
          .single()

        if (insertErr) {
          return res.status(500).json({ error: 'INSERT failed', detail: insertErr.message })
        }

        return res.status(200).json({ success: true, action: 'insert', id: inserted.id })
      }
    } catch (e) {
      return res.status(500).json({ error: 'exception', detail: e.message })
    }
  }

  if (req.method === 'GET') {
    // Test de lecture
    try {
      const { data: rows, error: fetchErr } = await supabase
        .from('curation_state')
        .select('data, updated_at')
        .order('updated_at', { ascending: false })
        .limit(1)

      if (fetchErr) {
        return res.status(500).json({ error: 'SELECT failed', detail: fetchErr.message })
      }

      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'no data' })
      }

      return res.status(200).json({ 
        success: true, 
        updated_at: rows[0].updated_at,
        has_test: rows[0].data.test === true,
        timestamp: rows[0].data.timestamp
      })
    } catch (e) {
      return res.status(500).json({ error: 'exception', detail: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
