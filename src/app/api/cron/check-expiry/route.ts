import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { resend } from "@/lib/resend";
import { VehicleExpiryEmailTemplate, getVehicleExpiryEmailText } from "@/lib/email-templates";

// Ova funkcija provjerava sva vozila i šalje email obavještenja korisnicima
// Može se pokrenuti manualno ili putem cron job-a
export async function GET(request: NextRequest) {
  try {
    // Provjera autorizacije - opciono dodati secret key za cron jobs
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    // U production modu, zahtijevaj autorizaciju
    if (process.env.NODE_ENV === "production" && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Dohvati sve korisnike koji imaju uključene notifikacije, zajedno sa vozilima iz njihove organizacije
    const users = await db.user.findMany({
      where: {
        emailNotificationsEnabled: true,
        organizationId: { not: null },
      },
      include: {
        organization: {
          include: {
            vehicles: true,
          },
        },
      },
    });

    const emailsSent: string[] = [];
    const errors: string[] = [];

    console.log(`[CRON] Found ${users.length} users with notifications enabled`);

    for (const user of users) {
      if (!user.organization) continue;
      
      const vehicles = user.organization.vehicles;
      console.log(`[CRON] Checking user: ${user.email} (ID: ${user.id}), has ${vehicles.length} vehicles in organization`);
      
      const expiringVehicles: Array<{
        name: string;
        registrationNumber: string;
        expiringItem: string;
        expiryDate: Date;
        daysUntilExpiry: number;
      }> = [];

      const now = new Date();
      const checkUntilDate = new Date();
      checkUntilDate.setDate(checkUntilDate.getDate() + user.notificationDaysBefore);

      // Provjeri svako vozilo organizacije
      for (const vehicle of vehicles) {
        console.log(`[CRON]   - Vehicle: ${vehicle.name} (organizationId: ${vehicle.organizationId})`);
        
        const datesToCheck = [
          {
            date: vehicle.sixMonthInspectionDate,
            name: "Šestomjesečni pregled",
          },
          {
            date: vehicle.registrationExpiryDate,
            name: "Registracija",
          },
          {
            date: vehicle.ppAparatExpiryDate,
            name: "PP Aparat",
          },
        ];

        for (const item of datesToCheck) {
          if (item.date) {
            const expiryDate = new Date(item.date);
            
            // Provjeri da li datum ističe u periodu od sada do notificationDaysBefore
            if (expiryDate >= now && expiryDate <= checkUntilDate) {
              const daysUntilExpiry = Math.ceil(
                (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );

              expiringVehicles.push({
                name: vehicle.name,
                registrationNumber: vehicle.registrationNumber,
                expiringItem: item.name,
                expiryDate: expiryDate,
                daysUntilExpiry: daysUntilExpiry,
              });
            }
          }
        }
      }

      // Ako ima vozila koja ističu, pošalji email
      if (expiringVehicles.length > 0) {
        try {
          const emailHtml = VehicleExpiryEmailTemplate({
            userName: user.name,
            vehicles: expiringVehicles,
          });

          const emailText = getVehicleExpiryEmailText({
            userName: user.name,
            vehicles: expiringVehicles,
          });

          await resend.emails.send({
            from: process.env.EMAIL_FROM || "Dispo-Go <onboarding@resend.dev>",
            to: user.email,
            subject: `⚠️ Obavještenje: ${expiringVehicles.length} ${expiringVehicles.length === 1 ? 'dokument ističe' : 'dokumenata ističe'}`,
            html: emailHtml,
            text: emailText,
          });

          emailsSent.push(user.email);
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
          errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailsSent.length,
      emails: emailsSent,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in check-expiry cron:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
