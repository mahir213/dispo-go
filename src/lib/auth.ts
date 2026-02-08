import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma"
import prisma from "./db";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql"
    }),

    emailAndPassword:{
        enabled: true,
        autoSignIn: true,
    },

    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "DISPONENT",
            },
            organizationId: {
                type: "string",
                required: false,
            },
        },
    },

    databaseHooks: {
        user: {
            create: {
                after: async (user) => {
                    // Kreiraj organizaciju za novog korisnika i postavi ga kao DIREKTORA
                    const organization = await prisma.organization.create({
                        data: {
                            name: `${user.name}'s Organization`,
                        },
                    });

                    // Ažuriraj korisnika sa organizationId i ulogom DIREKTOR
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            organizationId: organization.id,
                            role: "DIREKTOR",
                        },
                    });
                },
            },
        },
    },
});
