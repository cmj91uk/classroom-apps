import { Sketch } from '@uiw/react-color'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'

type ColorFieldProps = {
  label: string
  value: string
  presetColors: string[]
  onChange: (hex: string) => void
  compact?: boolean
  showLabel?: boolean
  icon?: ReactNode
}

export function ColorField({
  label,
  value,
  presetColors,
  onChange,
  compact = false,
  showLabel = true,
  icon,
}: ColorFieldProps) {
  const labelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className={
          compact
            ? icon
              ? 'flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-beige-dark/40 bg-white px-2 outline-none ring-beige-dark/30 focus:ring-2'
              : 'flex size-10 shrink-0 items-center justify-center rounded-lg border border-beige-dark/40 bg-white outline-none ring-beige-dark/30 focus:ring-2'
            : 'flex w-full items-center gap-3 rounded-lg border border-beige-dark/40 bg-white px-3 py-2.5 text-left outline-none ring-beige-dark/30 focus:ring-2'
        }
      >
        {icon ? (
          <span className="shrink-0 text-ink" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span
          className={
            compact
              ? 'size-6 rounded-md border border-black/10 shadow-inner'
              : 'size-8 shrink-0 rounded-md border border-black/10 shadow-inner'
          }
          style={{ backgroundColor: value }}
          aria-hidden="true"
        />
        {compact || !showLabel ? (
          <span id={labelId} className="sr-only">
            {label}
          </span>
        ) : (
          <span className="min-w-0">
            <span id={labelId} className="block text-sm font-medium text-ink">
              {label}
            </span>
            <span className="block truncate font-mono text-xs uppercase text-muted">
              {value}
            </span>
          </span>
        )}
        {!compact && !showLabel ? (
          <span className="min-w-0 truncate font-mono text-xs uppercase text-muted">
            {value}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={`${label} colour`}
          className={
            compact
              ? 'absolute top-full right-0 z-30 mt-2'
              : 'absolute top-full left-0 z-30 mt-2'
          }
        >
          <Sketch
            color={value}
            disableAlpha
            presetColors={presetColors}
            onChange={(color) => onChange(color.hex)}
            style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
          />
        </div>
      ) : null}
    </div>
  )
}
