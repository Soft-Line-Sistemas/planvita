"use client";

import { ChevronLeft } from "lucide-react";

export function BackBar() {
  const handleBack = () => {
    if (typeof window === "undefined") return;

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/cliente";
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .privacidade-back-bar {
            display: flex !important;
          }
        }
      `}</style>
      <div
        className="privacidade-back-bar"
        style={{
          display: "none",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#fff",
          borderTop: "1px solid #e0e0e0",
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          zIndex: 100,
        }}
      >
        <button
          type="button"
          onClick={handleBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
            color: "#1e5a14",
            fontWeight: 600,
            padding: "8px 0",
          }}
        >
          <ChevronLeft size={20} />
          Voltar
        </button>
      </div>
    </>
  );
}
