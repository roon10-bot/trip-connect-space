import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Ship, Calendar, Users, Trash2, Edit, MapPin, Eye, EyeOff, Copy, Ban, Pencil, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EditTripDialog } from "./EditTripDialog";
import { CopyTripDialog } from "./CopyTripDialog";
import { BulkUpdateTripsDialog } from "./BulkUpdateTripsDialog";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  // Filters
  const [filterName, setFilterName] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDeparture, setFilterDeparture] = useState("");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

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

  // Get unique departure locations for filter
  const departureLocations = [...new Set(trips?.map((t) => t.departure_location) || [])];

  // Apply filters
  const filteredTrips = trips?.filter((trip) => {
    if (filterName && !trip.name.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterType !== "all" && trip.trip_type !== filterType) return false;
    if (filterDeparture && !trip.departure_date.includes(filterDeparture)) return false;
    if (filterLocation !== "all" && trip.departure_location !== filterLocation) return false;
    if (filterStatus === "active" && !trip.is_active) return false;
    if (filterStatus === "inactive" && trip.is_active) return false;
    if (filterStatus === "fullbooked" && !trip.is_fullbooked) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const allSelected = filteredTrips && filteredTrips.length > 0 && selectedIds.length === filteredTrips.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTrips?.map((t) => t.id) || []);
    }
  };

  const hasActiveFilters = filterName || filterType !== "all" || filterDeparture || filterLocation !== "all" || filterStatus !== "all";

  const clearFilters = () => {
    setFilterName("");
    setFilterType("all");
    setFilterDeparture("");
    setFilterLocation("all");
    setFilterStatus("all");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif">Mina resor</CardTitle>
            <CardDescription>
              Hantera dina resor som visas för kunder på hemsidan
            </CardDescription>
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{selectedIds.length} valda</Badge>
              <Button size="sm" onClick={() => setBulkDialogOpen(true)}>
                <Pencil className="w-4 h-4 mr-1" />
                Bulkuppdatera
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>
                Avmarkera alla
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {trips && trips.length > 0 ? (
          <>
            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <Input
                placeholder="Sök resa..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla typer</SelectItem>
                  <SelectItem value="seglingsvecka">Seglingsveckan</SelectItem>
                  <SelectItem value="splitveckan">Splitveckan</SelectItem>
                  <SelectItem value="studentveckan">Studentveckan</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="month"
                value={filterDeparture}
                onChange={(e) => setFilterDeparture(e.target.value)}
                placeholder="Avgångsmånad"
              />
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Avgångsort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla avgångsorter</SelectItem>
                  {departureLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla statusar</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="fullbooked">Fullbokad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                  Visar {filteredTrips?.length} av {trips.length} resor
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Rensa filter
                </Button>
              </div>
            )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
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
                {filteredTrips?.map((trip) => (
                  <TableRow key={trip.id} className={selectedIds.includes(trip.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(trip.id)}
                        onCheckedChange={() => toggleSelect(trip.id)}
                      />
                    </TableCell>
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
          </>
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

      <BulkUpdateTripsDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        selectedTripIds={selectedIds}
        onSuccess={() => setSelectedIds([])}
      />
    </Card>
  );
};
