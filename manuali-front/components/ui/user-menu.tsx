import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  UserIcon,
  Box,
  Star,
  LogOutIcon,
} from "lucide-react";

interface UserMenuProps {
  isLoggedIn?: boolean; // Você também pode passar o objeto 'user?: User | null'
}

export function UserMenu({ isLoggedIn = false }: UserMenuProps) {
  // 1. Se não estiver logado, retorna apenas o botão de Entrar
  if (!isLoggedIn) {
    return (
      <Button render={<Link href="/login" />}>
        Entrar
      </Button>
    );
  }

  // 2. Se estiver logado, renderiza o seu DropdownMenu normalmente
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar>
              <AvatarImage src="" alt="minha foto" />
              <AvatarFallback>M</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem>
          <UserIcon />
          Minha conta
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Box />
          Meus pedidos
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Star />
          Minhas avaliações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
