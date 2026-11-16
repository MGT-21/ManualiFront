import { Amphora, LucideAmphora } from "lucide-react";

function Logo() {
  return (
    <div
      aria-label="Manuali Pernambuco – página inicial"
      className="flex h-11 min-w-0 flex-1 items-center gap-2 md:flex-none md:gap-2.5 lg:gap-3"
    >
      <span className="flex size-[34px] flex-none text-white items-center justify-center rounded-full bg-[#BD4B26] md:size-[38px] lg:size-10">
        <Amphora className=" size-6"/>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-fraunces)] text-[19px] font-bold tracking-[-0.01em] text-[#2A1A12] md:text-xl lg:text-[22px]">
          Manuali
        </span>
        <span className="mt-[3px] text-[9px] font-bold tracking-[0.08em] text-[#5A4A41] lg:text-[10px]">
          PERNAMBUCO
        </span>
      </span>
    </div>
  );
}

export { Logo }