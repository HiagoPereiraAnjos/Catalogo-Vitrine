import React, { useEffect, useMemo, useState } from 'react';
import { CopyPlus, Layers3 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { CollectionOption } from '../types';

interface CollectionActionsProps {
  collections: CollectionOption[];
  isDuplicating: boolean;
  onDuplicateCollection: (payload: {
    sourceCollection: string;
    targetCollection: string;
    markAsNew: boolean;
  }) => Promise<void> | void;
}

const normalizeCollectionKey = (value: string) => value.trim().toLocaleLowerCase('pt-BR');

export const CollectionActions = ({ collections, isDuplicating, onDuplicateCollection }: CollectionActionsProps) => {
  const [sourceCollection, setSourceCollection] = useState('');
  const [targetCollection, setTargetCollection] = useState('');
  const [markAsNew, setMarkAsNew] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (collections.length === 0) {
      setSourceCollection('');
      return;
    }

    setSourceCollection((current) => {
      const exists = collections.some((collection) => collection.name === current);
      return exists ? current : collections[0].name;
    });
  }, [collections]);

  const selectedCollection = useMemo(
    () => collections.find((collection) => collection.name === sourceCollection) || null,
    [collections, sourceCollection]
  );

  const canDuplicate = Boolean(sourceCollection && targetCollection.trim().length >= 2 && !isDuplicating);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedTargetCollection = targetCollection.trim();

    if (!sourceCollection) {
      setErrorMessage('Selecione uma coleção para duplicar.');
      return;
    }

    if (cleanedTargetCollection.length < 2) {
      setErrorMessage('Informe um nome para a nova coleção com ao menos 2 caracteres.');
      return;
    }

    if (normalizeCollectionKey(sourceCollection) === normalizeCollectionKey(cleanedTargetCollection)) {
      setErrorMessage('Escolha um nome diferente da coleção de origem.');
      return;
    }

    setErrorMessage('');

    await onDuplicateCollection({
      sourceCollection,
      targetCollection: cleanedTargetCollection,
      markAsNew
    });

    setTargetCollection('');
  };

  return (
    <section className="surface-card premium-reveal p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="section-eyebrow">Ações de coleção</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-gray-900">Duplicar coleção existente</h2>
          <p className="mt-1 text-sm text-gray-500">
            Copie rapidamente todos os itens de uma coleção para criar uma nova entrada de temporada.
          </p>
        </div>

        {selectedCollection && (
          <span className="premium-chip inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
            <Layers3 className="h-3.5 w-3.5" />
            {selectedCollection.count} produto(s)
          </span>
        )}
      </div>

      {collections.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Nenhuma coleção cadastrada ainda. Defina o campo de coleção em produtos ou use a importação em massa.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Coleção de origem</label>
            <select
              value={sourceCollection}
              onChange={(event) => {
                setSourceCollection(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              className="field-control"
            >
              {collections.map((collection) => (
                <option key={collection.name} value={collection.name}>
                  {collection.name} ({collection.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nova coleção</label>
            <input
              type="text"
              value={targetCollection}
              onChange={(event) => {
                setTargetCollection(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              placeholder="Ex: Primavera/Verão 2027"
              className="field-control"
            />
            <label className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={markAsNew}
                onChange={(event) => setMarkAsNew(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              Marcar todos os itens duplicados como novos
            </label>
          </div>

          <div className="flex items-end">
            <Button type="submit" className="w-full lg:w-auto" disabled={!canDuplicate}>
              <CopyPlus className="h-4 w-4" />
              {isDuplicating ? 'Duplicando...' : 'Duplicar coleção'}
            </Button>
          </div>
        </form>
      )}

      {errorMessage && <p className="mt-2 text-xs font-medium text-red-700">{errorMessage}</p>}
    </section>
  );
};

