import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="relative h-10 w-10">
      <div
        className={cn(
          "absolute right-0 top-0 z-50 flex h-10 items-center overflow-hidden rounded-md border bg-background transition-all duration-300 ease-in-out",
          isOpen
            ? "w-[75vw] max-w-4xl border-input shadow-lg ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            : "w-10 border-transparent bg-transparent shadow-none"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="h-10 w-10 shrink-0 hover:bg-transparent"
          aria-label="Abrir busca"
        >
          <Search className="h-4 w-4 text-muted-foreground" />
        </Button>

        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar no acervo..."
          className={cn(
            "border-0 bg-transparent px-1 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-opacity duration-200",
            isOpen ? "w-full opacity-100" : "w-0 p-0 opacity-0 pointer-events-none"
          )}
          onBlur={() => {
            if (!query) setIsOpen(false);
          }}
        />

        {isOpen && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="mr-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Fechar busca"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}