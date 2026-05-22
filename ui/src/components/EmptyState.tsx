interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  children?: React.ReactNode
}

export default function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
      <div className="text-[var(--color-text-muted)]">{icon}</div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
        {description && (
          <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
