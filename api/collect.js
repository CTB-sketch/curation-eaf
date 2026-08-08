   import Parser from "rss-parser";
   const parser = new Parser({ timeout: 12000, headers: { "User-Agent": "Mozilla/5.0 (BacFrancais-curation)" } });

   export default async function handler(req, res) {
     const { feed } = req.query;
     if (!feed) return res.status(400).json({ error: "Paramètre 'feed' requis" });
     try {
       const result = await parser.parseURL(feed);
       const items = (result.items || []).slice(0, 15).map(it => ({
         titre: it.title || "(sans titre)",
         url: it.link || null,
         desc: (it.contentSnippet || it.content || "").replace(/<[^>]*>/g, "").slice(0, 220),
         date: it.isoDate || it.pubDate || null
       }));
       return res.status(200).json({ feed, titre: result.title, items });
     } catch (e) {
       return res.status(200).json({ feed, error: e.message || "flux inaccessible" });
     }
   }
