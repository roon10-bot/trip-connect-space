import { useState } from "react";
import { Bed, Ruler, MapPin, Sparkles, ExternalLink, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AccommodationInfoDialogProps {
  accommodationRooms?: number | null;
  accommodationSizeSqm?: number | null;
  accommodationFacilities?: string[] | null;
  accommodationAddress?: string | null;
  accommodationDescription?: string | null;
  tripName: string;
}

export const AccommodationInfoDialog = ({
  accommodationRooms,
  accommodationSizeSqm,
  accommodationFacilities,
  accommodationAddress,
  accommodationDescription,
  tripName,
}: AccommodationInfoDialogProps) => {
  const hasInfo =
    accommodationRooms ||
    accommodationSizeSqm ||
    (accommodationFacilities && accommodationFacilities.length > 0) ||
    accommodationAddress ||
    accommodationDescription;

  if (!hasInfo) return null;

  const googleMapsUrl = accommodationAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(accommodationAddress)}`
    : null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 text-primary text-sm font-medium hover:underline cursor-pointer">
          <Info className="w-3.5 h-3.5" />
          Mer information
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Boendeinformation
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{tripName}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {accommodationDescription && (
            <p className="text-sm text-muted-foreground">
              {accommodationDescription}
            </p>
          )}

          {accommodationRooms && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bed className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Antal rum</p>
                <p className="text-sm text-muted-foreground">
                  {accommodationRooms} rum
                </p>
              </div>
            </div>
          )}

          {accommodationSizeSqm && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Ruler className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Storlek</p>
                <p className="text-sm text-muted-foreground">
                  {accommodationSizeSqm} m²
                </p>
              </div>
            </div>
          )}

          {accommodationFacilities && accommodationFacilities.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Faciliteter</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {accommodationFacilities.map((facility, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
                    >
                      {facility}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {accommodationAddress && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Adress</p>
                {googleMapsUrl ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {accommodationAddress}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {accommodationAddress}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
