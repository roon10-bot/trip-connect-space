import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const AltapayCallback = () => {
  const { status: pathStatus } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Support /altapay/:status, /altapay/ok, /altapay/fail, /altapay/redirect
  // and legacy /payment/return?status=ok
  const status = pathStatus || searchParams.get("status") || "redirect";

  const isSuccess = status === "ok" || status === "redirect";
  const isFail = status === "fail";

  useEffect(() => {
    if (isSuccess) {
      toast.success("Betalningen genomfördes!");
    } else if (isFail) {
      toast.error("Betalningen misslyckades.");
    }
    // Redirect to dashboard after brief delay
    const timer = setTimeout(() => navigate("/dashboard"), 3000);
    return () => clearTimeout(timer);
  }, [isSuccess, isFail, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {isSuccess ? (
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
        ) : isFail ? (
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
        ) : (
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
        )}
        <h1 className="text-xl font-semibold">
          {isSuccess ? "Betalningen lyckades!" : isFail ? "Betalningen misslyckades" : "Bearbetar..."}
        </h1>
        <p className="text-muted-foreground">Omdirigerar till din dashboard...</p>
      </div>
    </div>
  );
};

export default AltapayCallback;
