import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!firstUser) {
    console.log("No users found");
    return;
  }

  await prisma.user.update({
    where: { id: firstUser.id },
    data: { role: "DIREKTOR" },
  });

  console.log(`Updated user ${firstUser.email} to DIREKTOR role`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
