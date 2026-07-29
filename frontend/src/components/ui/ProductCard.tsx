import type { Product } from '@/types';

interface Props {
  product: Product;
  reason?: string;
}

export default function ProductCard({ product, reason }: Props) {
  return (
    <div className="glass-card-hover p-5 flex flex-col gap-4 animate-fade-up border border-white/10 relative overflow-hidden group">
      {/* Image */}
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-zinc-950 relative">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x225/12151c/34d399?text=${encodeURIComponent(product.name)}`;
          }}
        />
        <div className="absolute top-2 left-2">
          <span className="badge-grey text-[9px] uppercase font-bold tracking-wider backdrop-blur-md bg-black/60">{product.category}</span>
        </div>
      </div>

      {/* Name & description */}
      <div className="flex-1">
        <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors tracking-tight">{product.name}</h3>
        <p className="text-xs text-grey-400 mt-1 leading-relaxed line-clamp-2 font-medium">{product.description}</p>
      </div>

      {/* Reason badge */}
      {reason && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(34,197,94,0.1)]">
          <p className="text-xs text-emerald-300 leading-relaxed font-medium">
            <span className="font-bold text-emerald-400">Why recommended: </span>{reason}
          </p>
        </div>
      )}

      {/* Price & Action */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/10">
        <div>
          <span className="text-xs text-grey-500 block font-bold uppercase tracking-wider">Price</span>
          <span className="text-xl font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex gap-2">
          <a
            href={product.product_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary py-2.5 px-4 text-xs font-bold shadow-lg"
          >
            Buy Now →
          </a>
        </div>
      </div>
    </div>
  );
}
