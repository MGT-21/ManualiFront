import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCart } from "@/components/cart/cart-context";

export function CartMenu() {
  const { items, updateQuantity } = useCart();

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Botão do ícone do carrinho com contador (reutilizado no mobile e desktop)
  const CartTriggerButton = (
    <Button variant="ghost" size="icon" className="relative" aria-label="Abrir carrinho">
      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
      {totalItems > 0 && (
        <Badge
          variant="default"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
        >
          {totalItems}
        </Badge>
      )}
    </Button>
  );

  // Conteúdo interno compartilhado entre Sheet e Popover
  const CartBody = (
    <div className="flex flex-col">
      {items.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Seu carrinho está vazio.
        </div>
      ) : (
        <>
          <div className="max-h-[50vh] lg:max-h-72 space-y-4 overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.artisan}</p>
                  <p className="mt-1 text-sm font-semibold">
                    {item.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>

                {/* Controles de quantidade */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    {item.quantity === 1 ? (
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Minus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Resumo e botão de ação */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span>Subtotal</span>
              <span>
                {totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
            <Button className="w-full mb-2" size="lg">
              Finalizar pedido
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* 1. MOBILE & TABLET (< 1024px): Abre um Sheet na parte inferior */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger>{CartTriggerButton}</SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader className="mb-4 text-left">
              <SheetTitle>Seu Carrinho ({totalItems})</SheetTitle>
            </SheetHeader>
            <div className="px-4">
                {CartBody}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 2. DESKTOP (>= 1024px): Abre um Popover estilo Dropdown */}
      <div className="hidden lg:block">
        <Popover>
          <PopoverTrigger>{CartTriggerButton}</PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-4">
            <div className="mb-3 font-semibold">Seu Carrinho ({totalItems})</div>
            {CartBody}
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}