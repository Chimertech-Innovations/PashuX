import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import { SkeletonProductCard } from '@/components/ui/SkeletonCard';
import type { Product } from '@/types';

const CATEGORIES = [
  'All',
  'Nutrition and Supplements',
  'Detection and Diagnostics',
  'Udder Hygiene and Disease Prevention',
  'Ethnoveterinary Medicine',
  'Reproductive Management',
  'Milk Quality Testing',
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
    <div className="min-h-screen pt-24 pb-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <p className="section-label mb-3 text-slate-900 font-black">Chimertech Catalogue</p>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-3 tracking-tight">Products</h1>
          <p className="text-slate-900 text-sm max-w-xl leading-relaxed font-bold">
            Browse the full range of Chimertech cattle health and nutritional products. Products are recommended automatically based on your analysis results.
          </p>
        </div>

        {/* Executive Search & Filter Toolbar */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              id="products-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products by name or category…"
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 text-sm font-black focus:outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 shadow-sm transition-all"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs transition-all duration-200 ${
                  category === cat
                    ? 'bg-emerald-600 text-white font-black shadow-md border border-emerald-600'
                    : 'bg-white text-slate-900 hover:bg-slate-100 border border-slate-300 font-black shadow-sm'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        {!loading && (
          <p className="text-xs font-black text-slate-900 mb-5">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''} available
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
            <p className="text-slate-900 font-black text-sm">No products found matching your search.</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="btn-secondary mt-4 text-xs font-black text-slate-900">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
