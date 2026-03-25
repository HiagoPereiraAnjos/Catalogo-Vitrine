import { useSiteSettings } from '../../../hooks/useSiteSettings';

interface ProductsHeaderProps {
  title?: string;
  headingId?: string;
}

export const ProductsHeader = ({ title = 'Colecao', headingId }: ProductsHeaderProps) => {
  const { settings } = useSiteSettings();
  const brand = settings.brand;

  return (
    <div className="space-y-3">
      <p className="section-eyebrow">Curadoria {brand.shortName}</p>
      <h1 id={headingId} className="section-title text-4xl md:text-5xl">
        {title}
      </h1>
      <div className="section-divider" />
      <p className="section-support max-w-3xl">
        Descubra jeans premium organizados por colecao, temporada e modelagem para construir campanhas mais fortes e drops com identidade.
      </p>
    </div>
  );
};
