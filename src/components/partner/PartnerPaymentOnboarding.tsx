import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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

const individualPaymentSchema = z.object({
  iban: z.string().trim().min(1, "IBAN krävs"),
  bank_name: z.string().trim().min(1, "Banknamn krävs"),
  bank_address: z.string().optional(),
});

const companyPaymentSchema = z.object({
  iban: z.string().trim().min(1, "IBAN krävs"),
  swift: z.string().trim().min(1, "SWIFT krävs"),
  currency: z.string().trim().min(1, "Valuta krävs"),
});

interface PartnerPaymentOnboardingProps {
  partnerId: string;
  partnerType: string;
  userId: string;
}

export const PartnerPaymentOnboarding = ({ partnerId, partnerType, userId }: PartnerPaymentOnboardingProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const isCompany = partnerType === "company";
  const schema = isCompany ? companyPaymentSchema : individualPaymentSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: isCompany
      ? { iban: "", swift: "", currency: "" }
      : { iban: "", bank_name: "", bank_address: "" },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("partner_profiles")
        .update(data)
        .eq("id", partnerId);

      if (error) throw error;

      toast.success(t("partner.onboarding.saved"));
      queryClient.invalidateQueries({ queryKey: ["partnerProfile", userId] });
    } catch (err) {
      console.error("Payment info save error:", err);
      toast.error(t("partner.onboarding.error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full"
      >
        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-serif">
              {t("partner.onboarding.title")}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {t("partner.onboarding.description")}
            </p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="SE00 0000 0000 0000 0000 0000" className="h-12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isCompany ? (
                  <>
                    <FormField
                      control={form.control}
                      name="swift"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT</FormLabel>
                          <FormControl>
                            <Input className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("partner.hostReg.currency")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("partner.hostReg.currencyPlaceholder")} className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="bank_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("partner.hostReg.bankName")}</FormLabel>
                          <FormControl>
                            <Input className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bank_address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("partner.hostReg.bankAddress")}</FormLabel>
                          <FormControl>
                            <Input className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-ocean hover:opacity-90 font-semibold h-14"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t("partner.onboarding.saving")}
                    </>
                  ) : (
                    t("partner.onboarding.submit")
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
