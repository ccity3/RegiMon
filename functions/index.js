export default {
  async fetch(request) {
    return new Response("Hello, this is a test from Cloudflare Pages Functions!", {
      headers: { "Content-Type": "text/plain" },
    });
  },
};
