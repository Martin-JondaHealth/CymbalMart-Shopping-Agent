import React from 'react';
import { DollarSign, TrendingDown, TrendingUp, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';
import { BudgetMetrics, CategoryType } from '../types';

interface BudgetOverviewProps {
  metrics: BudgetMetrics;
  onAutoTrimBudget: () => void;
  onSwapToValueTier: () => void;
  onUpgradePremium: () => void;
  onOpenPortions: () => void;
}

const CATEGORY_COLORS: Record<CategoryType, { bg: string; text: string; label: string }> = {
  food: { bg: 'bg-emerald-500', text: 'text-emerald-700', label: 'Food & Mains' },
  beverage: { bg: 'bg-cyan-500', text: 'text-cyan-700', label: 'Drinks & Ice' },
  decor: { bg: 'bg-amber-500', text: 'text-amber-700', label: 'Decor & Vibe' },
  tableware: { bg: 'bg-indigo-500', text: 'text-indigo-700', label: 'Tableware' },
  activities: { bg: 'bg-purple-500', text: 'text-purple-700', label: 'Games & Favors' },
};

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  metrics,
  onAutoTrimBudget,
  onSwapToValueTier,
  onUpgradePremium,
  onOpenPortions,
}) => {
  const percentUsed =
    metrics.targetBudget > 0
      ? Math.min(150, Math.round((metrics.finalTotal / metrics.targetBudget) * 100))
      : 100;

  const barColor =
    metrics.isOverBudget
      ? 'bg-rose-500'
      : percentUsed > 90
      ? 'bg-amber-500'
      : 'bg-emerald-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 mb-6">
      {/* Top Metrics Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              Budget Alignment & Real-Time Totals
            </h2>
            <span className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-slate-200">
              Task 2: Review List
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic recalculations update instantly as items, quantities, and brand tiers change.
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center space-x-3">
          {metrics.isOverBudget ? (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Over Budget by ${(metrics.finalTotal - metrics.targetBudget).toFixed(2)}</span>
            </div>
          ) : (
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Within Budget · ${metrics.remainingBudget.toFixed(2)} Remaining</span>
            </div>
          )}

          {/* Auto Trim Button if over budget */}
          {metrics.isOverBudget && (
            <button
              id="auto-trim-budget-btn"
              onClick={onAutoTrimBudget}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Trim to Budget</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Budget Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5">
        {/* Target Budget */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
            Target Budget
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-900">${metrics.targetBudget}</span>
            <span className="text-xs text-slate-400">total</span>
          </div>
        </div>

        {/* Current Total */}
        <div className={`p-3.5 rounded-xl border ${
          metrics.isOverBudget
            ? 'bg-rose-50/60 border-rose-200'
            : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
            Calculated Total
          </span>
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-black ${metrics.isOverBudget ? 'text-rose-600' : 'text-emerald-950'}`}>
              ${metrics.finalTotal.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">w/ tax</span>
          </div>
        </div>

        {/* Cost Per Guest */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
            Cost Per Guest
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-700">${metrics.costPerGuest.toFixed(2)}</span>
            <span className="text-xs text-slate-400">/ person</span>
          </div>
        </div>

        {/* Host Club Savings */}
        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 flex items-center space-x-1 mb-1">
            <Tag className="w-3 h-3 text-amber-600" />
            <span>Host Club Savings</span>
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-amber-700">-${metrics.memberDiscount.toFixed(2)}</span>
            <span className="text-[10px] text-amber-600 font-bold">(5% Off)</span>
          </div>
        </div>
      </div>

      {/* Visual Budget Progress Bar */}
      <div className="space-y-2 pt-1 pb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            Budget Consumption: <span className="font-bold text-slate-900">{percentUsed}%</span>
          </span>
          <span className="text-slate-500 text-[11px]">
            Subtotal: ${metrics.subtotal.toFixed(2)} · Tax (7.5%): ${metrics.estimatedTax.toFixed(2)}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, percentUsed)}%` }}
          />
        </div>
      </div>

      {/* Category Breakdown Bar */}
      <div className="pt-3 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
          Category Allocation
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {(Object.keys(metrics.categoryBreakdown) as CategoryType[]).map((cat) => {
            const conf = CATEGORY_COLORS[cat];
            const amount = metrics.categoryBreakdown[cat] || 0;
            const percentOfSubtotal =
              metrics.subtotal > 0 ? Math.round((amount / metrics.subtotal) * 100) : 0;

            return (
              <div
                key={cat}
                className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between"
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${conf.bg}`} />
                  <span className="font-semibold text-slate-700 truncate text-[11px]">{conf.label}</span>
                </div>
                <div className="flex items-baseline justify-between text-slate-900 font-bold">
                  <span>${amount.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{percentOfSubtotal}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Budget Strategy Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Smart Budget Tools:</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSwapToValueTier}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
          >
            📉 Switch All to Value Brands
          </button>
          <button
            type="button"
            onClick={onUpgradePremium}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
          >
            ⭐ Upgrade to Gold Reserve
          </button>
          <button
            type="button"
            onClick={onOpenPortions}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
          >
            🍽️ Portions & Drink Guide
          </button>
        </div>
      </div>
    </div>
  );
};
