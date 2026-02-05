"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { User, UserPlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Driver = {
  id: string;
  name: string;
  phoneNumber: string;
};

interface AssignDriverProps {
  tourId: string;
  currentDriver: Driver | null;
  onAssigned?: () => void;
}

const DONT_SHOW_POPUP_KEY = "dispo-go-dont-show-driver-assign-popup";

export function AssignDriver({ tourId, currentDriver, onAssigned }: AssignDriverProps) {
  const [open, setOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open && drivers.length === 0) {
      setLoading(true);
      fetch("/api/drivers?limit=1000")
        .then((res) => res.json())
        .then((data) => {
          setDrivers(data.drivers || data);
          setLoading(false);
        })
        .catch(() => {
          toast.error("Greška pri učitavanju vozača");
          setLoading(false);
        });
    }
  }, [open, drivers.length]);

  const handleSelectDriver = (driver: Driver) => {
    const dontShow = localStorage.getItem(DONT_SHOW_POPUP_KEY) === "true";
    
    if (dontShow) {
      assignDriver(driver);
    } else {
      setSelectedDriver(driver);
      setShowConfirmDialog(true);
    }
    setOpen(false);
  };

  const assignDriver = async (driver: Driver) => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}/assign-driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driver.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign driver");
      }

      toast.success(`Vozač ${driver.name} je dodijeljen turi`);
      onAssigned?.();
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri dodjeli vozača");
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem(DONT_SHOW_POPUP_KEY, "true");
    }
    if (selectedDriver) {
      assignDriver(selectedDriver);
    }
    setShowConfirmDialog(false);
    setSelectedDriver(null);
    setDontShowAgain(false);
  };

  const handleRemoveDriver = async () => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}/assign-driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove driver");
      }

      toast.success("Vozač je uklonjen s ture");
      onAssigned?.();
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error("Greška pri uklanjanju vozača");
    } finally {
      setAssigning(false);
    }
  };

  if (currentDriver) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 text-sm bg-green-100 text-green-800 px-2.5 py-1.5 rounded-md">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[100px]" title={currentDriver.name}>
            {currentDriver.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
          onClick={handleRemoveDriver}
          disabled={assigning}
        >
          {assigning ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <X className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 text-muted-foreground"
            disabled={assigning}
          >
            {assigning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            <span>Vozač</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[250px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Pretraži vozače..." />
            <CommandList>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <>
                  <CommandEmpty>Nema pronađenih vozača</CommandEmpty>
                  <CommandGroup>
                    {drivers.map((driver) => (
                      <CommandItem
                        key={driver.id}
                        value={driver.name}
                        onSelect={() => handleSelectDriver(driver)}
                        className="cursor-pointer"
                      >
                        <User className="h-4 w-4 mr-2" />
                        <div className="flex flex-col">
                          <span>{driver.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {driver.phoneNumber}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dodjela vozača</AlertDialogTitle>
            <AlertDialogDescription>
              Dodavanje vozača na ovu turu će je učiniti aktivnom turom.
              {selectedDriver && (
                <span className="block mt-2 font-medium text-foreground">
                  Vozač: {selectedDriver.name}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Ne prikazuj više ovu poruku
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedDriver(null);
              setDontShowAgain(false);
            }}>
              Ne
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Da, nastavi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
