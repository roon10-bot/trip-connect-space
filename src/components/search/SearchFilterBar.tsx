import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal, ChevronDown, Map, MapOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SearchFilterBarProps {
  showMap: boolean;
  onToggleMap: () => void;
  budgetRange: [number, number];
  onBudgetChange: (range: [number, number]) => void;
  maxBudget: number;
  selectedPropertyTypes: string[];
  onPropertyTypesChange: (types: string[]) => void;
  selectedFacilities: string[];
  onFacilitiesChange: (facilities: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const PROPERTY_TYPES = [
  { value: "apartment", label: "Lägenhet" },
  { value: "villa", label: "Villa" },
  { value: "hotel", label: "Hotell" },
  { value: "hostel", label: "Vandrarhem" },
  { value: "boat", label: "Båt" },
];

const FACILITIES = [
  { value: "pool", label: "Pool" },
  { value: "wifi", label: "WiFi" },
  { value: "ac", label: "AC" },
  { value: "parking", label: "Parkering" },
  { value: "kitchen", label: "Kök" },
  { value: "washing_machine", label: "Tvättmaskin" },
  { value: "terrace", label: "Terrass" },
  { value: "sea_view", label: "Havsutsikt" },
];

const SORT_OPTIONS = [
  { value: "price_asc", label: "Pris (lägst först)" },
  { value: "price_desc", label: "Pris (högst först)" },
  { value: "date_asc", label: "Datum (närmast)" },
  { value: "capacity_desc", label: "Kapacitet (störst)" },
];

export const SearchFilterBar = ({
  showMap,
  onToggleMap,
  budgetRange,
  onBudgetChange,
  maxBudget,
  selectedPropertyTypes,
  onPropertyTypesChange,
  selectedFacilities,
  onFacilitiesChange,
  sortBy,
  onSortChange,
}: SearchFilterBarProps) => {
  const { t } = useTranslation();

  const togglePropertyType = (type: string) => {
    onPropertyTypesChange(
      selectedPropertyTypes.includes(type)
        ? selectedPropertyTypes.filter((t) => t !== type)
        : [...selectedPropertyTypes, type]
    );
  };

  const toggleFacility = (facility: string) => {
    onFacilitiesChange(
      selectedFacilities.includes(facility)
        ? selectedFacilities.filter((f) => f !== facility)
        : [...selectedFacilities, facility]
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap bg-card rounded-xl border border-border px-4 py-3">
      {/* Toggle map */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleMap}
        className="gap-2"
      >
        {showMap ? <MapOff className="w-4 h-4" /> : <Map className="w-4 h-4" />}
        {showMap ? "Dölj karta" : "Visa karta"}
      </Button>

      <div className="h-6 w-px bg-border" />

      {/* Budget */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            Budget
            <ChevronDown className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 bg-card" align="start">
          <div className="space-y-4">
            <p className="text-sm font-medium">Prisintervall per person</p>
            <Slider
              value={budgetRange}
              onValueChange={(v) => onBudgetChange(v as [number, number])}
              min={0}
              max={maxBudget}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{budgetRange[0].toLocaleString("sv-SE")} kr</span>
              <span>{budgetRange[1].toLocaleString("sv-SE")} kr</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Property Type */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            Boendetyp
            {selectedPropertyTypes.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {selectedPropertyTypes.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card">
          {PROPERTY_TYPES.map((pt) => (
            <DropdownMenuCheckboxItem
              key={pt.value}
              checked={selectedPropertyTypes.includes(pt.value)}
              onCheckedChange={() => togglePropertyType(pt.value)}
            >
              {pt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Facilities */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            Bekvämligheter
            {selectedFacilities.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {selectedFacilities.length}
              </span>
            )}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card">
          {FACILITIES.map((f) => (
            <DropdownMenuCheckboxItem
              key={f.value}
              checked={selectedFacilities.includes(f.value)}
              onCheckedChange={() => toggleFacility(f.value)}
            >
              {f.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <SlidersHorizontal className="w-4 h-4" />
            Sortera
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-card" align="end">
          {SORT_OPTIONS.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={sortBy === opt.value}
              onCheckedChange={() => onSortChange(opt.value)}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
