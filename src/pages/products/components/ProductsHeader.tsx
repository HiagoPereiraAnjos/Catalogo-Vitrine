import { defaultSiteSettings } from '../../../data/defaultSiteSettings';
import { useSiteSettings } from '../../../hooks/useSiteSettings';

interface ProductsHeaderProps {
  title?: string;
  headingId?: string;
}

export const ProductsHeader = ({ title = 'Colecao', headingId }: ProductsHeaderProps) => {
  const { settings } = useSiteSettings();
  const brand = settings.brand;
  const home = settings.home;

  const shortName = brand.shortName || brand.name;
  const supportText = home.collectionsSubtitle || defaultSiteSettings.home.collectionsSubtitle;

  return (
    <div className="space-y-3">
      <p className="section-eyebrow">Curadoria {shortName}</p>
      <h1 id={headingId} className="section-title text-4xl md:text-5xl">
        {title}
      </h1>
      <div className="section-divider" />
      <p className="section-support max-w-3xl">{supportText}</p>
    </div>
  );
};
