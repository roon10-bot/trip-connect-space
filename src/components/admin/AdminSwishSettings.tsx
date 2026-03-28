import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, TestTube, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminSwishSettings = () => {
  const [testMode, setTestMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchTestMode();
  }, []);

  const fetchTestMode = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "SWISH_TEST_MODE")
        .maybeSingle();

      if (!error && data) {
        setTestMode(data.value === "true");
      }
    } catch {
      // Default to false
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    setToggling(true);
    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: "SWISH_TEST_MODE", value: checked ? "true" : "false", updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );

      if (error) throw error;

      setTestMode(checked);
      toast.success(
        checked
          ? "Testläge aktiverat — Swish-betalningar går nu till testmiljön"
          : "Produktionsläge aktivt — Swish-betalningar går till skarpa miljön"
      );
    } catch (err) {
      toast.error("Kunde inte ändra Swish-miljö");
      console.error(err);
    } finally {
      setToggling(false);
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
          Växla mellan Swish testmiljö (MSS) och produktionsmiljö i realtid
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
            checked={testMode}
            onCheckedChange={handleToggle}
            disabled={toggling}
          />
          <Label htmlFor="swish-test-mode" className="cursor-pointer">
            {toggling ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Byter miljö...
              </span>
            ) : (
              "Aktivera testläge"
            )}
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
          <p>• Testcertifikat (SWISH_TEST_CERT/KEY) används automatiskt i testläge</p>
          <p>• Ändringen gäller omedelbart för alla nya betalningar</p>
        </div>
      </CardContent>
    </Card>
  );
};
