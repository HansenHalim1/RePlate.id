import type { Database } from './supabase.types'

type Product = Database['public']['Tables']['products']['Row']
type ProductDisplay = Product & { description?: string | null; hotel?: string | null }

const contains = (source: string, term: string) => source.includes(term.toLowerCase())

export function buildProductDescription(product: ProductDisplay): string {
  if (product.description) return product.description

  const name = (product.name || '').toLowerCase()
  const category = (product.category || '').toLowerCase()
  const hotel = product.hotel || 'our partner hotels'
  const match = (term: string) => contains(name, term) || contains(category, term)

  if (match('burger')) return `Grilled burger set with crisp greens and soft buns from ${hotel}.`
  if (match('chicken')) return `Tender chicken dish with warm spices, rescued fresh from ${hotel}.`
  if (match('beef') || match('steak')) return `Juicy beef entrée with hearty sides from ${hotel}.`
  if (match('rice') || match('nasi')) return `Comforting rice box with balanced sides prepared at ${hotel}.`
  if (match('pasta')) return `Al dente pasta tossed in chef-made sauce from ${hotel}.`
  if (match('soup')) return `Slow-simmered soup that warms you up, fresh from ${hotel}.`
  if (match('salad')) return `Crunchy salad with bright dressing crafted at ${hotel}.`
  if (match('bread') || match('bun')) return `Freshly baked breads and rolls straight from ${hotel}'s oven.`
  if (match('dessert') || match('cake') || match('pastry')) return `Sweet pastry assortment baked by ${hotel}'s kitchen.`
  if (match('coffee') || match('tea')) return `Warm beverage selection brewed with care at ${hotel}.`
  if (match('breakfast')) return `Hearty breakfast staples prepared at ${hotel} to start your day.`
  if (match('lunch') || match('dinner')) return `Chef-prepared ${product.name} curated at ${hotel} for your mealtime.`

  return `Chef-made ${product.name} prepared at ${hotel}, rescued fresh for you.`
}
