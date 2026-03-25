import { ReactNode } from 'react';

interface ProductFormSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export const ProductFormSection = ({ title, description, children }: ProductFormSectionProps) => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50/60 p-5 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
};
