import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Kunde inte logga ut. Försök igen.");
    } else {
      toast.success("Du har loggats ut.");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-lg">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till dashboard
        </Button>

        <h1 className="text-3xl font-serif font-bold text-foreground mb-8">
          Inställningar
        </h1>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Konto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Inloggad som {user?.email}
              </p>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logga ut
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Radera mitt konto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Radera konto</AlertDialogTitle>
                    <AlertDialogDescription>
                      För att radera ditt konto och all tillhörande data,
                      vänligen kontakta oss på{" "}
                      <a
                        href="mailto:info@studentresor.com"
                        className="text-primary underline"
                      >
                        info@studentresor.com
                      </a>{" "}
                      med ämnesraden "Radera mitt konto". Vi behandlar din
                      begäran inom 30 dagar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Stäng</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        window.location.href =
                          "mailto:info@studentresor.com?subject=Radera%20mitt%20konto";
                      }}
                    >
                      Skicka e-post
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
