import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

interface MapTrip {
  id: string;
  name: string;
  price: number;
  latitude: number | null;
  longitude: number | null;
}

interface SearchMapProps {
  trips: MapTrip[];
  selectedTripId?: string | null;
  onTripSelect?: (tripId: string) => void;
  className?: string;
}

const createPriceIcon = (price: number, isSelected: boolean) => {
  const formattedPrice = price.toLocaleString("sv-SE");
  return L.divIcon({
    className: "custom-price-marker",
    html: `<div style="
      background: ${isSelected ? "hsl(var(--primary))" : "hsl(var(--background))"};
      color: ${isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"};
      border: 2px solid ${isSelected ? "hsl(var(--primary))" : "hsl(var(--border))"};
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      cursor: pointer;
      transition: all 0.2s;
    ">${formattedPrice} SEK</div>`,
    iconSize: [0, 0],
    iconAnchor: [40, 20],
  });
};

export const SearchMap = ({ trips, selectedTripId, onTripSelect, className }: SearchMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        keyboard: false,
      }).setView([43.5, 16.5], 8); // Default: Croatia/Split area

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(mapInstance.current);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const tripsWithCoords = trips.filter((t) => t.latitude != null && t.longitude != null);

    if (tripsWithCoords.length === 0) return;

    const bounds = L.latLngBounds([]);

    tripsWithCoords.forEach((trip) => {
      const isSelected = trip.id === selectedTripId;
      const marker = L.marker([trip.latitude!, trip.longitude!], {
        icon: createPriceIcon(trip.price, isSelected),
      });

      marker.on("click", () => onTripSelect?.(trip.id));
      marker.addTo(mapInstance.current!);
      markersRef.current.push(marker);
      bounds.extend([trip.latitude!, trip.longitude!]);
    });

    if (tripsWithCoords.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [trips, selectedTripId, onTripSelect]);

  return (
    <div
      ref={mapRef}
      className={cn("w-full h-full bg-muted", className)}
      style={{ minHeight: "400px" }}
    />
  );
};
