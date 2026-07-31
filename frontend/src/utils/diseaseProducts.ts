import type { Product, DiseaseResult } from '@/types';

export function getDiseaseProductRecommendations(
  result: DiseaseResult,
  allProducts: Product[]
): Product[] {
  if (!result || !result.possible_condition) return [];

  const condition = result.possible_condition.toLowerCase();
  const signs = (result.visible_signs || []).map(s => s.toLowerCase()).join(' ');
  const combined = `${condition} ${signs}`;

  const targetIds = new Set<string>();

  // 1. Clinical / Subclinical Mastitis
  if (combined.includes('mastitis') || combined.includes('udder') || combined.includes('teat')) {
    targetIds.add('VDG1-601-A01-1UNT'); // Quadmastest Device
    targetIds.add('VDD1-102-A01-1UNT'); // CMT Paddle
    targetIds.add('VDD3-203-A01-001K'); // MooFoam
    targetIds.add('VDD3-201-A01-001K'); // FineKine
    targetIds.add('VDD3-202-A01-001K'); // Iogiene
    targetIds.add('VDD3-205-A01-001L'); // H-Udderon
    targetIds.add('VDD2-301-A01-0200M'); // Mastoveda Spray
  }

  // 2. Lumpy Skin Disease
  if (combined.includes('lumpy') || combined.includes('nodule') || combined.includes('lsd')) {
    targetIds.add('VDD2-302-A01-200M'); // Tic Tick Tic
    targetIds.add('VDD2-303-A01-500G'); // Tick Talc
  }

  // 3. Foot and Mouth Disease (FMD)
  if (combined.includes('foot') || combined.includes('mouth') || combined.includes('fmd') || combined.includes('drool') || combined.includes('blister')) {
    targetIds.add('VDD1-406-A01-01TK'); // FMD Antibody Rapid Test
    targetIds.add('VDD1-407-A01-01TK'); // FMD DIVA Rapid Test
  }

  // 4. Tick Infestation
  if (combined.includes('tick') || combined.includes('cluster') || combined.includes('irritation')) {
    targetIds.add('VDD2-302-A01-200M'); // Tic Tick Tic
    targetIds.add('VDD2-303-A01-500G'); // Tick Talc
  }

  // 5. Suspected Theileriosis
  if (combined.includes('theileria') || combined.includes('lymph node') || combined.includes('pale')) {
    targetIds.add('VDD1-413-A01-01TK'); // Theileria Rapid Test
    targetIds.add('VDD2-302-A01-200M'); // Tic Tick Tic
    targetIds.add('VDS1-509-A01-001L'); // NutraKine Liver Tonic
    targetIds.add('VDS1-507-A01-300G'); // NutraKine Phos+
  }

  // 6. IBR Respiratory Disease
  if (combined.includes('ibr') || combined.includes('nasal') || combined.includes('red nose') || combined.includes('cough')) {
    targetIds.add('VDD1-409-A01-01TK'); // Bovine IBR Rapid Test
  }

  // 7. Haemorrhagic Septicaemia (HS)
  if (combined.includes('septicaemia') || combined.includes('hs') || combined.includes('neck swelling') || combined.includes('throat')) {
    targetIds.add('VDD1-408-A01-01TK'); // HS Rapid Test
  }

  // 8. Bovine Tuberculosis (TB)
  if (combined.includes('tuberculosis') || combined.includes('tb') || combined.includes('chronic cough')) {
    targetIds.add('VDD1-403-A01-01TK'); // Bovine TB Rapid Test
  }

  // 9. Brucellosis Suspicion
  if (combined.includes('brucellosis') || combined.includes('brucella') || combined.includes('abortion') || combined.includes('retained placenta')) {
    targetIds.add('VDD1-404-A01-01TK'); // Brucella Antibody Test
    targetIds.add('VDD1-405-A01-01TK'); // Brucella Milk Test Strip
  }

  // 10. Leptospirosis Suspicion
  if (combined.includes('leptospirosis') || combined.includes('leptospira') || combined.includes('yellowish')) {
    targetIds.add('VDD1-402-A01-01TK'); // Leptospira Rapid Test
  }

  // 11. Salmonellosis Suspicion
  if (combined.includes('salmonella') || combined.includes('salmonellosis') || combined.includes('diarrhoea') || combined.includes('dirty tail')) {
    targetIds.add('VDD1-411-A01-01TK'); // Salmonella Rapid Test
  }

  // 12. Listeriosis Suspicion
  if (combined.includes('listeria') || combined.includes('listeriosis') || combined.includes('circling') || combined.includes('head tilt')) {
    targetIds.add('VDD1-410-A01-01TK'); // Listeria Rapid Test
  }

  // 13. Anthrax Suspicion
  if (combined.includes('anthrax') || combined.includes('bleeding from body')) {
    targetIds.add('VDD1-401-A01-01TK'); // Anthrax Rapid Test
  }

  // 14. Mange or Lice Infestation
  if (combined.includes('mange') || combined.includes('lice') || combined.includes('scratching') || combined.includes('thick skin')) {
    targetIds.add('VDD2-303-A01-500G'); // Tick Talc
    targetIds.add('VDS1-510-A01-100M'); // NutraKine D-Wormer
  }

  // 15. Weakness After Calving
  if (combined.includes('calving') || combined.includes('weakness after') || combined.includes('post-calving')) {
    targetIds.add('VDS1-505-A01-005L'); // NutraKine Calcdex 1L
    targetIds.add('VDS1-504-A01-001L'); // NutraKine MastoVita
  }

  // 16. Poor Calf Growth
  if (combined.includes('calf') || combined.includes('growth')) {
    targetIds.add('VDS1-511-A01-010K'); // ServaTac Milk Replacer
  }

  // Filter products by matched target IDs
  const matched = allProducts.filter(p => targetIds.has(p.id));

  if (matched.length > 0) return matched;

  // Keyword fallback search if exact ID array was empty
  return allProducts.filter(p => {
    const name = p.name.toLowerCase();
    if (combined.includes('mastitis') && (name.includes('cmt') || name.includes('finekine') || name.includes('iogiene'))) return true;
    if (combined.includes('tick') && (name.includes('tick') || name.includes('wormer'))) return true;
    return false;
  }).slice(0, 4);
}
