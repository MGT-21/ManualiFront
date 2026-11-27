"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "@/lib/utils"

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  )
}

function RadioGroupItem({ className, ...props }: Radio.Root.Props) {
  return (
    <Radio.Root
      data-slot="radio-group-item"
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-transparent shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[checked]:border-primary data-[checked]:bg-primary dark:bg-input/30",
        className
      )}
      {...props}
    >
      <Radio.Indicator className="size-1.5 rounded-full bg-primary-foreground" />
    </Radio.Root>
  )
}

export { RadioGroup, RadioGroupItem }
