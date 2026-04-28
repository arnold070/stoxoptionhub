// src/hooks/useCart.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string        // composite line key: `${productId}-${variantId ?? 'default'}`
  productId: string // real DB product ID — sent to checkout API
  variantId?: string
  name: string
  price: number
  image: string
  quantity: number
  variant?: { name: string; value: string }
  slug: string
}

// Build a stable, unique key per product+variant combination.
// Two items with the same product but different variants are separate lines.
export function cartItemId(productId: string, variantId?: string): string {
  return variantId ? `${productId}-${variantId}` : `${productId}-default`
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      // FIX #4: Uses composite key so different variants are separate cart lines
      addItem: (item) => {
        const lineId   = cartItemId(item.productId, item.variantId)
        const existing = get().items.find(i => i.id === lineId)
        if (existing) {
          set({
            items: get().items.map(i =>
              i.id === lineId ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...get().items, { ...item, id: lineId, quantity: 1 }] })
        }
        set({ isOpen: true })
      },

      removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),

      updateQuantity: (id, qty) => {
        if (qty < 1) { get().removeItem(id); return }
        set({ items: get().items.map(i => i.id === id ? { ...i, quantity: qty } : i) })
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),
    }),
    {
      name: 'ecove-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

// ---------------------------------------------------------------------------
// Wishlist
// FIX #9 (from earlier): Only syncs to server when authenticated
// ---------------------------------------------------------------------------
interface WishlistStore {
  ids: string[]
  toggleWishlist: (id: string, isAuthenticated?: boolean) => void
  isWishlisted: (id: string) => boolean
  syncToServer: () => Promise<void>
}

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      ids: [],

      toggleWishlist: (id, isAuthenticated = false) => {
        const current  = get().ids
        const isInList = current.includes(id)
        set({ ids: isInList ? current.filter(i => i !== id) : [...current, id] })

        // Only call the API when the user is actually logged in
        if (isAuthenticated) {
          fetch('/api/wishlist', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ productId: id }),
          }).catch(() => {})
        }
      },

      isWishlisted: (id) => get().ids.includes(id),

      // Call after a guest logs in to push their locally stored wishlist to the server
      syncToServer: async () => {
        const { ids } = get()
        if (ids.length === 0) return
        await Promise.allSettled(
          ids.map(id =>
            fetch('/api/wishlist', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ productId: id }),
            })
          )
        )
      },
    }),
    { name: 'ecove-wishlist' }
  )
)
