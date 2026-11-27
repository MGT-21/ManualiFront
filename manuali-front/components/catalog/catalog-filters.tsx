"use client"

import { useState } from "react"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { ProductSort } from "@/types/product"

export const CATEGORIAS = ["Cerâmica", "Têxtil", "Madeira", "Metal", "Outros"]

export interface CatalogFiltersState {
  categorias: string[]
  precoMin?: number
  precoMax?: number
  emEstoque: boolean
  esgotado: boolean
  ordenar: ProductSort
}

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "mais-vendido", label: "Mais vendido" },
  { value: "menor-preco", label: "Menor preço" },
  { value: "maior-preco", label: "Maior preço" },
]

function parsePreco(value: string): number | undefined {
  const n = Number(value.replace(",", "."))
  return value.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : undefined
}

interface CatalogFiltersProps {
  filters: CatalogFiltersState
  onChange: (patch: Partial<CatalogFiltersState>) => void
}

export function CatalogFilters({ filters, onChange }: CatalogFiltersProps) {
  // Min/Max só são aplicados ao clicar na lupa (ou Enter), como no layout.
  const [min, setMin] = useState(filters.precoMin?.toString() ?? "")
  const [max, setMax] = useState(filters.precoMax?.toString() ?? "")

  function toggleCategoria(categoria: string, checked: boolean) {
    onChange({
      categorias: checked
        ? [...filters.categorias, categoria]
        : filters.categorias.filter((c) => c !== categoria),
    })
  }

  return (
    <div className="space-y-4">
      <Card size="sm">
        <CardContent className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="font-heading text-base font-bold">
              Categorias
            </legend>
            {CATEGORIAS.map((categoria) => (
              <Label key={categoria} className="cursor-pointer font-normal">
                <Checkbox
                  checked={filters.categorias.includes(categoria)}
                  onCheckedChange={(checked) =>
                    toggleCategoria(categoria, checked)
                  }
                />
                {categoria}
              </Label>
            ))}
          </fieldset>

          <Separator />

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              onChange({ precoMin: parsePreco(min), precoMax: parsePreco(max) })
            }}
          >
            <p className="font-heading text-base font-bold">Preço</p>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Min"
                aria-label="Preço mínimo"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                className="h-8 min-w-0 px-2 text-xs"
              />
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder="Max"
                aria-label="Preço máximo"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                className="h-8 min-w-0 px-2 text-xs"
              />
              <Button
                type="submit"
                size="icon-sm"
                aria-label="Aplicar faixa de preço"
                className="shrink-0"
              >
                <Search />
              </Button>
            </div>
          </form>

          <Separator />

          <fieldset className="space-y-3">
            <legend className="font-heading text-base font-bold">
              Disponibilidade
            </legend>
            <Label className="cursor-pointer font-normal">
              <Checkbox
                checked={filters.emEstoque}
                onCheckedChange={(checked) => onChange({ emEstoque: checked })}
              />
              Em estoque
            </Label>
            <Label className="cursor-pointer font-normal">
              <Checkbox
                checked={filters.esgotado}
                onCheckedChange={(checked) => onChange({ esgotado: checked })}
              />
              Esgotado
            </Label>
          </fieldset>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold">
            Ordenar por
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {SORT_OPTIONS.map(({ value, label }) => {
            const active = filters.ordenar === value
            return (
              <Button
                key={value}
                type="button"
                size="lg"
                variant={active ? "default" : "outline"}
                aria-pressed={active}
                onClick={() => onChange({ ordenar: value })}
              >
                {label}
              </Button>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}