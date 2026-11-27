import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegistroForm } from "@/components/auth/registro-form"

export const metadata: Metadata = { title: "Criar conta | Manuali" }

export default function RegistroPage() {
  return (
    <AuthShell
      headline="Valorize o fazer manual."
      description="Seja expondo suas obras para o mundo ou adquirindo peças únicas com história e identidade cultural."
    >
      <RegistroForm />
    </AuthShell>
  )
}
