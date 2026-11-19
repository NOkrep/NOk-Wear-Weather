import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { ClothingItem, WeatherConsensus, ThermalProfile, AiStylistResponse } from '@/lib/types';
import { canRankForWeather, getItemWarmth } from '@/lib/catalog-wardrobe';
import { AI_MAX_DESCRIPTION_LENGTH, decodeStylistImage, readStylistBody } from '@/lib/ai-stylist-input';
import { DRAFT_TYPE_IDS, rulesDraft, sanitizeAiDraft } from '@/lib/garment-draft';

const noStore = { 'Cache-Control': 'private, no-store' };
const maxConcurrent = 4;
const requestsPerMinute = 30;
let active = 0;
let windowStart = 0;
let attempts = 0;

function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...noStore, ...headers } });
}

function textField(value: unknown, max = AI_MAX_DESCRIPTION_LENGTH): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.length <= max);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin) {
    try {
      const caller = new URL(origin);
      if (!['http:', 'https:'].includes(caller.protocol) || caller.host !== req.headers.get('host')
        || req.headers.get('sec-fetch-site') === 'cross-site') return reply({ error: 'ORIGIN_REJECTED' }, 403);
    } catch { return reply({ error: 'ORIGIN_REJECTED' }, 403); }
  }
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return reply({ error: 'JSON_REQUIRED' }, 415);
  }
  // This route never consumes project credentials. A provider request uses the caller's own key.
  const apiKey = req.headers.get('x-gemini-key')?.trim() || '';
  if (apiKey && !/^[A-Za-z0-9_-]{20,200}$/.test(apiKey)) return reply({ error: 'INVALID_KEY' }, 400);
  // Browsers always send Origin on POST; a keyed call without it is a script using this server as a relay.
  if (apiKey && !origin) return reply({ error: 'ORIGIN_REJECTED' }, 403);
  // Single-process limits. Concurrency covers the time spent reading any body; the per-minute budget
  // only counts calls that may reach Gemini, so the free local rule engine cannot be starved by them.
  if (active >= maxConcurrent) return reply({ error: 'RATE_LIMIT' }, 429, { 'Retry-After': '5' });
  if (apiKey) {
    const now = Date.now();
    if (now - windowStart >= 60_000) { windowStart = now; attempts = 0; }
    if (attempts >= requestsPerMinute) {
      const retryAfter = Math.max(1, Math.ceil((windowStart + 60_000 - now) / 1000));
      return reply({ error: 'RATE_LIMIT' }, 429, { 'Retry-After': String(retryAfter) });
    }
    attempts++;
  }
  active++;
  try {
    const uploadSignal = AbortSignal.any([req.signal, AbortSignal.timeout(15_000)]);
    let body: Awaited<ReturnType<typeof readStylistBody>>;
    try { body = await readStylistBody(req, uploadSignal); }
    catch { return reply({ error: 'INVALID_BODY' }, uploadSignal.aborted ? 408 : 400); }
    if (body === null) return reply({ error: 'TOO_LARGE' }, 413);
    const mode = body.mode ?? 'stylist_advice';
    if (mode !== 'analyze_garment' && mode !== 'stylist_advice') return reply({ error: 'INVALID_MODE' }, 400);

    const generationLimits = {
      httpOptions: { retryOptions: { attempts: 1 } },
      automaticContinuation: false,
      abortSignal: AbortSignal.any([req.signal, AbortSignal.timeout(20_000)]),
      maxOutputTokens: 1024,
      thinkingConfig: { thinkingBudget: 0 },
    };

    // MODE 1: Multimodal Garment Tagging (Photo and/or Text Description -> ClothingItem JSON)
    if (mode === 'analyze_garment') {
      if (!textField(body.descriptionText)) return reply({ error: 'INVALID_DESCRIPTION' }, 400);
      const descriptionText = body.descriptionText?.trim() || '';
      const mimeType = body.mimeType ?? 'image/jpeg';
      let imageBase64: string | null = null;
      if (body.imageBase64 !== undefined) {
        if (!apiKey) return reply({ error: 'PHOTO_REQUIRES_KEY' }, 422);
        imageBase64 = decodeStylistImage(body.imageBase64, mimeType);
        if (!imageBase64) return reply({ error: 'INVALID_IMAGE' }, 400);
      }
      if (!descriptionText && !imageBase64) return reply({ error: 'EMPTY_DRAFT' }, 400);

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          const contents: any[] = [];

          if (imageBase64) {
            contents.push({
              inlineData: {
                data: imageBase64,
                mimeType,
              },
            });
          }

          contents.push(
            `Sen uzman bir tekstil mühendisi ve gardırop küratörüsün. Kullanıcının giysi fotoğrafını ve/veya açıklamasını ("${descriptionText}") analiz et.
Kurallar:
- Emin olmadığın alanı hiç yazma; uydurma. Isı ve koruma tahminlerin kullanıcıya yalnız öneri olarak gösterilecek, o onaylamadan kaydedilmeyecek.
- garmentTypeId yalnız şu kimliklerden biri olabilir: ${DRAFT_TYPE_IDS.join(', ')}.
- category yalnız şunlardan biri olabilir: "base", "mid", "outer", "bottom", "footwear", "accessory".
- warmth: 1 (çok ince yazlık) ile 5 (ağır kışlık) arasında tam sayı.
- waterResistance: "none", "light" veya "waterproof".
- windResistance: "low", "medium" veya "high".
- colorHex: fotoğraftaki baskın renk (#rrggbb). Fotoğraf yoksa ve açıklamada renk geçmiyorsa yazma.
- Tüm metinler Türkçe olmalıdır.`
          );

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: {
              ...generationLimits,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  garmentTypeId: { type: Type.STRING, enum: DRAFT_TYPE_IDS },
                  material: { type: Type.STRING },
                  warmth: { type: Type.INTEGER },
                  waterResistance: { type: Type.STRING },
                  windResistance: { type: Type.STRING },
                  colorName: { type: Type.STRING },
                  colorHex: { type: Type.STRING },
                },
                // WW-10 B2: only a name and a category are required; unknown fields stay unknown.
                required: ['name', 'category'],
              },
            },
          });

          if (response.text) return reply({ draft: sanitizeAiDraft(JSON.parse(response.text), descriptionText), modelUsed: 'gemini-2.5-flash' });
        } catch { /* A usable description can still produce a local draft. */ }
      }
      if (!descriptionText) return reply({ error: 'PHOTO_ANALYSIS_UNAVAILABLE' }, 502);

      // Local rules when no Gemini key is set: only what the user's own words say (WW-10 B2).
      return reply({ draft: rulesDraft(descriptionText), modelUsed: 'local-heuristic' });
    }

    // MODE 2: Personalized AI Stylist & Microclimate Reasoning
    const weather = body.weather as WeatherConsensus | undefined;
    const thermalProfile = (body.thermalProfile ?? { offsetC: 0, feedbackCount: 0, label: 'Standart' }) as ThermalProfile;
    const wardrobe = body.wardrobe ?? [];
    if (!textField(body.districtName, 160) || !textField(body.userActivity)
      || typeof thermalProfile.label !== 'string' || !textField(thermalProfile.label, 160) || !Number.isFinite(thermalProfile.offsetC)
      || !Array.isArray(wardrobe) || wardrobe.length > 200
      || wardrobe.some(item => !item || typeof item.name !== 'string'
        || typeof item.category !== 'string' || !textField(item.category, 24) || !textField(item.name, 160) || !textField(item.material, 260)
        || !textField(item.colorName, 100) || !textField(item.waterResistance ?? undefined, 40))
      || (weather !== undefined && (!weather || typeof weather.condition !== 'string' || !textField(weather.condition, 60)
        || ![weather.temp, weather.feelsLike, weather.humidity, weather.dewPoint, weather.windSpeed,
          weather.precipitationProb, weather.uvIndex].every(value => Number.isFinite(value))))) {
      return reply({ error: 'INVALID_STYLIST_INPUT' }, 400);
    }
    const districtName = body.districtName || 'Seçili Bölge';
    const userActivity = body.userActivity || 'Günlük şehir içi tempo';

    if (apiKey && weather) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const wardrobeSummary = wardrobe
          .filter(item => canRankForWeather(item, weather))
          .slice(0, 20)
          .map((i) => `- ${i.name} (${i.category}, ${i.material}, Isı:${getItemWarmth(i)}/5${i.personalWarmth ? ' kişisel tahmin' : ''}, Su:${i.waterResistance??'bilinmiyor'}, Renk:${i.colorName})`)
          .join('\n');

        const prompt = `Sen Weathrobe (Wear Weather) uygulamasının Baş Meteorolojik Stil ve Tekstil Mühendisisin.
Aşağıdaki canlı meteorolojik konsensüs, kullanıcının kişisel termal toleransı ve kendi gardırobundaki kıyafetlere göre Türkçe bir kombin önerisi oluştur. Kişisel ısı tahmini ölçüm veya üretici beyanı değildir. Bilinmeyen su/rüzgâr korumasını doğrulanmış gibi sunma; kumaş içeriğinden teknik koruma değeri türetme.

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
            ...generationLimits,
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
          return reply(result);
        }
      } catch { /* The deterministic advice is still available. */ }
    }

    // Deterministic Scientific Stylist Fallback (works out-of-the-box even before GEMINI_API_KEY is added)
    const effTemp = (weather?.feelsLike ?? 18) + (thermalProfile?.offsetC ?? 0);
    const precipitationProbability = weather?.precipitationProb ?? 0;
    const pickNames = wardrobe
      .filter((i) => {
        const warmth = getItemWarmth(i);
        if (warmth === null || !weather || !canRankForWeather(i, weather)) return false;
        if (effTemp <= 12) return warmth >= 3;
        if (effTemp >= 23) return warmth <= 2;
        return warmth >= 1 && warmth <= 3;
      })
      .slice(0, 4)
      .map((i) => i.name);

    const fallbackResponse: AiStylistResponse = {
      headline: `${districtName} (${weather?.temp ?? 18}°C) İçin Kişiselleştirilmiş Gardırop Sentezi`,
      outfitAdvice: `Hissedilen ${weather?.feelsLike ?? 17}°C sıcaklık ve kişisel termal profiliniz (${thermalProfile.label}) baz alındığında, "${userActivity}" planınız için dolabınızdaki nefes alan iç taban ile ${effTemp <= 16 ? 'rüzgar kesici dış katmanı modüler olarak' : 'hafif tekli üst katmanı'} eşleştirmeniz en yüksek termal konforu sağlar.`,
      fabricAndColorTip: `Çiy noktası ${weather?.dewPoint ?? 10}°C ve bağıl nem %${weather?.humidity ?? 60} seviyesinde. ${(weather?.dewPoint ?? 10) >= 15 ? 'Nem yüksek olduğu için sentetik polyester yerine %100 pamuk veya keten lifleri tercih edin.' : 'Nem dengeli; pamuklu dokumalar ve ince trikolar gün boyu ferah tutacaktır.'}`,
      travelOrActivityTip:
        precipitationProbability >= 40
          ? `%${precipitationProbability} yağış olasılığına karşı su itici dış katmanınızı ve koyu renkli alt giyimi tercih edin.`
          : `Akşam saatlerinde rüzgarın (${weather?.windSpeed ?? 12} km/s) etkisiyle hissedilen sıcaklık 3-4°C düşeceğinden kolay giyilip çıkarılabilir bir üst katmanı yanınızda bulundurun.`,
      recommendedItemNames: pickNames.length > 0 ? pickNames : ['Beyaz Pamuklu Basic Tişört', 'Açık Mavi Oxford Gömlek', 'Bej Su İtici Trençkot / Rüzgarlık'],
      modelUsed: 'Weathrobe Termal Kural Motoru',
      isFallback: true,
    };

    return reply(fallbackResponse);
  } catch {
    return reply({ error: 'STYLIST_UNAVAILABLE' }, 500);
  } finally {
    active--;
  }
}
