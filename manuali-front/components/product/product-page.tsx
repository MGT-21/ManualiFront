"use client"

import { useState } from "react"
import { Minus, Plus, ShoppingCart } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

type Product = {
  id: string
  name: string
  seller: string
  price: number
  image: string
}

type Artisan = {
  name: string
  location: string
  bio: string
  avatar?: string
}

const product = {
  name: "Vaso de cerâmica azul",
  category: "Cerâmicas",
  price: 189.9,
  stock: 12,
  description:
    "Vaso de cerâmica artesanal, produzido no sertão nordestino com técnicas tradicionais de queima e pintura manual. Cada peça é única, com pequenas variações que tornam o vaso especial.",
  story:
    "Esta peça foi criada por Dona Maria, artesã de Caruaru, que há mais de 20 anos transforma o barro em arte. O vaso é feito com argila local, utilizando técnicas tradicionais passadas de geração em geração.",
  images: ["/vaso-1.jpg", "/vaso-2.jpg", "/vaso-3.jpg", "/vaso-4.jpg"],
}

const artisan: Artisan = {
  name: "Maria do Carmo",
  location: "Caruaru - PE",
  bio: "Artesã há 22 anos, especializada em cerâmica utilitária e decorativa.",
  avatar: "/maria.jpg",
}

const related: Product[] = [
  { id: "1", name: "Vaso de Barro Espiralado", seller: "Ateliê Barro Forte", price: 145, image: "/rel-1.jpg" },
  { id: "2", name: "Bolsa de Ouricuri Tecida", seller: "Artesãs de Petrolina", price: 120, image: "/rel-2.jpg" },
  { id: "3", name: "Luminária Rendada em Metal", seller: "Artesanato Alquimia", price: 290, image: "/rel-3.jpg" },
  { id: "4", name: "Caminho de Mesa Renascença", seller: "Dona Maria da Renda (Poção)", price: 420, image: "/rel-4.jpg" },
]

const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export default function ProductPage() {
  const [selected, setSelected] = useState(0)
  const [quantity, setQuantity] = useState(1)

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 md:space-y-10 md:px-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/ceramicas">{product.category}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Produto */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-8">
        {/* Galeria: imagem no topo no mobile; miniaturas à esquerda no desktop */}
        <div className="flex flex-col gap-3 md:flex-row-reverse">
          <div className="aspect-square flex-1 overflow-hidden rounded-lg bg-muted">
            <img
              src={product.images[selected]}
              alt={product.name}
              className="size-full object-cover"
            />
          </div>

          <div className="flex gap-2 md:w-20 md:flex-col">
            {product.images.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={selected === i}
                className="aspect-square w-16 overflow-hidden rounded-md border bg-muted aria-[current=true]:ring-2 aria-[current=true]:ring-ring md:w-full"
              >
                <img src={src} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Informações */}
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
            Em estoque • {product.stock} unidades disponíveis
          </p>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">Quantidade</p>
            <div className="inline-flex items-center gap-1 rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Diminuir quantidade"
                disabled={quantity <= 1}
                onClick={() => setQuantity((q) => q - 1)}
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
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus />
              </Button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <Button size="lg" className="w-full">
              Adicionar ao carrinho
            </Button>
            <Button size="lg" variant="outline" className="w-full">
              Comprar agora
            </Button>
          </div>
        </div>
      </section>

      {/* História + Artesão */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>A história da peça</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {product.story}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sobre o artesão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarImage src={artisan.avatar} alt={artisan.name} />
                <AvatarFallback>{artisan.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{artisan.name}</p>
                <p className="text-xs text-muted-foreground">
                  {artisan.location}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {artisan.bio}
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="link" className="h-auto p-0">
              <a href="/artesaos/maria-do-carmo">Ver mais produtos</a>
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Relacionados: carrossel com scroll no mobile, grade no desktop */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Você também pode gostar</h2>

        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          {related.map((item) => (
            <Card
              key={item.id}
              className="w-44 shrink-0 snap-start gap-0 overflow-hidden py-0 md:w-auto"
            >
              <div className="aspect-square bg-muted">
                <img
                  src={item.image}
                  alt={item.name}
                  className="size-full object-cover"
                />
              </div>
              <CardContent className="space-y-1 p-3">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.seller}
                </p>
              </CardContent>
              <CardFooter className="justify-between p-3 pt-0">
                <span className="text-sm font-semibold text-primary">
                  {brl(item.price)}
                </span>
                <Button size="sm" variant="secondary">
                  <ShoppingCart />
                  <span className="hidden md:inline">Comprar</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}