import type { Database } from './supabase.types'

type Product = Database['public']['Tables']['products']['Row']
type ProductDisplay = Product & { description?: string | null; hotel?: string | null; allergen?: string | null }

const keywordMap: Array<{ terms: string[]; label: string }> = [
  { terms: ['milk', 'cheese', 'cream', 'butter', 'dairy'], label: 'Milk' },
  { terms: ['egg', 'mayonnaise', 'mayo'], label: 'Eggs' },
  { terms: ['soy', 'tofu'], label: 'Soy' },
  { terms: ['peanut', 'nut', 'almond', 'cashew', 'walnut', 'hazelnut'], label: 'Nuts' },
  { terms: ['wheat', 'bread', 'bun', 'noodle', 'pasta', 'flour'], label: 'Gluten (wheat)' },
  { terms: ['shrimp', 'prawn', 'crab', 'seafood', 'fish', 'salmon', 'tuna'], label: 'Seafood/Fish' },
  { terms: ['beef'], label: 'Beef' },
  { terms: ['chicken'], label: 'Chicken' },
  { terms: ['pork'], label: 'Pork' },
]

export function buildAllergenInfo(product: ProductDisplay): string {
  if (product.allergen) return product.allergen

  const haystack = [
    product.name || '',
    product.description || '',
    product.category || '',
    product.hotel || '',
  ]
    .join(' ')
    .toLowerCase()

  const hits = new Set<string>()
  keywordMap.forEach(({ terms, label }) => {
    if (terms.some((t) => haystack.includes(t))) {
      hits.add(label)
    }
  })

  if (hits.size === 0) return '-'
  return Array.from(hits).join(', ')
}
