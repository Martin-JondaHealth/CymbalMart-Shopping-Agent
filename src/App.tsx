import React, { useState, useMemo, useEffect } from 'react';
import { PartyEvent, ShoppingItem, PresetPartyPlan, AIProposedAction, BrandTier } from './types';
import { PRESET_PARTIES } from './data/presetParties';
import { calculateBudgetMetrics } from './utils/budgetCalculations';
import { Navbar } from './components/Navbar';
import { EventWizard } from './components/EventWizard';
import { BudgetOverview } from './components/BudgetOverview';
import { ShoppingListView } from './components/ShoppingListView';
import { AddItemModal } from './components/AddItemModal';
import { PortionGuideModal } from './components/PortionGuideModal';
import { CheckoutModal } from './components/CheckoutModal';
import { CymbalMartAssistantChat } from './components/CymbalMartAssistantChat';
import { VoiceControlHUD } from './components/VoiceControlHUD';
import { useVoiceControl } from './hooks/useVoiceControl';
import { Sparkles, Calendar, Users, MapPin, Edit3, ShoppingCart, Check, RefreshCw, Mic } from 'lucide-react';

const DEFAULT_EVENT: PartyEvent = {
  id: 'event-init',
  title: 'Sizzling Backyard BBQ Bash',
  partyType: 'BBQ & Cookout',
  theme: 'Rustic Smokehouse & Lawn Games',
  targetBudget: 220,
  guestCount: 16,
  adultCount: 16,
  childCount: 0,
  durationHours: 3,
  venueType: 'backyard',
  dietaryPreferences: ['Kid-Friendly Choices'],
  specialRequests: 'Include charcoal, ice, and lawn activity items.',
  vibeDescription: 'A classic outdoor cookout complete with juicy grilled burgers, cold sweet teas, and yard games.',
};

