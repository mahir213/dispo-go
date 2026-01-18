"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { PlusIcon } from "lucide-react";

const vehicleSchema = z.object({
  name: z.string().min(1, "Ime vozila je obavezno"),
  registrationNumber: z.string().min(1, "Registarska oznaka je obavezna"),
  vehicleType: z.enum(["KAMION", "PRIKOLICA"], {
    message: "Tip vozila je obavezan",
  }),
  sixMonthInspectionDate: z.string().optional(),
  registrationExpiryDate: z.string().optional(),
  ppAparatExpiryDate: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

export function AddVehicleDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      name: "",
      registrationNumber: "",
      vehicleType: undefined,
      sixMonthInspectionDate: "",
      registrationExpiryDate: "",
      ppAparatExpiryDate: "",
    },
  });

  const onSubmit = async (values: VehicleFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          sixMonthInspectionDate: values.sixMonthInspectionDate
            ? new Date(values.sixMonthInspectionDate).toISOString()
            : undefined,
          registrationExpiryDate: values.registrationExpiryDate
            ? new Date(values.registrationExpiryDate).toISOString()
            : undefined,
          ppAparatExpiryDate: values.ppAparatExpiryDate
            ? new Date(values.ppAparatExpiryDate).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Greška pri dodavanju vozila");
      }

      toast.success("Vozilo uspješno dodato");
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Greška pri dodavanju vozila"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => console.log("Button clicked!")}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo vozilo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj novo vozilo</DialogTitle>
          <DialogDescription>
            Unesite podatke o novom vozilu
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ime vozila</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="npr. Kamion 1"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registarska oznaka</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="npr. SA-123-AB"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vehicleType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip vozila</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Izaberite tip" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="KAMION">Kamion</SelectItem>
                      <SelectItem value="PRIKOLICA">Prikolica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sixMonthInspectionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Šestomjesečni pregled (datum isteka)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registrationExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registracija (datum isteka)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ppAparatExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PP aparat (datum isteka)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Otkaži
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Dodavanje..." : "Dodaj vozilo"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
