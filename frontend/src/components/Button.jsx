import clsx from 'clsx'
import { motion } from 'framer-motion'

export function Button({
  variant = 'primary', // 'primary' | 'secondary' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  className,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-full font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60'

  const variants = {
    primary: 'bg-rose-500 text-white hover:bg-rose-600',
    secondary:
      'border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50',
    ghost: 'bg-transparent text-zinc-900 hover:bg-zinc-100',
  }

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-base',
  }

  return (
    <motion.button
      type={type}
      className={clsx(base, variants[variant], sizes[size], className)}
      whileTap={{ scale: 0.98 }}
      {...props}
    />
  )
}
