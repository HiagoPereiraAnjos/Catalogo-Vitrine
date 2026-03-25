import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({ as: Component = 'div', children, className = '', ...props }) => {
  return (
    <Component className={`mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-10 ${className}`} {...props}>
      {children}
    </Component>
  );
};

