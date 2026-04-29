import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { formatVnd } from '../utils/currency.js'

function CartItemRow({
  item_data,
  on_increase,
  on_decrease,
  on_remove,
  disable_action
}) {
  return (
    <li className='rounded-xl border border-white/10 bg-white/5 p-4'>
      <article className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <img
            src={item_data.image || 'https://placehold.co/96x96?text=No+Image'}
            alt={item_data.product_name}
            className='h-16 w-16 rounded-lg object-cover'
          />
          <div className='space-y-1'>
            <h2 className='font-display text-sm font-semibold uppercase tracking-wider text-white'>
              {item_data.product_name}
            </h2>
            <p className='text-xs text-[#94a3b8]'>{item_data.sku}</p>
            <p className='text-xs text-[#64748b]'>{item_data.brand || 'No brand'}</p>
          </div>
        </div>

        <div className='flex items-center gap-4'>
          <p className='text-sm font-semibold text-[#cbd5e1]'>
            {formatVnd(item_data.price)}
          </p>
          <div className='flex items-center rounded-lg border border-white/15 bg-white/5'>
            <button
              type='button'
              onClick={on_decrease}
              disabled={disable_action}
              className='h-9 w-9 text-[#cbd5e1] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#64748b]'
            >
              -
            </button>
            <span className='w-8 text-center text-sm text-white'>
              {item_data.quantity}
            </span>
            <button
              type='button'
              onClick={on_increase}
              disabled={disable_action}
              className='h-9 w-9 text-[#cbd5e1] transition hover:text-white disabled:cursor-not-allowed disabled:text-[#64748b]'
            >
              +
            </button>
          </div>
          <p className='w-20 text-right text-sm font-semibold text-[#e2e8f0]'>
            {formatVnd(item_data.subtotal)}
          </p>
          <button
            type='button'
            onClick={on_remove}
            disabled={disable_action}
            className='rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50'
          >
            Remove
          </button>
        </div>
      </article>
    </li>
  )
}

export default function CartPage() {
  const {
    cart_data,
    cart_loading,
    updateCartItem,
    removeCartItem
  } = useCart()

  const handleIncrease = async item_data => {
    await updateCartItem({
      variant_id: item_data.variant_id,
      quantity: item_data.quantity + 1
    })
  }

  const handleDecrease = async item_data => {
    if (item_data.quantity <= 1) {
      await removeCartItem(item_data.variant_id)
      return
    }

    await updateCartItem({
      variant_id: item_data.variant_id,
      quantity: item_data.quantity - 1
    })
  }

  const handleRemove = async item_data => {
    await removeCartItem(item_data.variant_id)
  }

  return (
    <main className='mx-auto min-h-screen max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8'>
      <header className='mb-6 flex items-center justify-between'>
        <h1 className='font-display text-xl font-bold uppercase tracking-wider text-white sm:text-2xl'>
          Shopping Cart
        </h1>
        <Link
          to='/'
          className='text-xs font-semibold uppercase tracking-wider text-[#94a3b8] transition hover:text-[#9f67ff]'
        >
          Continue Shopping
        </Link>
      </header>

      {cart_data.items.length === 0 && !cart_loading && (
        <section className='rounded-2xl border border-white/10 bg-white/5 p-10 text-center'>
          <p className='text-sm text-[#94a3b8]'>Your cart is empty</p>
        </section>
      )}

      {cart_data.items.length > 0 && (
        <section className='grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]'>
          <ul className='space-y-3'>
            {cart_data.items.map(item_data => (
              <CartItemRow
                key={item_data.variant_id}
                item_data={item_data}
                on_increase={() => handleIncrease(item_data)}
                on_decrease={() => handleDecrease(item_data)}
                on_remove={() => handleRemove(item_data)}
                disable_action={cart_loading}
              />
            ))}
          </ul>

          <aside className='h-fit rounded-2xl border border-white/10 bg-white/5 p-5'>
            <h2 className='font-display text-sm font-semibold uppercase tracking-wider text-[#cbd5e1]'>
              Cart Summary
            </h2>
            <div className='mt-4 flex items-center justify-between text-sm text-[#94a3b8]'>
              <span>Items</span>
              <span>{cart_data.items.length}</span>
            </div>
            <div className='mt-2 flex items-center justify-between font-display text-lg font-bold text-white'>
              <span>Total</span>
              <span>{formatVnd(cart_data.total)}</span>
            </div>
            <button
              type='button'
              className='mt-4 w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#06b6d4] px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:brightness-110'
            >
              Checkout
            </button>
          </aside>
        </section>
      )}
    </main>
  )
}
