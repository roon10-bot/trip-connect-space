import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const AltapayCallback = () => {
  const { status } = useParams();
  const navigate = useNavigate();

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