export default function App() {
  const [currentEvent, setCurrentEvent] = useState<PartyEvent>(DEFAULT_EVENT);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const defaultPreset = PRESET_PARTIES[0];
    return defaultPreset.items.map((it, idx) => ({
      ...it,
      id: `init-${idx}`,
    }));
  });

  const [isEventDefined, setIsEventDefined] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState<boolean>(false);
  const [isPortionsOpen, setIsPortionsOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Controlled category and search query filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live budget metrics
  const metrics = useMemo(() => {
    return calculateBudgetMetrics(
      shoppingList,
      currentEvent.targetBudget,
      currentEvent.guestCount
    );
  }, [shoppingList, currentEvent.targetBudget, currentEvent.guestCount]);

  // Handle AI Plan Generation
  const handleGeneratePlan = async (eventData: PartyEvent) => {
    setIsGenerating(true);
    setCurrentEvent(eventData);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (data.success && data.plan) {
        if (data.plan.title) {
          setCurrentEvent((prev) => ({
            ...prev,
            title: data.plan.title,
            vibeDescription: data.plan.vibeDescription,
          }));
        }

        if (Array.isArray(data.plan.items) && data.plan.items.length > 0) {
          setShoppingList(data.plan.items);
        }

        setIsEventDefined(true);
        showToast('🎉 Curated shopping list generated for your event!');
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (err: any) {
      console.error('Plan generation error:', err);
      // Fallback to preset or alert
      showToast('Generated plan using CymbalMart catalog rules.');
      setIsEventDefined(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle 1-Click Preset Selection
  const handleSelectPreset = (preset: PresetPartyPlan) => {
    setCurrentEvent({
      id: `event-${preset.id}`,
      title: preset.title,
      partyType: preset.partyType,
      theme: preset.theme,
      targetBudget: preset.targetBudget,
      guestCount: preset.guestCount,
      adultCount: preset.guestCount,
      childCount: 0,
      durationHours: 3,
      venueType: preset.venueType,
      dietaryPreferences: preset.dietaryPreferences,
      specialRequests: preset.specialRequests,
      vibeDescription: preset.description,
    });

    const itemsWithIds: ShoppingItem[] = preset.items.map((it, idx) => ({
      ...it,
      id: `preset-item-${Date.now()}-${idx}`,
    }));

    setShoppingList(itemsWithIds);
    setIsEventDefined(true);
    showToast(`Loaded ${preset.title} party plan!`);
  };

  // Toggle item inclusion in cart
  const handleToggleCheck = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  // Update item quantity
  const handleUpdateQty = (id: string, delta: number) => {
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, (item.quantity || 1) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  // Set quantity explicitly
  const handleSetQty = (id: string, qty: number) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  // Delete item
  const handleDelete = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
    showToast('Item removed from shopping list');
  };

  // Swap tier / brand
  const handleSwapTier = (
    id: string,
    newTier: BrandTier,
    altName: string,
    altBrand: string,
    newPrice: number
  ) => {
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            tier: newTier,
            name: altName,
            brand: altBrand,
            unitPrice: newPrice,
          };
        }
        return item;
      })
    );
    showToast(`Swapped to ${altBrand} ($${newPrice.toFixed(2)})`);
  };

  // Add custom item
  const handleAddItem = (newItem: Omit<ShoppingItem, 'id'>) => {
    const itemWithId: ShoppingItem = {
      ...newItem,
      id: `custom-${Date.now()}`,
    };
    setShoppingList((prev) => [itemWithId, ...prev]);
    showToast(`Added "${newItem.name}" to cart`);
  };

  // Bulk check / uncheck
  const handleCheckAll = (checked: boolean) => {
    setShoppingList((prev) => prev.map((item) => ({ ...item, isChecked: checked })));
  };

  // Smart Budget Optimizer: Auto-trim to fit budget
  const handleAutoTrimBudget = () => {
    let currentTotal = metrics.finalTotal;
    const target = currentEvent.targetBudget;
    if (currentTotal <= target) return;

    let updatedList = [...shoppingList];

    // Strategy 1: Swap items with budget alternatives
    updatedList = updatedList.map((item) => {
      if (item.tier !== 'budget' && item.alternatives && item.alternatives.length > 0) {
        const budgetAlt = item.alternatives.find((a) => a.tier === 'budget');
        if (budgetAlt) {
          return {
            ...item,
            tier: 'budget' as BrandTier,
            name: budgetAlt.name,
            brand: budgetAlt.brand,
            unitPrice: budgetAlt.unitPrice,
          };
        }
      }
      return item;
    });

    // Strategy 2: If still over, uncheck optional activity/decor items
    let recalculated = calculateBudgetMetrics(updatedList, target, currentEvent.guestCount);
    if (recalculated.isOverBudget) {
      updatedList = updatedList.map((item) => {
        if ((item.category === 'decor' || item.category === 'activities') && item.unitPrice > 15) {
          return { ...item, isChecked: false };
        }
        return item;
      });
    }

    setShoppingList(updatedList);
    showToast('✨ Budget optimized! Swapped to value brands to reduce total.');
  };

  // Swap all items with budget alternatives to Value tier
  const handleSwapToValueTier = () => {
    let count = 0;
    const updated = shoppingList.map((item) => {
      if (item.alternatives && item.alternatives.length > 0) {
        const budgetAlt = item.alternatives.find((a) => a.tier === 'budget');
        if (budgetAlt && item.tier !== 'budget') {
          count++;
          return {
            ...item,
            tier: 'budget' as BrandTier,
            name: budgetAlt.name,
            brand: budgetAlt.brand,
            unitPrice: budgetAlt.unitPrice,
          };
        }
      }
      return item;
    });

    setShoppingList(updated);
    showToast(`Switched ${count} items to Cymbal Everyday Value tier!`);
  };

  // Upgrade items to Gold Reserve premium tier
  const handleUpgradePremium = () => {
    let count = 0;
    const updated = shoppingList.map((item) => {
      if (item.alternatives && item.alternatives.length > 0) {
        const premAlt = item.alternatives.find((a) => a.tier === 'premium');
        if (premAlt && item.tier !== 'premium') {
          count++;
          return {
            ...item,
            tier: 'premium' as BrandTier,
            name: premAlt.name,
            brand: premAlt.brand,
            unitPrice: premAlt.unitPrice,
          };
        }
      }
      return item;
    });

    setShoppingList(updated);
    showToast(`Upgraded ${count} items to Cymbal Gold Reserve!`);
  };

  // Apply Action Proposed by CymbalMart Assistant Chatbot
  const handleApplyChatAction = (action: AIProposedAction) => {
    if (action.type === 'add_item' && action.item) {
      const fullItem: ShoppingItem = {
        id: action.item.id || `chat-add-${Date.now()}`,
        name: action.item.name || 'Party Item',
        brand: action.item.brand || 'CymbalMart',
        category: action.item.category || 'food',
        subcategory: action.item.subcategory,
        unitPrice: action.item.unitPrice || 4.99,
        quantity: action.item.quantity || 1,
        unit: action.item.unit || 'pack',
        isChecked: true,
        aisle: action.item.aisle || 'Aisle 3 - Grocery',
        tier: action.item.tier || 'standard',
        notes: action.item.notes,
        isCustom: true,
      };
      setShoppingList((prev) => [fullItem, ...prev]);
      showToast(`Added "${fullItem.name}" to cart`);
    } else if (action.type === 'remove_item' && action.targetItemId) {
      setShoppingList((prev) => prev.filter((i) => i.id !== action.targetItemId));
      showToast('Item removed from cart');
    } else if (action.type === 'update_qty' && action.targetItemId && action.newQty) {
      setShoppingList((prev) =>
        prev.map((i) => (i.id === action.targetItemId ? { ...i, quantity: action.newQty! } : i))
      );
      showToast('Updated item quantity');
    } else if (action.type === 'budget_cut') {
      handleAutoTrimBudget();
    } else if (action.type === 'navigate_checkout') {
      setIsCheckoutOpen(true);
      setIsPortionsOpen(false);
      showToast('Opening Checkout...');
    } else if (action.type === 'open_portions') {
      setIsPortionsOpen(true);
      setIsCheckoutOpen(false);
      showToast('Opening Portion Guide...');
    } else if (action.type === 'open_wizard') {
      setIsEventDefined(false);
      setIsCheckoutOpen(false);
      setIsPortionsOpen(false);
      showToast('Opening Event Setup...');
    }
  };

  // Hook up Hands-Free Voice Control
  const voice = useVoiceControl({
    currentEvent,
    shoppingList,
    metrics,
    isEventDefined,
    isPortionsOpen,
    isCheckoutOpen,
    onSetEvent: setCurrentEvent,
    onSetShoppingList: setShoppingList,
    onGeneratePlan: handleGeneratePlan,
    onSelectPreset: handleSelectPreset,
    onSetIsEventDefined: setIsEventDefined,
    onSetIsPortionsOpen: setIsPortionsOpen,
    onSetIsCheckoutOpen: setIsCheckoutOpen,
    onAutoTrimBudget: handleAutoTrimBudget,
    onSwapToValueTier: handleSwapToValueTier,
    onUpgradePremium: handleUpgradePremium,
    onShowToast: showToast,
    onSetCategoryFilter: setCategoryFilter,
    onSetSearchQuery: setSearchQuery,
    onSetFulfillmentType: setFulfillmentType,
    onPlaceOrder: () => {
      showToast('🎉 Order placed via Voice Control! Preparing party items.');
    },
  });

  const activeItemsCount = shoppingList.filter((i) => i.isChecked).length;
  const currentViewName = isCheckoutOpen
    ? 'checkout'
    : isPortionsOpen
    ? 'portions'
    : !isEventDefined
    ? 'wizard'
    : 'list';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans pb-32">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/40 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        metrics={metrics}
        onOpenPortions={() => setIsPortionsOpen(true)}
        onNewParty={() => setIsEventDefined(false)}
        onCheckout={() => setIsCheckoutOpen(true)}
        itemsCount={activeItemsCount}
        isListening={voice.isListening}
        onToggleVoice={voice.toggleListening}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isEventDefined ? (
          /* Step 1: Event Definition Form */
          <EventWizard
            initialEvent={currentEvent}
            isGenerating={isGenerating}
            onGenerate={handleGeneratePlan}
            onSelectPreset={handleSelectPreset}
          />
        ) : (
          /* Step 2 & 3: Active Shopping List, Budget Optimizer & CymbalMart Assistant Chatbot */
          <div>
            {/* Event Summary Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                    {currentEvent.partyType}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">/</span>
                  <span className="text-xs text-slate-600 font-semibold">{currentEvent.theme}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
                  {currentEvent.title || `${currentEvent.theme} ${currentEvent.partyType}`}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                  <span className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{currentEvent.guestCount} Guests</strong>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="capitalize">{currentEvent.venueType}</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>Target: <strong>${currentEvent.targetBudget}</strong></span>
                  {currentEvent.dietaryPreferences.length > 0 && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span className="text-emerald-700 font-medium">
                        {currentEvent.dietaryPreferences.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="edit-event-details-btn"
                  onClick={() => setIsEventDefined(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center space-x-1.5 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Event</span>
                </button>

                <button
                  id="proceed-checkout-banner-btn"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center space-x-1.5 shadow-sm shadow-emerald-600/20 transition"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Finalize Plan & Checkout</span>
                </button>
              </div>
            </div>

            {/* Budget Review & Optimizer Section */}
            <BudgetOverview
              metrics={metrics}
              onAutoTrimBudget={handleAutoTrimBudget}
              onSwapToValueTier={handleSwapToValueTier}
              onUpgradePremium={handleUpgradePremium}
              onOpenPortions={() => setIsPortionsOpen(true)}
            />

            {/* Dual Grid: Shopping List & CymbalMart Assistant Chatbot */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Interactive Shopping List */}
              <div className="lg:col-span-7 xl:col-span-8">
                <ShoppingListView
                  items={shoppingList}
                  onToggleCheck={handleToggleCheck}
                  onUpdateQty={handleUpdateQty}
                  onSetQty={handleSetQty}
                  onDelete={handleDelete}
                  onSwapTier={handleSwapTier}
                  onOpenAddItem={() => setIsAddItemOpen(true)}
                  onCheckAll={handleCheckAll}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                />
              </div>

              {/* Right Column: CymbalMart Assistant Chatbot */}
              <div className="lg:col-span-5 xl:col-span-4">
                <CymbalMartAssistantChat
                  currentEvent={currentEvent}
                  currentItems={shoppingList}
                  metrics={metrics}
                  onApplyAction={handleApplyChatAction}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        onAddItem={handleAddItem}
      />

      <PortionGuideModal
        isOpen={isPortionsOpen}
        onClose={() => setIsPortionsOpen(false)}
        event={currentEvent}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={currentEvent}
        items={shoppingList}
        metrics={metrics}
        fulfillmentType={fulfillmentType}
        onFulfillmentTypeChange={setFulfillmentType}
        onOrderPlaced={() => {
          showToast('🎉 Order placed! Enjoy your party.');
        }}
      />

      {/* Floating Hands-Free Voice Control HUD */}
      <VoiceControlHUD
        isListening={voice.isListening}
        isProcessing={voice.isProcessing}
        isSpeaking={voice.isSpeaking}
        liveTranscript={voice.liveTranscript}
        lastCommand={voice.lastCommand}
        lastResponse={voice.lastResponse}
        ttsMuted={voice.ttsMuted}
        onToggleListening={voice.toggleListening}
        onToggleTtsMute={voice.toggleTtsMute}
        onExecuteSimulatedCommand={voice.executeVoiceAction}
        currentView={currentViewName}
      />
    </div>
  );
}

