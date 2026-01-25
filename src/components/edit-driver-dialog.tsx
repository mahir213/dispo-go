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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const driverSchema = z.object({
  name: z.string().min(1, "Ime vozača je obavezno"),
  phoneNumber: z.string().min(1, "Broj telefona je obavezan"),
  email: z.string().email("Nevažeća email adresa").optional().or(z.literal("")),
  licenseNumber: z.string().min(1, "Broj dozvole je obavezan"),
  licenseExpiryDate: z.string().optional(),
  medicalExamExpiryDate: z.string().optional(),
  driverCardExpiryDate: z.string().optional(),
});

type DriverFormValues = z.infer<typeof driverSchema>;

interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  licenseNumber: string;
  licenseExpiryDate: string | null;
  medicalExamExpiryDate: string | null;
  driverCardExpiryDate: string | null;
}

interface EditDriverDialogProps {
  driver: Driver;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDriverDialog({ driver, open, onOpenChange }: EditDriverDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: driver.name,
      phoneNumber: driver.phoneNumber,
      email: driver.email || "",
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: driver.licenseExpiryDate
        ? format(new Date(driver.licenseExpiryDate), "yyyy-MM-dd")
        : "",
      medicalExamExpiryDate: driver.medicalExamExpiryDate
        ? format(new Date(driver.medicalExamExpiryDate), "yyyy-MM-dd")
        : "",
      driverCardExpiryDate: driver.driverCardExpiryDate
        ? format(new Date(driver.driverCardExpiryDate), "yyyy-MM-dd")
        : "",
    },
  });

  const onSubmit = async (values: DriverFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          licenseExpiryDate: values.licenseExpiryDate
            ? new Date(values.licenseExpiryDate).toISOString()
            : null,
          medicalExamExpiryDate: values.medicalExamExpiryDate
            ? new Date(values.medicalExamExpiryDate).toISOString()
            : null,
          driverCardExpiryDate: values.driverCardExpiryDate
            ? new Date(values.driverCardExpiryDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Greška pri ažuriranju vozača");
      }

      toast.success("Vozač uspješno ažuriran");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Greška pri ažuriranju vozača"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Uredi vozača</DialogTitle>
          <DialogDescription>
            Ažuriraj podatke o vozaču
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ime i prezime</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="npr. Ivan Horvat"
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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broj telefona</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="npr. +385 91 234 5678"
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcionalno)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="npr. ivan.horvat@email.com"
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
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Broj vozačke dozvole</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="npr. 123456789"
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
              name="licenseExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vozačka dozvola (datum isteka)</FormLabel>
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
              name="medicalExamExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Liječnički pregled (datum isteka)</FormLabel>
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
              name="driverCardExpiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahografska kartica (datum isteka)</FormLabel>
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
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Spremanje..." : "Spremi promjene"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
