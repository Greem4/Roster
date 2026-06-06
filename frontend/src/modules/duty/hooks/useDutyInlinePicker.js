import { useEffect, useRef, useState } from 'react'

/** Открытый inline-picker: закрытие по клику снаружи. */
export function useDutyInlinePicker() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const close = () => setOpen(false)
  const toggle = () => setOpen((prev) => !prev)

  return { open, setOpen, rootRef, close, toggle }
}
