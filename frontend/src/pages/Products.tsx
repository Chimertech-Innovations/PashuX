import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import { SkeletonProductCard } from '@/components/ui/SkeletonCard';
import type { Product } from '@/types';

const CATEGORIES = [
  'All',
  'Detection and Diagnostics',
  'Udder Hygiene',
  'Milk Quality Testing',
  'Nutrition and Supplements',
  'Reproductive Management',
  'Parasite Control',
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch]     = useState('');

  useEffect(() => {
    getProducts()
      .then(p => { setProducts(p); setFiltered(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = products;
    if (category !== 'All') result = result.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [category, search, products]);

  return (
    <div className="min-h-screen pt-24 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <p className="section-label mb-3">Chimertech Catalogue</p>
          <h1 className="text-display font-black text-white mb-3">Products</h1>
          <p className="text-grey-400 text-sm max-w-xl leading-relaxed">
            Browse the full range of Chimertech cattle health products. Products are recommended automatically based on your analysis results.
          </p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            id="products-search"
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="input-field sm:max-w-xs"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  category === cat
                    ? 'bg-white text-black'
                    : 'bg-white/[0.04] text-grey-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-xs text-grey-600 mb-5">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonProductCard key={i} />)
            : filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          }
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-grey-500 text-sm">No products found.</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="btn-ghost mt-4 text-xs">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
