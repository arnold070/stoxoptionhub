// ═══════════════════════════════════════════════════════════
//  Ecove Marketplace — Shared TypeScript Types
// ═══════════════════════════════════════════════════════════

// ── Enums ────────────────────────────────────────────────────
export type Role = 'customer' | 'vendor' | 'admin' | 'super_admin'
export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type ProductStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed' | 'partially_refunded'
export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'on_hold'
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

// ── User ─────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: Role
  avatarUrl?: string
  isEmailVerified: boolean
  lastLoginAt?: string
  vendor?: VendorSummary
  createdAt: string
}

// ── Vendor ───────────────────────────────────────────────────
export interface VendorSummary {
  id: string
  businessName: string
  slug: string
  status: VendorStatus
  logoUrl?: string
  averageRating: number
  totalOrders: number
  availableBalance: number
  pendingBalance: number
}

export interface Vendor extends VendorSummary {
  description?: string
  tagline?: string
  phone: string
  whatsapp?: string
  city: string
  state: string
  address: string
  bannerUrl?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountName?: string
  idDocumentUrl?: string
  cacDocumentUrl?: string
  addressProofUrl?: string
  statusNote?: string
  commissionRate?: number
  reviewCount: number
  responseRate: number
  onTimeRate: number
  lifetimePaid: number
  totalSales: number
  maxProducts: number
  isAutoApproved: boolean
  approvedAt?: string
  createdAt: string
  updatedAt: string
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'phone'>
  _count?: { products: number; orderItems: number; payouts: number }
}

// ── Category ─────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  parentId?: string
  displayOrder: number
  isActive: boolean
  metaTitle?: string
  metaDescription?: string
  children?: Category[]
  _count?: { products: number }
}

// ── Product ───────────────────────────────────────────────────
export interface ProductImage {
  id: string
  url: string
  publicId?: string
  altText?: string
  isPrimary: boolean
  sortOrder: number
}

export interface ProductVariant {
  id: string
  name: string
  value: string
  priceAdjustment: number
  stock: number
  sku?: string
}

export interface ProductSummary {
  id: string
  name: string
  slug: string
  price: number
  comparePrice?: number
  stock: number
  isFlashSale: boolean
  flashSalePrice?: number
  flashSaleEnd?: string
  isFeatured: boolean
  isBestSeller: boolean
  status: ProductStatus
  images: ProductImage[]
  category?: Pick<Category, 'id' | 'name' | 'slug'>
  vendor: Pick<Vendor, 'id' | 'businessName' | 'slug' | 'averageRating'>
  _count: { reviews: number; orderItems: number }
}

export interface Product extends ProductSummary {
  description?: string
  shortDescription?: string
  brand?: string
  sku?: string
  weight?: number
  handlingTime?: string
  shipsFrom?: string
  adminNote?: string
  tags: string[]
  specifications?: Record<string, string>
  variants: ProductVariant[]
  reviews?: Review[]
  createdAt: string
  updatedAt: string
}

// ── Order ─────────────────────────────────────────────────────
export interface ShippingAddress {
  firstName: string
  lastName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  country: string
}

export interface OrderItem {
  id: string
  productId?: string
  vendorId?: string
  productName: string
  productImage?: string
  vendorName?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  variant?: { name: string; value: string }
  commissionRate: number
  commissionAmt: number
  vendorEarning: number
  fulfillmentStatus: OrderStatus
  trackingNumber?: string
  shippedAt?: string
  deliveredAt?: string
  payoutStatus: PayoutStatus
  createdAt: string
  order?: Partial<Order>
  product?: Partial<Product>
  vendor?: Partial<Vendor>
}

export interface Order {
  id: string
  orderNumber: string
  userId?: string
  guestEmail?: string
  guestPhone?: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: string
  paymentRef?: string
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  couponCode?: string
  couponDiscount?: number
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  notes?: string
  cancelReason?: string
  items: OrderItem[]
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>
  createdAt: string
  updatedAt: string
}

// ── Review ────────────────────────────────────────────────────
export interface Review {
  id: string
  productId: string
  vendorId?: string
  userId?: string
  guestName?: string
  rating: number
  title?: string
  body?: string
  isVerifiedPurchase: boolean
  status: ReviewStatus
  flagReason?: string
  createdAt: string
  user?: Pick<User, 'firstName' | 'lastName' | 'avatarUrl'>
  product?: Pick<Product, 'id' | 'name' | 'slug'>
}

// ── Payout ────────────────────────────────────────────────────
export interface Payout {
  id: string
  vendorId: string
  amount: number
  currency: string
  periodStart: string
  periodEnd: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  status: PayoutStatus
  adminNote?: string
  transferRef?: string
  processedAt?: string
  requestedAt: string
  vendor?: Partial<Vendor>
}

// ── Commission ────────────────────────────────────────────────
export interface CommissionRule {
  id: string
  type: 'global' | 'category' | 'vendor'
  rate: number
  categoryId?: string
  vendorId?: string
  isActive: boolean
  note?: string
  category?: Pick<Category, 'id' | 'name'>
  createdAt: string
}

// ── Coupon ────────────────────────────────────────────────────
export interface Coupon {
  id: string
  code: string
  type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y'
  value?: number
  minOrderAmount?: number
  maxUses?: number
  usedCount: number
  startDate?: string
  endDate?: string
  isActive: boolean
}

// ── Banner ────────────────────────────────────────────────────
export interface Banner {
  id: string
  title: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  imageUrl?: string
  position: 'hero_slider' | 'side_card_left' | 'side_card_right' | 'full_width' | 'dual_banner'
  bgColor?: string
  displayOrder: number
  startDate?: string
  endDate?: string
  isActive: boolean
}

// ── Cart ─────────────────────────────────────────────────────
export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  slug: string
  variant?: { name: string; value: string }
}

// ── API Response ─────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ── Analytics ─────────────────────────────────────────────────
export interface AdminAnalytics {
  vendors: { total: number; active: number; pending: number }
  products: { live: number; pending: number }
  orders: { total: number; thisMonth: number }
  revenue: { total: number; thisMonth: number; lastMonth: number; growth: string | null }
  commissions: { pending: number }
  recentOrders: Partial<Order>[]
  topVendors: Partial<Vendor>[]
}

export interface VendorDashboardStats {
  availableBalance: number
  pendingBalance: number
  lifetimePaid: number
  totalSales: number
  totalOrders: number
  averageRating: number
  reviewCount: number
  products: { total: number; approved: number; pending: number; rejected: number; draft: number }
  thisMonth: { orders: number; revenue: number }
  pendingPayout?: Partial<Payout>
}

// ── Fraud ─────────────────────────────────────────────────────
export interface FraudFlag {
  id: string
  entityType: string
  entityId: string
  reason: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  isResolved: boolean
  resolvedAt?: string
  note?: string
  createdAt: string
}

// ── Notification ─────────────────────────────────────────────
export interface VendorNotification {
  id: string
  vendorId: string
  type: string
  title: string
  message: string
  link?: string
  isRead: boolean
  createdAt: string
}

// ── Site Settings ─────────────────────────────────────────────
export type SiteSettings = Record<string, string>
