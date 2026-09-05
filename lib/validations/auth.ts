import { z } from 'zod'
export const loginSchema=z.object({email:z.string().email(),password:z.string().min(6)})
export const registerSchema=z.object({full_name:z.string().min(2),whatsapp:z.string().min(10),password:z.string().min(6),confirmPassword:z.string().min(6)}).refine(x=>x.password===x.confirmPassword,{path:['confirmPassword'],message:'As senhas não conferem'})
export const verificationSchema=z.object({code:z.string().regex(/^\\d{5}[A-Z]$/,'Código inválido')})
