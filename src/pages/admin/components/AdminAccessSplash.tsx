import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Container } from '../../../components/Container';
import { useSiteSettings } from '../../../hooks/useSiteSettings';

interface AdminAccessSplashProps {
  onEnter: () => void;
}

export const AdminAccessSplash = ({ onEnter }: AdminAccessSplashProps) => {
  const { settings } = useSiteSettings();
  const brandName = settings.brand.name;

  return (
    <Container className="section-shell-tight mx-auto max-w-4xl">
      <div className="premium-reveal overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_25px_55px_-38px_rgba(15,23,42,0.65)]">
        <div className="bg-gradient-to-r from-slate-900 to-gray-800 px-8 py-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Área administrativa
          </div>
          <h2 className="mt-4 text-3xl font-semibold leading-tight">Acesso controlado para o painel de gestão</h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-200">
            Interface reservada para operação do catálogo {brandName}. Estrutura preparada para autenticação real em evolução futura.
          </p>
        </div>

        <div className="grid gap-6 p-8 md:grid-cols-[1.3fr_1fr]">
          <div className="surface-card rounded-2xl bg-gray-50 p-5 shadow-none">
            <h3 className="text-sm font-semibold text-gray-900">Próximo passo planejado</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>- Login seguro com controle por perfil.</li>
              <li>- Registro de alterações por usuário.</li>
              <li>- Permissões separadas para equipe comercial e operação.</li>
            </ul>
          </div>

          <div className="surface-card rounded-2xl p-5 shadow-none">
            <p className="mb-4 text-sm text-gray-500">Ambiente de desenvolvimento</p>
            <Button className="w-full" onClick={onEnter}>
              <LockKeyhole className="h-4 w-4" />
              Entrar no painel (simulação)
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
};
