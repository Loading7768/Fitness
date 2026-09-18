import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-semibold text-neutral-100">{title}</h1>
      {action}
    </div>
  )
}

export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-neutral-900 border border-neutral-800 rounded-xl p-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-violet-600 text-white active:bg-violet-700',
  secondary: 'bg-neutral-800 text-neutral-100 active:bg-neutral-700',
  danger: 'bg-red-600 text-white active:bg-red-700',
  ghost: 'bg-transparent text-neutral-300 active:bg-neutral-800',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`rounded-lg px-4 py-2.5 font-medium disabled:opacity-40 transition-colors ${variantClass[variant]} ${className}`}
      {...props}
    />
  )
}

export function EmptyState({ text }: { text: string }) {
  return <p className="text-center text-neutral-500 text-sm py-10">{text}</p>
}
