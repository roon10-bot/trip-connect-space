import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

/**
 * AltaPay Callback Handler
 * 
 * AltaPay POSTs to callback_ok / callback_fail / callback_redirect after payment.
 * Static hosting (Cloudflare Pages) returns 405 for POST requests.
 * This edge function accepts the POST and redirects the user's browser
 * to the corresponding frontend SPA page via HTTP 302.
 * 
 * Passes through transaction_info parameters (like pending_booking_id)
 * as query params on the redirect URL.
 */

const FRONTEND_BASE = "https://studentresor.com";

serve(async (req) => {
  const url = new URL(req.url);
  
  // Parse body for POST (AltaPay sends form data)
  let bodyParams = new URLSearchParams();
  if (req.method === "POST") {
    const body = await req.text();
    bodyParams = new URLSearchParams(body);
  }

  const callbackType = url.searchParams.get("type") || "redirect";
  
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

  // Extract pending_booking_id from transaction_info if present
  const pendingBookingId = bodyParams.get("transaction_info[pending_booking_id]") || 
    url.searchParams.get("pending_booking_id") || "";

  const queryParts: string[] = [];
  if (pendingBookingId) {
    queryParts.push(`pending_booking_id=${encodeURIComponent(pendingBookingId)}`);
  }

  const query = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const redirectUrl = `${FRONTEND_BASE}${targetPath}${query}`;
  console.log(`[ALTAPAY-CALLBACK] ${req.method} type=${callbackType} -> 302 ${redirectUrl}`);

  return new Response(null, {
    status: 302,
    headers: {
      "Location": redirectUrl,
      "Cache-Control": "no-store",
    },
  });
});
