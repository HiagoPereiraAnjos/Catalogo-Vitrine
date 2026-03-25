import React, { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, UploadCloud } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import { ProductCreateInput } from '../../../types';
import { buildBulkImportPreview, BulkImportSource, parseBulkImportFile } from '../utils/bulkImport';
import { BulkImportPreview } from './BulkImportPreview';
import { ImportTemplateDownloader } from './ImportTemplateDownloader';

interface BulkImportModalProps {
  isOpen: boolean;
  isImporting: boolean;
  existingSkus: string[];
  onClose: () => void;
  onConfirmImport: (products: ProductCreateInput[], metadata: { validCount: number; invalidCount: number }) => Promise<void> | void;
}

const getImportErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Não foi possível processar o arquivo selecionado.';
};

export const BulkImportModal = ({
  isOpen,
  isImporting,
  existingSkus,
  onClose,
  onConfirmImport
}: BulkImportModalProps) => {
  const [source, setSource] = useState<BulkImportSource | null>(null);
  const [collectionOverride, setCollectionOverride] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [importError, setImportError] = useState('');

  const preview = useMemo(
    () => (source ? buildBulkImportPreview(source, { existingSkus, collectionOverride }) : null),
    [source, existingSkus, collectionOverride]
  );

  useEffect(() => {
    if (!isOpen) {
      setSource(null);
      setCollectionOverride('');
      setImportError('');
      setIsReadingFile(false);
    }
  }, [isOpen]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsReadingFile(true);
    setImportError('');

    try {
      const parsedSource = await parseBulkImportFile(file);
      setSource(parsedSource);
    } catch (error) {
      setSource(null);
      setImportError(getImportErrorMessage(error));
    } finally {
      setIsReadingFile(false);
    }
  };

  const canConfirm = Boolean(preview && preview.validCount > 0 && !isImporting);

  const handleConfirmImport = async () => {
    if (!preview || preview.validProducts.length === 0 || isImporting) {
      return;
    }

    await onConfirmImport(preview.validProducts, {
      validCount: preview.validCount,
      invalidCount: preview.invalidCount
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importação em massa"
      description="Importe uma coleção completa via JSON ou CSV com validação antes de salvar."
      maxWidthClassName="sm:max-w-7xl"
      bodyClassName="p-0"
    >
      <div className="max-h-[82vh] space-y-6 overflow-y-auto p-6">
        <ImportTemplateDownloader />

        <section className="surface-card premium-reveal p-4">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <label className="premium-interactive cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 hover:border-gray-400 hover:bg-gray-100">
              <input type="file" accept=".json,.csv,application/json,text/csv" onChange={handleFileChange} className="sr-only" />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm">
                  <UploadCloud className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Selecionar arquivo de importação</p>
                  <p className="text-xs text-gray-500">Formatos aceitos: `.json` e `.csv`</p>
                </div>
              </div>
            </label>

            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Atribuir coleção para todos os itens</label>
              <input
                type="text"
                value={collectionOverride}
                onChange={(event) => setCollectionOverride(event.target.value)}
                placeholder="Ex: Coleção Outono/Inverno 2026"
                className="field-control"
              />
              <p className="mt-1 text-xs text-gray-500">
                Se preenchido, esse valor substitui o campo `collection` de todas as linhas importadas.
              </p>
            </div>
          </div>

          <div className="mt-3 min-h-6">
            {isReadingFile && (
              <p className="inline-flex items-center gap-2 text-xs font-medium text-blue-700">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Lendo arquivo...
              </p>
            )}
            {!isReadingFile && source && (
              <p className="text-xs text-gray-600">
                Arquivo carregado: <strong>{source.fileName}</strong> ({source.format.toUpperCase()})
              </p>
            )}
            {importError && <p className="text-xs font-medium text-red-700">{importError}</p>}
          </div>
        </section>

        <BulkImportPreview preview={preview} />
      </div>

      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={isImporting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirmImport} disabled={!canConfirm}>
            {isImporting ? 'Importando...' : preview ? `Importar ${preview.validCount} produto(s)` : 'Importar produtos'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

