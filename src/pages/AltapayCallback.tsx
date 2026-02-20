import { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const AltapayCallback = () => {
  const { status: pathStatus } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Support both /altapay/:status and /payment/return?status=ok
  const status = pathStatus || searchParams.get("status") || "";

  useEffect(() => {
    if (status === "ok" || status === "redirect") {
      toast.success("Betalningen genomfördes!");
    } else if (status === "fail") {
      toast.error("Betalningen misslyckades.");
    }
    // Redirect to dashboard after brief delay
    const timer = setTimeout(() => navigate("/dashboard"), 2000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Omdirigerar till din dashboard...</p>
      </div>
    </div>
  );
};

export default AltapayCallback;
