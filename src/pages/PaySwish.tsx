import { useEffect } from "react";

/**
 * AltaPay Swish callback_form page.
 * AltaPay injects its payment JavaScript into the <form id="PensioPaymentForm">.
 * This page is loaded inside an iframe or redirect by AltaPay when the user
 * selects Swish as payment method.
 */
const PaySwish = () => {
  useEffect(() => {
    // AltaPay appends a <script> tag via the DynamicJavascriptUrl.
    // The script looks for <form id="PensioPaymentForm"> and renders the
    // Swish QR / app-switch flow inside it.
    // Nothing else needs to happen here; the form is the anchor.
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Swish-betalning</h1>
        <p className="text-muted-foreground text-sm">
          Vänta medan Swish laddas…
        </p>

        {/* AltaPay required form anchor */}
        <form id="PensioPaymentForm" className="altapay-swish-form" />

        <p className="text-xs text-muted-foreground">
          Du omdirigeras automatiskt när betalningen är klar.
        </p>
      </div>
    </div>
  );
};

export default PaySwish;
