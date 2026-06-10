import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white placeholder:text-white/30 transition-all outline-none",
        "focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:bg-white/8",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }