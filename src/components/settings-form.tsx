"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/theme-provider";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const settingsSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
  notificationDaysBefore: z.number().min(1).max(90),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    emailNotificationsEnabled: boolean;
    notificationDaysBefore: number;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { theme, setTheme } = useTheme();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      notificationDaysBefore: user.notificationDaysBefore,
    },
  });

  const onSubmit = async (data: SettingsFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update settings");
      }

      toast.success("Postavke su uspješno ažurirane");
      router.refresh();
    } catch (error) {
      toast.error("Došlo je do greške prilikom ažuriranja postavki");
    } finally {
      setIsLoading(false);
    }
  };

  const notificationsEnabled = form.watch("emailNotificationsEnabled");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tema */}
        <Card>
          <CardHeader>
            <CardTitle>Izgled</CardTitle>
            <CardDescription>
              Prilagodite izgled prikaza aplikacije
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tema</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="flex-1"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Svijetla
                </Button>
                <Button
                  type="button"
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Tamna
                </Button>
                <Button
                  type="button"
                  variant={theme === "system" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("system")}
                  className="flex-1"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  Sistem
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Izaberite temu koja vam najbolje odgovara
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Profil */}
        <Card>
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Osnovne informacije o vašem računu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ime
                </label>
                <p className="text-base mt-1">{user.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-base mt-1">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifikacije */}
        <Card>
          <CardHeader>
            <CardTitle>Email obavještenja</CardTitle>
            <CardDescription>
              Upravljajte email obavještenjima o isteku dokumenata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="emailNotificationsEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Omogući email obavještenja
                    </FormLabel>
                    <FormDescription>
                      Primajte email kada vozilima ističu dokumenti ili pregledi
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Button
                      type="button"
                      variant={field.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => field.onChange(!field.value)}
                    >
                      {field.value ? "Uključeno" : "Isključeno"}
                    </Button>
                  </FormControl>
                </FormItem>
              )}
            />

            {notificationsEnabled && (
              <FormField
                control={form.control}
                name="notificationDaysBefore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Koliko dana unaprijed obavijestiti</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Odaberite broj dana" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="7">7 dana</SelectItem>
                        <SelectItem value="14">14 dana</SelectItem>
                        <SelectItem value="30">30 dana (preporučeno)</SelectItem>
                        <SelectItem value="45">45 dana</SelectItem>
                        <SelectItem value="60">60 dana</SelectItem>
                        <SelectItem value="90">90 dana</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Primat ćete email obavještenje kada neki od dokumenata
                      ističe u ovom periodu
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spremi promjene
          </Button>
        </div>
      </form>
    </Form>
  );
}
