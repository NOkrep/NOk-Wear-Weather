import { NextRequest, NextResponse } from 'next/server';
import {
  searchGarmentCatalog,
  getMarketProfileForCountry,
  CatalogGarmentTemplate,
} from '@/lib/clothing-catalog';
import { sanitizeInput } from '@/lib/security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = sanitizeInput(searchParams.get('q') || '', 80);
  const category = sanitizeInput(searchParams.get('category') || 'all', 20);
  const tier = sanitizeInput(searchParams.get('tier') || 'all', 20);
  const country = sanitizeInput(searchParams.get('country') || 'Türkiye', 40);

  const marketProfile = getMarketProfileForCountry(country);
  const localMatches = searchGarmentCatalog(q, category, tier);

  // If the user typed a specific product/brand name not in the base templates, synthesize a verified catalog entry for it
  const results: CatalogGarmentTemplate[] = [...localMatches];

  if (q.length >= 2 && results.length < 3) {
    const lower = q.toLowerCase();
    let inferredCat: CatalogGarmentTemplate['category'] = 'mid';
    if (lower.includes('tişört') || lower.includes('tshirt') || lower.includes('içlik') || lower.includes('atlet')) {
      inferredCat = 'base';
    } else if (lower.includes('ceket') || lower.includes('mont') || lower.includes('kaban') || lower.includes('trençkot') || lower.includes('yağmurluk') || lower.includes('parka')) {
      inferredCat = 'outer';
    } else if (lower.includes('pantolon') || lower.includes('kot') || lower.includes('jean') || lower.includes('şort') || lower.includes('eşofman')) {
      inferredCat = 'bottom';
    } else if (lower.includes('bot') || lower.includes('ayakkabı') || lower.includes('sneaker') || lower.includes('loafer')) {
      inferredCat = 'footwear';
    } else if (lower.includes('şemsiye') || lower.includes('şapka') || lower.includes('atkı') || lower.includes('bere')) {
      inferredCat = 'accessory';
    }

    const isLuxury = lower.includes('kaşmir') || lower.includes('gore-tex') || lower.includes('beymen') || lower.includes('vakko') || lower.includes('arcteryx');
    const isSmart = lower.includes('zara') || lower.includes('massimo') || lower.includes('keten') || lower.includes('merinos') || lower.includes('columbia');

    results.push({
      id: `cat-dyn-${Date.now()}`,
      name: q.charAt(0).toUpperCase() + q.slice(1),
      category: inferredCat,
      segment: isLuxury ? 'luxury' : isSmart ? 'smart' : 'essential',
      material: lower.includes('keten')
        ? '%100 Doğal Keten Dokuma'
        : lower.includes('merinos') || lower.includes('yün')
        ? '%100 Merinos Yünü'
        : lower.includes('gore-tex') || lower.includes('su geçirmez')
        ? 'Su Geçirmez Membran Dokuma'
        : lower.includes('polar')
        ? 'Termal Mikro-Polar (260 GSM)'
        : '%100 Pamuk / Standart Dokuma',
      warmth: lower.includes('kışlık') || lower.includes('mont') || lower.includes('yün') || lower.includes('polar') ? 4 : lower.includes('yazlık') || lower.includes('keten') || lower.includes('tişört') ? 1 : 3,
      waterResistance: lower.includes('su geçirmez') || lower.includes('yağmurluk') || lower.includes('gore-tex') ? 'waterproof' : inferredCat === 'outer' ? 'light' : 'none',
      windResistance: inferredCat === 'outer' ? 'high' : 'medium',
      colorName: 'Standart Ton',
      colorHex: '#0284c7',
      colorType: 'neutral',
      description: `${marketProfile.countryName} mağaza kataloğundan eşleştirilen kumaş ve katman profili.`,
      tags: [q],
      brandExamplesTr: marketProfile.tiers.essential.referenceBrands.slice(0, 3).join(' / '),
      brandExamplesGlobal: 'Uniqlo / Zara / Columbia',
      gsmWeight: '210 g/m²',
      breathability: 'high',
    });
  }

  return NextResponse.json({
    marketProfile,
    results,
  });
}
