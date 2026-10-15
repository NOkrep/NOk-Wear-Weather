'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClothingItem, BudgetSegment } from '@/lib/types';
import {
  addWardrobeItem,
  removeWardrobeItem,
  resetWardrobeToDefaults,
} from '@/lib/wardrobe-storage';
import {
  CatalogGarmentTemplate,
  getMarketProfileForCountry,
} from '@/lib/clothing-catalog';
import { getStoredCustomKeys } from '@/lib/weather-service';
import {
  X,
  Shirt,
  Sparkles,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Upload,
} from 'lucide-react';

interface WardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardrobe: ClothingItem[];
  onWardrobeChange: (updated: ClothingItem[]) => void;
  currentCountry?: string;
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
  currentCountry = 'Türkiye',
}: WardrobeModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_closet' | 'custom_ai'>('catalog');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogTier, setCatalogTier] = useState<string>('all');
  const [catalogResults, setCatalogResults] = useState<CatalogGarmentTemplate[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Custom / AI states
  const [aiDescription, setAiDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const market = getMarketProfileForCountry(currentCountry);

  // Fetch verified catalog items whenever query/filters change
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearchingCatalog(true);
      try {
        const url = `/api/catalog?q=${encodeURIComponent(catalogQuery)}&category=${catalogCategory}&tier=${catalogTier}&country=${encodeURIComponent(currentCountry)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setCatalogResults(data.results || []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error(err);
      } finally {
        setIsSearchingCatalog(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, catalogQuery, catalogCategory, catalogTier, currentCountry]);

  if (!isOpen) return null;

  const handleAddFromCatalog = (tpl: CatalogGarmentTemplate) => {
    const newItem: ClothingItem = {
      id: `w-cat-${tpl.id}-${Date.now()}`,
      name: tpl.name,
      category: tpl.category,
      segment: tpl.segment,
      material: tpl.material,
      warmth: tpl.warmth,
      waterResistance: tpl.waterResistance,
      windResistance: tpl.windResistance,
      colorName: tpl.colorName,
      colorHex: tpl.colorHex,
      colorType: tpl.colorType,
      description: tpl.description,
      brandHint:
        currentCountry.toLowerCase().includes('türkiye')
          ? tpl.brandExamplesTr
          : tpl.brandExamplesGlobal,
      isUserOwned: true,
    };
    const updated = addWardrobeItem(newItem);
    onWardrobeChange(updated);
    setJustAddedId(tpl.id);
    setTimeout(() => setJustAddedId(null), 1400);
  };

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
          setActiveTab('my_closet');
        }
      }
    } catch (err) {
      console.error('Error adding garment:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = removeWardrobeItem(id);
    onWardrobeChange(updated);
  };

  const handleReset = () => {
    const updated = resetWardrobeToDefaults();
    onWardrobeChange(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Kıyafet Kataloğu & Dijital Gardırobum
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  {market.countryName} Alım Gücü Endeksli
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fotoğraf yüklemeye gerek kalmadan mağaza/kumaş kataloğundan aratarak kıyafetlerinizi tek tıkla dolabınıza ekleyin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Katalogdan Aratarak Ekle (Fotoğrafsız & Doğrulanmış Kumaş)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_closet')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'my_closet'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Dolabımdaki Parçalar ({wardrobe.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custom_ai')}
            className={`px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'custom_ai'
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Özel Metin / Fotoğrafla Ekle</span>
          </button>
        </div>

        {/* TAB 1: VERIFIED GARMENT & STORE CATALOG SEARCH */}
        {activeTab === 'catalog' && (
          <div className="space-y-3.5">
            {/* Search & Purchasing Power Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                  placeholder="Kıyafet, kumaş veya marka ara (Örn: trençkot, keten gömlek, polar, mavi, zara, gore-tex)..."
                  className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
                />
                {isSearchingCatalog && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500 shrink-0" />}
              </div>

              <div className="sm:col-span-3">
                <select
                  value={catalogTier}
                  onChange={(e) => setCatalogTier(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Alım Gücü Segmentleri</option>
                  <option value="essential">Standart ({market.tiers.essential.priceBand})</option>
                  <option value="smart">Orta-Üst ({market.tiers.smart.priceBand})</option>
                  <option value="luxury">Lüks & Teknik ({market.tiers.luxury.priceBand})</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="base">İç Katman (Tişört/İçlik)</option>
                  <option value="mid">Orta Katman (Gömlek/Kazak/Polar)</option>
                  <option value="outer">Dış Katman (Ceket/Trençkot/Mont)</option>
                  <option value="bottom">Alt Giyim (Kot/Chino/Şort)</option>
                  <option value="footwear">Ayakkabı & Bot</option>
                </select>
              </div>
            </div>

            {/* Catalog Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {catalogResults.map((tpl) => {
                const isAdded = justAddedId === tpl.id;
                const tierLabel =
                  tpl.segment === 'luxury'
                    ? 'Lüks & Teknik'
                    : tpl.segment === 'smart'
                    ? 'Orta-Üst Şehir'
                    : 'Standart / Bütçe Dostu';
                return (
                  <div
                    key={tpl.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                          {CATEGORY_LABELS[tpl.category]}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tierLabel}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white pt-0.5">
                        {tpl.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Kumaş: {tpl.material}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[165px]">
                          Örn: {currentCountry.toLowerCase().includes('türkiye') ? tpl.brandExamplesTr : tpl.brandExamplesGlobal}
                        </span>
                        <span>Isı: {tpl.warmth}/5</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddFromCatalog(tpl)}
                        className={`w-full py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-500 text-white'
                            : 'bg-sky-500 hover:bg-sky-600 text-white'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dolabınıza Eklendi!</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Dolabıma Ekle</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: MY CLOSET */}
        {activeTab === 'my_closet' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Kayıtlı Kıyafetleriniz ({wardrobe.length} Parça)
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Varsayılan Dolaba Sıfırla</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {wardrobe.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        title="Dolaptan Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {item.material}
                    </p>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-800 flex justify-between">
                    <span>Isı: {item.warmth}/5</span>
                    <span>Su: {item.waterResistance === 'waterproof' ? 'Tam' : item.waterResistance === 'light' ? 'Su İtici' : 'Standart'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM TEXT / OPTIONAL PHOTO */}
        {activeTab === 'custom_ai' && (
          <form onSubmit={handleAiAdd} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">
              Katalogda Bulamadığınız Özel Bir Parçayı Yazarak Ekleyin
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Kıyafetin adını ve etiketindeki kumaş bilgisini yazmanız yeterlidir (Örn: &quot;Lacivert %80 yün %20 kaşmir kaban&quot;).
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="Örn: Haki yeşili su geçirmez kapüşonlu rüzgarlık..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
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
                className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{imagePreview ? 'Fotoğraf Seçildi' : 'Fotoğraf (Opsiyonel)'}</span>
              </button>
              <button
                type="submit"
                disabled={isAnalyzing || (!aiDescription.trim() && !imagePreview)}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Ekle</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
