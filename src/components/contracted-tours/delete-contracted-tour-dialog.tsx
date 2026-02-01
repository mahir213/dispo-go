"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteContractedTourDialogProps {
  tourId: string;
  tourName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteContractedTourDialog({
  tourId,
  tourName,
  open,
  onOpenChange,
}: DeleteContractedTourDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Greška pri brisanju ture");
      }

      toast.success("Ugovorena tura je uspješno obrisana");
      onOpenChange(false);
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Greška pri brisanju ture"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
          <AlertDialogDescription>
            Ova akcija će trajno obrisati ugovorenu turu &quot;{tourName}&quot;.
            Ova akcija se ne može poništiti.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Odustani</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Brisanje..." : "Obriši"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
