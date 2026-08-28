import React, { useState, useMemo } from 'react';
import { ShoppingItem, CategoryType, BrandTier } from '../types';
import { ItemCard } from './ItemCard';
import { Plus, Search, Filter, CheckSquare, Square, ArrowUpDown, Sparkles, Layers } from 'lucide-react';

interface ShoppingListViewProps {
  items: ShoppingItem[];
  onToggleCheck: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onSetQty: (id: string, qty: number) => void;
  onDelete: (id: string) => void;
  onSwapTier: (id: string, newTier: BrandTier, altName: string, altBrand: string, newPrice: number) => void;
  onOpenAddItem: () => void;
  onCheckAll: (checked: boolean) => void;
  categoryFilter?: string;
  onCategoryFilterChange?: (cat: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (q: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  items,
  onToggleCheck,
  onUpdateQty,
  onSetQty,
  onDelete,
  onSwapTier,
  onOpenAddItem,
  onCheckAll,
  categoryFilter,
  onCategoryFilterChange,
  searchQuery: externalSearchQuery,
  onSearchQueryChange,
}) => {
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'aisle' | 'price-desc' | 'price-asc'>('default');

  const selectedCategory = categoryFilter !== undefined ? categoryFilter : internalCategory;
  const setSelectedCategory = (cat: string) => {
    if (onCategoryFilterChange) {
      onCategoryFilterChange(cat);
    } else {
      setInternalCategory(cat);
    }
  };

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = (q: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(q);
    } else {
      setInternalSearchQuery(q);
    }
  };

  const categories: { id: string; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'All Items', icon: '🛒', count: items.length },
    { id: 'food', label: 'Food & Mains', icon: '🍕', count: items.filter((i) => i.category === 'food').length },
    { id: 'beverage', label: 'Drinks & Ice', icon: '🥤', count: items.filter((i) => i.category === 'beverage').length },
    { id: 'tableware', label: 'Tableware', icon: '🍽️', count: items.filter((i) => i.category === 'tableware').length },
    { id: 'decor', label: 'Decorations', icon: '🎈', count: items.filter((i) => i.category === 'decor').length },
    { id: 'activities', label: 'Games & Favors', icon: '🎲', count: items.filter((i) => i.category === 'activities').length },
  ];

  const filteredItems = useMemo(() => {
    let list = items.filter((item) => {
      const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.aisle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });

    if (sortBy === 'aisle') {
      list = [...list].sort((a, b) => a.aisle.localeCompare(b.aisle));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => b.unitPrice * b.quantity - a.unitPrice * a.quantity);
    } else if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => a.unitPrice * a.quantity - b.unitPrice * b.quantity);
    }

    return list;
  }, [items, selectedCategory, searchQuery, sortBy]);

  const allChecked = items.length > 0 && items.every((i) => i.isChecked);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6">
      {/* Category Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-3 scrollbar-none border-b border-slate-100 mb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            id={`filter-cat-${cat.id}`}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedCategory === cat.id
                  ? 'bg-emerald-800 text-emerald-100'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search, Sort, & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-items-input"
            type="text"
            placeholder="Search items, brands, or store aisles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {/* Sort & Action controls */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="sort-items-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="default">Default Order</option>
              <option value="aisle">Sort by Store Aisle</option>
              <option value="price-desc">Highest Cost</option>
              <option value="price-asc">Lowest Cost</option>
            </select>
          </div>

          <button
            type="button"
            id="toggle-all-items-btn"
            onClick={() => onCheckAll(!allChecked)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition"
            title={allChecked ? 'Deselect All' : 'Select All'}
          >
            {allChecked ? <CheckSquare className="w-3.5 h-3.5 text-emerald-600" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{allChecked ? 'All In' : 'Select All'}</span>
          </button>

          <button
            type="button"
            id="open-add-item-modal-btn"
            onClick={onOpenAddItem}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleCheck={onToggleCheck}
              onUpdateQty={onUpdateQty}
              onSetQty={onSetQty}
              onDelete={onDelete}
              onSwapTier={onSwapTier}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No items match your filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or add a custom item to your party list.
          </p>
          <button
            onClick={onOpenAddItem}
            className="mt-3 inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Item</span>
          </button>
        </div>
      )}
    </div>
  );
};
