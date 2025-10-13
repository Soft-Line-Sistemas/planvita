"use client";

import * as React from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

type CollapsibleProps = CollapsiblePrimitive.CollapsibleProps;
type CollapsibleTriggerProps = CollapsiblePrimitive.CollapsibleTriggerProps;
type CollapsibleContentProps = CollapsiblePrimitive.CollapsibleContentProps;

const Collapsible: React.FC<CollapsibleProps> = (props) => {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
};

const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = (props) => {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
};

const CollapsibleContent: React.FC<CollapsibleContentProps> = (props) => {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
