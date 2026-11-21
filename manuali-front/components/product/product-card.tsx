import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { Link } from "next/link"

import { Product } from "@/types/product"

import { ShoppingCartPlus } from "lucide-react"

export function ProductCard({
    id,
    name,
    description,
    price,
    image,
}: Product) {
    return (
        <Link href={`/product/${id}`}>
            <Card className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden">
                <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
                <img
                    src={image}
                    alt={name}
                    className="relative z-20 aspect-video w-full object-cover"
                />

                <CardHeader className="flex-grow">
                    <CardTitle>{name}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardFooter className=" justify-between ">
                    <CardTitle>{price}</CardTitle>
                    <Button><ShoppingCartPlus /><span className="hidden sm:block">Comprar</span></Button>
                </CardFooter>
            </Card>
        </Link>
    );
}
