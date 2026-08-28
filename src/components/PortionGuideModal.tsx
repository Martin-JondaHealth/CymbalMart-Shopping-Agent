import React, { useState } from 'react';
import { Calculator, X, Users, Clock, Flame, Wine, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { PartyEvent } from '../types';

interface PortionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PartyEvent;
  onApplyPortionsToCart?: (portions: { meatLbs: number; drinksCount: number; iceBags: number }) => void;
}

export const PortionGuideModal: React.FC<PortionGuideModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const [guests, setGuests] = useState(event.guestCount || 12);
  const [hours, setHours] = useState(event.durationHours || 3);
  const [eventStyle, setEventStyle] = useState<'meal' | 'appetizers_only' | 'heavy_drinks'>('meal');

  if (!isOpen) return null;

  // Standard Catering Math:
  // Protein: 0.4 lbs per guest for full meal, 0.25 lbs for finger food
  const proteinLbs = Number((guests * (eventStyle === 'meal' ? 0.45 : 0.25)).toFixed(1));
  // Appetizer bites: 5 pieces per hour per guest if appetizers only, or 3-4 pieces before meal
  const appetizerBites = guests * (eventStyle === 'appetizers_only' ? hours * 4 : 4);
  // Drinks: 2 drinks first hour + 1 drink every subsequent hour
  const totalDrinks = guests * (2 + Math.max(0, hours - 1));
  // Ice: 1.25 lbs per guest
  const iceBagsNeeded = Math.max(1, Math.ceil((guests * 1.25) / 10)); // 10 lb bags
  // Side dishes / Salads: 4 oz per guest
  const sidesLbs = Number(((guests * 4) / 16).toFixed(1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">CymbalMart Party Portion Estimator</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Param Adjusters */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Guest Count
              </label>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <input
                  type="number"
                  min="2"
                  max="150"
                  value={guests}
                  onChange={(e) => setGuests(Math.max(2, parseInt(e.target.value, 10) || 2))}
                  className="w-full font-bold text-sm bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Party Duration
              </label>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <select
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value, 10) || 3)}
                  className="w-full font-bold text-sm bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours (All-Day)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calculated Portions Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                🥩 Main Proteins
              </span>
              <span className="text-xl font-extrabold text-emerald-950 block mt-1">
                {proteinLbs} lbs
              </span>
              <span className="text-[11px] text-emerald-700">~{Math.ceil(guests * 1.5)} burger/dog servings</span>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                🥤 Total Beverages
              </span>
              <span className="text-xl font-extrabold text-teal-950 block mt-1">
                {totalDrinks} drinks
              </span>
              <span className="text-[11px] text-teal-700">{Math.ceil(totalDrinks / 12)} x 12-pack cases</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 block">
                🧊 Party Ice Bags
              </span>
              <span className="text-xl font-extrabold text-sky-950 block mt-1">
                {iceBagsNeeded} bags
              </span>
              <span className="text-[11px] text-sky-700">10-lb bags for chilling</span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                🥗 Sides & Salads
              </span>
              <span className="text-xl font-extrabold text-amber-950 block mt-1">
                {sidesLbs} lbs
              </span>
              <span className="text-[11px] text-amber-700">~{Math.ceil(sidesLbs / 2)} large deli tubs</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800 block">
                🍢 Appetizer Bites
              </span>
              <span className="text-xl font-extrabold text-slate-900 block mt-1">
                {appetizerBites} pcs
              </span>
              <span className="text-[11px] text-slate-600">Skewers, dips & chips</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                🍽️ Tableware Sets
              </span>
              <span className="text-xl font-extrabold text-slate-900 block mt-1">
                {guests + 10} sets
              </span>
              <span className="text-[11px] text-slate-600">Buffer for seconds & spills</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 block">💡 CymbalMart Host Golden Rules:</span>
            <p>• Never run out of ice! Ice melts 2x faster outdoors.</p>
            <p>• Keep 25% of beverages non-alcoholic, sparkling, or fresh brewed.</p>
            <p>• Label food items clearly for guests with nut, dairy, or gluten sensitivities.</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
            >
              Done & Return to Shopping List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
