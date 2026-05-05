import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title = 'En cours de construction',
  description = 'Cette fonctionnalité sera disponible prochainement.',
  icon: Icon = Construction,
}) => (
  <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
      <Icon className="h-8 w-8 text-muted-foreground shrink-0" />
    </div>
    <h2 className="font-display text-xl font-bold text-foreground mb-2">{title}</h2>
    <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
  </div>
);

export default ComingSoon;
