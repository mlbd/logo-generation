import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white hover:opacity-90 shadow-lg hover:shadow-[var(--color-primary)]/25",
                secondary:
                    "bg-[var(--color-secondary)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
                ghost:
                    "hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                destructive:
                    "bg-[var(--color-destructive)] text-white hover:bg-[var(--color-destructive)]/90",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-lg px-8 text-base",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
    return (
        <button
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button, buttonVariants }
