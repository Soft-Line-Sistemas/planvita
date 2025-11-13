// app/relatorios/page.tsx
"use client";

import { RelatoriosComponent } from "@/components/RelatoriosComponent";
import { usePagamentos } from "@/hooks/queries/usePagamentos";

export default function RelatoriosPage() {
  const { data, isLoading, isError, error, refetch } = usePagamentos();

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Não foi possível carregar os relatórios
          </h2>
          {error instanceof Error && (
            <p className="text-gray-500">{error.message}</p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <RelatoriosComponent pagamentos={data ?? []} isLoading={isLoading} />
    </div>
  );
}
