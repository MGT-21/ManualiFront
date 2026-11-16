import { Button } from "@/components/ui/button"
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"



import { ShoppingCartPlus } from "lucide-react"

interface ProductCardsProps {
    id: number;
    nome: string;
    artesao: string;
    preco: string;
    imagem: string;
}

export function ProductCard({
    id,
    nome,
    artesao,
    preco,
    imagem,
}: ProductCardsProps) {
    return (
        <Card className="relative mx-auto w-full max-w-sm pt-0 overflow-hidden">
            <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
            <img
                src={imagem}
                alt={nome}
                className="relative z-20 aspect-video w-full object-cover"
            />

            <CardHeader className="flex-grow">
                <CardTitle>{nome}</CardTitle>
                <CardDescription>Feito por {artesao}</CardDescription>
            </CardHeader>
            <CardFooter className=" justify-between ">
                <CardTitle>{preco}</CardTitle>
                <Button><ShoppingCartPlus /><span className="hidden sm:block">Comprar</span></Button>
            </CardFooter>

        </Card>
    );
}
