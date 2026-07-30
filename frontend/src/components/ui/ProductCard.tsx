import type { Product } from '@/types';

interface Props {
  product: Product;
  reason?: string;
}

function getDirectImageUrl(url: string | undefined, productName: string): string {
  if (!url) {
    return `https://placehold.co/400x400/f8fafc/059669?text=${encodeURIComponent(productName)}`;
  }

  // Convert Google Drive view URLs: drive.google.com/file/d/{ID}/view
  const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  // Convert Google Drive open?id={ID} URLs
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
    <div className="glass-card-hover p-5 flex flex-col gap-4 animate-fade-up bg-white border border-slate-200 shadow-sm relative overflow-hidden group rounded-2xl">
      {/* Image Container 1:1 ratio */}
      <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 relative border border-slate-200 flex items-center justify-center">
        <img
          src={directImageSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            // Fallback if Google Drive permissions block direct CDN loading
            (e.target as HTMLImageElement).src = `https://placehold.co/400x400/f8fafc/059669?text=${encodeURIComponent(product.name)}`;
          }}
        />
        <div className="absolute top-2 left-2">
          <span className="badge-grey text-[9px] uppercase font-bold tracking-wider backdrop-blur-md bg-white/90 text-slate-900 border border-slate-300 shadow-sm">
            {product.category}
          </span>
        </div>
      </div>

      {/* Name & description */}
      <div className="flex-1">
        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors tracking-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-xs text-slate-700 mt-1 leading-relaxed line-clamp-2 font-bold">
          {product.description}
        </p>
      </div>

      {/* Reason badge */}
      {reason && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <p className="text-xs text-emerald-900 leading-relaxed font-bold">
            <span className="font-black text-emerald-950">Why recommended: </span>{reason}
          </p>
        </div>
      )}

      {/* Price & Action */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-200">
        <div>
          <span className="text-[10px] text-slate-500 block font-black uppercase tracking-wider">Price</span>
          <span className="text-xl font-black text-slate-900 tracking-tight">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex gap-2">
          <a
            href={product.product_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary py-2.5 px-4 text-xs font-black shadow-md shadow-emerald-500/20"
          >
            Buy Now →
          </a>
        </div>
      </div>
    </div>
  );
}
