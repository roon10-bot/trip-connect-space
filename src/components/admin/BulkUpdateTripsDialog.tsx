import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface BulkUpdateTripsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTripIds: string[];
  onSuccess: () => void;
}

export const BulkUpdateTripsDialog = ({
  open,
  onOpenChange,
  selectedTripIds,
  onSuccess,
}: BulkUpdateTripsDialogProps) => {
  const queryClient = useQueryClient();

  // Toggle flags for which fields to update
  const [updateStatus, setUpdateStatus] = useState(false);
  const [updateFullbooked, setUpdateFullbooked] = useState(false);
  const [updatePrice, setUpdatePrice] = useState(false);
  const [updateName, setUpdateName] = useState(false);
  const [updateAccommodation, setUpdateAccommodation] = useState(false);

  // Field values
  const [isActive, setIsActive] = useState(true);
  const [isFullbooked, setIsFullbooked] = useState(false);
  const [price, setPrice] = useState("");
  const [name, setName] = useState("");
  const [accommodationRooms, setAccommodationRooms] = useState("");
  const [accommodationSizeSqm, setAccommodationSizeSqm] = useState("");
  const [accommodationAddress, setAccommodationAddress] = useState("");
  const [accommodationDescription, setAccommodationDescription] = useState("");
  const [accommodationFacilities, setAccommodationFacilities] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, unknown> = {};

      if (updateStatus) updates.is_active = isActive;
      if (updateFullbooked) updates.is_fullbooked = isFullbooked;
      if (updatePrice && price) updates.price = Number(price);
      if (updateName && name) updates.name = name;
      if (updateAccommodation) {
        if (accommodationRooms) updates.accommodation_rooms = Number(accommodationRooms);
        if (accommodationSizeSqm) updates.accommodation_size_sqm = Number(accommodationSizeSqm);
        if (accommodationAddress) updates.accommodation_address = accommodationAddress;
        if (accommodationDescription) updates.accommodation_description = accommodationDescription;
        if (accommodationFacilities) {
          updates.accommodation_facilities = accommodationFacilities
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean);
        }
      }

      if (Object.keys(updates).length === 0) {
        throw new Error("Inga fält valda att uppdatera");
      }

      const { error } = await supabase
        .from("trips")
        .update(updates)
        .in("id", selectedTripIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trips"] });
      toast.success(`${selectedTripIds.length} resor uppdaterade`);
      resetForm();
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Kunde inte uppdatera resorna");
    },
  });

  const resetForm = () => {
    setUpdateStatus(false);
    setUpdateFullbooked(false);
    setUpdatePrice(false);
    setUpdateName(false);
    setUpdateAccommodation(false);
    setIsActive(true);
    setIsFullbooked(false);
    setPrice("");
    setName("");
    setAccommodationRooms("");
    setAccommodationSizeSqm("");
    setAccommodationAddress("");
    setAccommodationDescription("");
    setAccommodationFacilities("");
  };

  const hasSelection = updateStatus || updateFullbooked || updatePrice || updateName || updateAccommodation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Bulkuppdatera resor</DialogTitle>
          <DialogDescription>
            Uppdatera <Badge variant="secondary">{selectedTripIds.length}</Badge> valda resor.
            Välj vilka fält du vill ändra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-name"
                checked={updateName}
                onCheckedChange={(c) => setUpdateName(!!c)}
              />
              <Label htmlFor="bulk-name" className="font-semibold">Namn på resan</Label>
            </div>
            {updateName && (
              <div className="ml-6">
                <Label htmlFor="name-input">Nytt namn</Label>
                <Input
                  id="name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Splitveckan 2026"
                />
              </div>
            )}
          </div>

          <Separator />
          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-status"
                checked={updateStatus}
                onCheckedChange={(c) => setUpdateStatus(!!c)}
              />
              <Label htmlFor="bulk-status" className="font-semibold">Status (aktiv/inaktiv)</Label>
            </div>
            {updateStatus && (
              <div className="ml-6 flex items-center gap-4">
                <Button
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setIsActive(true)}
                >
                  Aktiv
                </Button>
                <Button
                  size="sm"
                  variant={!isActive ? "default" : "outline"}
                  onClick={() => setIsActive(false)}
                >
                  Inaktiv
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Fullbooked */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-fullbooked"
                checked={updateFullbooked}
                onCheckedChange={(c) => setUpdateFullbooked(!!c)}
              />
              <Label htmlFor="bulk-fullbooked" className="font-semibold">Fullbokad-status</Label>
            </div>
            {updateFullbooked && (
              <div className="ml-6 flex items-center gap-4">
                <Button
                  size="sm"
                  variant={isFullbooked ? "default" : "outline"}
                  onClick={() => setIsFullbooked(true)}
                >
                  Fullbokad
                </Button>
                <Button
                  size="sm"
                  variant={!isFullbooked ? "default" : "outline"}
                  onClick={() => setIsFullbooked(false)}
                >
                  Öppen
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Price */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-price"
                checked={updatePrice}
                onCheckedChange={(c) => setUpdatePrice(!!c)}
              />
              <Label htmlFor="bulk-price" className="font-semibold">Pris</Label>
            </div>
            {updatePrice && (
              <div className="ml-6">
                <Label htmlFor="price-input">Nytt pris (kr)</Label>
                <Input
                  id="price-input"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 5990"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Accommodation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="bulk-accommodation"
                checked={updateAccommodation}
                onCheckedChange={(c) => setUpdateAccommodation(!!c)}
              />
              <Label htmlFor="bulk-accommodation" className="font-semibold">Boendeinformation</Label>
            </div>
            {updateAccommodation && (
              <div className="ml-6 space-y-3">
                <div>
                  <Label htmlFor="acc-rooms">Antal rum</Label>
                  <Input
                    id="acc-rooms"
                    type="number"
                    value={accommodationRooms}
                    onChange={(e) => setAccommodationRooms(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-size">Storlek (m²)</Label>
                  <Input
                    id="acc-size"
                    type="number"
                    value={accommodationSizeSqm}
                    onChange={(e) => setAccommodationSizeSqm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-address">Adress</Label>
                  <Input
                    id="acc-address"
                    value={accommodationAddress}
                    onChange={(e) => setAccommodationAddress(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-desc">Beskrivning</Label>
                  <Textarea
                    id="acc-desc"
                    value={accommodationDescription}
                    onChange={(e) => setAccommodationDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="acc-facilities">Faciliteter (kommaseparerade)</Label>
                  <Input
                    id="acc-facilities"
                    value={accommodationFacilities}
                    onChange={(e) => setAccommodationFacilities(e.target.value)}
                    placeholder="Pool, WiFi, Parkering"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!hasSelection || mutation.isPending}
          >
            {mutation.isPending ? "Uppdaterar..." : "Uppdatera alla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
