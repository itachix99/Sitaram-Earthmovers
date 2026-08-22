import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[var(--sitaram-yellow)] text-[var(--charcoal)] hover:bg-[var(--sitaram-amber)] shadow-sm",
        charcoal: "bg-[var(--charcoal)] text-white hover:bg-[#232628] dark:hover:bg-white/10 shadow-sm",
        outline: "border border-border bg-card hover:bg-muted text-foreground dark:bg-card dark:hover:bg-muted",
        ghost: "hover:bg-muted text-foreground",
        danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
        subtle: "bg-muted text-foreground hover:bg-border",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-8 text-base rounded-xl",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, children, ...props }, ref) => {
  const classes = cn(buttonVariants({ variant, size, className }));
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: cn(classes, (child.props as { className?: string }).className),
    } as never);
  }
  return (
    <button className={classes} ref={ref} {...props}>
      {children}
    </button>
  );
});
Button.displayName = "Button";

export { Button, buttonVariants };
