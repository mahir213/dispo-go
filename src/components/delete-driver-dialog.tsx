"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface DeleteDriverDialogProps {
  driverId: string;
  driverName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDriverDialog({
  driverId,
  driverName,
  open,
  onOpenChange,
}: DeleteDriverDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${driverId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Greška pri brisanju vozača");
      }

      toast.success("Vozač uspješno obrisan");
      onOpenChange(false);
      router.push("/vozaci");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Greška pri brisanju vozača"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Obriši vozača
          </DialogTitle>
          <DialogDescription>
            Da li ste sigurni da želite obrisati vozača{" "}
            <span className="font-semibold">{driverName}</span>?
            <br />
            <span className="text-destructive">
              Ova akcija se ne može poništiti. Sve bilješke će također biti obrisane.
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Otkaži
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Brisanje..." : "Obriši vozača"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
