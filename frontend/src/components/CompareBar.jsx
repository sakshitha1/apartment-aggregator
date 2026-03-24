import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCompare } from '../context/CompareContext.jsx'

export function CompareBar() {
  const { ids, remove, clear, count, max } = useCompare()
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl">
            <div className="text-sm font-semibold text-zinc-700">
              Compare ({count}/{max})
            </div>

            <div className="flex gap-2">
              {ids.map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700"
                >
                  <span className="max-w-[80px] truncate">#{id}</span>
                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="ml-1 text-zinc-400 hover:text-zinc-700"
                    aria-label="Remove from compare"
                  >
                    ×
                  </button>
                </div>
              ))}
              {Array.from({ length: max - count }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex h-7 w-16 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-400"
                >
                  +Add
                </div>
              ))}
            </div>

            {count >= 2 && (
              <button
                type="button"
                onClick={() => navigate(`/compare?ids=${ids.join(',')}`)}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 transition"
              >
                Compare
              </button>
            )}

            <button
              type="button"
              onClick={clear}
              className="text-xs text-zinc-400 hover:text-zinc-700 transition"
              aria-label="Clear compare"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
