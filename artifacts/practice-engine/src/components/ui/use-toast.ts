import { useState, useEffect } from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ToastFunction = (toast: Omit<Toast, "id">) => void

let memoryState: Toast[] = []
let listeners: Array<(state: Toast[]) => void> = []

function dispatch(action: Toast[]) {
  memoryState = action
  listeners.forEach((listener) => listener(memoryState))
}

export function toast(props: Omit<Toast, "id">) {
  const id = genId()
  const update = [...memoryState, { ...props, id }]
  dispatch(update)

  setTimeout(() => {
    dispatch(memoryState.filter((t) => t.id !== id))
  }, 3000)
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState)

  useEffect(() => {
    listeners.push(setToasts)
    return () => {
      const index = listeners.indexOf(setToasts)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [setToasts])

  return { toasts, toast }
}
