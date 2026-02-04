import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close dialog"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:inset-0 sm:bottom-auto sm:my-10 sm:rounded-3xl"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{title}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-zinc-100"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}

