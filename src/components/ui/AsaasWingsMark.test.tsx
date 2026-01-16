import React from "react";
import { render, screen } from "@testing-library/react";
import { AsaasWingsMark } from "./AsaasWingsMark";
import "@testing-library/jest-dom";
// Mock Tooltip components to avoid needing full Radix UI setup in test
jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Tooltip: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-trigger">{children}</div>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
}));

describe("AsaasWingsMark Component", () => {
  it("renders default icon correctly", () => {
    render(<AsaasWingsMark />);
    const icon = screen.getByRole("img", { name: /Asaas Integration Icon/i });
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass("w-4 h-4 text-sky-500");
  });

  it("renders with badge variant", () => {
    render(<AsaasWingsMark variant="badge" />);
    const icon = screen.getByRole("img", { name: /Asaas Integration Icon/i });
    expect(icon.parentElement).toHaveClass(
      "inline-flex items-center justify-center p-1 rounded-md bg-sky-50",
    );
  });

  it("renders with custom tooltip text", () => {
    const customText = "Custom Tooltip";
    render(<AsaasWingsMark tooltipText={customText} />);
    // Since we mocked TooltipContent, it should be in the document
    expect(screen.getByText(customText)).toBeInTheDocument();
  });

  it("renders without tooltip when withTooltip is false", () => {
    render(<AsaasWingsMark withTooltip={false} />);
    expect(screen.queryByTestId("tooltip-content")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<AsaasWingsMark className="custom-class" />);
    const icon = screen.getByRole("img", { name: /Asaas Integration Icon/i });
    expect(icon).toHaveClass("custom-class");
  });
});
