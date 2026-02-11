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
import { Truck, Container, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Vehicle = {
  id: string;
  name: string;
  registrationNumber: string;
  vehicleType: "KAMION" | "PRIKOLICA";
};

interface AssignVehicleHistoryProps {
  tourId: string;
  vehicleType: "KAMION" | "PRIKOLICA";
  currentVehicle: Vehicle | null;
  onAssigned?: () => void;
}

export function AssignVehicleHistory({ 
  tourId, 
  vehicleType, 
  currentVehicle, 
  onAssigned 
}: AssignVehicleHistoryProps) {
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const Icon = vehicleType === "KAMION" ? Truck : Container;
  const label = vehicleType === "KAMION" ? "Kamion" : "Prikolica";
  const fieldName = vehicleType === "KAMION" ? "truckId" : "trailerId";

  useEffect(() => {
    if (open && vehicles.length === 0) {
      setLoading(true);
      fetch("/api/vehicles?limit=1000")
        .then((res) => res.json())
        .then((data) => {
          const allVehicles = data.vehicles || data;
          const filtered = allVehicles.filter((v: Vehicle) => v.vehicleType === vehicleType);
          setVehicles(filtered);
          setLoading(false);
        })
        .catch(() => {
          toast.error(`Greška pri učitavanju vozila`);
          setLoading(false);
        });
    }
  }, [open, vehicles.length, vehicleType]);

  const assignVehicle = async (vehicle: Vehicle | null) => {
    setAssigning(true);
    try {
      const response = await fetch(`/api/contracted-tours/${tourId}/assign-vehicle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: vehicle?.id || null }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to assign vehicle");
      }

      if (vehicle) {
        toast.success(`${label} ${vehicle.registrationNumber} dodijeljen turi`);
      } else {
        toast.success(`${label} uklonjen s ture`);
      }
      onAssigned?.();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Greška pri dodjeli vozila`);
    } finally {
      setAssigning(false);
      setOpen(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    assignVehicle(null);
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
        {currentVehicle ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1.5 text-xs font-normal px-1 py-0.5 relative group"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="whitespace-nowrap">{currentVehicle.registrationNumber}</span>
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
            <Plus className="h-3 w-3" />
            <Icon className="h-3.5 w-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Pretraži ${label.toLowerCase()}e...`} />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <>
                <CommandEmpty>Nema rezultata</CommandEmpty>
                <CommandGroup>
                  {vehicles.map((vehicle) => (
                    <CommandItem
                      key={vehicle.id}
                      value={`${vehicle.name} ${vehicle.registrationNumber}`}
                      onSelect={() => assignVehicle(vehicle)}
                      className={cn(
                        "cursor-pointer",
                        currentVehicle?.id === vehicle.id && "bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      <div className="flex flex-col">
                        <span className="font-medium">{vehicle.registrationNumber}</span>
                        <span className="text-xs text-muted-foreground">{vehicle.name}</span>
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
