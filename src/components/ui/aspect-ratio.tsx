import * as React from "react";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

// Tipagem baseada no Radix AspectRatio Root
type AspectRatioProps = React.ComponentProps<typeof AspectRatioPrimitive.Root>;

function AspectRatio({ ...props }: AspectRatioProps) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
