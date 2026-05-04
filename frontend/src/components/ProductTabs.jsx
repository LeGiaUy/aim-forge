import { useMemo, useState } from 'react'

const TAB_ITEMS = [
  { id: 'description', label: 'Description' },
  { id: 'specs', label: 'Specifications' },
  { id: 'shipping', label: 'Shipping' }
]

export default function ProductTabs({ description, specs }) {
  const [active_tab, setActiveTab] = useState('description')

  const has_specs = useMemo(() => {
    return Boolean(specs?.length)
  }, [specs])

  return (
    <section className='rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-7'>
      <div className='flex flex-wrap gap-2 border-b border-white/10 pb-3'>
        {TAB_ITEMS.map(item => (
          <button
            key={item.id}
            type='button'
            onClick={() => setActiveTab(item.id)}
            className={`rounded-full px-4 py-2 text-xs font-display uppercase tracking-wider transition ${
              active_tab === item.id
                ? 'bg-[#7c3aed]/25 text-[#d8b4fe]'
                : 'bg-transparent text-[#94a3b8] hover:bg-white/5 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {active_tab === 'description' && (
        <p className='whitespace-pre-line pt-4 text-sm leading-7 text-[#cbd5e1]'>
          {description || 'No detailed description available'}
        </p>
      )}

      {active_tab === 'specs' && (
        <div className='pt-4'>
          {!has_specs && (
            <p className='text-sm text-[#94a3b8]'>
              Specifications are not available yet
            </p>
          )}

          {has_specs && (
            <div className='overflow-hidden rounded-xl border border-white/10'>
              {specs.map(item => (
                <div
                  key={`${item.attribute}-${item.value}`}
                  className='grid grid-cols-2 items-start border-b border-white/10 bg-black/20 px-4 py-3 text-sm last:border-b-0'
                >
                  <span className='font-semibold text-[#e2e8f0]'>
                    {item.attribute}
                  </span>
                  <span className='whitespace-pre-line text-[#94a3b8]'>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {active_tab === 'shipping' && (
        <div className='space-y-3 pt-4 text-sm text-[#cbd5e1]'>
          <p>Free shipping for orders over 2.500.000₫</p>
          <p>Standard delivery: 3-5 business days</p>
          <p>Express delivery: 1-2 business days</p>
          <p>30-day return policy for sealed products</p>
        </div>
      )}
    </section>
  )
}
