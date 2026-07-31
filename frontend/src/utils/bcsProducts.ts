import type { Product } from '@/types';

export interface BCSRecommendationResult {
  products: Product[];
  guidance: string;
}

export function getBCSProductRecommendations(
  score: number,
  allProducts: Product[]
): BCSRecommendationResult {
  if (score <= 0) {
    return { products: [], guidance: 'Invalid subject or image.' };
  }

  // BCS 1: NutraKine Gain + health and parasite assessment.
  if (score < 1.75) {
    const prods = allProducts.filter(p =>
      p.id === 'VDS1-503-A01-500G' || p.name.toLowerCase().includes('nutrakine gain')
    );
    return {
      products: prods.length > 0 ? prods : allProducts.filter(p => p.name.toLowerCase().includes('gain')).slice(0, 1),
      guidance: 'BCS 1 (Emaciated): NutraKine Gain + health and parasite assessment required.',
    };
  }

  // BCS 2: NutraKine Gain, with Liver Tonic or Phos+ based on symptoms.
  if (score < 2.75) {
    const prods = allProducts.filter(p =>
      ['VDS1-503-A01-500G', 'VDS1-509-A01-001L', 'VDS1-507-A01-300G'].includes(p.id) ||
      ['nutrakine gain', 'liver tonic', 'phos+'].some(k => p.name.toLowerCase().includes(k))
    );
    return {
      products: prods,
      guidance: 'BCS 2 (Thin): NutraKine Gain, with Liver Tonic or Phos+ based on symptoms.',
    };
  }

  // BCS 3: Milk Booster, Fertility Booster or Calcdex based on production stage.
  if (score < 3.75) {
    const prods = allProducts.filter(p =>
      ['VDS1-502-A01-500G', 'VDS1-501-A01-500G', 'VDS1-505-A01-005L', 'VDS1-506-A01-500M'].includes(p.id) ||
      ['milk booster', 'fertility booster', 'calcdex'].some(k => p.name.toLowerCase().includes(k))
    );
    return {
      products: prods,
      guidance: 'BCS 3 (Ideal): Milk Booster, Fertility Booster or Calcdex based on production stage.',
    };
  }

  // BCS 4: No weight-gain supplement; ration correction required.
  if (score < 4.5) {
    return {
      products: [],
      guidance: 'BCS 4 (Overconditioned): No weight-gain supplement; ration correction required.',
    };
  }

  // BCS 5: No automatic product recommendation; veterinary review required.
  return {
    products: [],
    guidance: 'BCS 5 (Obese): No automatic product recommendation; veterinary review required.',
  };
}
