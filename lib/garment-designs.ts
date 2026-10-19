import type { GarmentAppearance } from './garment-appearance';
import type { GarmentTypeId } from './catalog/taxonomy';

/** Original illustration presets. They never establish product construction or performance. */
const STYLES = {
  "short-sleeve-tee": [["Klasik bisiklet yaka","Classic crew"],["V yaka","V neck"],["Henley patlı","Henley placket"],["Cepli bol kesim","Oversized pocket tee"],["Raglan kol","Raglan sleeves"]],
  "long-sleeve-tee": [["Klasik uzun kol","Classic long sleeve"],["Henley patlı","Henley placket"],["Raglan kol","Raglan sleeves"],["Düşük omuz","Dropped shoulder"],["Yüksek yaka","High neck"]],
  "tank-top": [["Klasik askı","Classic straps"],["İnce askı","Fine straps"],["Yarışçı sırt kesimi","Racer cut"],["Kısa geniş kesim","Cropped boxy"],["Uzun kavisli etek","Long curved hem"]],
  "shirt": [["Klasik cepli","Classic pocket"],["Hakim yaka","Band collar"],["Kısa kol açık yaka","Short sleeve open collar"],["Çift cep","Twin pockets"],["Uzun overshirt","Long overshirt"]],
  "thermal-top": [["Yuvarlak yaka","Round neck"],["Yarım fermuar","Half zip"],["Yüksek yaka","High neck"],["Kontrast paneller","Contrast panels"],["Düz dikişli raglan","Flat seam raglan"]],
  "sweatshirt": [["Bisiklet yaka","Crewneck"],["Kapüşonlu","Pullover hoodie"],["Fermuarlı kapüşon","Zip hoodie"],["Yarım fermuar","Half zip"],["Kısa düşük omuz","Cropped dropped shoulder"]],
  "sweater": [["Yuvarlak yaka","Round neck"],["V yaka","V neck"],["Balıkçı yaka","Turtleneck"],["Saç örgü çizimi","Cable knit illustration"],["Polo yaka","Polo collar"]],
  "cardigan": [["V yaka düğmeli","V neck buttons"],["Yuvarlak yaka","Round neck"],["Uzun açık ön","Long open front"],["Fermuarlı","Zip front"],["Kısa kutu kesim","Cropped boxy"]],
  "fleece": [["Tam fermuar","Full zip"],["Yarım fermuar","Half zip"],["Kapüşonlu","Hooded"],["Çıtçıtlı pat","Snap placket"],["Omuz panelli","Shoulder panels"]],
  "light-jacket": [["Düğmeli kısa ceket","Short button jacket"],["Blazer silüeti","Blazer silhouette"],["Bomber silüeti","Bomber silhouette"],["Çift cepli ceket","Twin pocket jacket"],["Uzun gömlek ceket","Long shirt jacket"]],
  "windbreaker": [["Fermuarlı kapüşon","Zip hood"],["Yarım fermuarlı anorak","Half zip anorak"],["Dik yaka","Stand collar"],["Kısa kesim","Cropped cut"],["Asimetrik panel","Asymmetric panel"]],
  "rain-jacket": [["Kapüşonlu klasik","Classic hood"],["Uzun etek","Long hem"],["Anorak ön cep","Anorak front pocket"],["Omuz pelerinli","Shoulder cape"],["Kısa geniş kesim","Short boxy cut"]],
  "softshell": [["Dik yaka","Stand collar"],["Kapüşonlu","Hooded"],["Göğüs cepli","Chest pocket"],["Yan panelli","Side panels"],["Uzun arka etek","Dropped back hem"]],
  "puffer": [["Yatay bölmeli","Horizontal quilting"],["Şevron bölmeli","Chevron quilting"],["Kapüşonlu","Hooded"],["Kısa geniş kesim","Cropped boxy"],["Uzun silüet","Long silhouette"]],
  "coat-parka": [["Kruvaze kaban","Double breasted coat"],["Kuşaklı trenç","Belted trench"],["Kapüşonlu parka","Hooded parka"],["Dik yakalı kaban","Stand collar coat"],["Geniş yakalı uzun kaban","Long wide lapels"]],
  "jeans": [["Düz paça","Straight leg"],["Daralan paça","Tapered leg"],["Bol paça","Wide leg"],["İspanyol paça","Flared leg"],["Kargo cepli","Cargo pockets"]],
  "woven-trousers": [["Klasik düz","Classic straight"],["Pileli","Pleated"],["Bol paça","Wide leg"],["Bilekte daralan","Ankle tapered"],["Kargo cepli","Cargo pockets"]],
  "joggers": [["Lastik paça","Cuffed"],["Düz paça","Open hem"],["Kargo cepli","Cargo pockets"],["Kontrast şerit","Contrast stripe"],["Kısa rahat kesim","Cropped relaxed"]],
  "leggings": [["Klasik uzun","Classic full length"],["Kapri","Capri"],["Yan cepli","Side pockets"],["İspanyol paça","Flared"],["Kontrast panelli","Contrast panels"]],
  "shorts": [["Düz kısa","Classic short"],["Kargo cepli","Cargo pockets"],["Kavisli spor etek","Curved sport hem"],["Uzun bermuda","Long Bermuda"],["Pileli geniş","Pleated wide"]],
  "skirt": [["A kesim","A line"],["Düz kalem","Pencil"],["Pileli","Pleated"],["Anvelop","Wrap"],["Düğmeli midi","Button front midi"]],
  "dress": [["Askılı A kesim","Strap A line"],["Gömlek elbise","Shirt dress"],["Anvelop","Wrap"],["Kısa kollu düz","Short sleeve straight"],["Katlı uzun","Tiered long"]],
  "sneakers": [["Bağcıklı düşük bilek","Low lace up"],["Yüksek bilek","High top"],["Bağcıksız","Slip on"],["Panelli taban","Panelled sole"],["Cırt cırtlı","Hook and loop"]],
  "running-shoes": [["Düşük profilli","Low profile"],["Kalın tabanlı","Deep sole"],["Arazi dişleri","Trail lugs"],["Kontrast yan panel","Contrast side panel"],["Düz sade üst","Minimal upper"]],
  "sandals": [["Çift bant","Twin straps"],["Çapraz bant","Cross straps"],["Topuk bantlı","Heel strap"],["Parmak arası","Toe post"],["Üç bant","Three straps"]],
  "rain-boots": [["Uzun konç","Tall shaft"],["Kısa konç","Short shaft"],["Yan lastik","Elastic sides"],["Tokalı","Buckle detail"],["Bağcıklı ağız","Drawstring cuff"]],
  "winter-boots": [["Bağcıklı","Lace up"],["Kısa bilek","Short ankle"],["Katlı ağız","Folded cuff"],["Yan fermuar","Side zip"],["Uzun konç","Tall shaft"]],
  "socks": [["Orta konç","Crew"],["Kısa bilek","Ankle"],["Uzun konç","Knee length"],["Blok topuk burun","Blocked heel and toe"],["Çizgi şerit","Stripe bands"]],
  "beanie": [["Katlı kenar","Folded cuff"],["Gevşek tepe","Slouch"],["Ponponlu","Bobble"],["Kısa balıkçı","Short fisherman"],["Fitilli çizim","Ribbed illustration"]],
  "sun-hat": [["Kova şapka","Bucket"],["Geniş siper","Wide brim"],["Kep","Cap"],["Yumuşak geniş kenar","Soft wide brim"],["Vizör","Visor"]],
  "scarf": [["Klasik uzun","Classic long"],["İlmek boyunluk","Loop snood"],["Püsküllü geniş","Wide fringed"],["Üçgen fular","Triangle scarf"],["Kısa düğüm","Short knot"]],
  "gloves": [["Beş parmak","Five finger"],["Tek parmak","Mittens"],["Parmaksız","Fingerless"],["Uzun manşet","Long cuffs"],["Panelli eldiven","Panelled gloves"]],
  "polo-shirt": [["Klasik kısa kol","Classic short sleeve"],["Uzun kol","Long sleeve"],["Açık V pat","Open V placket"],["Kontrast yaka","Contrast collar"],["Fermuarlı pat","Zip placket"]],
  "blouse": [["Yuvarlak yaka","Round neck"],["Bağlamalı yaka","Tie neck"],["Anvelop","Wrap front"],["Balon kol","Volume sleeves"],["Kolsuz drapeli","Sleeveless drape"]],
  "gilet": [["Fermuarlı düz","Plain zip"],["Bölmeli yelek","Quilted vest"],["Çok cepli","Utility pockets"],["Düğmeli klasik","Buttoned waistcoat"],["Uzun kapüşonlu","Long hooded"]],
  "rain-poncho": [["Klasik panço","Classic poncho"],["Ön fermuarlı","Front zip"],["Çıtçıtlı yan","Side snaps"],["Ön cepli","Front pocket"],["Uzun bisiklet kesimi","Long cycling cut"]]
} as const;
export interface GarmentDesign {
  id: string;
  type: GarmentTypeId;
  variant: number;
  tr: string;
  en: string;
  appearance: Partial<GarmentAppearance>;
}
export function garmentDesigns(type: GarmentTypeId): GarmentDesign[] {
  return STYLES[type].map(([tr, en], variant) => ({
    id: type + ':' + variant, type, variant, tr, en,
    appearance: designAppearance(type, variant),
  }));
}
export function findGarmentDesign(type: GarmentTypeId | undefined, id: unknown): GarmentDesign | undefined {
  if (!type || typeof id !== 'string') return undefined;
  return garmentDesigns(type).find(design => design.id === id);
}
function designAppearance(type: GarmentTypeId, variant: number): Partial<GarmentAppearance> {
  const a: Partial<GarmentAppearance> = {};
  if (['shirt', 'light-jacket', 'coat-parka'].includes(type)) a.neckline = 'collar';
  if (type === 'polo-shirt') { a.neckline = 'polo'; a.sleeve = variant === 1 ? 'long' : 'short'; }
  if (type === 'gilet') { a.sleeve = 'none'; a.neckline = variant === 4 ? 'hood' : variant === 3 ? 'v' : 'turtle'; }
  if (type === 'rain-poncho' || type === 'rain-jacket') a.neckline = 'hood';
  if (type === 'short-sleeve-tee' && variant === 1 || type === 'sweater' && variant === 1 || type === 'cardigan' && variant === 0) a.neckline = 'v';
  if (type === 'long-sleeve-tee' && variant === 4 || type === 'sweater' && variant === 2 || type === 'thermal-top' && variant === 2) a.neckline = 'turtle';
  if (type === 'sweater' && variant === 4) a.neckline = 'polo';
  if (type === 'sweatshirt') a.neckline = variant === 1 || variant === 2 ? 'hood' : variant === 3 ? 'turtle' : 'crew';
  if (type === 'shirt' && variant === 2) a.sleeve = 'short';
  if (type === 'fleece') a.neckline = variant === 2 ? 'hood' : 'turtle';
  if (type === 'puffer' || type === 'softshell') a.neckline = variant === (type === 'puffer' ? 2 : 1) ? 'hood' : 'turtle';
  if (type === 'windbreaker') a.neckline = variant === 2 ? 'turtle' : 'hood';
  if (type === 'coat-parka' && variant === 2) a.neckline = 'hood';
  if (type === 'coat-parka' && variant === 3 || type === 'shirt' && variant === 1) a.neckline = 'turtle';
  if (type === 'short-sleeve-tee' && variant === 3) a.fit = 'oversized';
  if (type === 'rain-jacket' && variant === 1 || type === 'cardigan' && variant === 2) a.length = 'long';
  if (type === 'rain-jacket' && variant === 4 || type === 'cardigan' && variant === 4) { a.length = 'cropped'; a.fit = 'oversized'; }
  if (['jeans', 'woven-trousers'].includes(type)) a.fit = variant === 1 ? 'slim' : variant === 2 || variant === 3 ? 'oversized' : 'regular';
  if (variant === 4 && ['long-sleeve-tee', 'shirt', 'softshell', 'puffer', 'coat-parka', 'gilet', 'rain-poncho', 'dress'].includes(type)) a.length = 'long';
  if (variant === 3 && ['tank-top', 'windbreaker', 'puffer'].includes(type) || type === 'sweatshirt' && variant === 4) { a.length = 'cropped'; a.fit = 'oversized'; }
  if (type === 'leggings' && variant === 1 || type === 'joggers' && variant === 4 || type === 'woven-trousers' && variant === 3) a.length = 'cropped';
  if (type === 'shorts' && variant === 3) a.length = 'long';
  if (type === 'dress') { a.sleeve = variant === 1 ? 'long' : variant === 3 ? 'short' : 'none'; a.neckline = variant === 1 ? 'collar' : variant === 2 ? 'v' : 'crew'; }
  if (type === 'blouse') { a.sleeve = variant === 4 ? 'none' : 'long'; a.neckline = variant === 2 ? 'v' : 'crew'; }
  return a;
}

