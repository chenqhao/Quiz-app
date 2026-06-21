export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: { background: 'var(--muted)', color: 'var(--muted-foreground)' },
    primary: { background: 'color-mix(in srgb, var(--primary) 15%, transparent)', color: 'var(--primary)' },
    success: { background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' },
    danger: { background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' },
    warning: { background: 'color-mix(in srgb, var(--warning) 15%, transparent)', color: 'var(--warning)' },
    secondary: { background: 'color-mix(in srgb, var(--secondary) 15%, transparent)', color: 'var(--secondary)' },
  };

  const style = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }) {
  const map = {
    easy: { variant: 'success', label: 'Easy' },
    medium: { variant: 'warning', label: 'Medium' },
    hard: { variant: 'danger', label: 'Hard' },
  };
  const { variant, label } = map[difficulty] || map.medium;
  return <Badge variant={variant}>{label}</Badge>;
}

export function TypeBadge({ type }) {
  return (
    <Badge variant={type === 'multiple_choice' ? 'primary' : 'secondary'}>
      {type === 'multiple_choice' ? 'MC' : 'Written'}
    </Badge>
  );
}

export function MasteryBadge({ status }) {
  const map = {
    new: { variant: 'default', label: 'New' },
    mastered: { variant: 'success', label: 'Mastered' },
    needs_review: { variant: 'warning', label: 'Needs Review' },
    hard: { variant: 'danger', label: 'Hard' },
  };
  const { variant, label } = map[status] || map.new;
  return <Badge variant={variant}>{label}</Badge>;
}
