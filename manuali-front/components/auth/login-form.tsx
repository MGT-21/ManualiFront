"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FormField } from "@/components/auth/form-field"
import { PasswordInput } from "@/components/auth/password-input"
import { loginSchema, type LoginValues, type UserType } from "@/lib/validations/auth"

export function LoginForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tipo: "artesao", email: "", senha: "" },
  })

  const tipo = watch("tipo")

  async function onSubmit(values: LoginValues) {
    // TODO: integrar com a API de autenticação
    console.log("login", values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Olá novamente!</h1>
        <p className="text-sm text-muted-foreground">
          Escolha como deseja se conectar hoje.
        </p>
      </div>

      <Tabs value={tipo} onValueChange={(v) => setValue("tipo", v as UserType)}>
        <TabsList>
          <TabsTrigger value="artesao">Artesão</TabsTrigger>
          <TabsTrigger value="consumidor">Consumidor</TabsTrigger>
        </TabsList>
      </Tabs>

      <FormField label="E-mail cadastrado" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="exemplo@email.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Sua senha"
        htmlFor="senha"
        error={errors.senha?.message}
        action={
          <Link
            href="/recuperar-senha"
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Esqueceu a senha?
          </Link>
        }
      >
        <PasswordInput
          id="senha"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.senha}
          {...register("senha")}
        />
      </FormField>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        Entrar no espaço
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{" "}
        <Link href="/registro" className="font-medium text-primary underline-offset-4 hover:underline">
          Criar cadastro
        </Link>
      </p>
    </form>
  )
}
