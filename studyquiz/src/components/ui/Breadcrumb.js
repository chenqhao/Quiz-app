import Link from 'next/link';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-6 animate-fade-in" style={{ color: 'var(--muted-foreground)' }}>
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {item.href ? (
            <Link href={item.href} className="hover:underline transition-colors" style={{ color: 'var(--muted-foreground)' }}>
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
