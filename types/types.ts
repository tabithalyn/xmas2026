type WishlistItem = {
  id: number
  name: string
  store: string
  price: number
  image_url: string | null
  product_url: string
  preference: string | null
  created_at: string | null
}

type WishlistDraft = {
  name: string
  store: string
  price: number
  image_url: string
  product_url: string
  preference: string
}