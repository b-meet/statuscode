import * as React from "react"
// Removed unused import
// Actually, I didn't install radix-ui/react-slot. I'll just use standard props.

import { cn } from "@/lib/utils"

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glaze-400 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-gradient-to-r from-glaze-500 to-accent-600 text-white hover:shadow-lg hover:shadow-glaze-500/25 border-t border-white/20": variant === "primary",
                        "bg-zinc-800 text-zinc-100 hover:bg-zinc-700": variant === "secondary",
                        "border border-zinc-200 bg-transparent hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800": variant === "outline",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100": variant === "ghost",
                        "h-8 px-4 text-xs": size === "sm",
                        "h-10 px-6 text-sm": size === "md",
                        "h-12 px-8 text-base": size === "lg",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
