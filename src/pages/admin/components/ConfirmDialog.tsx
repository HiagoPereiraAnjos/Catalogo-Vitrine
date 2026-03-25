import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  itemName?: string;
  itemCode?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  itemName,
  itemCode,
  onCancel,
  onConfirm
}: ConfirmDialogProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={description}
      maxWidthClassName="sm:max-w-lg"
    >
      <div className="space-y-5">
        {(itemName || itemCode) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">Você está prestes a excluir:</p>
                <p className="mt-1 text-sm text-red-700/90">
                  <strong>{itemName || 'Item'}</strong>
                  {itemCode ? ` (${itemCode})` : ''}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>
    </Modal>
  );
};
