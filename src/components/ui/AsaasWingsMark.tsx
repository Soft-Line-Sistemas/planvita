"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

type Props = {
  className?: string;
  withTooltip?: boolean;
  tooltipText?: string;
  variant?: "default" | "badge" | "inline";
};

export const AsaasWingsMark: React.FC<Props> = ({
  className,
  withTooltip = true,
  tooltipText = "Integrado com Asaas",
  variant = "inline",
}) => {
  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className ?? "w-4 h-4 text-sky-500"}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 12c2-1 4-3 5.5-5.2C9.4 5.7 10.5 5 11.7 5c1.5 0 2.8.9 3.3 2.3.3.9.1 1.9-.4 2.7-.9 1.3-2.6 2.2-4.3 2.8-1.1.4-2.2.7-3.3.9-.5.1-1-.3-1-.8V12z" />
      <path d="M21 12c-2-1-4-3-5.5-5.2C14.6 5.7 13.5 5 12.3 5c-1.5 0-2.8.9-3.3 2.3-.3.9-.1 1.9.4 2.7.9 1.3 2.6 2.2 4.3 2.8 1.1.4 2.2.7 3.3.9.5.1 1-.3 1-.8V12z" />
    </svg>
  );
  const wrapperClass =
    variant === "badge"
      ? "inline-flex items-center justify-center p-1 rounded-md bg-sky-50"
      : variant === "default"
        ? "inline-flex items-center justify-center p-0.5 rounded bg-sky-100"
        : "inline-flex items-center";

  const content = <span className={wrapperClass}>{icon}</span>;

  if (!withTooltip) return content;

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AsaasWingsMark;
