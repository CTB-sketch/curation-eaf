import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY

  const report = {
    variables: {
      SUPABASE_URL: url ? 'présente (' + url.slice(0, 12) + '…)' : '❌ ABSENTE',
      SUPABASE_ANON_KEY: key ? 'présente (' + key.slice(0, 8) + '…)' : '❌ ABSENTE'
    }
  }

  // Si les variables manquent, on s'arrête là avec le verdict
  if (!url || !key) {
    report.verdict = 'Les variables ne sont pas visibles. Il faut les ajouter dans Vercel PUIS redéployer (un simple commit ne suffit pas toujours).'
    return res.status(200).json(report)
  }

  const supabase = createClient(url, key)

  // Test 1 : lecture (SELECT)
  try {
    const { data, error } = await supabase.from('curation_state').select('id')
    if (error) {
      report.lecture = { ok: false, error: error.message, code: error.code }
      if (error.code === '42P01') report.lecture.verdict = 'La table n\'existe pas → exécute le schéma SQL dans Supabase.'
      if (error.code === '42501') report.lecture.verdict = 'RLS bloque la lecture → vérifie les policies.'
    } else {
      report.lecture = { ok: true, lignes: data.length }
    }
  } catch (e) {
    report.lecture = { ok: false, error: e.message }
  }

  // Test 2 : écriture (INSERT puis DELETE d'une ligne de test)
  try {
    const { data: ins, error: insErr } = await supabase
      .from('curation_state').insert({ data: { test: true } }).select('id').single()
    if (insErr) {
      report.ecriture = { ok: false, error: insErr.message, code: insErr.code }
      if (insErr.code === '42501') report.ecriture.verdict = 'RLS bloque l\'écriture → vérifie les policies INSERT.'
    } else {
      const { error: delErr } = await supabase.from('curation_state').delete().eq('id', ins.id)
      report.ecriture = { ok: !delErr, detail: delErr ? delErr.message : 'insert + delete OK' }
    }
  } catch (e) {
    report.ecriture = { ok: false, error: e.message }
  }

  return res.status(200).json(report)
}
