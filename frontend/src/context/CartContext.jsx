import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useAuth } from './AuthContext.jsx'
import { cartApi } from '../services/api.js'
/* eslint-disable react-refresh/only-export-components */

const CartContext = createContext(null)

const EMPTY_CART = {
  cart_id: null,
  items: [],
  total: 0
}

export function CartProvider({ children }) {
  const { is_authenticated } = useAuth()
  const [cart_data, setCartData] = useState(EMPTY_CART)
  const [cart_loading, setCartLoading] = useState(false)

  const loadCart = useCallback(async () => {
    if (!is_authenticated) {
      setCartData(EMPTY_CART)
      return EMPTY_CART
    }

    setCartLoading(true)
    try {
      const response = await cartApi.getCart()
      const next_cart = response.data.data || EMPTY_CART
      setCartData(next_cart)
      return next_cart
    } finally {
      setCartLoading(false)
    }
  }, [is_authenticated])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCart()
  }, [loadCart])

  const addToCart = async payload => {
    const response = await cartApi.addItem(payload)
    const next_cart = response.data.data || EMPTY_CART
    setCartData(next_cart)
    return next_cart
  }

  const updateCartItem = async payload => {
    const response = await cartApi.updateItem(payload)
    const next_cart = response.data.data || EMPTY_CART
    setCartData(next_cart)
    return next_cart
  }

  const removeCartItem = async variant_id => {
    const response = await cartApi.removeItem(variant_id)
    const next_cart = response.data.data || EMPTY_CART
    setCartData(next_cart)
    return next_cart
  }

  const clearCart = useCallback(() => {
    setCartData(EMPTY_CART)
  }, [])

  const total_items = useMemo(() => {
    return cart_data.items.reduce((sum_value, item_value) => {
      return sum_value + item_value.quantity
    }, 0)
  }, [cart_data.items])

  const context_value = useMemo(
    () => ({
      cart_data,
      cart_loading,
      total_items,
      loadCart,
      addToCart,
      updateCartItem,
      removeCartItem,
      clearCart
    }),
    [cart_data, cart_loading, total_items, loadCart, clearCart]
  )

  return (
    <CartContext.Provider value={context_value}>{children}</CartContext.Provider>
  )
}

export function useCart() {
  const context_value = useContext(CartContext)
  if (!context_value) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context_value
}
