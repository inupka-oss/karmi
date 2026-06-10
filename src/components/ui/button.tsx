import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-pink-700 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98]",
        destructive: "bg-red-600 text-white shadow-xs hover:bg-red-700",
        outline: "border border-white/10 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/20",
        secondary: "bg-white/10 text-white backdrop-blur-sm hover:bg-white/15 border border-white/5",
        ghost: "hover:bg-white/10 text-white/70 hover:text-white",
        link: "text-purple-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 py-2 rounded-full",
        sm: "h-8 rounded-full gap-1.5 px-3 text-xs",
        lg: "h-12 rounded-full px-8 text-base",
        icon: "size-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className, variant, size, asChild = false, ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }