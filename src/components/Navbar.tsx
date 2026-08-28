import React from 'react';
import { ShoppingBag, Sparkles, MapPin, Calculator, CheckCircle2, RefreshCw, Mic, MicOff } from 'lucide-react';
import { BudgetMetrics } from '../types';

interface NavbarProps {
  metrics: BudgetMetrics;
  onOpenPortions: () => void;
  onNewParty: () => void;
  onCheckout: () => void;
  itemsCount: number;
  isListening?: boolean;
  onToggleVoice?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metrics,
  onOpenPortions,
  onNewParty,
  onCheckout,
  itemsCount,
  isListening = false,
  onToggleVoice,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Geometric Brand Emblem & Store Locator */}
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-xs">
              <div className="w-4 h-4 bg-white rounded-xs rotate-45" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  CymbalMart <span className="font-normal text-slate-500 text-sm italic">Planner Agent</span>
                </span>
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">System Active</span>
                </div>
              </div>
              <div className="flex items-center text-[11px] text-slate-500 space-x-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                <span>Store #104 · Downtown Metro Express</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Budget Indicator */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Hands-Free Voice Control Toggle in Navbar */}
            {onToggleVoice && (
              <button
                type="button"
                id="navbar-voice-toggle-btn"
                onClick={onToggleVoice}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                  isListening
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse shadow-sm shadow-rose-500/20'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                }`}
                title={isListening ? 'Voice Control Active (Listening)' : 'Turn On Hands-Free Voice Control'}
              >
                {isListening ? (
                  <Mic className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className="hidden md:inline">{isListening ? 'Voice Active' : 'Voice Control'}</span>
              </button>
            )}

            {/* Portion Calculator Button */}
            <button
              id="portion-calculator-btn"
              onClick={onOpenPortions}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
              title="Party Portion Guide"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>Portion Guide</span>
            </button>

            {/* New Event Button */}
            <button
              id="new-party-btn"
              onClick={onNewParty}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Change Event</span>
            </button>

            {/* Budget status chip */}
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                metrics.isOverBudget
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <span className="text-slate-500">Total:</span>
              <span className={`font-bold text-sm ${metrics.isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                ${metrics.finalTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500">/ ${metrics.targetBudget}</span>
            </div>

            {/* Checkout Button */}
            <button
              id="header-checkout-btn"
              onClick={onCheckout}
              disabled={itemsCount === 0}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-600/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Review & Checkout</span>
              <span className="sm:hidden">Checkout</span>
              <span className="bg-emerald-800 text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                {itemsCount}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

