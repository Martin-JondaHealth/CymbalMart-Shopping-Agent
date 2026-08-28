import React, { useState } from 'react';
import { Sparkles, Users, DollarSign, Calendar, Utensils, Home, Compass, ArrowRight, Flame, Wine, Cake, Check } from 'lucide-react';
import { PartyEvent, PresetPartyPlan } from '../types';
import { PRESET_PARTIES, POPULAR_EVENT_TYPES, POPULAR_THEMES, DIETARY_OPTIONS } from '../data/presetParties';

interface EventWizardProps {
  initialEvent: PartyEvent;
  isGenerating: boolean;
  onGenerate: (event: PartyEvent) => void;
  onSelectPreset: (preset: PresetPartyPlan) => void;
}

export const EventWizard: React.FC<EventWizardProps> = ({
  initialEvent,
  isGenerating,
  onGenerate,
  onSelectPreset,
}) => {
  const [formData, setFormData] = useState<PartyEvent>(initialEvent);
  const [isCustomType, setIsCustomType] = useState(false);
  const [isCustomTheme, setIsCustomTheme] = useState(false);

  const handleDietaryToggle = (option: string) => {
    setFormData((prev) => {
      const exists = prev.dietaryPreferences.includes(option);
      return {
        ...prev,
        dietaryPreferences: exists
          ? prev.dietaryPreferences.filter((o) => o !== option)
          : [...prev.dietaryPreferences, option],
      };
    });
  };

  const handleGuestChange = (total: number) => {
    const validTotal = Math.max(2, total);
    setFormData((prev) => ({
      ...prev,
      guestCount: validTotal,
      adultCount: Math.min(prev.adultCount, validTotal),
      childCount: Math.max(0, validTotal - prev.adultCount),
    }));
  };

  const quickBudgetOptions = [120, 200, 300, 450];

  const estimatedPerGuest =
    formData.guestCount > 0
      ? (formData.targetBudget / formData.guestCount).toFixed(2)
      : '0.00';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>CymbalMart AI Shopping & Planning Agent</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Plan Your Event, <span className="text-emerald-600">Curate Your List</span>
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto">
          Tell us about your celebration. We'll automatically generate a customized, aisle-mapped, and budget-conscious shopping list with CymbalMart store brands and portions.
        </p>
      </div>

      {/* 1-Click Popular Presets */}
      <div className="mb-10 bg-slate-900 rounded-2xl p-5 text-white shadow-xs border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Busy Host? Pick a Ready-Curated Party Pack
            </h2>
          </div>
          <span className="text-xs text-emerald-400 font-semibold hidden sm:inline">
            1-Click Instant List
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_PARTIES.map((preset) => {
            const Icon =
              preset.id.includes('bbq')
                ? Flame
                : preset.id.includes('cocktail')
                ? Wine
                : Cake;

            return (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                onClick={() => onSelectPreset(preset)}
                className="group text-left p-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/90 border border-slate-700/80 hover:border-emerald-500/60 transition duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                      ${preset.targetBudget}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                    {preset.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {preset.tagline}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{preset.guestCount} Guests · {preset.items.length} Items</span>
                  <span className="text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center">
                    Load &rarr;
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Event Definition Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Custom Event Setup</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Task 1 of 3: Define Event</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Party Type & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Party Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Event Type
              </label>
              {!isCustomType ? (
                <div className="space-y-2">
                  <select
                    id="party-type-select"
                    value={formData.partyType}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomType(true);
                        setFormData({ ...formData, partyType: '' });
                      } else {
                        setFormData({ ...formData, partyType: e.target.value });
                      }
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {POPULAR_EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="__custom__">+ Enter custom event type...</option>
                  </select>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    id="custom-party-type-input"
                    type="text"
                    placeholder="e.g., Taco Fiesta, 90s Karaoke..."
                    value={formData.partyType}
                    onChange={(e) => setFormData({ ...formData, partyType: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomType(false)}
                    className="px-3 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Theme & Vibe */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Party Theme & Aesthetic
              </label>
              {!isCustomTheme ? (
                <select
                  id="theme-select"
                  value={formData.theme}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomTheme(true);
                      setFormData({ ...formData, theme: '' });
                    } else {
                      setFormData({ ...formData, theme: e.target.value });
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {POPULAR_THEMES.map((th) => (
                    <option key={th} value={th}>
                      {th}
                    </option>
                  ))}
                  <option value="__custom__">+ Enter custom theme...</option>
                </select>
              ) : (
                <div className="flex space-x-2">
                  <input
                    id="custom-theme-input"
                    type="text"
                    placeholder="e.g. Neon Glow, Rustic Italian, Nautical..."
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomTheme(false)}
                    className="px-3 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Budget & Guests Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Target Budget */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Target Budget</span>
                </label>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  ~${estimatedPerGuest}/guest
                </span>
              </div>

              <div className="relative mb-3">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold text-base">
                  $
                </span>
                <input
                  id="target-budget-input"
                  type="number"
                  min="30"
                  max="5000"
                  step="5"
                  value={formData.targetBudget}
                  onChange={(e) => setFormData({ ...formData, targetBudget: Number(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-2 text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Budget Chips */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">Presets:</span>
                {quickBudgetOptions.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setFormData({ ...formData, targetBudget: amt })}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      formData.targetBudget === amt
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Guest Count & Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Total Guest Count</span>
                </label>
                <span className="text-xs text-slate-500">
                  {formData.adultCount} adults, {formData.childCount} kids
                </span>
              </div>

              {/* Counter Input */}
              <div className="flex items-center space-x-3 mb-3">
                <button
                  type="button"
                  id="decrease-guests-btn"
                  onClick={() => handleGuestChange(formData.guestCount - 2)}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  -
                </button>
                <input
                  id="guest-count-input"
                  type="number"
                  min="2"
                  max="200"
                  value={formData.guestCount}
                  onChange={(e) => handleGuestChange(Number(e.target.value) || 2)}
                  className="w-full text-center py-2 text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  id="increase-guests-btn"
                  onClick={() => handleGuestChange(formData.guestCount + 2)}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-lg hover:bg-slate-100 flex items-center justify-center transition"
                >
                  +
                </button>
              </div>

              {/* Quick Guest presets */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-500">Party size:</span>
                {[6, 12, 18, 30].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleGuestChange(count)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                      formData.guestCount === count
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {count} guests
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Venue & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Venue Location
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'indoor', label: 'Indoor Living' },
                  { id: 'backyard', label: 'Backyard / Patio' },
                  { id: 'park', label: 'Public Park' },
                  { id: 'pool', label: 'Poolside' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, venueType: v.id as any })}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg text-center border transition ${
                      formData.venueType === v.id
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Party Duration
              </label>
              <div className="flex items-center space-x-2">
                {[2, 3, 4, 6].map((hrs) => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setFormData({ ...formData, durationHours: hrs })}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                      formData.durationHours === hrs
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {hrs} Hours
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dietary Needs */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center space-x-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dietary Requirements & Accommodations</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((option) => {
                const isSelected = formData.dietaryPreferences.includes(option);
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleDietaryToggle(option)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{option}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Special Requests & Notes (Optional)
            </label>
            <textarea
              id="special-requests-input"
              rows={2}
              placeholder="e.g. Include non-alcoholic signature mocktail options, eco-friendly bamboo plates, outdoor yard games..."
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="generate-shopping-list-btn"
              disabled={isGenerating}
              className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center space-x-2 transition shadow-md shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Curating Budget-Optimized Shopping List...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Curated Shopping List</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
