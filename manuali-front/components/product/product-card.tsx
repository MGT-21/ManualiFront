import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import Link from "next/link"

import { ProductCardData } from "@/types/product"

import { ShoppingCartPlus } from "lucide-react"
import Image from "next/image"
import { useCart } from "@/components/cart/cart-context"

export function ProductCard({
    id,
    nome,
    descricao,
    preco,
    fotos,
}: ProductCardData) {
    const { addItem } = useCart()

    return (
        <Link href={`/product/${id}`}>
            <Card className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden">
                <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
                <Image
                    src={fotos?.[0] || "https://images.unsplash.com/photo-1718361482637-754b67950018?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D"}
                    alt={nome}
                    width={600}
                    height={600}
                    className="relative z-20 aspect-video w-full object-cover"
                />

                <CardHeader className="flex-grow">
                    <CardTitle>{nome}</CardTitle>
                    <CardDescription className="truncate">{descricao}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between ">
                    <CardTitle>
                        {preco.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </CardTitle>
                    <Button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            addItem({ id, nome, preco })
                        }}
                    >
                        <ShoppingCartPlus className="size-4" />
                        <span className="hidden lg:block">Comprar</span>
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    );
}
