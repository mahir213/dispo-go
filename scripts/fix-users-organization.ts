import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Pronađi sve korisnike
  const users = await prisma.user.findMany({
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true, 
      organizationId: true 
    }
  });
  
  console.log("Current users:");
  console.log(JSON.stringify(users, null, 2));
  
  // Pronađi korisnike bez organizacije
  const usersWithoutOrg = users.filter(u => !u.organizationId);
  
  if (usersWithoutOrg.length > 0) {
    console.log(`\nFound ${usersWithoutOrg.length} users without organization. Fixing...`);
    
    for (const user of usersWithoutOrg) {
      // Kreiraj organizaciju
      const org = await prisma.organization.create({
        data: {
          name: `${user.name}'s Company`,
        }
      });
      
      // Ažuriraj korisnika
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          organizationId: org.id,
          role: "DIREKTOR"
        }
      });
      
      console.log(`  Fixed user ${user.email} -> organization ${org.id}`);
    }
  } else {
    console.log("\nAll users have organizations.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
