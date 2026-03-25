import { Download } from 'lucide-react';
import { Button } from '../../../components/Button';
import { BULK_IMPORT_CSV_TEMPLATE, BULK_IMPORT_JSON_TEMPLATE } from '../utils/bulkImport';

const downloadTextFile = (fileName: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

interface ImportTemplateDownloaderProps {
  className?: string;
}

export const ImportTemplateDownloader = ({ className = '' }: ImportTemplateDownloaderProps) => {
  return (
    <section className={`surface-card border-dashed p-4 ${className}`}>
      <p className="text-sm font-semibold text-gray-900">Modelos prontos para importação</p>
      <p className="mt-1 text-xs text-gray-500">
        Baixe um exemplo e use os mesmos campos para evitar erros na validação.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => downloadTextFile('template-importacao-produtos.json', BULK_IMPORT_JSON_TEMPLATE, 'application/json')}
        >
          <Download className="h-4 w-4" />
          Baixar JSON
        </Button>

        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => downloadTextFile('template-importacao-produtos.csv', BULK_IMPORT_CSV_TEMPLATE, 'text/csv;charset=utf-8')}
        >
          <Download className="h-4 w-4" />
          Baixar CSV
        </Button>
      </div>
    </section>
  );
};

