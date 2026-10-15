import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ClothingItem, WeatherConsensus, ThermalProfile, AiStylistResponse } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode: 'analyze_garment' | 'stylist_advice' = body.mode || 'stylist_advice';

    const headerKey = req.headers.get('x-gemini-key')?.trim();
    const apiKey =
      headerKey ||
      process.env.GEMINI_API_KEY ||
      process.env.API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      '';

    // MODE 1: Multimodal Garment Tagging (Photo and/or Text Description -> ClothingItem JSON)
    if (mode === 'analyze_garment') {
      const descriptionText: string = body.descriptionText || '';
      const imageBase64: string | undefined = body.imageBase64;
      const mimeType: string = body.mimeType || 'image/jpeg';

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const contents: any[] = [];

          if (imageBase64) {
            const cleanBase64 = imageBase64.includes(',')
              ? imageBase64.split(',')[1]
              : imageBase64;
            contents.push({
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            });
          }

          contents.push(
            `Sen uzman bir tekstil mühendisi ve gardırop küratörüsün. Kullanıcının yüklediği giysi fotoğrafını ve/veya açıklamasını ("${descriptionText}") analiz ederek Weathrobe dijital gardırop formatında JSON döndür.
Kurallar:
- category yalnızca şunlardan biri olabilir: "base" (tişört/içlik), "mid" (gömlek/kazak/sweatshirt/hırka), "outer" (ceket/trençkot/mont/kaban/yağmurluk), "bottom" (pantolon/şort/etek), "footwear" (ayakkabı/bot/sneaker), "accessory" (şemsiye/şapka/atkı/gözlük).
- segment: "essential" veya "premium".
- warmth: 1 (çok ince yazlık) ile 5 (ağır kışlık) arasında tam sayı.
- waterResistance: "none", "light" veya "waterproof".
- windResistance: "low", "medium" veya "high".
- colorType: "light", "dark" veya "neutral".
- Tüm metinler Türkçe olmalıdır.`
          );

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  segment: { type: Type.STRING },
                  material: { type: Type.STRING },
                  warmth: { type: Type.INTEGER },
                  waterResistance: { type: Type.STRING },
                  windResistance: { type: Type.STRING },
                  colorName: { type: Type.STRING },
                  colorHex: { type: Type.STRING },
                  colorType: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: [
                  'name',
                  'category',
                  'segment',
                  'material',
                  'warmth',
                  'waterResistance',
                  'windResistance',
                  'colorName',
                  'colorHex',
                  'colorType',
                  'description',
                ],
              },
            },
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            const item: ClothingItem = {
              id: `w-ai-${Date.now()}`,
              name: parsed.name || 'Yeni Gardırop Parçası',
              category: ['base', 'mid', 'outer', 'bottom', 'footwear', 'accessory'].includes(parsed.category)
                ? parsed.category
                : 'mid',
              segment: parsed.segment === 'premium' ? 'premium' : 'essential',
              material: parsed.material || 'Pamuk Karışım',
              warmth: (Math.max(1, Math.min(5, Number(parsed.warmth) || 3)) as 1 | 2 | 3 | 4 | 5),
              waterResistance: ['none', 'light', 'waterproof'].includes(parsed.waterResistance)
                ? parsed.waterResistance
                : 'none',
              windResistance: ['low', 'medium', 'high'].includes(parsed.windResistance)
                ? parsed.windResistance
                : 'medium',
              colorName: parsed.colorName || 'Nötr Ton',
              colorHex: parsed.colorHex?.startsWith('#') ? parsed.colorHex : '#64748b',
              colorType: ['light', 'dark', 'neutral'].includes(parsed.colorType)
                ? parsed.colorType
                : 'neutral',
              description: parsed.description || 'Gemini AI tarafından analiz edilerek eklendi.',
              isUserOwned: true,
            };
            return NextResponse.json({ item, modelUsed: 'gemini-2.5-flash' });
          }
        } catch (aiErr) {
          console.error('Gemini analyze_garment error, using heuristic parser:', aiErr);
        }
      }

      // Intelligent Heuristic Fallback when Gemini API key is not yet entered
      const lower = descriptionText.toLowerCase();
      let category: ClothingItem['category'] = 'mid';
      if (lower.includes('tişört') || lower.includes('t-shirt') || lower.includes('içlik') || lower.includes('atlet')) {
        category = 'base';
      } else if (lower.includes('ceket') || lower.includes('mont') || lower.includes('kaban') || lower.includes('trençkot') || lower.includes('yağmurluk') || lower.includes('parka')) {
        category = 'outer';
      } else if (lower.includes('pantolon') || lower.includes('kot') || lower.includes('jean') || lower.includes('şort') || lower.includes('eşofman')) {
        category = 'bottom';
      } else if (lower.includes('ayakkabı') || lower.includes('bot') || lower.includes('sneaker') || lower.includes('loafer')) {
        category = 'footwear';
      } else if (lower.includes('şemsiye') || lower.includes('şapka') || lower.includes('atkı') || lower.includes('bere') || lower.includes('gözlük')) {
        category = 'accessory';
      }

      const isWaterproof = lower.includes('su geçirmez') || lower.includes('gore-tex') || lower.includes('yağmurluk') || lower.includes('deri bot');
      const isWarm = lower.includes('kışlık') || lower.includes('yün') || lower.includes('polar') || lower.includes('kaşmir') || lower.includes('mont') || lower.includes('kaban');
      const isLight = lower.includes('keten') || lower.includes('yazlık') || lower.includes('ince') || lower.includes('tişört') || lower.includes('şort');

      let colorName = 'Antrasit / Nötr';
      let colorHex = '#475569';
      let colorType: ClothingItem['colorType'] = 'neutral';
      if (lower.includes('beyaz') || lower.includes('krem') || lower.includes('ekru')) {
        colorName = 'Beyaz / Ekru';
        colorHex = '#f8fafc';
        colorType = 'light';
      } else if (lower.includes('bej') || lower.includes('kum') || lower.includes('taş')) {
        colorName = 'Bej';
        colorHex = '#d6d3d1';
        colorType = 'light';
      } else if (lower.includes('siyah')) {
        colorName = 'Siyah';
        colorHex = '#18181b';
        colorType = 'dark';
      } else if (lower.includes('lacivert') || lower.includes('mavi')) {
        colorName = 'Lacivert / Mavi';
        colorHex = '#1e3a8a';
        colorType = 'dark';
      } else if (lower.includes('yeşil') || lower.includes('haki')) {
        colorName = 'Haki Yeşili';
        colorHex = '#3f6212';
        colorType = 'neutral';
      }

      const fallbackItem: ClothingItem = {
        id: `w-local-${Date.now()}`,
        name: descriptionText.trim() || 'Yeni Gardırop Parçası',
        category,
        segment: lower.includes('kaşmir') || lower.includes('merinos') || lower.includes('gore-tex') || lower.includes('ipek') ? 'premium' : 'essential',
        material: lower.includes('keten') ? 'Doğal Keten' : lower.includes('yün') ? 'Yün Dokuma' : lower.includes('deri') ? 'Deri' : 'Pamuk / Karışım Dokuma',
        warmth: isWarm ? 4 : isLight ? 1 : 3,
        waterResistance: isWaterproof ? 'waterproof' : category === 'outer' ? 'light' : 'none',
        windResistance: category === 'outer' ? 'high' : 'medium',
        colorName,
        colorHex,
        colorType,
        description: 'Akıllı kural motoru tarafından sınıflandırıldı.',
        isUserOwned: true,
      };

      return NextResponse.json({ item: fallbackItem, modelUsed: 'local-heuristic' });
    }

    // MODE 2: Personalized AI Stylist & Microclimate Reasoning
    const weather: WeatherConsensus = body.weather;
    const districtName: string = body.districtName || 'Seçili Bölge';
    const wardrobe: ClothingItem[] = body.wardrobe || [];
    const thermalProfile: ThermalProfile = body.thermalProfile || { offsetC: 0, feedbackCount: 0, label: 'Standart' };
    const userActivity: string = body.userActivity || 'Günlük şehir içi tempo';

    if (apiKey && weather) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const wardrobeSummary = wardrobe
          .slice(0, 20)
          .map((i) => `- ${i.name} (${i.category}, ${i.material}, Sıcaklık:${i.warmth}/5, Su:${i.waterResistance}, Renk:${i.colorName})`)
          .join('\n');

        const prompt = `Sen Weathrobe (Wear Weather) uygulamasının Baş Meteorolojik Stil ve Tekstil Mühendisisin.
Aşağıdaki canlı meteorolojik konsensüs, kullanıcının kişisel termal toleransı ve kendi gardırobundaki kıyafetlere göre Türkçe, bilimsel (çiy noktası, rüzgar soğuğu, optik renk yansıması) ve doğrudan uygulanabilir bir kombin reçetesi oluştur.

Konum: ${districtName}
Canlı Hava Konsensüsü:
- Sıcaklık: ${weather.temp}°C (Hissedilen: ${weather.feelsLike}°C)
- Nem: %${weather.humidity}, Çiy Noktası: ${weather.dewPoint}°C
- Rüzgar: ${weather.windSpeed} km/s, Yağış İhtimali: %${weather.precipitationProb}, UV: ${weather.uvIndex}
- Durum: ${weather.condition}

Kullanıcı Termal Profili: ${thermalProfile.label} (Ofset: ${thermalProfile.offsetC}°C)
Kullanıcının Bugünkü Planı / Aktivitesi: "${userActivity}"

Kullanıcının Dijital Gardırobundaki Parçalar:
${wardrobeSummary}

Lütfen kullanıcının kendi gardırobundaki parçalara öncelik vererek JSON şemasına uygun yanıt üret.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                outfitAdvice: { type: Type.STRING },
                fabricAndColorTip: { type: Type.STRING },
                travelOrActivityTip: { type: Type.STRING },
                recommendedItemNames: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                'headline',
                'outfitAdvice',
                'fabricAndColorTip',
                'travelOrActivityTip',
                'recommendedItemNames',
              ],
            },
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const result: AiStylistResponse = {
            headline: parsed.headline,
            outfitAdvice: parsed.outfitAdvice,
            fabricAndColorTip: parsed.fabricAndColorTip,
            travelOrActivityTip: parsed.travelOrActivityTip,
            recommendedItemNames: parsed.recommendedItemNames || [],
            modelUsed: 'Gemini 2.5 Flash',
            isFallback: false,
          };
          return NextResponse.json(result);
        }
      } catch (err) {
        console.error('Gemini stylist_advice error, falling back to deterministic engine:', err);
      }
    }

    // Deterministic Scientific Stylist Fallback (works out-of-the-box even before GEMINI_API_KEY is added)
    const effTemp = (weather?.feelsLike ?? 18) + (thermalProfile?.offsetC ?? 0);
    const pickNames = wardrobe
      .filter((i) => {
        if (effTemp <= 12) return i.warmth >= 3;
        if (effTemp >= 23) return i.warmth <= 2;
        return i.warmth >= 1 && i.warmth <= 3;
      })
      .slice(0, 4)
      .map((i) => i.name);

    const fallbackResponse: AiStylistResponse = {
      headline: `${districtName} (${weather?.temp ?? 18}°C) İçin Kişiselleştirilmiş Gardırop Sentezi`,
      outfitAdvice: `Hissedilen ${weather?.feelsLike ?? 17}°C sıcaklık ve kişisel termal profiliniz (${thermalProfile.label}) baz alındığında, "${userActivity}" planınız için dolabınızdaki nefes alan iç taban ile ${effTemp <= 16 ? 'rüzgar kesici dış katmanı modüler olarak' : 'hafif tekli üst katmanı'} eşleştirmeniz en yüksek termal konforu sağlar.`,
      fabricAndColorTip: `Çiy noktası ${weather?.dewPoint ?? 10}°C ve bağıl nem %${weather?.humidity ?? 60} seviyesinde. ${(weather?.dewPoint ?? 10) >= 15 ? 'Nem yüksek olduğu için sentetik polyester yerine %100 pamuk veya keten lifleri tercih edin.' : 'Nem dengeli; pamuklu dokumalar ve ince trikolar gün boyu ferah tutacaktır.'}`,
      travelOrActivityTip:
        (weather?.precipitationProb ?? 0) >= 40
          ? `%${weather.precipitationProb} yağış olasılığına karşı su itici dış katmanınızı ve koyu renkli alt giyimi tercih edin.`
          : `Akşam saatlerinde rüzgarın (${weather?.windSpeed ?? 12} km/s) etkisiyle hissedilen sıcaklık 3-4°C düşeceğinden kolay giyilip çıkarılabilir bir üst katmanı yanınızda bulundurun.`,
      recommendedItemNames: pickNames.length > 0 ? pickNames : ['Beyaz Pamuklu Basic Tişört', 'Açık Mavi Oxford Gömlek', 'Bej Su İtici Trençkot / Rüzgarlık'],
      modelUsed: 'Weathrobe Termal Kural Motoru (Canlı Gemini AI için Kaynaklar menüsünden GEMINI_API_KEY ekleyebilirsiniz)',
      isFallback: true,
    };

    return NextResponse.json(fallbackResponse);
  } catch (err) {
    console.error('AI Stylist route error:', err);
    return NextResponse.json({ error: 'Stil analizi yapılamadı' }, { status: 500 });
  }
}
