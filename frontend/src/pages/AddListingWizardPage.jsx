import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Button } from '../components/Button.jsx'
import { PageFade } from '../components/PageFade.jsx'
import { CATEGORIES } from '../data/mockListings.js'

const STEPS = [
  { key: 'basic', label: 'Basic info' },
  { key: 'location', label: 'Location' },
  { key: 'details', label: 'Details' },
  { key: 'media', label: 'Media' },
  { key: 'review', label: 'Review' },
]

function Field({ label, children }) {
  return (
    <label className="block space-y-1">
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      {children}
    </label>
  )
}

function TextInput(props) {
  return (
    <input
      className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
      {...props}
    />
  )
}

function TextArea(props) {
  return (
    <textarea
      className="min-h-[120px] w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
      {...props}
    />
  )
}

function Dropzone({ images, onAddFiles }) {
  return (
    <div className="space-y-3">
      <div
        className="rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onAddFiles?.(Array.from(e.dataTransfer.files || []))
        }}
      >
        <div className="text-sm font-semibold">Drag & drop photos here</div>
        <div className="mt-1 text-xs text-zinc-500">
          Or choose files from your device
        </div>
        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onAddFiles?.(Array.from(e.target.files || []))}
            className="text-sm"
          />
        </div>
      </div>

      {images.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img) => (
            <img
              key={img.url}
              src={img.url}
              alt={img.name}
              className="aspect-square w-full rounded-2xl border border-zinc-200 object-cover"
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AddListingWizardPage() {
  const [stepIdx, setStepIdx] = useState(0)
  const step = STEPS[stepIdx]

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'apartments',
    address: '',
    price: 15000,
    rooms: 1,
    floor: 1,
    images: [],
  })

  const canNext = useMemo(() => {
    if (step.key === 'basic') return form.title.trim().length >= 5
    if (step.key === 'location') return form.address.trim().length >= 5
    if (step.key === 'details') return Number(form.price) > 0
    if (step.key === 'media') return form.images.length >= 1
    return true
  }, [form, step.key])

  const addFiles = (files) => {
    const accepted = files.filter((f) => f.type.startsWith('image/'))
    const next = accepted.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }))
    setForm((s) => ({ ...s, images: [...s.images, ...next].slice(0, 10) }))
  }

  return (
    <PageFade>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Add property</h1>
          <div className="text-sm text-zinc-600">Become a host in 5 quick steps.</div>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        {/* Stepper */}
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStepIdx(i)}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-semibold',
                i === stepIdx
                  ? 'bg-rose-500 text-white'
                  : i < stepIdx
                    ? 'bg-zinc-100 text-zinc-800'
                    : 'bg-zinc-50 text-zinc-500',
              )}
            >
              {i + 1}. {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          {step.key === 'basic' ? (
            <>
              <Field label="Title">
                <TextInput
                  value={form.title}
                  onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                  placeholder="e.g., Bright apartment near the park"
                />
              </Field>
              <Field label="Description">
                <TextArea
                  value={form.description}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="What makes your place special?"
                />
              </Field>
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, category: e.target.value }))
                  }
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm shadow-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          ) : null}

          {step.key === 'location' ? (
            <>
              <Field label="Address (auto-complete placeholder)">
                <TextInput
                  value={form.address}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, address: e.target.value }))
                  }
                  placeholder="Start typing an address…"
                />
              </Field>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                Auto-complete will be wired to your backend/provider later. For now this is a
                regular input.
              </div>
            </>
          ) : null}

          {step.key === 'details' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Price (KZT)">
                <TextInput
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, price: Number(e.target.value) }))
                  }
                />
              </Field>
              <Field label="Rooms">
                <TextInput
                  type="number"
                  min={0}
                  value={form.rooms}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, rooms: Number(e.target.value) }))
                  }
                />
              </Field>
              <Field label="Floor">
                <TextInput
                  type="number"
                  min={0}
                  value={form.floor}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, floor: Number(e.target.value) }))
                  }
                />
              </Field>
            </div>
          ) : null}

          {step.key === 'media' ? (
            <Dropzone images={form.images} onAddFiles={addFiles} />
          ) : null}

          {step.key === 'review' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">{form.title || 'Untitled'}</div>
                <div className="mt-1 text-sm text-zinc-600">
                  {form.address || 'No address yet'}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-zinc-700">
                    {form.category}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-zinc-700">
                    {form.rooms} rooms
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-zinc-700">
                    floor {form.floor}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-zinc-700">
                    {Number(form.price).toLocaleString('ru-KZ')} KZT
                  </span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => alert('Published (demo). Connect backend to persist.')}
              >
                Review & Publish
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
            disabled={stepIdx === 0}
          >
            Back
          </Button>

          <Button
            onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
            disabled={stepIdx === STEPS.length - 1 || !canNext}
          >
            Next
          </Button>
        </div>
      </div>
      </div>
    </PageFade>
  )
}

