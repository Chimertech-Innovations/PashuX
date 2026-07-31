import type { Product } from '@/types';

interface Props {
  product: Product;
  reason?: string;
}

function getDirectImageUrl(url: string | undefined, productName: string): string {
  if (!url) {
    return `https://placehold.co/400x400/f8fafc/059669?text=${encodeURIComponent(productName)}`;
  }
  const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  const driveIdRegex = /drive\.google\.com\/open\?id=([^\&]+)/;
  const matchId = url.match(driveIdRegex);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }
  return url;
}

export default function ProductCard({ product, reason }: Props) {
  const directImageSrc = getDirectImageUrl(product.image_url, product.name);

  return (
    <div className="glass-card p-5 flex flex-col gap-4 bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-400 transition-all duration-300 relative overflow-hidden group rounded-3xl">
      {/* Top Banner Tag */}
      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-slate-50 relative border border-slate-200 flex items-center justify-center p-2">
        <img
          src={directImageSrc}
          alt={product.name}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x400/f8fafc/059669?text=${encodeURIComponent(product.name)}`;
          }}
        />
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider bg-white/95 text-slate-900 border border-slate-300 shadow-md backdrop-blur-md">
            {product.category}
          </span>
        </div>
      </div>

      {/* Product Title & Description - Ultra Crisp Black Text */}
      <div className="flex-1 space-y-1.5">
        <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-slate-900 font-bold leading-relaxed line-clamp-2">
          {product.description}
        </p>
      </div>

      {/* Reason Box */}
      {reason && (
        <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-300 shadow-inner">
          <p className="text-xs text-slate-900 leading-relaxed font-bold">
            <span className="font-black text-emerald-950 uppercase tracking-wider text-[10px] block mb-0.5">Clinical Reason:</span>
            {reason}
          </p>
        </div>
      )}

      {/* Price & Buy Button */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-200">
        <div>
          <span className="text-[10px] text-slate-900 block font-black uppercase tracking-wider">Market Price</span>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>
        <a
          href={product.product_page_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary py-2.5 px-5 text-xs font-black shadow-md shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
        >
          <span>Buy Now</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
