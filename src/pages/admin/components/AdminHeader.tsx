import { FileUp, Layers3, LockKeyhole, Plus, ShieldCheck, WandSparkles } from 'lucide-react';
import { Button } from '../../../components/Button';

interface AdminHeaderProps {
  onExit: () => void;
  onOpenCategory: () => void;
  onOpenCollectionWizard: () => void;
  onOpenBulkImport: () => void;
  onOpenProduct: () => void;
}

export const AdminHeader = ({
  onExit,
  onOpenCategory,
  onOpenCollectionWizard,
  onOpenBulkImport,
  onOpenProduct
}: AdminHeaderProps) => {
  return (
    <section className="premium-reveal overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-[0_26px_56px_-40px_rgba(15,23,42,0.8)]">
      <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Área reservada
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Painel administrativo</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-200">
            Gestão visual do catálogo com foco em curadoria, organização e consistência de marca.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={onExit}
            type="button"
          >
            <LockKeyhole className="h-4 w-4" />
            Sair da área reservada
          </Button>
          <Button
            variant="light"
            className="text-slate-900 ring-1 ring-white/40 transition-all hover:ring-white/70"
            onClick={onOpenCategory}
            type="button"
          >
            <Layers3 className="h-4 w-4" />
            Criar categoria
          </Button>
          <Button
            variant="light"
            className="text-slate-900 ring-1 ring-white/40 transition-all hover:ring-white/70"
            onClick={onOpenCollectionWizard}
            type="button"
          >
            <WandSparkles className="h-4 w-4" />
            Criar colecao
          </Button>
          <Button
            variant="light"
            className="text-slate-900 ring-1 ring-white/40 transition-all hover:ring-white/70"
            onClick={onOpenBulkImport}
            type="button"
          >
            <FileUp className="h-4 w-4" />
            Importar arquivo
          </Button>
          <Button
            variant="light"
            className="text-slate-900 ring-1 ring-white/40 transition-all hover:ring-white/70"
            onClick={onOpenProduct}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        </div>
      </div>
    </section>
  );
};
