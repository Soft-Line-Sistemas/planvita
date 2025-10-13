"use client";
import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PrimitiveProps<T extends React.ElementType> = React.ComponentProps<T> & {
  className?: string;
};

export const Menubar: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Root>
> = ({ className, ...props }) => {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        "bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs",
        className,
      )}
      {...props}
    />
  );
};

export const MenubarMenu: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Menu>
> = (props) => <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;

export const MenubarGroup: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Group>
> = (props) => <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;

export const MenubarPortal: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Portal>
> = (props) => (
  <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />
);

export const MenubarRadioGroup: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.RadioGroup>
> = (props) => (
  <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
);

export const MenubarTrigger: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Trigger>
> = ({ className, ...props }) => (
  <MenubarPrimitive.Trigger
    data-slot="menubar-trigger"
    className={cn(
      "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
      className,
    )}
    {...props}
  />
);

export const MenubarContent: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Content> & {
    align?: "start" | "center" | "end";
    alignOffset?: number;
    sideOffset?: number;
  }
> = ({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}) => (
  <MenubarPortal>
    <MenubarPrimitive.Content
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-md",
        className,
      )}
      {...props}
    />
  </MenubarPortal>
);

export const MenubarItem: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
    variant?: "default" | "destructive";
  }
> = ({ className, inset, variant = "default", ...props }) => (
  <MenubarPrimitive.Item
    data-slot="menubar-item"
    data-inset={inset}
    data-variant={variant}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  />
);

export const MenubarCheckboxItem: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.CheckboxItem> & { checked?: boolean }
> = ({ className, children, checked, ...props }) => (
  <MenubarPrimitive.CheckboxItem
    data-slot="menubar-checkbox-item"
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
);

export const MenubarRadioItem: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.RadioItem>
> = ({ className, children, ...props }) => (
  <MenubarPrimitive.RadioItem
    data-slot="menubar-radio-item"
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <CircleIcon className="size-2 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
);

export const MenubarLabel: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Label> & { inset?: boolean }
> = ({ className, inset, ...props }) => (
  <MenubarPrimitive.Label
    data-slot="menubar-label"
    data-inset={inset}
    className={cn(
      "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
      className,
    )}
    {...props}
  />
);

export const MenubarSeparator: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Separator>
> = ({ className, ...props }) => (
  <MenubarPrimitive.Separator
    data-slot="menubar-separator"
    className={cn("bg-border -mx-1 my-1 h-px", className)}
    {...props}
  />
);

export const MenubarShortcut: React.FC<
  React.HTMLAttributes<HTMLSpanElement>
> = ({ className, ...props }) => (
  <span
    data-slot="menubar-shortcut"
    className={cn(
      "text-muted-foreground ml-auto text-xs tracking-widest",
      className,
    )}
    {...props}
  />
);

export const MenubarSub: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.Sub>
> = (props) => <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;

export const MenubarSubTrigger: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.SubTrigger> & { inset?: boolean }
> = ({ className, inset, children, ...props }) => (
  <MenubarPrimitive.SubTrigger
    data-slot="menubar-sub-trigger"
    data-inset={inset}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
);

export const MenubarSubContent: React.FC<
  PrimitiveProps<typeof MenubarPrimitive.SubContent>
> = ({ className, ...props }) => (
  <MenubarPrimitive.SubContent
    data-slot="menubar-sub-content"
    className={cn(
      "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
      className,
    )}
    {...props}
  />
);
