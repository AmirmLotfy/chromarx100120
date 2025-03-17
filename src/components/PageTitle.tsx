
import React from 'react';

export interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  description?: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title, subtitle, icon, actions, description }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};

export default PageTitle;
