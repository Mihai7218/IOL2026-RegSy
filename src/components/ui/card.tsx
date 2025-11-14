import { ReactNode, HTMLAttributes } from 'react'
import clsx from 'clsx'

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('rounded-2xl border p-4 shadow-sm bg-white', className)} {...rest}>{children}</div>
}
export function CardHeader({ children }: { children: ReactNode }) { return <div className='mb-3 font-semibold'>{children}</div> }
export function CardContent({ children }: { children: ReactNode }) { return <div>{children}</div> }
