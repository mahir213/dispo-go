"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function TestEmailButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    emailsSent?: number;
    emails?: string[];
    errors?: string[];
    timestamp?: string;
  } | null>(null);

  const handleTest = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const response = await fetch("/api/cron/check-expiry", {
        method: "GET",
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        toast.success(`Uspješno poslano ${data.emailsSent} emailova`);
      } else {
        toast.error("Greška prilikom slanja emailova");
        setResult({ success: false });
      }
    } catch (error) {
      toast.error("Greška pri pozivu API-ja");
      setResult({ success: false });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Test Email Notifikacija
        </CardTitle>
        <CardDescription>
          Manualno pokreni provjeru isteka i slanje emailova
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleTest} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pokreni provjeru
        </Button>

        {result && (
          <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {result.success ? "Uspješno izvršeno" : "Greška"}
                </p>
                {result.emailsSent !== undefined && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Poslano emailova: {result.emailsSent}
                  </p>
                )}
                {result.emails && result.emails.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Emailovi poslani na:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {result.emails.map((email) => (
                        <li key={email}>{email}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-600">Greške:</p>
                    <ul className="text-sm text-red-600 list-disc list-inside">
                      {result.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.timestamp && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(result.timestamp).toLocaleString("hr-HR")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-1">
          <p>Ova funkcija:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Provjerava sva vozila u sistemu</li>
            <li>Identifikuje vozila sa dokumentima koji ističu</li>
            <li>Šalje emailove korisnicima koji imaju uključene notifikacije</li>
            <li>Ista logika se koristi u automatskom cron job-u</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
