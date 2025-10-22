"use client";
import { ChevronRight, Check } from "lucide-react";

interface Step {
  id: number;
  title: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export const StepIndicator = ({ steps, currentStep }: StepIndicatorProps) => (
  <div className="flex items-center justify-center mb-8 px-4">
    <div className="flex items-center space-x-2 md:space-x-4">
      {steps.map((step, index) => {
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;

        return (
          <div key={step.id} className="flex items-center">
            <div
              className={`
                flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-300
                ${
                  isActive
                    ? "bg-green-600 border-green-600 text-white shadow-lg scale-110"
                    : isCompleted
                      ? "bg-green-100 border-green-600 text-green-600"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                }
              `}
            >
              {isCompleted ? (
                <Check className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <span className="font-bold text-sm md:text-base">
                  {step.id}
                </span>
              )}
            </div>

            <div className="ml-2 hidden md:block">
              <p
                className={`text-sm font-medium ${isActive ? "text-green-600" : "text-gray-500"}`}
              >
                {step.title}
              </p>
            </div>

            {index < steps.length - 1 && (
              <ChevronRight className="w-4 h-4 mx-2 md:mx-4 text-gray-400" />
            )}
          </div>
        );
      })}
    </div>
  </div>
);
