"use client"

import {zodResolver} from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import  { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button" 
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"


import { Input } from "@/components/ui/input"

import { authClient } from "@/lib/auth-client"

const registerSchema = z.object({
    email: z.string().email("Molimo unesite ispravnu email adresu"),
    password: z.string().min(6, "Lozinka mora imati najmanje 6 karaktera"),
    confirmPassword: z.string(),
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne poklapaju",
    path: ["confirmPassword"]
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const router = useRouter();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });
    
    const onSubmit = async (values: RegisterFormValues) => {
        await authClient.signUp.email(
        {
            name: values.email,
            email: values.email,
            password: values.password,
            callbackURL: "/",
        },
        {
            onSuccess: () => {
                router.push("/");
            },
            onError: (ctx) =>{
                toast.error(ctx.error.message);
            }
        } 
      )
    };

    const isPending = form.formState.isSubmitting;

    return(
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle>
                        Početak
                        <CardDescription>
                            Kreirajte nalog da započnete
                        </CardDescription>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Form{...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="grid gap-6">
                                <div className="grid gap-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="email" placeholder="vas@email.com" disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                      <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lozinka</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" placeholder="********" disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Potvrdite lozinku</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="password" placeholder="********" disabled={isPending} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit"
                                    className="w-full" disabled={isPending}>
                                        Registrujte se
                                    </Button>
                                </div>
                                <div className="text-center text-sm">Već imate nalog?{" "}
                                    <Link href="/login"
                                    className="underline offset-4">
                                      Prijavite se 
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
    
}
