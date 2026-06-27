// 1週間の献立アプリ — Cloudflare Worker
// 役割: アプリ(index.html)の配信 + データ同期API(/api/data)をD1で提供
// 認証は Cloudflare Access が前段で担当する（このコードにキーは持たない）。

// 旧GitHub Pagesからのデータ移行(PUT)を受け取れるよう、CORSを許可する
const MIGRATE_ORIGIN = "https://yuukiniwayma-hub.github.io";
function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  if (origin === MIGRATE_ORIGIN) {
    return {
      "Access-Control-Allow-Origin": MIGRATE_ORIGIN,
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
  return {};
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/data") {
      // CORS プリフライト
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }
      const cors = corsHeaders(request);
      // 読み込み
      if (request.method === "GET") {
        const row = await env.DB
          .prepare("SELECT recipes, assignments, updated_at FROM weekly_dinner WHERE id = 'default'")
          .first();
        return Response.json({
          recipes: JSON.parse((row && row.recipes) || "[]"),
          assignments: JSON.parse((row && row.assignments) || "{}"),
          updated_at: (row && row.updated_at) || "",
        }, { headers: cors });
      }

      // 保存
      if (request.method === "PUT") {
        let body;
        try {
          body = await request.json();
        } catch (e) {
          return new Response("Bad Request", { status: 400 });
        }
        const recipes = JSON.stringify(body.recipes || []);
        const assignments = JSON.stringify(body.assignments || {});
        const updatedAt = body.updated_at || new Date().toISOString();
        await env.DB
          .prepare(
            "INSERT INTO weekly_dinner (id, recipes, assignments, updated_at) VALUES ('default', ?1, ?2, ?3) " +
            "ON CONFLICT(id) DO UPDATE SET recipes = ?1, assignments = ?2, updated_at = ?3"
          )
          .bind(recipes, assignments, updatedAt)
          .run();
        return new Response(null, { status: 204, headers: cors });
      }

      return new Response("Method Not Allowed", { status: 405 });
    }

    // それ以外は静的アセット（index.html 等）を返す
    return env.ASSETS.fetch(request);
  },
};
