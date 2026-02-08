import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <ShieldX className="mx-auto h-16 w-16 text-destructive" />
        <h1 className="text-3xl font-bold">Nemate pristup</h1>
        <p className="text-muted-foreground">
          Nemate dozvolu za pristup ovoj stranici.
        </p>
        <Button asChild>
          <Link href="/">Povratak na početnu</Link>
        </Button>
      </div>
    </div>
  );
}
