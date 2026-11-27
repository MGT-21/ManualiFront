"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FormField } from "@/components/auth/form-field"
import { PasswordInput } from "@/components/auth/password-input"
import { registroSchema, type RegistroValues, type UserType } from "@/lib/validations/auth"

const tipoOptions: { value: UserType; label: string }[] = [
  { value: "artesao", label: "Quero vender (Artesão)" },
  { value: "consumidor", label: "Quero comprar" },
]

export function RegistroForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegistroValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      tipo: "artesao",
      nome: "",
      email: "",
      senha: "",
      documento: "",
      biografia: "",
    },
  })

  const tipo = watch("tipo")
  const isArtesao = tipo === "artesao"

  async function onSubmit(values: RegistroValues) {
    // TODO: integrar com a API de cadastro
    console.log("registro", values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5">
      <div className="grid gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Crie sua conta</h1>
        <p className="text-sm text-muted-foreground">
          Junte-se à nossa comunidade de fomento à cultura local.
        </p>
      </div>

      <div className="grid gap-2">
        <span className="text-sm leading-none font-medium">Tipo de Cadastro</span>
        <RadioGroup
          value={tipo}
          onValueChange={(v) => setValue("tipo", v as UserType)}
          className="grid-cols-1 sm:grid-cols-2"
          aria-label="Tipo de cadastro"
        >
          {tipoOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2.5 text-sm transition-colors has-[[data-checked]]:border-primary has-[[data-checked]]:bg-muted"
            >
              <RadioGroupItem value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      <FormField label="Nome Completo" htmlFor="nome" error={errors.nome?.message}>
        <Input
          id="nome"
          autoComplete="name"
          placeholder="Como quer ser chamado"
          aria-invalid={!!errors.nome}
          {...register("nome")}
        />
      </FormField>

      <FormField label="E-mail" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="seuemail@exemplo.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField label="Crie sua senha" htmlFor="senha" error={errors.senha?.message}>
        <PasswordInput
          id="senha"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={!!errors.senha}
          {...register("senha")}
        />
      </FormField>

      {isArtesao && (
        <>
          <FormField
            label="CPF ou CNPJ do Ateliê"
            htmlFor="documento"
            error={errors.documento?.message}
          >
            <Input
              id="documento"
              inputMode="numeric"
              placeholder="Apenas números"
              aria-invalid={!!errors.documento}
              {...register("documento")}
            />
          </FormField>

          <FormField
            label="Biografia / História do seu Ateliê"
            htmlFor="biografia"
            error={errors.biografia?.message}
          >
            <Textarea
              id="biografia"
              rows={4}
              placeholder="Conte um pouco sobre sua trajetória com o artesanato, materiais que utiliza e sua história..."
              aria-invalid={!!errors.biografia}
              {...register("biografia")}
            />
          </FormField>
        </>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting}>
        Concluir cadastro
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Já tem cadastro?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Fazer Login
        </Link>
      </p>
    </form>
  )
}
