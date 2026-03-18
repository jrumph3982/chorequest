import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AdminCardProps {
  title?: string
  description?: string
  children: ReactNode
  actions?: ReactNode
  className?: string
  /** Skip default px-5 py-4 padding on the content area */
  noPadding?: boolean
}

export function AdminCard({
  title,
  description,
  children,
  actions,
  className,
  noPadding = false,
}: AdminCardProps) {
  return (
    <div className={cn('bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden', className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#334155]">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-slate-100 leading-tight">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-5 py-4'}>{children}</div>
    </div>
  )
}
