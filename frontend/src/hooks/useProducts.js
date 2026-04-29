import { useState, useEffect } from "react";
import api from "../services/api.js";

export function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = {};
    if (filters.category_id) params.category_id = filters.category_id;
    if (filters.brand_id)    params.brand_id    = filters.brand_id;

    api.get("/products", { params })
      .then((res) => {
        const data = res.data?.data;
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : [];

        if (!cancelled) setProducts(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return { products, loading, error };
}
