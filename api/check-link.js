   export default async function handler(req, res) {
     const { url } = req.query;
     if (!url) return res.status(400).json({ error: "Paramètre 'url' requis" });
     const ctrl = new AbortController();
     const timer = setTimeout(() => ctrl.abort(), 12000);
     try {
       const r = await fetch(url, {
         method: "GET",
         redirect: "follow",
         signal: ctrl.signal,
         headers: { "User-Agent": "Mozilla/5.0 (BacFrancais-curation)" }
       });
       clearTimeout(timer);
       return res.status(200).json({
         url, ok: r.ok, status: r.status, finalUrl: r.url, redirected: r.url !== url
       });
     } catch (e) {
       clearTimeout(timer);
       return res.status(200).json({ url, ok: false, error: e.message || "erreur réseau" });
     }
   }
