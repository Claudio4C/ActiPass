import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  variation?: number;
  trend?: 'up' | 'down';
  icon: React.ComponentType<LucideProps>;
  linkTo?: string;
  period?: string;
  badge?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title, value, variation, trend, icon: Icon, linkTo, period, badge,
}) => {
  const content = (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
            {variation !== undefined && (
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-accent' : 'text-destructive'}`}>
                {trend === 'up' ? <ArrowUp className="h-3 w-3 shrink-0" /> : <ArrowDown className="h-3 w-3 shrink-0" />}
                {Math.abs(variation)}%
              </span>
            )}
          </div>
          {period && <p className="mt-1 text-xs text-muted-foreground">{period}</p>}
        </div>
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary shrink-0" />
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return linkTo ? <Link to={linkTo} className="block">{content}</Link> : content;
};

export default StatCard;
