"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ProductCard } from "@/components/product/product-card"
import {
  CatalogFilters,
  type CatalogFiltersState,
} from "@/components/catalog/catalog-filters"
import { useDebounce } from "@/hooks/use-debounce"
import { searchProducts } from "@/services/productsService"
import type { ProductApiData } from "@/types/product"

// Quantidade de produtos por página (3 colunas x 2 linhas, como no layout).
export const PRODUCTS_PER_PAGE = 6

const INITIAL_FILTERS: CatalogFiltersState = {
  categorias: [],
  emEstoque: true,
  esgotado: true,
  ordenar: "mais-vendido",
}

type SearchResult = { key: string; produtos: ProductApiData[] | null }

// Busca no servidor (nome + categoria + ativo). Com várias categorias marcadas,
// faz uma requisição por categoria e junta os resultados sem duplicar.
async function fetchProducts(nome: string, categorias: string[]) {
  const buscas =
    categorias.length > 0
      ? categorias.map((categoria) =>
          searchProducts({ nome, categoria, ativo: true }),
        )
      : [searchProducts({ nome, ativo: true })]

  const lotes = await Promise.all(buscas)
  const porId = new Map<string, ProductApiData>()
  for (const produto of lotes.flat()) porId.set(produto.id, produto)
  return [...porId.values()]
}

// 1 2 3 … 67 68
function getPageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const items: (number | "ellipsis")[] = []
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) items.push("ellipsis")
    items.push(page)
  })
  return items
}

export function CatalogPage() {
  const [nome, setNome] = useState("")
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [pagina, setPagina] = useState(1)
  const [result, setResult] = useState<SearchResult | null>(null)

  const debouncedNome = useDebounce(nome)
  const categoriasKey = [...filters.categorias].sort().join("|")
  const queryKey = `${debouncedNome.trim()}::${categoriasKey}`

  // Qualquer mudança de filtro volta para a página 1.
  function updateFilters(patch: Partial<CatalogFiltersState>) {
    setFilters((current) => ({ ...current, ...patch }))
    setPagina(1)
  }

  useEffect(() => {
    let active = true
    const [nomeBusca, categorias] = queryKey.split("::")

    fetchProducts(nomeBusca, categorias ? categorias.split("|") : [])
      .then((produtos) => active && setResult({ key: queryKey, produtos }))
      .catch((error: unknown) => {
        if (!active) return
        console.error("Erro ao buscar produtos:", error)
        setResult({ key: queryKey, produtos: null })
      })

    // Ignora respostas antigas quando os filtros mudam durante a requisição
    return () => {
      active = false
    }
  }, [queryKey])

  const carregando = result?.key !== queryKey
  const erro = !carregando && result?.produtos === null

  // Filtros que a rota de busca não oferece são aplicados aqui no cliente.
  const filtrados = useMemo(() => {
    const lista = (result?.produtos ?? []).filter((p) => {
      const emEstoque = p.estoque > 0
      if (emEstoque && !filters.emEstoque) return false
      if (!emEstoque && !filters.esgotado) return false
      if (filters.precoMin !== undefined && p.preco < filters.precoMin) return false
      if (filters.precoMax !== undefined && p.preco > filters.precoMax) return false
      return true
    })

    if (filters.ordenar === "menor-preco") lista.sort((a, b) => a.preco - b.preco)
    if (filters.ordenar === "maior-preco") lista.sort((a, b) => b.preco - a.preco)
    // "mais-vendido": mantém a ordem devolvida pela API (ela ainda não informa vendas)

    return lista
  }, [result, filters])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PRODUCTS_PER_PAGE))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice(
    (paginaAtual - 1) * PRODUCTS_PER_PAGE,
    paginaAtual * PRODUCTS_PER_PAGE,
  )

  function irParaPagina(destino: number) {
    setPagina(destino)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">
          Todos os produtos
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Descubra peças únicas feitas à mão por artesãos pernambucanos
        </p>
      </header>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar cerâmicas, rendas, ateliês..."
            aria-label="Buscar produtos"
            className="h-10 bg-muted pl-9"
          />
        </div>

        {/* Filtros em gaveta no mobile */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="lg" className="lg:hidden" />
            }
          >
            <SlidersHorizontal />
            Filtros
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-6">
              <CatalogFilters filters={filters} onChange={updateFilters} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <CatalogFilters filters={filters} onChange={updateFilters} />
        </aside>

        <section className="space-y-6" aria-live="polite">
          {carregando ? (
            <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
              {Array.from({ length: PRODUCTS_PER_PAGE }, (_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-video w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : erro ? (
            <p role="alert" className="py-12 text-center text-sm text-muted-foreground">
              Não foi possível carregar os produtos. Tente novamente mais tarde.
            </p>
          ) : visiveis.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum produto encontrado para esses filtros.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {filtrados.length === 1
                  ? "1 produto encontrado"
                  : `${filtrados.length} produtos encontrados`}
              </p>
              <div className="grid grid-cols-2 gap-5 xl:grid-cols-3">
                {visiveis.map((produto) => (
                  <ProductCard
                    key={produto.id}
                    id={produto.id}
                    nome={produto.nome}
                    descricao={produto.descricao}
                    preco={produto.preco}
                    fotos={produto.fotos}
                  />
                ))}
              </div>
            </>
          )}

          {!carregando && !erro && totalPaginas > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (paginaAtual > 1) irParaPagina(paginaAtual - 1)
                    }}
                  />
                </PaginationItem>

                {getPageItems(paginaAtual, totalPaginas).map((item, i) => (
                  <PaginationItem key={`${item}-${i}`}>
                    {item === "ellipsis" ? (
                      <PaginationEllipsis />
                    ) : (
                      <PaginationLink
                        isActive={item === paginaAtual}
                        onClick={() => irParaPagina(item)}
                      >
                        {item}
                      </PaginationLink>
                    )}
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (paginaAtual < totalPaginas) irParaPagina(paginaAtual + 1)
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </section>
      </div>
    </main>
  )
}