import Link from "next/link"
import { Logo } from "@/components/shared/logo"

interface AuthShellProps {
  headline: string
  description: string
  children: React.ReactNode
}

/**
 * Layout split-screen das páginas de autenticação.
 * Desktop: painel de imagem à esquerda + formulário à direita.
 * Mobile: só o formulário, com a logo no topo.
 */
export function AuthShell({ headline, description, children }: AuthShellProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Painel de imagem: troque bg-muted por uma imagem de fundo quando tiver o asset */}
      <aside className="relative hidden flex-col justify-between bg-muted p-10 lg:flex">
        <Link href="/" className="flex">
          <Logo />
        </Link>
        <div className="max-w-md space-y-3">
          <h2 className="text-4xl font-bold tracking-tight">{headline}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Manuali Pernambuco. Feito com amor em Recife e Caruaru.
        </p>
      </aside>

      <main className="flex flex-col gap-6 p-6 lg:p-10">
        <Link href="/" className="flex lg:hidden">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  )
}
