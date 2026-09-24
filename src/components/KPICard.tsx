import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  title: string
  value: string | number
  icon: ReactNode
  status?: 'normal' | 'warning' | 'risk' | 'info'
  trend?: 'up' | 'down' | 'flat'
  trendLabel?: string
  to?: string
  tooltip?: string
  suffix?: string
}

export function KPICard({
  title,
  value,
  icon,
  status = 'info',
  trend,
  trendLabel,
  to,
  tooltip,
  suffix,
}: Props) {
  const navigate = useNavigate()
  const statusColor = {
    normal: 'text-green border-green/30 bg-green/10',
    warning: 'text-warn border-warn/30 bg-warn/10',
    risk: 'text-risk border-risk/30 bg-risk/10',
    info: 'text-cyan border-cyan/30 bg-cyan/10',
  }[status]

  return (
    <button
      type="button"
      title={tooltip}
      onClick={() => to && navigate(to)}
      className={cn(
        'card card-hover text-left w-full',
        to && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn('rounded-lg p-2', statusColor)}>{icon}</div>
        {trend && (
          <span
            className={cn(
              'flex items-center gap-0.5 text-xs',
              trend === 'up' && 'text-risk',
              trend === 'down' && 'text-green',
              trend === 'flat' && 'text-slate-500'
            )}
          >
            {trend === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {trend === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            {trend === 'flat' && <Minus className="h-3.5 w-3.5" />}
            {trendLabel}
          </span>
        )}
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight text-white">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-slate-400">{suffix}</span>}
      </div>
      <div className="mt-1 text-xs font-medium text-slate-400">{title}</div>
      <div className="mt-2 text-[10px] uppercase tracking-wider text-slate-600">DEMO DATA</div>
    </button>
  )
}