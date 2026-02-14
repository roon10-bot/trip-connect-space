import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Check } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import studentresorLogo from "@/assets/studentresor-logo.svg";
import loginHero from "@/assets/login-hero.png";

const authSchema = z.object({
  email: z.string().email("Ange en giltig e-postadress"),
  password: z.string().min(8, "Lösenordet måste vara minst 8 tecken"),
  fullName: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const { signIn, signUp, user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  // Check if URL contains magic link / invite / recovery hash
  const hasMagicLinkHash = () => {
    const hash = window.location.hash;
    return hash && (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("type=magiclink"));
  };

  // Listen for auth events from magic link / recovery token processing
  useEffect(() => {
    // Set immediately if hash is present (before auth event fires)
    if (hasMagicLinkHash()) {
      setIsSettingPassword(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        if (hasMagicLinkHash()) {
          setIsSettingPassword(true);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  // Handle redirect after successful login
  useEffect(() => {
    if (shouldRedirect && user && !adminLoading) {
      navigate(isAdmin ? "/admin" : "/dashboard");
      setShouldRedirect(false);
    }
  }, [shouldRedirect, user, isAdmin, adminLoading, navigate]);

  // Handle already logged in users (but not if setting password via magic link)
  useEffect(() => {
    if (user && !adminLoading && !isSettingPassword) {
      navigate(isAdmin ? "/admin" : "/dashboard");
    }
  }, [user, isAdmin, adminLoading, navigate, isSettingPassword]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Felaktiga inloggningsuppgifter");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Välkommen tillbaka!");
          setShouldRedirect(true);
        }
      } else {
        const { error } = await signUp(data.email, data.password, data.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("E-postadressen är redan registrerad");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Konto skapat! Du är nu inloggad.");
          setShouldRedirect(true);
        }
      }
    } catch (error) {
      toast.error("Ett oväntat fel uppstod");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Lösenordet måste vara minst 8 tecken");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Lösenord sparat! Du är nu inloggad.");
        setIsSettingPassword(false);
        setShouldRedirect(true);
      }
    } catch {
      toast.error("Ett oväntat fel uppstod");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Google-inloggning misslyckades");
        console.error("Google sign-in error:", error);
      }
    } catch {
      toast.error("Google-inloggning misslyckades");
    } finally {
      setIsGoogleLoading(false);
    }
  };


  const toggleMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 flex-col">
        {/* Image section */}
        <div className="relative flex-1">
          <img
            src={loginHero}
            alt="Studentresor"
            className="w-full h-full object-cover brightness-50 contrast-75"
          />
          <div className="absolute inset-0 bg-[#0C4D73]/70" />
          <div className="absolute inset-0 flex flex-col justify-between p-16">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-12">
                <img src={studentresorLogo} alt="Studentresor" className="h-10 opacity-80" />
              </Link>
              <h2 className="text-3xl font-serif font-semibold text-white/90 mb-4">
                Din resa. Samlad på ett ställe.
              </h2>
              <p className="text-white/60 text-base">
                Skapa ett konto för att hantera din bokning, betalningar och viktiga uppdateringar inför resan.
              </p>
            </div>
          </div>
        </div>
        {/* Info section below image */}
        <div className="bg-[#0a3d5c] px-16 py-6">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              "Se och betala dina delbetalningar",
              "Ladda ner biljetter och dokument",
              "Fyll i uppgifter & allergier",
              "Få uppdateringar direkt från oss",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-white/50 text-xs">
                <Check className="w-3.5 h-3.5 text-white/35 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-white/25 text-[10px] mt-4">
            Ställd resegaranti hos Kammarkollegiet • Säker betalning via Stripe • 24/7 support under resan
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={studentresorLogo} alt="Studentresor" className="h-8" />
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              {isSettingPassword ? "Välj ditt lösenord" : isLogin ? "Logga in" : "Skapa konto"}
            </h1>
            {(isSettingPassword || !isLogin) && (
              <p className="text-muted-foreground">
                {isSettingPassword
                  ? "Ange ett lösenord för att aktivera ditt konto"
                  : "Använd din e-post för att skapa ett konto och få full kontroll över din resa."}
              </p>
            )}
          </div>

          {isSettingPassword ? (
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nytt lösenord</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minst 8 tecken"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-ocean hover:opacity-90 text-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Spara lösenord"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">



              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.se"
                  {...register("email")}
                  className="h-12"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Lösenord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-ocean hover:opacity-90 text-lg font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  "Logga in"
                ) : (
                  "Skapa konto"
                )}
              </Button>
            </form>
          )}

          {!isSettingPassword && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">eller</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base font-medium"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                )}
                Fortsätt med Google
              </Button>

            </>
          )}


          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-primary hover:underline font-medium"
            >
              {isLogin
                ? "Har du inget konto? Skapa ett"
                : "Har du redan ett konto? Logga in"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Genom att skapa konto godkänner du våra{" "}
            <Link to="/terms" className="underline hover:text-foreground">villkor</Link>{" "}
            och integritetspolicy.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
