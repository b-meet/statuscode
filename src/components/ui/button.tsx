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
    ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                className={cn(
                    "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-statuscode-400 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
                    {
                        "bg-gradient-to-r from-statuscode-500 to-accent-600 text-white shadow-lg shadow-statuscode-500/20 hover:shadow-statuscode-500/40 border-t border-white/20": variant === "primary",
                        "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700": variant === "secondary",
                        "border border-zinc-200 bg-transparent hover:bg-zinc-800 border-zinc-800 text-zinc-100": variant === "outline",
                        "hover:bg-zinc-100 hover:bg-zinc-800 text-zinc-100": variant === "ghost",
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
