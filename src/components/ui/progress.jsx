import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted)]",
            className
        )}
        {...props}
    >
        <div
            className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] transition-all duration-300 ease-out"
            style={{ width: `${value || 0}%` }}
        />
    </div>
))
Progress.displayName = "Progress"

export { Progress }
