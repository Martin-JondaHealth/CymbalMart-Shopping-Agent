import React, { useState } from 'react';
import { ShoppingItem, PartyEvent, BudgetMetrics } from '../types';
import { ShoppingBag, CheckCircle2, Copy, Check, Printer, Clock, MapPin, Truck, Store, ArrowRight, X, ShieldCheck, Tag } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: PartyEvent;
  items: ShoppingItem[];
  metrics: BudgetMetrics;
  onOrderPlaced: () => void;
  fulfillmentType?: 'pickup' | 'delivery';
  onFulfillmentTypeChange?: (type: 'pickup' | 'delivery') => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  items,
  metrics,
  onOrderPlaced,
  fulfillmentType: externalFulfillmentType,
  onFulfillmentTypeChange,
}) => {
  const [internalFulfillmentType, setInternalFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const fulfillmentType = externalFulfillmentType !== undefined ? externalFulfillmentType : internalFulfillmentType;
  const setFulfillmentType = (type: 'pickup' | 'delivery') => {
    if (onFulfillmentTypeChange) {
      onFulfillmentTypeChange(type);
    } else {
      setInternalFulfillmentType(type);
    }
  };
  const [pickupSlot, setPickupSlot] = useState('Today, 4:00 PM - 5:00 PM');
  const [deliveryAddress, setDeliveryAddress] = useState('742 Evergreen Terrace, Springfield');
  const [copied, setCopied] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  if (!isOpen) return null;

  const activeItems = items.filter((i) => i.isChecked);

  // Group items by aisle for aisle navigation
  const itemsByAisle: Record<string, ShoppingItem[]> = activeItems.reduce((acc, item) => {
    const aisleKey = item.aisle || 'General Grocery';
    if (!acc[aisleKey]) acc[aisleKey] = [];
    acc[aisleKey].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const handleCopyList = () => {
    const textLines = [
      `🛒 CYMBALMART PARTY SHOPPING LIST - ${event.theme.toUpperCase()} ${event.partyType.toUpperCase()}`,
      `Guests: ${event.guestCount} | Budget: $${event.targetBudget} | Total: $${metrics.finalTotal.toFixed(2)}`,
      `--------------------------------------------------`,
      ...Object.entries(itemsByAisle).map(([aisle, list]: [string, ShoppingItem[]]) => {
        return `\n📍 [${aisle.toUpperCase()}]\n` +
          list.map((it: ShoppingItem) => `  [ ] ${it.quantity}x ${it.name} (${it.brand}) - $${(it.unitPrice * it.quantity).toFixed(2)}`).join('\n');
      }),
      `\n--------------------------------------------------`,
      `Subtotal: $${metrics.subtotal.toFixed(2)}`,
      `Host Club Savings: -$${metrics.memberDiscount.toFixed(2)}`,
      `Estimated Tax: $${metrics.estimatedTax.toFixed(2)}`,
      `Final Total: $${metrics.finalTotal.toFixed(2)}`,
    ].join('\n');

    navigator.clipboard.writeText(textLines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePlaceOrder = () => {
    const randomOrderNum = `CYM-${Math.floor(100000 + Math.random() * 900000)}`;
    setOrderNumber(randomOrderNum);
    setIsOrderComplete(true);
    onOrderPlaced();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">
              {isOrderComplete ? 'Party Order Confirmed!' : 'Refine & Finalize Party Order'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isOrderComplete ? (
          /* Order Confirmation View */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                Order Placed Successfully
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900">
                You're Ready to Host!
              </h2>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Your curated shopping list for <span className="font-bold text-slate-900">{event.title || event.partyType}</span> has been sent to CymbalMart Store #104.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference:</span>
                <span className="font-mono font-bold text-slate-900">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fulfillment:</span>
                <span className="font-bold text-slate-900">
                  {fulfillmentType === 'pickup' ? `Store Curbside Pickup (${pickupSlot})` : 'Express Same-Day Delivery'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Items:</span>
                <span className="font-bold text-slate-900">{metrics.totalItemsCount} items</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black">
                <span className="text-slate-700">Charged Amount:</span>
                <span className="text-emerald-700">${metrics.finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyList}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center justify-center space-x-1.5 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Printable Aisle Checklist'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition"
              >
                Back to Planner Hub
              </button>
            </div>
          </div>
        ) : (
          /* Main Review & Checkout View */
          <div className="p-6 space-y-6">
            {/* Fulfillment Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Select Fulfillment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('pickup')}
                  className={`p-3.5 rounded-xl text-left border transition flex items-start space-x-3 ${
                    fulfillmentType === 'pickup'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Store className={`w-5 h-5 mt-0.5 ${fulfillmentType === 'pickup' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Free Curbside Pickup
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Downtown CymbalMart #104 · Bay 3
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      FREE (Ready in 2h)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                  className={`p-3.5 rounded-xl text-left border transition flex items-start space-x-3 ${
                    fulfillmentType === 'delivery'
                      ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Truck className={`w-5 h-5 mt-0.5 ${fulfillmentType === 'delivery' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Express Same-Day Delivery
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Direct to party address
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                      Free for Host Club ($0)
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Time Slot / Address */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Scheduled Time Slot:</span>
                <span className="text-slate-900 font-bold">{pickupSlot}</span>
              </div>
              <span className="text-[11px] text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                Guaranteed Cold Fresh
              </span>
            </div>

            {/* Aisle-by-Aisle Shopping Plan Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Aisle-by-Aisle Store Routing ({activeItems.length} items)</span>
                </label>
                <button
                  type="button"
                  onClick={handleCopyList}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy List'}</span>
                </button>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                {(Object.entries(itemsByAisle) as [string, ShoppingItem[]][]).map(([aisle, list]) => (
                  <div key={aisle} className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-1.5">
                      {aisle}
                    </span>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {list.map((it) => (
                        <li key={it.id} className="flex justify-between text-xs">
                          <span>
                            <strong className="text-slate-900">{it.quantity}x</strong> {it.name}
                          </span>
                          <span className="text-slate-500 font-medium">
                            ${(it.unitPrice * it.quantity).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Price Breakdown */}
            <div className="bg-slate-900 text-white p-4 rounded-xl space-y-2 text-xs shadow-xs border border-slate-800">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-white">${metrics.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span className="flex items-center space-x-1">
                  <Tag className="w-3 h-3" />
                  <span>CymbalMart Host Club Discount (5%):</span>
                </span>
                <span className="font-bold">-${metrics.memberDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Local Sales Tax (7.5%):</span>
                <span>${metrics.estimatedTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Fulfillment & Bagging Fee:</span>
                <span className="text-emerald-400 font-semibold">$0.00 (Waived)</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 text-sm font-black">
                <span className="text-white">Final Checkout Total:</span>
                <span className="text-emerald-400 text-base">${metrics.finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Target Event Budget:</span>
                <span className={metrics.isOverBudget ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  ${metrics.targetBudget} ({metrics.isOverBudget ? `Over by $${(metrics.finalTotal - metrics.targetBudget).toFixed(2)}` : `Under by $${metrics.remainingBudget.toFixed(2)}`})
                </span>
              </div>
            </div>

            {/* Submit / Place Order */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                Back to Edit
              </button>

              <button
                type="button"
                id="place-order-confirm-btn"
                onClick={handlePlaceOrder}
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20 flex items-center space-x-2 transition"
              >
                <span>Finalize & Place Order (${metrics.finalTotal.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
