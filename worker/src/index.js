// Import the background JS that contains the fetch function
import { fetch as wasmFetch } from "../pkg/rgou_ai_worker_bg.js";

// Export the fetch function for Cloudflare Workers
export default {
  fetch: wasmFetch,
};
