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
  let rawBody = "";
  if (req.method === "POST") {
    rawBody = await req.text();
    bodyParams = new URLSearchParams(rawBody);
  }

  const callbackType = url.searchParams.get("type") || "redirect";

  // Log AltaPay error details for debugging
  const errorMessage = bodyParams.get("error_message") || bodyParams.get("merchant_error_message") || "";
  const paymentStatus = bodyParams.get("status") || bodyParams.get("payment_status") || "";
  const transactionId = bodyParams.get("transaction_id") || "";
  const cardholderMessage = bodyParams.get("cardholder_message_must_be_shown") || "";
  console.log(`[ALTAPAY-CALLBACK] Payment details: status=${paymentStatus}, error=${errorMessage}, cardholder_msg=${cardholderMessage}, txn=${transactionId}`);
  
  // Log first 1500 chars of body for full debugging
  if (rawBody) {
    console.log(`[ALTAPAY-CALLBACK] Raw body (first 1500): ${rawBody.substring(0, 1500)}`);
  }
  
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

  const queryParts: string[] = [
    `status=${encodeURIComponent(callbackType)}`,
  ];
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
