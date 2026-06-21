export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: 'var(--muted)' }}
      >
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--foreground)' }}>
        {title}
      </h3>
      <p className="text-sm text-center max-w-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
        {description}
      </p>
      {action}
    </div>
  );
}
