"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Truck, Container, User, Check, ChevronsUpDown, Loader2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Driver = {
  id: string;
  name: string;
  phoneNumber: string;
};

type Vehicle = {
  id: string;
  name: string;
  registrationNumber: string;
  vehicleType: "KAMION" | "PRIKOLICA";
};

interface ActivateTourDialogProps {
  tourId: string;
  tourName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivateTourDialog({ tourId, tourName, open, onOpenChange }: ActivateTourDialogProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Vehicle[]>([]);
  const [trailers, setTrailers] = useState<Vehicle[]>([]);
  
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<Vehicle | null>(null);
  const [selectedTrailer, setSelectedTrailer] = useState<Vehicle | null>(null);
  
  const [driverOpen, setDriverOpen] = useState(false);
  const [truckOpen, setTruckOpen] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  
  const router = useRouter();

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        fetch("/api/drivers").then(res => res.json()),
        fetch("/api/vehicles").then(res => res.json()),
      ])
        .then(([driversData, vehiclesData]) => {
          setDrivers(driversData);
          setTrucks(vehiclesData.filter((v: Vehicle) => v.vehicleType === "KAMION"));
          setTrailers(vehiclesData.filter((v: Vehicle) => v.vehicleType === "PRIKOLICA"));
          setLoading(false);
        })
        .catch(() => {
          toast.error("Greška pri učitavanju podataka");
          setLoading(false);
        });
    }
  }, [open]);

  // Reset selections when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedDriver(null);
      setSelectedTruck(null);
      setSelectedTrailer(null);
    }
  }, [open]);

  const handleActivate = async () => {
    if (!selectedDriver || !selectedTruck || !selectedTrailer) {
      toast.error("Molimo odaberite vozača, kamion i prikolicu");
      return;
    }

    setActivating(true);
    try {
      // Assign driver
      const driverRes = await fetch(`/api/contracted-tours/${tourId}/assign-driver`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: selectedDriver.id }),
      });

      if (!driverRes.ok) {
        const data = await driverRes.json();
        throw new Error(data.message || "Failed to assign driver");
      }

      // Assign truck
      const truckRes = await fetch(`/api/contracted-tours/${tourId}/assign-vehicle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truckId: selectedTruck.id }),
      });

      if (!truckRes.ok) {
        const data = await truckRes.json();
        throw new Error(data.error || "Failed to assign truck");
      }

      // Assign trailer
      const trailerRes = await fetch(`/api/contracted-tours/${tourId}/assign-vehicle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trailerId: selectedTrailer.id }),
      });

      if (!trailerRes.ok) {
        const data = await trailerRes.json();
        throw new Error(data.error || "Failed to assign trailer");
      }

      toast.success("Tura je aktivirana!");
      onOpenChange(false);
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri aktiviranju ture");
    } finally {
      setActivating(false);
    }
  };

  const isValid = selectedDriver && selectedTruck && selectedTrailer;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-green-600" />
            Aktiviraj turu
          </DialogTitle>
          <DialogDescription>
            {tourName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Driver Selection */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Vozač *
              </Label>
              <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={driverOpen}
                    className="justify-between"
                  >
                    {selectedDriver ? selectedDriver.name : "Odaberi vozača..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Pretraži vozače..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata</CommandEmpty>
                      <CommandGroup>
                        {drivers.map((driver) => (
                          <CommandItem
                            key={driver.id}
                            value={driver.name}
                            onSelect={() => {
                              setSelectedDriver(driver);
                              setDriverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedDriver?.id === driver.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{driver.name}</span>
                              <span className="text-xs text-muted-foreground">{driver.phoneNumber}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Truck Selection */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Kamion *
              </Label>
              <Popover open={truckOpen} onOpenChange={setTruckOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={truckOpen}
                    className="justify-between"
                  >
                    {selectedTruck ? `${selectedTruck.registrationNumber} - ${selectedTruck.name}` : "Odaberi kamion..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Pretraži kamione..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata</CommandEmpty>
                      <CommandGroup>
                        {trucks.map((truck) => (
                          <CommandItem
                            key={truck.id}
                            value={`${truck.name} ${truck.registrationNumber}`}
                            onSelect={() => {
                              setSelectedTruck(truck);
                              setTruckOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedTruck?.id === truck.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{truck.registrationNumber}</span>
                              <span className="text-xs text-muted-foreground">{truck.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Trailer Selection */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Container className="h-4 w-4" />
                Prikolica *
              </Label>
              <Popover open={trailerOpen} onOpenChange={setTrailerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={trailerOpen}
                    className="justify-between"
                  >
                    {selectedTrailer ? `${selectedTrailer.registrationNumber} - ${selectedTrailer.name}` : "Odaberi prikolicu..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[350px] p-0">
                  <Command>
                    <CommandInput placeholder="Pretraži prikolice..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata</CommandEmpty>
                      <CommandGroup>
                        {trailers.map((trailer) => (
                          <CommandItem
                            key={trailer.id}
                            value={`${trailer.name} ${trailer.registrationNumber}`}
                            onSelect={() => {
                              setSelectedTrailer(trailer);
                              setTrailerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedTrailer?.id === trailer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{trailer.registrationNumber}</span>
                              <span className="text-xs text-muted-foreground">{trailer.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={activating}>
            Odustani
          </Button>
          <Button onClick={handleActivate} disabled={!isValid || activating}>
            {activating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aktiviranje...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Aktiviraj
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
