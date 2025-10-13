"use client";

import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type WithInset = { inset?: boolean };
type WithVariant = { variant?: "default" | "destructive" };

// Root
export const ContextMenu: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Root>
> = (props) => (
  <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
);

// Trigger
export const ContextMenuTrigger: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Trigger>
> = (props) => (
  <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
);

// Group
export const ContextMenuGroup: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Group>
> = (props) => (
  <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
);

// Portal
export const ContextMenuPortal: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Portal>
> = (props) => (
  <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
);

// Sub
export const ContextMenuSub: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Sub>
> = (props) => (
  <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />
);

// RadioGroup
export const ContextMenuRadioGroup: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>
> = (props) => (
  <ContextMenuPrimitive.RadioGroup
    data-slot="context-menu-radio-group"
    {...props}
  />
);

// SubTrigger
export const ContextMenuSubTrigger: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & WithInset
> = ({ className, inset, children, ...props }) => (
  <ContextMenuPrimitive.SubTrigger
    data-slot="context-menu-sub-trigger"
    data-inset={inset}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto" />
  </ContextMenuPrimitive.SubTrigger>
);

// SubContent
export const ContextMenuSubContent: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.SubContent>
> = ({ className, ...props }) => (
  <ContextMenuPrimitive.SubContent
    data-slot="context-menu-sub-content"
    className={cn(
      "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
      className,
    )}
    {...props}
  />
);

// Content
export const ContextMenuContent: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Content>
> = ({ className, ...props }) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      data-slot="context-menu-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
);

// Item
export const ContextMenuItem: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Item> &
    WithInset &
    WithVariant
> = ({ className, inset, variant = "default", ...props }) => (
  <ContextMenuPrimitive.Item
    data-slot="context-menu-item"
    data-inset={inset}
    data-variant={variant}
    className={cn(
      "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  />
);

// CheckboxItem
export const ContextMenuCheckboxItem: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem> & {
    checked?: boolean;
  }
> = ({ className, children, checked, ...props }) => (
  <ContextMenuPrimitive.CheckboxItem
    data-slot="context-menu-checkbox-item"
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
);

// RadioItem
export const ContextMenuRadioItem: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>
> = ({ className, children, ...props }) => (
  <ContextMenuPrimitive.RadioItem
    data-slot="context-menu-radio-item"
    className={cn(
      "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
      className,
    )}
    {...props}
  >
    <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <CircleIcon className="size-2 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
);

// Label
export const ContextMenuLabel: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Label> & WithInset
> = ({ className, inset, ...props }) => (
  <ContextMenuPrimitive.Label
    data-slot="context-menu-label"
    data-inset={inset}
    className={cn(
      "text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
      className,
    )}
    {...props}
  />
);

// Separator
export const ContextMenuSeparator: React.FC<
  React.ComponentProps<typeof ContextMenuPrimitive.Separator>
> = ({ className, ...props }) => (
  <ContextMenuPrimitive.Separator
    data-slot="context-menu-separator"
    className={cn("bg-border -mx-1 my-1 h-px", className)}
    {...props}
  />
);

// Shortcut
export const ContextMenuShortcut: React.FC<
  React.HTMLAttributes<HTMLSpanElement>
> = ({ className, ...props }) => (
  <span
    data-slot="context-menu-shortcut"
    className={cn(
      "text-muted-foreground ml-auto text-xs tracking-widest",
      className,
    )}
    {...props}
  />
);
