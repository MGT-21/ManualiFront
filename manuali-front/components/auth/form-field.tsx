import * as React from "react"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  label: string
  htmlFor: string
  error?: string
  action?: React.ReactNode
  children: React.ReactNode
}

export function FormField({ label, htmlFor, error, action, children }: FormFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor}>{label}</Label>
        {action}
      </div>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
