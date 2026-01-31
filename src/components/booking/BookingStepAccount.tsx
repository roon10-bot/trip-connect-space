import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
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

              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-ocean hover:opacity-90 text-lg font-semibold h-14"
                  disabled={isLoading}
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
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
