import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const usePartner = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: partnerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["partnerProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("partner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        console.error("Error fetching partner profile:", error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const { data: hasPartnerRole } = useQuery({
    queryKey: ["hasPartnerRole", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner")
        .maybeSingle();
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = authLoading || profileLoading;
  const isApproved = partnerProfile?.status === "approved" && hasPartnerRole;
  const isPending = partnerProfile?.status === "pending";
  const isRejected = partnerProfile?.status === "rejected";

  return {
    partnerProfile,
    isApproved,
    isPending,
    isRejected,
    isLoading,
    hasPartnerRole: hasPartnerRole ?? false,
  };
};
