import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = { title: "Entrar | Manuali" }

export default function LoginPage() {
  return (
    <AuthShell
      headline="Onde a alma do Nordeste vira obra de arte."
      description="Conectamos os mestres do barro, da renda e da madeira diretamente com admiradores da nossa economia criativa."
    >
      <LoginForm />
    </AuthShell>
  )
}
