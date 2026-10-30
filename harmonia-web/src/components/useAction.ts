import { useState } from 'react'

export type Notice = { kind: 'ok' | 'error'; text: string } | null

/** Exécute une action async en gérant "en cours" + message de succès/erreur. */
export function useAction() {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  const run = async (fn: () => Promise<string | void>) => {
    if (busy) return
    setBusy(true)
    setNotice(null)
    try {
      const message = await fn()
      if (message) setNotice({ kind: 'ok', text: message })
    } catch (e) {
      setNotice({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Something went wrong.',
      })
    } finally {
      setBusy(false)
    }
  }

  return { busy, notice, setNotice, run }
}
