import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Ship, Calendar, Users, Trash2, Edit, MapPin, Eye, EyeOff, Copy, Ban } from "lucide-react";
import { toast } from "sonner";
import { EditTripDialog } from "./EditTripDialog";
import { CopyTripDialog } from "./CopyTripDialog";

const tripTypeLabels: Record<string, string> = {
  seglingsvecka: "Seglingsveckan",
  splitveckan: "Splitveckan",
  studentveckan: "Studentveckan",
};

interface TripsListProps {
  onEditTrip?: (tripId: string) => void;
}

export const TripsList = ({ onEditTrip }: TripsListProps) => {
  const queryClient = useQueryClient();
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [copyingTrip, setCopyingTrip] = useState<NonNullable<typeof trips>[0] | null>(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["admin-trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("departure_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ tripId, isActive }: { tripId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("trips")
        .update({ is_active: isActive })
        .eq("id", tripId);

      if (error) throw error;
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success(isActive ? "Resa aktiverad" : "Resa inaktiverad");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera resan");
    },
  });

  const toggleFullbookedMutation = useMutation({
    mutationFn: async ({ tripId, isFullbooked }: { tripId: string; isFullbooked: boolean }) => {
      const { error } = await supabase
        .from("trips")
        .update({ is_fullbooked: isFullbooked })
        .eq("id", tripId);

      if (error) throw error;
    },
    onSuccess: (_, { isFullbooked }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success(isFullbooked ? "Resa markerad som fullbokad" : "Resa öppnad för bokning");
    },
    onError: () => {
      toast.error("Kunde inte uppdatera resan");
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const { error } = await supabase
        .from("trips")
        .delete()
        .eq("id", tripId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success("Resa borttagen");
    },
    onError: () => {
      toast.error("Kunde inte ta bort resan");
    },
  });

  const getTotalPrice = (trip: NonNullable<typeof trips>[0]) => {
    return (
      Number(trip.first_payment_amount || 0) +
      Number(trip.second_payment_amount || 0) +
      Number(trip.final_payment_amount || 0)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Mina resor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Mina resor</CardTitle>
        <CardDescription>
          Hantera dina resor som visas för kunder på hemsidan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trips && trips.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resa</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Avgångsort</TableHead>
                  <TableHead>Kapacitet</TableHead>
                  <TableHead>Totalpris</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {tripTypeLabels[trip.trip_type] || trip.trip_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(trip.departure_date), "d MMM", { locale: sv })} -{" "}
                        {format(new Date(trip.return_date), "d MMM yyyy", { locale: sv })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {trip.departure_location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        {trip.capacity}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {getTotalPrice(trip).toLocaleString("sv-SE")} kr
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant={trip.is_active ? "default" : "secondary"}>
                          {trip.is_active ? "Aktiv" : "Inaktiv"}
                        </Badge>
                        {trip.is_fullbooked && (
                          <Badge variant="destructive">Fullbokat</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleActiveMutation.mutate({
                            tripId: trip.id,
                            isActive: !trip.is_active,
                          })}
                          title={trip.is_active ? "Inaktivera" : "Aktivera"}
                        >
                          {trip.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>

                        <Button
                          variant={trip.is_fullbooked ? "destructive" : "outline"}
                          size="icon"
                          onClick={() => toggleFullbookedMutation.mutate({
                            tripId: trip.id,
                            isFullbooked: !trip.is_fullbooked,
                          })}
                          title={trip.is_fullbooked ? "Öppna för bokning" : "Markera fullbokad"}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCopyingTrip(trip)}
                          title="Kopiera resa"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setEditingTripId(trip.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ta bort resa?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Är du säker på att du vill ta bort "{trip.name}"? Denna åtgärd
                                kan inte ångras.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteTripMutation.mutate(trip.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Ta bort
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Ship className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Inga resor skapade ännu</p>
            <p className="text-sm text-muted-foreground">
              Klicka på "Skapa en resa" i menyn för att komma igång
            </p>
          </div>
        )}
      </CardContent>

      <EditTripDialog
        tripId={editingTripId}
        open={!!editingTripId}
        onOpenChange={(open) => !open && setEditingTripId(null)}
      />

      <CopyTripDialog
        trip={copyingTrip}
        open={!!copyingTrip}
        onOpenChange={(open) => !open && setCopyingTrip(null)}
      />
    </Card>
  );
};
