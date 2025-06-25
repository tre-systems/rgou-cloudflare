const worker = {
  async fetch(request, env) {
    // Handle static assets
    try {
      const asset = await env.ASSETS.fetch(request);
      if (asset.status === 200) {
        return asset;
      }
    } catch {
      // Asset not found, continue
    }

    // For all other routes, serve index.html (SPA routing)
    try {
      const indexRequest = new Request(new URL("/index.html", request.url));
      const indexAsset = await env.ASSETS.fetch(indexRequest);
      if (indexAsset.status === 200) {
        return new Response(indexAsset.body, {
          headers: {
            "Content-Type": "text/html",
            ...Object.fromEntries(indexAsset.headers.entries()),
          },
        });
      }
    } catch {
      // Fallback error
    }

    return new Response("Not Found", { status: 404 });
  },
};

export default worker;
