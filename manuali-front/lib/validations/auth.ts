import { z } from "zod"

export const userTypes = ["artesao", "consumidor"] as const
export type UserType = (typeof userTypes)[number]

const onlyDigits = (value: string) => value.replace(/\D/g, "")

export const loginSchema = z.object({
  tipo: z.enum(userTypes),
  email: z.email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe sua senha"),
})

export type LoginValues = z.infer<typeof loginSchema>

export const registroSchema = z
  .object({
    tipo: z.enum(userTypes),
    nome: z.string().trim().min(3, "Informe seu nome completo"),
    email: z.email("Informe um e-mail válido"),
    senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
    documento: z.string().optional(),
    biografia: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // CPF/CNPJ e biografia só são exigidos para quem vai vender
    if (data.tipo !== "artesao") return

    const digits = onlyDigits(data.documento ?? "")
    if (digits.length !== 11 && digits.length !== 14) {
      ctx.addIssue({
        code: "custom",
        path: ["documento"],
        message: "Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido",
      })
    }

    if (!data.biografia || data.biografia.trim().length < 20) {
      ctx.addIssue({
        code: "custom",
        path: ["biografia"],
        message: "Conte um pouco mais sobre você (mín. 20 caracteres)",
      })
    }
  })

export type RegistroValues = z.infer<typeof registroSchema>
