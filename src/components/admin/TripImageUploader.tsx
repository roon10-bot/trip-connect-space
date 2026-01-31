import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TripImage {
  id: string;
  image_url: string;
  display_order: number;
}

interface TripImageUploaderProps {
  tripId: string;
}

export const TripImageUploader = ({ tripId }: TripImageUploaderProps) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const { data: images, isLoading } = useQuery({
    queryKey: ["trip-images", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_images")
        .select("*")
        .eq("trip_id", tripId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as TripImage[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      setIsUploading(true);
      const currentMaxOrder = images?.length ?? 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} är för stor (max 5 MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${tripId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("trip-images")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Kunde inte ladda upp ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("trip-images")
          .getPublicUrl(fileName);

        const { error: insertError } = await supabase
          .from("trip_images")
          .insert({
            trip_id: tripId,
            image_url: publicUrl,
            display_order: currentMaxOrder + i,
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          toast.error(`Kunde inte spara ${file.name}`);
        }
      }
    },
    onSuccess: () => {
      setIsUploading(false);
      queryClient.invalidateQueries({ queryKey: ["trip-images", tripId] });
      toast.success("Bilder uppladdade!");
    },
    onError: () => {
      setIsUploading(false);
      toast.error("Kunde inte ladda upp bilder");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("trip_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-images", tripId] });
      toast.success("Bild borttagen");
    },
    onError: () => {
      toast.error("Kunde inte ta bort bilden");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadMutation.mutate(files);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Resebilder</h4>
        <label className="cursor-pointer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            asChild
          >
            <span>
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Ladda upp bilder
            </span>
          </Button>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>

      {images && images.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {images.map((image, index) => (
            <div key={image.id} className="relative group">
              <img
                src={image.image_url}
                alt={`Resebild ${index + 1}`}
                className="w-full aspect-square object-cover rounded-lg border"
              />
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteMutation.mutate(image.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">
            Inga bilder uppladdade ännu
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ladda upp bilder som visas i karusellen
          </p>
        </div>
      )}
    </div>
  );
};
