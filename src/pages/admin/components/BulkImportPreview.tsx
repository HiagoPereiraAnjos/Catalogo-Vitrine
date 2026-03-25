import { AlertTriangle, CheckCircle2, FileSearch, PackageCheck, XCircle } from 'lucide-react';
import { BulkImportPreviewData } from '../utils/bulkImport';

interface BulkImportPreviewProps {
  preview: BulkImportPreviewData | null;
}

const SummaryCard = ({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'default' | 'success' | 'danger';
}) => {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : tone === 'danger'
        ? 'border-red-200 bg-red-50 text-red-700'
        : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <article className={`premium-chip rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </article>
  );
};

export const BulkImportPreview = ({ preview }: BulkImportPreviewProps) => {
  if (!preview) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <FileSearch className="mx-auto h-6 w-6 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-700">Nenhum arquivo carregado</p>
        <p className="mt-1 text-xs text-gray-500">Selecione um arquivo JSON ou CSV para visualizar os itens antes de importar.</p>
      </div>
    );
  }

  return (
    <section className="premium-reveal space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total de linhas" value={preview.totalCount} tone="default" />
        <SummaryCard label="Válidas" value={preview.validCount} tone="success" />
        <SummaryCard label="Com erros" value={preview.invalidCount} tone="danger" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200">
        <div className="max-h-[360px] overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-[0.1em] text-gray-500">
              <tr>
                <th className="px-3 py-2.5">Linha</th>
                <th className="px-3 py-2.5">Produto</th>
                <th className="px-3 py-2.5">SKU</th>
                <th className="px-3 py-2.5">Categoria</th>
                <th className="px-3 py-2.5">Coleção</th>
                <th className="px-3 py-2.5">Preço</th>
                <th className="px-3 py-2.5">Estoque</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {preview.rows.map((row) => {
                const isValid = row.errors.length === 0;

                return (
                  <tr key={`${row.rowNumber}-${row.sku}-${row.name}`} className="align-top transition-colors hover:bg-gray-50">
                    <td className="px-3 py-3 text-xs text-gray-500">{row.rowNumber}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">{row.name || 'Sem nome'}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {row.gender || '-'} / {row.collection || 'Sem coleção'}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-gray-700">{row.sku || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">{row.category || '-'}</td>
                    <td className="px-3 py-3 text-gray-700">
                      {row.collection || '-'}
                      {row.season ? <p className="text-xs text-gray-500">{row.season}</p> : null}
                    </td>
                    <td className="px-3 py-3 text-gray-700">{typeof row.price === 'number' ? `R$ ${row.price.toFixed(2)}` : '-'}</td>
                    <td className="px-3 py-3 text-xs text-gray-700">{row.stockStatus}</td>
                    <td className="px-3 py-3">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Válido
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                            <XCircle className="h-3.5 w-3.5" />
                            Inválido
                          </span>
                          <ul className="mt-1.5 space-y-0.5">
                            {row.errors.map((errorMessage, index) => (
                              <li key={index} className="flex items-start gap-1 text-xs text-red-700">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>{errorMessage}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {preview.validCount > 0 && (
        <p className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <PackageCheck className="h-3.5 w-3.5" />
          {preview.validCount} produto(s) pronto(s) para importação.
        </p>
      )}
    </section>
  );
};

