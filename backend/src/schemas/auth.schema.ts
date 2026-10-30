import { z } from "zod";

const registerSchema = z.object({
    name: z.string({message: "Invalid name format"}).min(2).max(100),
    email: z.string({message: "Invalid email format"}).email(),
    password: z.string({message: "Invalid password format"}).min(6).max(100),
});

const loginSchema = z.object({
    email: z.string({message: "Invalid email"}).email(),
    password: z.string({message: "Invalid password"}).min(6,{message: "Password must be at least 6 characters long"}).max(100),
});

const forgotPasswordSchema = z.object({
    email: z.email({message: "Invalid email format"}).min(1, {message: "Email is required"})
});

export { registerSchema, loginSchema, forgotPasswordSchema };