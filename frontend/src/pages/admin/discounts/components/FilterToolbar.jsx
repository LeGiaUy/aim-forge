export default function FilterToolbar({
  list_params,
  set_list_params,
  brands,
  categories,
  products
}) {
  return (
    <section className='admin-card space-y-3'>
      <h2 className='admin-section-title'>Bộ lọc chiến dịch</h2>
      <div className='grid grid-cols-1 gap-3 lg:grid-cols-4'>
        <input
          aria-label='Tìm chiến dịch'
          value={list_params.search}
          onChange={event =>
            set_list_params(prev => ({
              ...prev,
              page: 1,
              search: event.target.value
            }))
          }
          className='admin-input'
          placeholder='Tìm theo tên campaign'
        />
        <select
          aria-label='Lọc trạng thái'
          value={list_params.status}
          onChange={event =>
            set_list_params(prev => ({
              ...prev,
              page: 1,
              status: event.target.value
            }))
          }
          className='admin-select'
        >
          <option value=''>Tất cả trạng thái</option>
          <option value='active'>Đang chạy</option>
          <option value='upcoming'>Sắp chạy</option>
          <option value='expired'>Hết hạn</option>
          <option value='inactive'>Tắt</option>
        </select>
        <select
          aria-label='Lọc thương hiệu'
          value={list_params.brand_id}
          onChange={event =>
            set_list_params(prev => ({
              ...prev,
              page: 1,
              brand_id: event.target.value
            }))
          }
          className='admin-select'
        >
          <option value=''>Tất cả thương hiệu</option>
          {brands.map(item => (
            <option key={item.brand_id} value={item.brand_id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label='Lọc danh mục'
          value={list_params.category_id}
          onChange={event =>
            set_list_params(prev => ({
              ...prev,
              page: 1,
              category_id: event.target.value
            }))
          }
          className='admin-select'
        >
          <option value=''>Tất cả danh mục</option>
          {categories.map(item => (
            <option key={item.category_id} value={item.category_id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
        <select
          aria-label='Lọc sản phẩm'
          value={list_params.product_id}
          onChange={event =>
            set_list_params(prev => ({
              ...prev,
              page: 1,
              product_id: event.target.value
            }))
          }
          className='admin-select'
        >
          <option value=''>Tất cả sản phẩm</option>
          {products.map(item => (
            <option key={item.product_id} value={item.product_id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label='Sắp xếp'
          value={list_params.sort}
          onChange={event =>
            set_list_params(prev => ({ ...prev, sort: event.target.value }))
          }
          className='admin-select'
        >
          <option value='newest'>Mới nhất</option>
          <option value='start_asc'>Start tăng dần</option>
          <option value='start_desc'>Start giảm dần</option>
          <option value='end_asc'>End tăng dần</option>
          <option value='end_desc'>End giảm dần</option>
        </select>
        <select
          aria-label='Số dòng một trang'
          value={list_params.limit}
          onChange={event =>
            set_list_params(prev => ({
              ...prev,
              page: 1,
              limit: Number(event.target.value)
            }))
          }
          className='admin-select'
        >
          <option value='10'>10 / trang</option>
          <option value='20'>20 / trang</option>
          <option value='50'>50 / trang</option>
        </select>
      </div>
    </section>
  )
}
