'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  open: boolean
  title: string
  label: string
  placeholder?: string
  defaultValue?: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function PromptModal({ open, title, label, placeholder, defaultValue = '', confirmLabel = 'Confirm', danger, onConfirm, onCancel }: Props) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setValue(defaultValue); setTimeout(() => inputRef.current?.focus(), 50) }
  }, [open, defaultValue])

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) onConfirm(value.trim())
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h3 className="font-extrabold text-gray-900 text-base mb-1">{title}</h3>
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200 mb-4"
          />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!value.trim()}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-colors"
              style={{ background: danger ? '#ef4444' : '#f68b1f' }}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
