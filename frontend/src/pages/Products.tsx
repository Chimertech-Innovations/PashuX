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
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">Products</h1>
          <p className="text-slate-600 text-sm max-w-xl leading-relaxed font-medium">
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
            className="w-full sm:max-w-xs px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs transition-all duration-200 ${
                  category === cat
                    ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20 border border-emerald-600'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 font-semibold shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-xs font-bold text-slate-500 mb-5">
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
            <p className="text-slate-600 font-bold text-sm">No products found.</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="btn-secondary mt-4 text-xs font-bold">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
