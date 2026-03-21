import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAdmin } from "@/hooks/useAdmin";
import { usePartner } from "@/hooks/usePartner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Check, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import studentresorLogo from "@/assets/studentresor-logo.svg";
import loginHero from "@/assets/login-hero.png";
import { HostRegistrationForm, type IndividualFormData, type CompanyFormData } from "@/components/auth/HostRegistrationForm";
import type { PartnerProfileData } from "@/types/partner";

const signupSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().trim().min(1, t("auth.firstNameRequired") || "Förnamn krävs"),
  lastName: z.string().trim().min(1, t("auth.lastNameRequired") || "Efternamn krävs"),
  email: z.string().email(t("auth.invalidEmail") || "Ange en giltig e-postadress"),
  password: z.string().min(8, t("auth.minChars")),
});

const loginSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t("auth.invalidEmail") || "Ange en giltig e-postadress"),
  password: z.string().min(8, t("auth.minChars")),
});

type SignupFormData = z.infer<ReturnType<typeof signupSchema>>;
type LoginFormData = z.infer<ReturnType<typeof loginSchema>>;
type AuthFormData = SignupFormData | LoginFormData;

type AccountType = "traveler" | "host";

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialHash = typeof window !== "undefined" ? window.location.hash : "";
  const isEmailConfirmationFlow =
    searchParams.get("verified") === "1" ||
    searchParams.get("type") === "signup" ||
    initialHash.includes("type=signup");
  const [isLogin, setIsLogin] = useState(isEmailConfirmationFlow || searchParams.get("mode") !== "signup");
  const [accountType, setAccountType] = useState<AccountType>("traveler");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [emailJustVerified, setEmailJustVerified] = useState(isEmailConfirmationFlow);
  
  const [newPassword, setNewPassword] = useState("");
  const { signIn, signUp, signOut, user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const { partnerProfile, isLoading: partnerLoading } = usePartner();
  const navigate = useNavigate();

  // Check if URL contains magic link / invite / recovery hash
  const hasMagicLinkHash = () => {
    const hash = window.location.hash;
    return hash && (hash.includes("type=invite") || hash.includes("type=recovery") || hash.includes("type=magiclink"));
  };

  const isVerificationLanding = () => {
    const hash = window.location.hash;
    return (
      searchParams.get("verified") === "1" ||
      searchParams.get("type") === "signup" ||
      hash.includes("type=signup")
    );
  };

  useEffect(() => {
    if (isVerificationLanding()) {
      setShouldRedirect(false);
      setEmailJustVerified(true);
      setIsLogin(true);
      setIsSettingPassword(false);
      return;
    }

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
  }, [searchParams]);

  const welcomeEmailSentRef = useRef(false);

  useEffect(() => {
    if (emailJustVerified && user && !welcomeEmailSentRef.current) {
      welcomeEmailSentRef.current = true;
      setShouldRedirect(false);

      // Send welcome email server-side before signing out
      void (async () => {
        try {
          if (window.location.hash) {
            window.history.replaceState(null, "", `${window.location.pathname}?verified=1`);
          }

          const { error } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              template_key: "welcome",
              to_email: user.email,
              variables: {
                first_name: user.user_metadata?.full_name?.split(" ")[0] || "",
              },
              action_url: "https://studentresor.com/destinations",
            },
          });

          if (error) {
            throw error;
          }
        } catch (e) {
          console.error("Welcome email failed:", e);
        }
        await signOut();
      })();
    }
  }, [emailJustVerified, signOut, user]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(isLogin ? loginSchema(t) : signupSchema(t)),
  });

  const getRedirectPath = useCallback(() => {
    if (isAdmin) return "/admin";
    if (partnerProfile) return "/partner";
    return "/dashboard";
  }, [isAdmin, partnerProfile]);

  useEffect(() => {
    if (shouldRedirect && user && !adminLoading && !partnerLoading) {
      navigate(getRedirectPath());
      setShouldRedirect(false);
    }
  }, [shouldRedirect, user, adminLoading, partnerLoading, navigate, getRedirectPath]);

  useEffect(() => {
    if (user && !adminLoading && !partnerLoading && !isSettingPassword && !emailJustVerified) {
      navigate(getRedirectPath());
    }
  }, [user, adminLoading, partnerLoading, navigate, isSettingPassword, emailJustVerified, getRedirectPath]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    try {
      if (isLogin) {
        // Clear verification flag so the sign-out guard doesn't fire after manual login
        setEmailJustVerified(false);
        const { error } = await signIn(data.email, data.password);
        if (error) {
          toast.error(error.message.includes("Invalid login credentials") ? t("auth.invalidCredentials") : error.message);
        } else {
          toast.success(t("auth.welcomeBack"));
          setShouldRedirect(true);
        }
      } else {
        const fullName = `${'firstName' in data ? data.firstName : ''} ${'lastName' in data ? data.lastName : ''}`.trim();
        const { error } = await signUp(data.email, data.password, fullName);
        if (error) {
          toast.error(error.message.includes("already registered") ? t("auth.emailRegistered") : error.message);
        } else {
          setVerificationEmail(data.email);
          setShowEmailVerification(true);
        }
      }
    } catch {
      toast.error(t("auth.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleHostSubmit = async (
    email: string,
    password: string,
    fullName: string,
    partnerData: PartnerProfileData
  ) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await signUp(email, password, fullName);
      if (authError) {
        toast.error(authError.message.includes("already registered") ? t("auth.emailRegistered") : authError.message);
        return;
      }
      
      const userId = authData?.user?.id;
      if (!userId) {
        toast.error(t("auth.unexpectedError"));
        return;
      }

      // Insert partner profile with status 'pending'
      // Partner role is assigned automatically by DB trigger when admin approves
      const { error: profileError } = await supabase.from("partner_profiles").insert({
        user_id: userId,
        ...partnerData,
      });

      if (profileError) {
        console.error("Partner profile insert error:", profileError);
        toast.error(t("auth.unexpectedError"));
        return;
      }

      toast.success(t("auth.accountCreated"));

      supabase.functions.invoke("admin-notifications", {
        body: { type: "partner_registered", data: partnerData },
      }).catch((err) => console.error("Admin notification failed:", err));

      navigate("/partner");
    } catch {
      toast.error(t("auth.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleIndividualSubmit = (data: IndividualFormData) => {
    const fullName = `${data.firstName} ${data.lastName}`;
    handleHostSubmit(data.email, data.password, fullName, {
      partner_type: "individual",
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      personal_id: data.personalId || null,
      address: data.address,
      city: data.city,
      country: data.country,
      iban: data.iban,
      bank_name: data.bankName,
      bank_address: data.bankAddress || null,
      certifies_rental_rights: true,
      certifies_local_taxes: true,
    });
  };

  const handleCompanySubmit = (data: CompanyFormData) => {
    handleHostSubmit(data.email, data.password, data.contactPerson, {
      partner_type: "company",
      company_name: data.companyName,
      organization_number: data.organizationNumber,
      contact_person: data.contactPerson,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      iban: data.iban,
      swift: data.swift,
      currency: data.currency,
      certifies_company_authority: true,
    });
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error(t("auth.minChars"));
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(t("auth.passwordSaved"));
        setIsSettingPassword(false);
        setShouldRedirect(true);
      }
    } catch {
      toast.error(t("auth.unexpectedError"));
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
        toast.error(t("auth.googleFailed"));
        console.error("Google sign-in error:", error);
      }
    } catch {
      toast.error(t("auth.googleFailed"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setAccountType("traveler");
    setShowEmailVerification(false);
    setVerificationEmail("");
    reset();
  };

  const showTravelerSignup = !isLogin && accountType === "traveler";
  const showHostSignup = !isLogin && accountType === "host";

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={loginHero}
          alt="Studenter seglar i Kroatiens skärgård"
          className="w-full h-full object-cover brightness-50 contrast-75"
        />
        <div className="absolute inset-0 bg-[#0C4D73]/70" />
        <div className="absolute inset-0 flex flex-col justify-between p-16">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-12">
              <img src={studentresorLogo} alt="Studentresor" className="h-10 opacity-80" />
            </Link>
            <h2 className="text-3xl font-serif font-semibold text-white/90 mb-4">
              {showHostSignup ? t("auth.heroHost") : t("auth.heroTraveler")}
            </h2>
            <p className="text-white/60 text-base">
              {showHostSignup ? t("auth.heroHostDesc") : t("auth.heroTravelerDesc")}
            </p>
          </div>
          <div>
            {showHostSignup ? (
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                {(t("auth.hostBenefits", { returnObjects: true }) as string[]).map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white/50 text-xs">
                    <Check className="w-3.5 h-3.5 text-white/35 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                {(t("auth.travelerBenefits", { returnObjects: true }) as string[]).map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white/50 text-xs">
                    <Check className="w-3.5 h-3.5 text-white/35 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-white/25 text-[10px]">
              {t("auth.guarantee")}
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background overflow-y-auto">
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

          <div className="text-center mb-6">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              {isSettingPassword ? t("auth.setPassword") : isLogin ? t("auth.login") : t("auth.createAccount")}
            </h1>
            {isSettingPassword && (
              <p className="text-muted-foreground">
                {t("auth.setPasswordDesc")}
              </p>
            )}
          </div>

          {/* Tabs: Resenär / Värd – only for signup */}
          {!isLogin && !isSettingPassword && !showEmailVerification && (
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                type="button"
                onClick={() => setAccountType("traveler")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  accountType === "traveler"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("auth.traveler")}
              </button>
              <button
                type="button"
                onClick={() => setAccountType("host")}
                className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                  accountType === "host"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("auth.host")}
              </button>
            </div>
          )}

          {emailJustVerified && (
            <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    {t("auth.emailVerifiedTitle") || "E-postadressen är bekräftad!"}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {t("auth.emailVerifiedDesc") || "Logga in med dina uppgifter för att fortsätta."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showEmailVerification ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-foreground">
                    {t("auth.verifyEmailTitle")}
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    {t("auth.verifyEmailDesc")}
                  </p>
                </div>

                <div className="rounded-lg bg-muted/60 p-4 text-left">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    {t("auth.verificationSentTo")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground break-all">{verificationEmail}</p>
                </div>

                <p className="text-xs text-muted-foreground">{t("auth.checkSpamTip")}</p>

                <Button
                  type="button"
                  className="w-full h-12 bg-gradient-ocean hover:opacity-90 text-lg font-semibold"
                  onClick={() => {
                    setShowEmailVerification(false);
                    setIsLogin(true);
                    setAccountType("traveler");
                    reset();
                  }}
                >
                  {t("auth.goToLogin")}
                </Button>
              </div>
            </div>
          ) : isSettingPassword ? (
            <form onSubmit={handleSetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("auth.minChars")}
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
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.savePassword")}
              </Button>
            </form>
          ) : showHostSignup ? (
            /* ─── Host Registration ─── */
            <HostRegistrationForm
              onSubmitIndividual={handleIndividualSubmit}
              onSubmitCompany={handleCompanySubmit}
              isLoading={isLoading}
            />
          ) : (
            /* ─── Traveler / Login Form ─── */
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {showTravelerSignup && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t("auth.firstName")}</Label>
                      <Input
                        id="firstName"
                        placeholder={t("auth.firstName")}
                        {...register("firstName" as any)}
                        className="h-12"
                      />
                      {(errors as any).firstName && (
                        <p className="text-sm text-destructive">{(errors as any).firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                      <Input
                        id="lastName"
                        placeholder={t("auth.lastName")}
                        {...register("lastName" as any)}
                        className="h-12"
                      />
                      {(errors as any).lastName && (
                        <p className="text-sm text-destructive">{(errors as any).lastName.message}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("auth.emailPlaceholder")}
                    {...register("email")}
                    className="h-12"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
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
                    t("auth.login")
                  ) : (
                    t("auth.createAccount")
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">{t("auth.or")}</span>
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
                {t("auth.continueGoogle")}
              </Button>

              {!isLogin && (
                <p className="mt-6 text-center text-xs text-muted-foreground">
                  {t("auth.termsAgree")}{" "}
                  <Link to="/kontovillkor" className="underline hover:text-foreground">{t("auth.termsLink")}</Link>{" "}
                  {t("auth.and")}{" "}
                  <Link to="/kontovillkor#integritetspolicy" className="underline hover:text-foreground">{t("auth.privacyLink")}</Link>.
                </p>
              )}
            </>
          )}

          {!showEmailVerification && (
            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-primary hover:underline font-medium"
              >
                {isLogin
                  ? t("auth.noAccount")
                  : t("auth.hasAccount")}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
