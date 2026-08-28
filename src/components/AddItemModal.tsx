import React, { useState } from 'react';
import { ShoppingItem, CategoryType, BrandTier } from '../types';
import { X, Plus, Sparkles, MapPin, Tag } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<ShoppingItem, 'id'>) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Cymbal Everyday');
  const [category, setCategory] = useState<CategoryType>('food');
  const [unitPrice, setUnitPrice] = useState<number>(4.99);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('pack');
  const [aisle, setAisle] = useState('Aisle 4 - Grocery');
  const [tier, setTier] = useState<BrandTier>('standard');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name: name.trim(),
      brand: brand.trim() || 'CymbalMart',
      category,
      unitPrice: Number(unitPrice) || 1.99,
      quantity: Math.max(1, Number(quantity) || 1),
      unit,
      isChecked: true,
      aisle: aisle.trim() || 'Aisle 3 - Grocery',
      tier,
      notes: notes.trim() || undefined,
      isCustom: true,
    });

    setName('');
    setUnitPrice(4.99);
    setQuantity(1);
    setNotes('');
    onClose();
  };

  const quickItemSuggestions = [
    { name: 'Extra Party Ice (10 lb bag)', brand: 'Cymbal Arctic', category: 'beverage' as CategoryType, price: 2.99, unit: 'bag', aisle: 'Front Ice Coolers' },
    { name: 'Artisan Tortilla Chips & Guac', brand: 'Cymbal Kitchens', category: 'food' as CategoryType, price: 5.49, unit: 'bag', aisle: 'Aisle 6 - Snacks' },
    { name: 'Heavy-Duty Trash Bags (20ct)', brand: 'Cymbal Clean', category: 'tableware' as CategoryType, price: 4.99, unit: 'box', aisle: 'Aisle 8 - Cleaning' },
    { name: 'Confetti Cannon & Party Horns', brand: 'Cymbal Celebrations', category: 'decor' as CategoryType, price: 7.99, unit: 'set', aisle: 'Aisle 7 - Party Goods' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Add Custom Item to Party List</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
            Popular Host Additions:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickItemSuggestions.map((sug) => (
              <button
                key={sug.name}
                type="button"
                onClick={() => {
                  setName(sug.name);
                  setBrand(sug.brand);
                  setCategory(sug.category);
                  setUnitPrice(sug.price);
                  setUnit(sug.unit);
                  setAisle(sug.aisle);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-950 font-medium transition shadow-2xs"
              >
                + {sug.name} (${sug.price})
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Item Name *
            </label>
            <input
              id="custom-item-name"
              type="text"
              required
              placeholder="e.g. Gourmet Sparkling Apple Cider"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="food">🍕 Food & Snacks</option>
                <option value="beverage">🥤 Beverages & Ice</option>
                <option value="tableware">🍽️ Tableware & Essentials</option>
                <option value="decor">🎈 Decorations & Vibe</option>
                <option value="activities">🎲 Games & Favors</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Brand Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as BrandTier)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="budget">Value Saver</option>
                <option value="standard">Cymbal Choice (Standard)</option>
                <option value="premium">Gold Reserve (Premium)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Unit Price ($)
              </label>
              <input
                id="custom-item-price"
                type="number"
                step="0.01"
                min="0.10"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Quantity
              </label>
              <input
                id="custom-item-qty"
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Unit Type
              </label>
              <input
                type="text"
                placeholder="pack, bag, box"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Aisle Location
              </label>
              <input
                type="text"
                value={aisle}
                onChange={(e) => setAisle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Host Notes / Portions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 2 pieces per guest"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="confirm-add-item-btn"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xs transition"
            >
              Add Item to List (${(unitPrice * quantity).toFixed(2)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
