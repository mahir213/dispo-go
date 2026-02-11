"use client";

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { User, UserPlus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Driver = {
  id: string;
  name: string;
  phoneNumber: string;
};

interface AssignDriverHistoryProps {
  tourId: string;
  currentDriver: Driver | null;
  onAssigned?: () => void;
}

export function AssignDriverHistory({ 
  tourId, 
  currentDriver, 
  onAssigned 
}: AssignDriverHistoryProps) {
  const [open, setOpen] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

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

  const assignDriver = async (driver: Driver | null) => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}/assign-driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: driver?.id || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to assign driver");
      }

      if (driver) {
        toast.success(`Vozač ${driver.name} je dodijeljen turi`);
      } else {
        toast.success("Vozač je uklonjen s ture");
      }
      onAssigned?.();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri dodjeli vozača");
    } finally {
      setAssigning(false);
      setOpen(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    assignDriver(null);
  };

  if (assigning) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {currentDriver ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1.5 text-xs font-normal px-1.5 py-1 relative group bg-muted"
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[80px]">{currentDriver.name}</span>
            <X 
              className="h-3 w-3 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" 
              onClick={handleRemove}
            />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 text-xs text-muted-foreground hover:text-foreground px-1 py-0.5"
          >
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
        )}
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
                      value={`${driver.name} ${driver.phoneNumber}`}
                      onSelect={() => assignDriver(driver)}
                      className={cn(
                        "cursor-pointer",
                        currentDriver?.id === driver.id && "bg-accent"
                      )}
                    >
                      <User className="h-4 w-4 mr-2" />
                      <div className="flex flex-col">
                        <span className="font-medium">{driver.name}</span>
                        <span className="text-xs text-muted-foreground">{driver.phoneNumber}</span>
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
  );
}
