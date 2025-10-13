import { clsx, ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes usando clsx e tailwind-merge
 * @param inputs Classes ou condições de classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
