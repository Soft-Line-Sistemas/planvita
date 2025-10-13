"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/utils";
import { toggleVariants, type ToggleProps } from "@/components/ui/toggle";

interface ToggleGroupContextProps {
  size: ToggleProps["size"];
  variant: ToggleProps["variant"];
}
const ToggleGroupContext = React.createContext<ToggleGroupContextProps>({
  size: "default",
  variant: "default",
});

type ToggleGroupProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> & {
  size?: ToggleProps["size"];
  variant?: ToggleProps["variant"];
};

export function ToggleGroup({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

type ToggleGroupItemProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Item
> & {
  size?: ToggleProps["size"];
  variant?: ToggleProps["variant"];
};

export function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: ToggleGroupItemProps) {
  const context = React.useContext(ToggleGroupContext);

  const appliedVariant = variant || context.variant;
  const appliedSize = size || context.size;

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={appliedVariant}
      data-size={appliedSize}
      className={cn(
        toggleVariants({ variant: appliedVariant, size: appliedSize }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
