"use client"

import { useEffect, useState } from "react"
import { Minus, Plus } from "lucide-react"
import Image from "next/image"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { getProductById } from "@/services/productsService"
import type { ProductApiData } from "@/types/product"
import { useCart } from "@/components/cart/cart-context"
import { ProductCard } from "./product-card"

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

const IMAGEM_PADRAO =
  "https://images.unsplash.com/photo-1718361482637-754b67950018?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"

// TODO: trocar pelos dados da API quando houver o service de relacionados
const PRODUTOS_RELACIONADOS = [
  {
    id: "relacionado-1",
    nome: "Vaso de cerâmica",
    descricao: "Modelado e pintado à mão",
    preco: 129.9,
    foto: IMAGEM_PADRAO,
  },
  {
    id: "relacionado-2",
    nome: "Cesto de palha",
    descricao: "Trançado com fibras naturais",
    preco: 89.9,
    foto: IMAGEM_PADRAO,
  },
  {
    id: "relacionado-3",
    nome: "Tábua de madeira",
    descricao: "Acabamento artesanal",
    preco: 74.5,
    foto: IMAGEM_PADRAO,
  },
  {
    id: "relacionado-4",
    nome: "Manta de tear",
    descricao: "Tecida em tear manual",
    preco: 189,
    foto: IMAGEM_PADRAO,
  },
]

// Único lugar que depende dos nomes dos campos da API.
// Confira estoque, categoria, historia e artesaoId no seu ProductApiData.
function toProductView(data: ProductApiData) {
  return {
    id: data.id,
    nome: data.nome,
    preco: data.preco,
    descricao: data.descricao,
    fotos: data.fotos ?? [],
    estoque: data.estoque,
    categoria: data.categoria,
    historia: data.historia,
    artesaoId: data.artesaoId,
  }
}

type RequestResult = {
  id: string
  product: ReturnType<typeof toProductView> | null
}

export default function ProductPage({ id }: { id: string }) {
  const { addItem } = useCart()
  const [result, setResult] = useState<RequestResult | null>(null)
  const [selected, setSelected] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    let active = true

    getProductById(id)
      .then((data) => {
        if (!active) return
        setResult({ id, product: toProductView(data) })
        setSelected(0)
        setQuantity(1)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        console.error("Erro ao buscar produto:", requestError)
        setResult({ id, product: null })
      })

    // Ignora respostas antigas quando o id muda ou o componente é desmontado
    return () => {
      active = false
    }
  }, [id])

  if (result?.id !== id) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <p role="status">Carregando produto...</p>
      </main>
    )
  }

  const { product } = result

  if (!product) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <p role="alert">
          Não foi possível carregar este produto. Verifique se ele existe e tente
          novamente.
        </p>
      </main>
    )
  }

  const selectedImage = product.fotos[selected]
  const inStock = product.estoque > 0

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:space-y-10 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/acervo">{product.categoria}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.nome}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-8">
        <div className="flex flex-col gap-3 md:flex-row-reverse md:items-start">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted md:flex-1">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.nome}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Imagem indisponível
              </div>
            )}
          </div>

          {product.fotos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-1 md:w-20 md:flex-col md:overflow-visible">
              {product.fotos.map((foto, index) => (
                <button
                  key={`${foto}-${index}`}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={selected === index}
                  className="aspect-square w-16 shrink-0 overflow-hidden rounded-md border bg-muted aria-[current=true]:ring-2 aria-[current=true]:ring-ring md:w-full"
                >
                  <Image
                    src={foto}
                    alt=""
                    width={80}
                    height={80}
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{product.categoria}</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {product.nome}
            </h1>
          </div>

          <p className="text-3xl font-semibold text-primary">
            {brl(product.preco)}
          </p>

          <p className="text-sm text-muted-foreground">
            {!inStock
              ? "Produto indisponível"
              : product.estoque === 1
                ? "Em estoque • 1 unidade disponível"
                : `Em estoque • ${product.estoque} unidades disponíveis`}
          </p>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.descricao}
          </p>

          {inStock && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Quantidade</p>
              <div className="inline-flex items-center gap-1 rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((current) => current - 1)}
                >
                  <Minus />
                </Button>
                <span
                  aria-live="polite"
                  className="w-8 text-center text-sm tabular-nums"
                >
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= product.estoque}
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!inStock}
              onClick={() =>
                addItem(
                  { id: product.id, nome: product.nome, preco: product.preco },
                  quantity,
                )
              }
            >
              Adicionar ao carrinho
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full"
              disabled={!inStock}
            >
              Comprar agora
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>A história da peça</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.historia || "Não há uma história cadastrada para esta peça."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sobre o artesão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Artesão #{product.artesaoId}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Ainda não há mais informações sobre este artesão.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="h-auto p-0" disabled>
              Ver mais produtos
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Você também pode gostar</h2>
        <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0 ">
          {PRODUTOS_RELACIONADOS.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              nome={product.nome}
              descricao={product.descricao}
              preco={product.preco}
              fotos={product.fotos}
            />
          ))}
        </div>
      </section>
    </main>
  )
}