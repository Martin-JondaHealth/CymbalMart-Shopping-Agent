import React, { useState } from 'react';
import { ShoppingItem, BrandTier } from '../types';
import { Trash2, MapPin, Tag, ArrowLeftRight, Check, Sparkles, Plus, Minus, Info } from 'lucide-react';

interface ItemCardProps {
  item: ShoppingItem;
  onToggleCheck: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onSetQty: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
  onSwapTier: (id: string, newTier: BrandTier, altName: string, altBrand: string, newPrice: number) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onToggleCheck,
  onUpdateQty,
  onSetQty,
  onDelete,
  onSwapTier,
}) => {
  const [showTierSwap, setShowTierSwap] = useState(false);

  const itemTotal = ((item.unitPrice || 0) * (item.quantity || 1)).toFixed(2);

  const tierBadges: Record<BrandTier, { label: string; bg: string; text: string; border: string }> = {
    budget: { label: 'Value Saver', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
    standard: { label: 'Cymbal Choice', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
    premium: { label: 'Gold Reserve', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  };

  const badge = tierBadges[item.tier] || tierBadges.standard;

  return (
    <div
      className={`group rounded-xl border p-4 transition-all duration-200 ${
        item.isChecked
          ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          : 'bg-slate-50/70 border-slate-200 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox & Details */}
        <div className="flex items-start space-x-3 min-w-0 flex-1">
          <input
            type="checkbox"
            id={`item-checkbox-${item.id}`}
            checked={item.isChecked}
            onChange={() => onToggleCheck(item.id)}
            className="mt-1 w-4 h-4 rounded-xs text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.label}
              </span>
              <span className="text-[11px] font-medium text-slate-500 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{item.aisle || 'Grocery Aisle'}</span>
              </span>
              {item.isCustom && (
                <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded-sm">
                  Custom
                </span>
              )}
            </div>

            <h3 className={`text-sm font-bold text-slate-900 leading-snug ${!item.isChecked ? 'line-through text-slate-400' : ''}`}>
              {item.name}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">{item.brand}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">${item.unitPrice.toFixed(2)} / {item.unit || 'each'}</span>
            </div>

            {/* Portion note / dietary tags */}
            {(item.notes || (item.dietaryTags && item.dietaryTags.length > 0)) && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                {item.notes && (
                  <span className="inline-flex items-center text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                    <Info className="w-3 h-3 mr-1 text-slate-400" />
                    {item.notes}
                  </span>
                )}
                {item.dietaryTags?.map((tag) => (
                  <span key={tag} className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quantity Controls & Price */}
        <div className="flex flex-col items-end space-y-2">
          <div className="text-right">
            <span className="text-base font-black text-slate-900">
              ${itemTotal}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {item.quantity} x ${item.unitPrice.toFixed(2)}
            </span>
          </div>

          {/* Stepper */}
          <div className="flex items-center space-x-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              id={`decrease-qty-${item.id}`}
              onClick={() => onUpdateQty(item.id, -1)}
              className="w-7 h-7 rounded-md bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shadow-2xs transition disabled:opacity-40"
              disabled={item.quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-6 text-center text-xs font-bold text-slate-800">
              {item.quantity}
            </span>
            <button
              type="button"
              id={`increase-qty-${item.id}`}
              onClick={() => onUpdateQty(item.id, 1)}
              className="w-7 h-7 rounded-md bg-white hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shadow-2xs transition"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer: Tier Swap & Delete */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        {/* Tier Alternatives button */}
        {item.alternatives && item.alternatives.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              id={`tier-swap-btn-${item.id}`}
              onClick={() => setShowTierSwap(!showTierSwap)}
              className="inline-flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold py-1 px-1.5 rounded hover:bg-emerald-50 transition"
            >
              <ArrowLeftRight className="w-3 h-3 text-emerald-600" />
              <span>Swap Brand / Tier ({item.alternatives.length} options)</span>
            </button>

            {/* Dropdown popup for tier swap */}
            {showTierSwap && (
              <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Available Brand Swaps
                </div>
                <div className="space-y-1 mt-1">
                  {item.alternatives.map((alt) => {
                    const priceDiff = alt.unitPrice - item.unitPrice;
                    const diffLabel =
                      priceDiff > 0
                        ? `+$${priceDiff.toFixed(2)}`
                        : `-$${Math.abs(priceDiff).toFixed(2)}`;

                    return (
                      <button
                        key={alt.name}
                        type="button"
                        onClick={() => {
                          onSwapTier(item.id, alt.tier, alt.name, alt.brand, alt.unitPrice);
                          setShowTierSwap(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 flex items-center justify-between transition border border-transparent hover:border-slate-200"
                      >
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">{alt.name}</div>
                          <div className="text-[11px] text-slate-500">{alt.brand} ({alt.tier})</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-slate-900">${alt.unitPrice.toFixed(2)}</span>
                          <span className={`text-[10px] block font-bold ${priceDiff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {diffLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-slate-400">Best CymbalMart Value</span>
        )}

        {/* Delete Item */}
        <button
          type="button"
          id={`delete-item-btn-${item.id}`}
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
          title="Remove from list"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
