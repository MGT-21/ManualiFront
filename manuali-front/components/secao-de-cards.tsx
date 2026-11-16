import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SecaoDeCardsProps {
  title: string;
  subtitle?: string; // Opcional, caso alguma seção não precise de subtítulo
  linkText?: string;
  linkHref?: string;
  children: React.ReactNode;
}

export function SecaoDeCards({
  title,
  subtitle,
  linkText,
  linkHref,
  children,
}: SecaoDeCardsProps) {
  return (
    <section className="space-y-6 pt-4">
      <div className="flex flex-col justify-between gap-2 border-b border-stone-200/60 pb-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-[#2C221E] sm:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-light text-[#6E6259] sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>

        {/* Só renderiza o link se ambos texto e URL forem passados */}
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#C85A32] hover:underline"
          >
            {linkText} <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      {/* Área onde os cards da API serão renderizados */}
      <div>{children}</div>
    </section>
  );
}