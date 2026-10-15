'use client';

import React, { useState, useRef } from 'react';
import { ClothingItem, BudgetSegment } from '@/lib/types';
import {
  addWardrobeItem,
  removeWardrobeItem,
  resetWardrobeToDefaults,
} from '@/lib/wardrobe-storage';
import { getStoredCustomKeys } from '@/lib/weather-service';
import {
  X,
  Shirt,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  RotateCcw,
  Copy,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: ClothingItem[];
  onWardrobeChange: (updated: ClothingItem[]) => void;
}

const CATEGORY_LABELS: Record<ClothingItem['category'], string> = {
  base: 'İç Katman',
  mid: 'Orta Katman',
  outer: 'Dış Katman',
  bottom: 'Alt Giyim',
  footwear: 'Ayakkabı',
  accessory: 'Aksesuar',
};

export function WardrobeModal({
  isOpen,
  onClose,
  wardrobe,
  onWardrobeChange,
}: WardrobeModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ClothingItem['category']>('all');
  const [aiDescription, setAiDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Manual form states
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState<ClothingItem['category']>('mid');
  const [manualMaterial, setManualMaterial] = useState('Pamuklu Dokuma');
  const [manualWarmth, setManualWarmth] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [manualWater, setManualWater] = useState<ClothingItem['waterResistance']>('none');
  const [manualWind, setManualWind] = useState<ClothingItem['windResistance']>('medium');
  const [manualColorName, setManualColorName] = useState('Lacivert');
  const [manualColorHex, setManualColorHex] = useState('#1e3a8a');
  const [manualSegment, setManualSegment] = useState<BudgetSegment>('essential');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const filteredItems =
    selectedCategory === 'all'
      ? wardrobe
      : wardrobe.filter((item) => item.category === selectedCategory);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAiAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiDescription.trim() && !imagePreview) return;

    setIsAnalyzing(true);
    try {
      const customKeys = getStoredCustomKeys();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (customKeys.geminiApiKey?.trim()) {
        headers['x-gemini-key'] = customKeys.geminiApiKey.trim();
      }

      const res = await fetch('/api/ai-stylist', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          mode: 'analyze_garment',
          descriptionText: aiDescription,
          imageBase64: imagePreview || undefined,
          mimeType: imageMimeType,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.item) {
          const updated = addWardrobeItem(data.item);
          onWardrobeChange(updated);
          setAiDescription('');
          setImagePreview(null);
        }
      }
    } catch (err) {
      console.error('Error adding garment via AI:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const newItem: ClothingItem = {
      id: `w-man-${Date.now()}`,
      name: manualName.trim(),
      category: manualCategory,
      segment: manualSegment,
      material: manualMaterial.trim() || 'Pamuk Karışım',
      warmth: manualWarmth,
      waterResistance: manualWater,
      windResistance: manualWind,
      colorName: manualColorName.trim() || 'Nötr',
      colorHex: manualColorHex,
      colorType:
        manualColorHex.toLowerCase() === '#ffffff' || manualColorHex.toLowerCase() === '#f8fafc'
          ? 'light'
          : 'neutral',
      description: 'Kullanıcı tarafından manuel olarak gardıroba eklendi.',
      isUserOwned: true,
    };

    const updated = addWardrobeItem(newItem);
    onWardrobeChange(updated);
    setManualName('');
    setShowManualForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = removeWardrobeItem(id);
    onWardrobeChange(updated);
  };

  const handleReset = () => {
    const updated = resetWardrobeToDefaults();
    onWardrobeChange(updated);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(wardrobe, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Dijital Gardırobum (My Wardrobe)
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  v0.3.0 &bull; {wardrobe.length} Parça
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kendi kıyafetlerinizi fotoğraf veya kısa açıklamayla ekleyin; kombinler doğrudan sizin dolabınızdan üretilsin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Multimodal Garment Adder Box */}
        <form
          onSubmit={handleAiAdd}
          className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-500/25 space-y-3"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-300">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Gemini AI ile Hızlı Giysi Tanıma (Fotoğraf veya Metin)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-500 flex items-center gap-1"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showManualForm ? 'Manuel Formu Gizle' : 'Manuel Özellik Seçerek Ekle'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div className="sm:col-span-7">
              <input
                type="text"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Örn: Zümrüt yeşili merinos yünü kazak, Siyah su geçirmez Gore-Tex mont..."
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                  imagePreview
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{imagePreview ? 'Fotoğraf Hazır' : 'Fotoğraf Seç'}</span>
              </button>
            </div>

            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={isAnalyzing || (!aiDescription.trim() && !imagePreview)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analiz Ediliyor...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Dolaba Ekle</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {imagePreview && (
            <div className="flex items-center gap-3 pt-1">
              <img
                src={imagePreview}
                alt="Yüklenen kıyafet önizlemesi"
                className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-700"
              />
              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                <span className="font-semibold block">Görsel analize hazır</span>
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="text-rose-500 hover:underline"
                >
                  Görseli Kaldır
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Optional Manual Form */}
        {showManualForm && (
          <form
            onSubmit={handleManualAdd}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
          >
            <div className="font-bold text-slate-800 dark:text-slate-200">
              Manuel Kıyafet Parametreleri
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Parça Adı:</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Örn: Keten Bej Gömlek"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Kategori:</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="base">İç Katman (Tişört/İçlik)</option>
                  <option value="mid">Orta Katman (Gömlek/Kazak/Hırka)</option>
                  <option value="outer">Dış Katman (Ceket/Mont/Trençkot)</option>
                  <option value="bottom">Alt Giyim (Pantolon/Şort)</option>
                  <option value="footwear">Ayakkabı / Bot</option>
                  <option value="accessory">Aksesuar (Şemsiye/Şapka/Atkı)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Kumaş / Materyal:</label>
                <input
                  type="text"
                  value={manualMaterial}
                  onChange={(e) => setManualMaterial(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Isı Yalıtımı (1=Çok İnce, 5=Kışlık):
                </label>
                <select
                  value={manualWarmth}
                  onChange={(e) => setManualWarmth(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value={1}>1 - Çok İnce (Yazlık)</option>
                  <option value={2}>2 - Hafif (Ilıman)</option>
                  <option value={3}>3 - Orta (Geçiş Mevsimi)</option>
                  <option value={4}>4 - Sıcak Tutan (Soğuk Hava)</option>
                  <option value={5}>5 - Tam Kışlık (Ağır Yalıtım)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Su Direnci:</label>
                <select
                  value={manualWater}
                  onChange={(e) => setManualWater(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="none">Standart (Su Geçirir)</option>
                  <option value="light">Su İtici (Hafif Yağmur)</option>
                  <option value="waterproof">Tam Su Geçirmez (Membran)</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] text-slate-500 mb-1">Renk Adı & Kodu:</label>
                  <input
                    type="text"
                    value={manualColorName}
                    onChange={(e) => setManualColorName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <input
                  type="color"
                  value={manualColorHex}
                  onChange={(e) => setManualColorHex(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              >
                Manuel Olarak Kaydet
              </button>
            </div>
          </form>
        )}

        {/* Category Filter Tabs & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-sky-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Tümü ({wardrobe.length})
            </button>
            {(['base', 'mid', 'outer', 'bottom', 'footwear', 'accessory'] as const).map((cat) => {
              const count = wardrobe.filter((i) => i.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-sky-500 text-white font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyJson}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-[11px] font-semibold flex items-center gap-1"
            >
              {copiedJson ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedJson ? 'JSON Kopyalandı' : 'Dolabı JSON Kopyala'}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 text-[11px] font-semibold flex items-center gap-1"
              title="Varsayılan Başlangıç Gardırobuna Dön"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Varsayılana Dön</span>
            </button>
          </div>
        </div>

        {/* Wardrobe Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2.5"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border border-slate-200 dark:border-slate-700">
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: item.colorHex }}
                      title={item.colorName}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Dolaptan Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <span className="truncate max-w-[120px]">{item.material}</span>
                <span>Isı: {item.warmth}/5 &bull; Su: {item.waterResistance === 'waterproof' ? 'Tam' : item.waterResistance === 'light' ? 'Hafif' : 'Yok'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
