import type { Product } from '@/types';

interface Props {
  product: Product;
  reason?: string;
}

export default function ProductCard({ product, reason }: Props) {
  return (
    <div className="glass-card-hover p-5 flex flex-col gap-4 animate-fade-up">
      {/* Image */}
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-grey-900">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={e => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x225/1a1a1a/4ade80?text=${encodeURIComponent(product.name)}`;
          }}
        />
      </div>

      {/* Category */}
      <span className="badge-grey text-[10px]">{product.category}</span>

      {/* Name */}
      <div>
        <h3 className="text-sm font-bold text-white">{product.name}</h3>
        <p className="text-xs text-grey-500 mt-1 leading-relaxed line-clamp-2">{product.description}</p>
      </div>

      {/* Reason */}
      {reason && (
        <div className="p-3 rounded-xl bg-green-950/40 border border-green-900/40">
          <p className="text-xs text-green-400 leading-relaxed">
            <span className="font-semibold">Why recommended: </span>{reason}
          </p>
        </div>
      )}

      {/* Price */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/[0.05]">
        <span className="text-lg font-bold text-white">
          ₹{product.price.toLocaleString('en-IN')}
        </span>
        <div className="flex gap-2">
          <a
            href={product.product_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary py-2 px-3 text-xs"
          >
            View
          </a>
          <a
            href={product.product_page_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary py-2 px-3 text-xs"
          >
            Buy Now
          </a>
        </div>
      </div>
    </div>
  );
}
