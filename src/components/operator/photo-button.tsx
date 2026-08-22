"use client";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Placeholder for the future camera/receipt upload feature (storage pending). */
export function PhotoButton() {
  return (
    <Button
      variant="outline"
      className="h-11 flex-col gap-0.5"
      onClick={() => toast.info("Photo upload coming soon", { description: "Camera storage is planned for a later release." })}
    >
      <Camera className="h-4 w-4" />
      Photo
    </Button>
  );
}
