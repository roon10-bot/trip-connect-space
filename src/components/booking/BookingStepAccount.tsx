import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const accountSchema = z.object({
  firstName: z.string().min(1, "Förnamn krävs").max(50, "Max 50 tecken"),
  lastName: z.string().min(1, "Efternamn krävs").max(50, "Max 50 tecken"),
  email: z.string().email("Ange en giltig e-postadress"),
  password: z
    .string()
    .min(8, "Lösenordet måste vara minst 8 tecken")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Lösenordet måste innehålla minst ett specialtecken"
    ),
});

export type AccountFormData = z.infer<typeof accountSchema>;

interface BookingStepAccountProps {
  onNext: (data: AccountFormData) => void;
  isLoading: boolean;
}

export const BookingStepAccount = ({
  onNext,
  isLoading,
}: BookingStepAccountProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        toast.error("Kunde inte logga in med Google. Försök igen.");
        console.error("Google sign-in error:", error);
      }
    } catch (err) {
      toast.error("Något gick fel. Försök igen.");
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = (data: AccountFormData) => {
    onNext(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="font-serif text-2xl flex items-center gap-3">
            <UserPlus className="w-6 h-6 text-primary" />
            Steg 1: Skapa konto
          </CardTitle>
          <p className="text-muted-foreground">
            Skapa ett konto för att slutföra din bokning och få tillgång till
            dina resedokument.
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Förnamn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ditt förnamn"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Efternamn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ditt efternamn"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-post</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="din@email.se"
                        className="h-12"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lösenord</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Minst 8 tecken och 1 specialtecken"
                          className="h-12 pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 space-y-3">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-ocean hover:opacity-90 text-lg font-semibold h-14"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Skapar konto...
                    </>
                  ) : (
                    "Skapa konto och fortsätt"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">eller</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full h-14 text-base font-medium gap-3"
                  disabled={isLoading || isGoogleLoading}
                  onClick={handleGoogleSignIn}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Fortsätt med Google
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Genom att skapa konto godkänner du våra{" "}
                  <Link to="/kontovillkor" className="underline hover:text-foreground">användarvillkor</Link>{" "}
                  och{" "}
                  <Link to="/kontovillkor#integritetspolicy" className="underline hover:text-foreground">integritetspolicy</Link>.
                </p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
