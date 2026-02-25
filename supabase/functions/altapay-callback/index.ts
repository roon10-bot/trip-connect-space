import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/**
 * AltaPay Callback Handler
 * 
 * AltaPay POSTs to callback_ok / callback_fail / callback_redirect after payment.
 * Static hosting (Cloudflare Pages) returns 405 for POST requests.
 * This edge function accepts the POST and redirects the user's browser
 * to the corresponding frontend SPA page via HTTP 302.
 */

const FRONTEND_BASE = "https://studentresor.com";

serve(async (req) => {
  // Accept any method (POST from AltaPay, GET for testing)
  const url = new URL(req.url);
  
  // Consume request body to avoid resource leaks
  if (req.method === "POST") {
    await req.text();
  }

  // Determine the callback type from the path: /altapay-callback?type=ok|fail|redirect
  const callbackType = url.searchParams.get("type") || "redirect";
  
  // Map to frontend route
  let targetPath: string;
  switch (callbackType) {
    case "ok":
      targetPath = "/altapay/ok";
      break;
    case "fail":
      targetPath = "/altapay/fail";
      break;
    default:
      targetPath = "/altapay/redirect";
      break;
  }

  const redirectUrl = `${FRONTEND_BASE}${targetPath}`;
  console.log(`[ALTAPAY-CALLBACK] ${req.method} type=${callbackType} -> 302 ${redirectUrl}`);

  return new Response(null, {
    status: 302,
    headers: {
      "Location": redirectUrl,
      "Cache-Control": "no-store",
    },
  });
});
