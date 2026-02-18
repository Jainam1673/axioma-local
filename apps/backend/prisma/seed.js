import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "owner@axioma.local" },
    update: {},
    create: {
      email: "owner@axioma.local",
      passwordHash: "$2b$10$bvrJJpkEXKx9kQwUsKitj.cXi2MD8hH8Nf6urTXFb4FIwFCERLMh6",
      role: "OWNER",
    },
  });

  await prisma.partner.createMany({
    data: [
      { userId: owner.id, name: "Partner A", shareRatio: 0.6 },
      { userId: owner.id, name: "Partner B", shareRatio: 0.4 },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
