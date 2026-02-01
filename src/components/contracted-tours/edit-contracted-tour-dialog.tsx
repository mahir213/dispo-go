"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { bsLocale } from "@/lib/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Trash2, MapPin, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const unloadingStopSchema = z.object({
  id: z.string().optional(),
  location: z.string().min(1, "Istovarno mjesto je obavezno"),
  unloadingDate: z.date().optional().nullable(),
});

const tourSchema = z.object({
  tourType: z.enum(["UVOZ", "IZVOZ", "MEDJUTURA"], {
    message: "Tip ture je obavezan",
  }),
  loadingLocation: z.string().min(1, "Utovarno mjesto je obavezno"),
  loadingDate: z.date().optional().nullable(),
  exportCustoms: z.string().optional(),
  importCustoms: z.string().optional(),
  unloadingStops: z.array(unloadingStopSchema).min(1, "Potrebno je barem jedno istovarno mjesto"),
  price: z.string().min(1, "Cijena je obavezna"),
  company: z.string().min(1, "Kompanija je obavezna"),
  isADR: z.boolean(),
});

type TourFormValues = z.infer<typeof tourSchema>;

type UnloadingStop = {
  id: string;
  location: string;
  unloadingDate: string | null;
};

type ContractedTour = {
  id: string;
  tourType: "UVOZ" | "IZVOZ" | "MEDJUTURA";
  loadingLocation: string;
  loadingDate: string | null;
  exportCustoms: string | null;
  importCustoms: string | null;
  unloadingStops: UnloadingStop[];
  price: number;
  company: string;
  isADR: boolean;
};

interface EditContractedTourDialogProps {
  tour: ContractedTour;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContractedTourDialog({
  tour,
  open,
  onOpenChange,
}: EditContractedTourDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
    defaultValues: {
      tourType: tour.tourType,
      loadingLocation: tour.loadingLocation,
      loadingDate: tour.loadingDate ? new Date(tour.loadingDate) : null,
      exportCustoms: tour.exportCustoms || "",
      importCustoms: tour.importCustoms || "",
      unloadingStops: tour.unloadingStops?.length > 0
        ? tour.unloadingStops.map(stop => ({
            id: stop.id,
            location: stop.location,
            unloadingDate: stop.unloadingDate ? new Date(stop.unloadingDate) : null,
          }))
        : [{ location: "", unloadingDate: null }],
      price: tour.price.toString(),
      company: tour.company,
      isADR: tour.isADR,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "unloadingStops",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        tourType: tour.tourType,
        loadingLocation: tour.loadingLocation,
        loadingDate: tour.loadingDate ? new Date(tour.loadingDate) : null,
        exportCustoms: tour.exportCustoms || "",
        importCustoms: tour.importCustoms || "",
        unloadingStops: tour.unloadingStops?.length > 0
          ? tour.unloadingStops.map(stop => ({
              id: stop.id,
              location: stop.location,
              unloadingDate: stop.unloadingDate ? new Date(stop.unloadingDate) : null,
            }))
          : [{ location: "", unloadingDate: null }],
        price: tour.price.toString(),
        company: tour.company,
        isADR: tour.isADR,
      });
    }
  }, [open, tour, form]);

  const onSubmit = async (values: TourFormValues) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contracted-tours/${tour.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          price: parseFloat(values.price),
          loadingDate: values.loadingDate?.toISOString() || null,
          unloadingStops: values.unloadingStops.map(stop => ({
            id: stop.id,
            location: stop.location,
            unloadingDate: stop.unloadingDate?.toISOString() || null,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Greška pri ažuriranju ture");
      }

      toast.success("Ugovorena tura je uspješno ažurirana");
      onOpenChange(false);
      router.refresh();
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Greška pri ažuriranju ture"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uredi ugovorenu turu</DialogTitle>
          <DialogDescription>
            Ažurirajte podatke o ugovorenoj turi
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Row 1: Tip, Kompanija, Cijena, ADR */}
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="tourType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip ture</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Izaberite tip" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UVOZ">Uvoz</SelectItem>
                        <SelectItem value="IZVOZ">Izvoz</SelectItem>
                        <SelectItem value="MEDJUTURA">Međutura</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kompanija</FormLabel>
                    <FormControl>
                      <Input placeholder="Naziv kompanije" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cijena (€)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isADR"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-3 space-y-0 pb-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      ADR roba
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Utovar - lokacija i datum */}
            <div className="border rounded-lg p-4 bg-green-50/50">
              <h4 className="font-medium text-sm text-green-800 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Utovar
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="loadingLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Utovarno mjesto</FormLabel>
                      <FormControl>
                        <Input placeholder="Unesite mjesto utovara" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="loadingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum utovara</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: bsLocale })
                              ) : (
                                <span>Odaberite datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            locale={bsLocale}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Row 3: Carine */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="exportCustoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Izvozna carina</FormLabel>
                    <FormControl>
                      <Input placeholder="Unesite izvoznu carinu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="importCustoms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uvozna carina</FormLabel>
                    <FormControl>
                      <Input placeholder="Unesite uvoznu carinu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Row 4: Istovari */}
            <div className="border rounded-lg p-4 bg-red-50/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm text-red-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Istovar ({fields.length})
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ location: "", unloadingDate: null })}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Dodaj istovar
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end">
                    <FormField
                      control={form.control}
                      name={`unloadingStops.${index}.location`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Istovarno mjesto {index + 1}
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Unesite mjesto istovara" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`unloadingStops.${index}.unloadingDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={index > 0 ? "sr-only" : ""}>
                            Datum istovara {index + 1}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: bsLocale })
                                  ) : (
                                    <span>Odaberite datum</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                locale={bsLocale}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {fields.length === 1 && <div className="w-10" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Spremanje..." : "Spremi promjene"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
