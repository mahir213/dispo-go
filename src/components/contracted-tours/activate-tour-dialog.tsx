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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, Container, User, Check, ChevronsUpDown, Loader2, PlayCircle, Link2 } from "lucide-react";
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

type ActiveTour = {
  id: string;
  company: string;
  loadingLocation: string;
  tourType: string;
  driver?: { name: string; id: string };
  truck?: { registrationNumber: string; id: string };
  trailer?: { registrationNumber: string; id: string };
};

interface ActivateTourDialogProps {
  tourId: string;
  tourName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivateTourDialog({ tourId, tourName, open, onOpenChange }: ActivateTourDialogProps) {
  const [activationType, setActivationType] = useState<"new" | "existing">("new");
  const [activeTours, setActiveTours] = useState<ActiveTour[]>([]);
  const [selectedTour, setSelectedTour] = useState<ActiveTour | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  
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

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        fetch("/api/drivers?limit=1000").then(res => res.json()),
        fetch("/api/vehicles?limit=1000").then(res => res.json()),
        fetch("/api/contracted-tours?filterCompleted=false&limit=1000").then(res => res.json()),
      ])
        .then(([driversData, vehiclesData, toursData]) => {
          setDrivers(driversData.drivers || driversData);
          
          const allVehicles = vehiclesData.vehicles || vehiclesData;
          const allTours = toursData.tours || [];
          
          // Filter only active tours (with driver assigned), not the current tour, and only root tours (no parentTourId)
          const active = allTours.filter((t: any) => t.driverId && t.id !== tourId && !t.parentTourId);
          setActiveTours(active);
          
          // Get IDs of vehicles that are already assigned to active tours (excluding current tour)
          const usedTruckIds = new Set(allTours.filter((t: any) => t.driverId && t.truckId && t.id !== tourId).map((t: any) => t.truckId));
          const usedTrailerIds = new Set(allTours.filter((t: any) => t.driverId && t.trailerId && t.id !== tourId).map((t: any) => t.trailerId));
          
          // Filter out vehicles that are already in use
          const availableTrucks = allVehicles.filter((v: Vehicle) => 
            v.vehicleType === "KAMION" && !usedTruckIds.has(v.id)
          );
          const availableTrailers = allVehicles.filter((v: Vehicle) => 
            v.vehicleType === "PRIKOLICA" && !usedTrailerIds.has(v.id)
          );
          
          setTrucks(availableTrucks);
          setTrailers(availableTrailers);
          
          setLoading(false);
        })
        .catch(() => {
          toast.error("Greška pri učitavanju podataka");
          setLoading(false);
        });
    }
  }, [open, tourId]);

  useEffect(() => {
    if (!open) {
      setActivationType("new");
      setSelectedTour(null);
      setSelectedDriver(null);
      setSelectedTruck(null);
      setSelectedTrailer(null);
    }
  }, [open]);

  // When selecting existing tour, auto-fill driver, truck, trailer
  useEffect(() => {
    if (activationType === "existing" && selectedTour) {
      const driver = drivers.find(d => d.id === selectedTour.driver?.id);
      const truck = trucks.find(t => t.id === selectedTour.truck?.id);
      const trailer = trailers.find(t => t.id === selectedTour.trailer?.id);
      
      setSelectedDriver(driver || null);
      setSelectedTruck(truck || null);
      setSelectedTrailer(trailer || null);
    }
  }, [activationType, selectedTour, drivers, trucks, trailers]);

  const handleActivate = async () => {
    if (activationType === "new") {
      if (!selectedDriver || !selectedTruck || !selectedTrailer) {
        toast.error("Molimo odaberite vozača, kamion i prikolicu");
        return;
      }
    } else {
      if (!selectedTour) {
        toast.error("Molimo odaberite postojeću turu");
        return;
      }
    }

    setActivating(true);
    try {
      if (activationType === "new") {
        // Original logic for new tour
        const driverRes = await fetch(`/api/contracted-tours/${tourId}/assign-driver`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driverId: selectedDriver!.id }),
        });

        if (!driverRes.ok) {
          const data = await driverRes.json();
          throw new Error(data.message || "Failed to assign driver");
        }

        const truckRes = await fetch(`/api/contracted-tours/${tourId}/assign-vehicle`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ truckId: selectedTruck!.id }),
        });

        if (!truckRes.ok) {
          const data = await truckRes.json();
          throw new Error(data.error || "Failed to assign truck");
        }

        const trailerRes = await fetch(`/api/contracted-tours/${tourId}/assign-vehicle`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trailerId: selectedTrailer!.id }),
        });

        if (!trailerRes.ok) {
          const data = await trailerRes.json();
          throw new Error(data.error || "Failed to assign trailer");
        }

        toast.success("Tura je aktivirana!");
      } else {
        // Add to existing tour - set parent tour and copy driver/vehicles
        const parentTour = selectedTour!;
        
        const updateRes = await fetch(`/api/contracted-tours/${tourId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parentTourId: parentTour.id,
            driverId: parentTour.driver?.id,
            truckId: parentTour.truck?.id,
            trailerId: parentTour.trailer?.id,
          }),
        });

        if (!updateRes.ok) {
          const data = await updateRes.json();
          throw new Error(data.message || "Failed to add to existing tour");
        }

        toast.success("Tura je dodana na postojeću!");
      }
      
      onOpenChange(false);
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Greška pri aktiviranju ture");
    } finally {
      setActivating(false);
    }
  };

  const isValid = activationType === "new" 
    ? (selectedDriver && selectedTruck && selectedTrailer)
    : (selectedTour !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
            {/* Activation Type Selection */}
            <div className="grid gap-3">
              <Label>Način aktivacije</Label>
              <RadioGroup value={activationType} onValueChange={(value: "new" | "existing") => setActivationType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="font-normal cursor-pointer">Nova tura - dodijeli vozača i vozila</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="existing" id="existing" />
                  <Label htmlFor="existing" className="font-normal cursor-pointer flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Dodaj na postojeću aktivnu turu
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {activationType === "existing" ? (
              <>
                {/* Existing Tour Selection */}
                <div className="grid gap-2">
                  <Label>Odaberi aktivnu turu *</Label>
                  {activeTours.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nema aktivnih tura</p>
                  ) : (
                    <Popover open={tourOpen} onOpenChange={setTourOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={tourOpen}
                          className="justify-between"
                        >
                          {selectedTour ? (
                            <span className="flex items-center gap-2">
                              <span className="font-medium">{selectedTour.company}</span>
                              <span className="text-xs text-muted-foreground">• {selectedTour.loadingLocation}</span>
                            </span>
                          ) : (
                            "Odaberi turu..."
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[450px] p-0">
                        <Command>
                          <CommandInput placeholder="Pretraži ture..." />
                          <CommandList>
                            <CommandEmpty>Nema rezultata</CommandEmpty>
                            <CommandGroup>
                              {activeTours.map((tour) => (
                                <CommandItem
                                  key={tour.id}
                                  value={`${tour.company} ${tour.loadingLocation}`}
                                  onSelect={() => {
                                    setSelectedTour(tour);
                                    setTourOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedTour?.id === tour.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{tour.company}</span>
                                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded">{tour.tourType}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{tour.loadingLocation}</span>
                                    {tour.driver && (
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                        <User className="h-3 w-3" />
                                        <span>{tour.driver.name}</span>
                                        {tour.truck && (
                                          <>
                                            <Truck className="h-3 w-3 ml-1" />
                                            <span>{tour.truck.registrationNumber}</span>
                                          </>
                                        )}
                                        {tour.trailer && (
                                          <>
                                            <Container className="h-3 w-3 ml-1" />
                                            <span>{tour.trailer.registrationNumber}</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                {selectedTour && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Tura će koristiti iste resurse:</p>
                    <div className="space-y-1 text-sm">
                      {selectedTour.driver && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          <span>{selectedTour.driver.name}</span>
                        </div>
                      )}
                      {selectedTour.truck && (
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5" />
                          <span>{selectedTour.truck.registrationNumber}</span>
                        </div>
                      )}
                      {selectedTour.trailer && (
                        <div className="flex items-center gap-2">
                          <Container className="h-3.5 w-3.5" />
                          <span>{selectedTour.trailer.registrationNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
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
