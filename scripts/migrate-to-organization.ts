import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting migration to organization-based model...");

  // 1. Dohvati sve korisnike koji nemaju organizaciju
  const usersWithoutOrg = await prisma.user.findMany({
    where: {
      organizationId: null,
    },
  });

  console.log(`Found ${usersWithoutOrg.length} users without organization`);

  for (const user of usersWithoutOrg) {
    console.log(`\nProcessing user: ${user.email} (${user.id})`);

    // 2. Kreiraj organizaciju za korisnika
    const organization = await prisma.organization.create({
      data: {
        name: `${user.name}'s Company`,
      },
    });

    console.log(`  Created organization: ${organization.id}`);

    // 3. Ažuriraj korisnika da pripada organizaciji i postavi ga kao direktora
    await prisma.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        role: "DIREKTOR",
      },
    });

    console.log(`  Updated user to DIREKTOR role`);

    // 4. Ažuriraj vozila - traži po starom userId polju ako postoji
    // Prvo pronađi vozila koja imaju userId = user.id (stara shema)
    const vehicleUpdateResult = await prisma.$executeRaw`
      UPDATE vehicle 
      SET "organizationId" = ${organization.id}
      WHERE "userId" = ${user.id}
    `;
    console.log(`  Updated ${vehicleUpdateResult} vehicles`);

    // 5. Ažuriraj vozače
    const driverUpdateResult = await prisma.$executeRaw`
      UPDATE driver 
      SET "organizationId" = ${organization.id}
      WHERE "userId" = ${user.id}
    `;
    console.log(`  Updated ${driverUpdateResult} drivers`);

    // 6. Ažuriraj ugovorene ture
    const tourUpdateResult = await prisma.$executeRaw`
      UPDATE contracted_tour 
      SET "organizationId" = ${organization.id}
      WHERE "userId" = ${user.id}
    `;
    console.log(`  Updated ${tourUpdateResult} tours`);

    // 7. Ažuriraj kalendar događaje
    const eventUpdateResult = await prisma.$executeRaw`
      UPDATE calendar_event 
      SET "organizationId" = ${organization.id}
      WHERE "userId" = ${user.id}
    `;
    console.log(`  Updated ${eventUpdateResult} calendar events`);
  }

  console.log("\n✅ Migration completed!");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
