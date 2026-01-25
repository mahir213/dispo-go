"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

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

export function AddDriverDialog() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: {
      name: "",
      phoneNumber: "",
      email: "",
      licenseNumber: "",
      licenseExpiryDate: "",
      medicalExamExpiryDate: "",
      driverCardExpiryDate: "",
    },
  });

  const onSubmit = async (values: DriverFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          licenseExpiryDate: values.licenseExpiryDate
            ? new Date(values.licenseExpiryDate).toISOString()
            : undefined,
          medicalExamExpiryDate: values.medicalExamExpiryDate
            ? new Date(values.medicalExamExpiryDate).toISOString()
            : undefined,
          driverCardExpiryDate: values.driverCardExpiryDate
            ? new Date(values.driverCardExpiryDate).toISOString()
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Greška pri dodavanju vozača");
      }

      toast.success("Vozač uspješno dodat");
      setOpen(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Greška pri dodavanju vozača"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="h-4 w-4 mr-2" />
          Novi vozač
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj novog vozača</DialogTitle>
          <DialogDescription>
            Unesite podatke o novom vozaču
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
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Odustani
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Dodavanje..." : "Dodaj vozača"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
