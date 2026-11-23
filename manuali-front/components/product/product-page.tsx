"use client"

import Link from "next/link"
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
import {
  buscarProduto,
  buscarProdutosRelacionados,
} from "@/services/productsService"
import type { Product, ProductDetails } from "@/types/product"
import { useCart } from "@/components/cart/cart-context"

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function ProductPage({ id }: { id: string }) {
  const { addItem } = useCart()
  const [product, setProduct] = useState<ProductDetails | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [selected, setSelected] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loadedProductId, setLoadedProductId] = useState<string | null>(null)
  const [loadedRelatedId, setLoadedRelatedId] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [relatedError, setRelatedError] = useState(false)

  useEffect(() => {
    let active = true

    buscarProduto(id)
      .then((data) => {
        if (active) {
          setProduct(data)
          setError(false)
          setSelected(0)
          setQuantity(1)
        }
      })
      .catch((requestError: unknown) => {
        console.error("Erro ao buscar produto:", requestError)
        if (active) {
          setProduct(null)
          setError(true)
        }
      })
      .finally(() => {
        if (active) setLoadedProductId(id)
      })

    buscarProdutosRelacionados(id)
      .then((data) => {
        if (active) {
          setRelated(data)
          setRelatedError(false)
          setLoadedRelatedId(id)
        }
      })
      .catch((requestError: unknown) => {
        console.error("Erro ao buscar produtos relacionados:", requestError)
        if (active) {
          setRelated([])
          setRelatedError(true)
          setLoadedRelatedId(id)
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const loading = loadedProductId !== id

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <p role="status">Carregando produto...</p>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-8">
        <p role="alert">
          Não foi possível carregar este produto. Verifique se ele existe e tente
          novamente.
        </p>
      </main>
    )
  }

  const selectedImage = product.images[selected]

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:space-y-10 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/acervo">{product.category}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-8">
        <div className="flex flex-col gap-3 md:flex-row-reverse">
          <div className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-muted">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                sizes="(min-width: 768px) 55vw, 100vw"
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Imagem indisponível
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 md:w-20 md:flex-col">
              {product.images.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  aria-current={selected === index}
                  className="aspect-square w-16 overflow-hidden rounded-md border bg-muted aria-[current=true]:ring-2 aria-[current=true]:ring-ring md:w-full"
                >
                  <Image
                    src={image}
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
            <p className="text-sm text-muted-foreground">{product.category}</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {product.name}
            </h1>
          </div>

          <p className="text-3xl font-semibold text-primary">
            {brl(product.price)}
          </p>

          <p className="text-sm text-muted-foreground">
            {product.stock > 0
              ? `Em estoque • ${product.stock} unidades disponíveis`
              : "Produto indisponível"}
          </p>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {product.stock > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Quantidade</p>
              <div className="inline-flex items-center gap-1 rounded-md border">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Diminuir quantidade"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((current) => current - 1)}
                >
                  <Minus />
                </Button>
                <span className="w-8 text-center text-sm tabular-nums">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Aumentar quantidade"
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <Button
              size="lg"
              className="w-full"
              disabled={product.stock === 0}
              onClick={() =>
                addItem(
                  {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    artisan: `Artesão #${product.artisanId}`,
                  },
                  quantity,
                )
              }
            >
              Adicionar ao carrinho
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              disabled={product.stock === 0}
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
              {product.story || "Não há uma história cadastrada para esta peça."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sobre o artesão</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium">Artesão #{product.artisanId}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              A API não disponibiliza informações públicas adicionais sobre
              este artesão.
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
        {loadedRelatedId !== id ? (
          <p role="status" className="text-sm text-muted-foreground">
            Carregando recomendações...
          </p>
        ) : relatedError ? (
          <p role="status" className="text-sm text-muted-foreground">
            Não foi possível carregar recomendações neste momento.
          </p>
        ) : related.length > 0 ? (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="w-44 shrink-0 snap-start md:w-auto"
              >
                <Card className="h-full gap-0 overflow-hidden py-0">
                  <div className="relative aspect-square bg-muted">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="(min-width: 768px) 25vw, 176px"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                        Imagem indisponível
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-1 p-3">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-3 pt-0">
                    <span className="text-sm font-semibold text-primary">
                      {brl(item.price)}
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma recomendação encontrada.
          </p>
        )}
      </section>
    </main>
  )
}
