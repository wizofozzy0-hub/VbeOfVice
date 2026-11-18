export async function onRequestPost(context) {
  const { request, env } = context;
  const secret = request.headers.get("X-Admin-Secret");

  if (!secret || secret !== env.ADMIN_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await request.json();
  const repo = env.GITHUB_REPO; // e.g. "username/vibeofvice.github.io"
  const path = "content.json";
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${path}`;

  const existingReq = await fetch(apiUrl, {
    headers: {
      "Authorization": `Bearer ${env.GITHUB_PAT}`,
      "User-Agent": "VibeofVice-CMS"
    }
  });

  let sha = undefined;
  if (existingReq.ok) {
    const existingData = await existingReq.json();
    sha = existingData.sha;
  }

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(body, null, 2))));
  const commitRes = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_PAT}`,
      "Content-Type": "application/json",
      "User-Agent": "VibeofVice-CMS"
    },
    body: JSON.stringify({
      message: "chore(cms): update VibeofVice content.json",
      content: encoded,
      sha
    })
  });

  return new Response(JSON.stringify({ ok: commitRes.ok }), {
    status: commitRes.ok ? 200 : 500,
    headers: { "Content-Type": "application/json" }
  });
}