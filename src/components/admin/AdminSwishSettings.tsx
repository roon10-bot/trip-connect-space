import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, TestTube, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminSwishSettings = () => {
  const [testMode, setTestMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestMode();
  }, []);

  const fetchTestMode = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/swish-test-mode`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      setTestMode(data.test_mode ?? false);
    } catch {
      setTestMode(false);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (checked: boolean) => {
    // Since we can't change secrets at runtime, show instructions
    if (checked) {
      toast.info(
        "För att aktivera testläge: Sätt SWISH_TEST_MODE till 'true' som secret i Lovable Cloud.",
        { duration: 8000 }
      );
    } else {
      toast.info(
        "För att gå tillbaka till produktion: Sätt SWISH_TEST_MODE till 'false' (eller ta bort den) som secret.",
        { duration: 8000 }
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Laddar Swish-inställningar...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Swish-miljö
        </CardTitle>
        <CardDescription>
          Välj mellan Swish testmiljö (MSS) och produktionsmiljö
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-4">
            {testMode ? (
              <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TestTube className="w-5 h-5 text-amber-600" />
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            )}
            <div>
              <p className="font-medium">
                {testMode ? "Testmiljö (MSS)" : "Produktionsmiljö"}
              </p>
              <p className="text-sm text-muted-foreground">
                {testMode
                  ? "Betalningar skickas till mss.cpc.getswish.net — inga riktiga pengar"
                  : "Betalningar skickas till cpc.getswish.net — skarpt läge"}
              </p>
            </div>
          </div>
          <Badge variant={testMode ? "secondary" : "default"} className={testMode ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}>
            {testMode ? "TEST" : "PRODUKTION"}
          </Badge>
        </div>

        <div className="flex items-center gap-3 p-4 rounded-lg border">
          <Switch
            id="swish-test-mode"
            checked={testMode ?? false}
            onCheckedChange={handleToggle}
          />
          <Label htmlFor="swish-test-mode" className="cursor-pointer">
            Aktivera testläge
          </Label>
        </div>

        {testMode && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">Testläge aktivt</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                Alla Swish-betalningar dirigeras till testmiljön. Glöm inte att byta tillbaka innan ni går live!
              </p>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Testmiljö använder Swish MSS (Merchant Swish Simulator)</p>
          <p>• Samma certifikat fungerar i båda miljöer</p>
          <p>• Ändra genom att uppdatera secret <code className="bg-muted px-1 py-0.5 rounded">SWISH_TEST_MODE</code></p>
        </div>
      </CardContent>
    </Card>
  );
};
