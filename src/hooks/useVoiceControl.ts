import { useState, useEffect, useCallback, useRef } from 'react';
import { voiceController } from '../utils/speechRecognition';
import { soundFX } from '../utils/soundEffects';
import { PartyEvent, ShoppingItem, BudgetMetrics, BrandTier, PresetPartyPlan } from '../types';
import { PRESET_PARTIES } from '../data/presetParties';

interface UseVoiceControlProps {
  currentEvent: PartyEvent;
  shoppingList: ShoppingItem[];
  metrics: BudgetMetrics;
  isEventDefined: boolean;
  isPortionsOpen: boolean;
  isCheckoutOpen: boolean;
  onSetEvent: (event: PartyEvent | ((prev: PartyEvent) => PartyEvent)) => void;
  onSetShoppingList: (items: ShoppingItem[] | ((prev: ShoppingItem[]) => ShoppingItem[])) => void;
  onGeneratePlan: (event: PartyEvent) => Promise<void>;
  onSelectPreset: (preset: PresetPartyPlan) => void;
  onSetIsEventDefined: (defined: boolean) => void;
  onSetIsPortionsOpen: (open: boolean) => void;
  onSetIsCheckoutOpen: (open: boolean) => void;
  onAutoTrimBudget: () => void;
  onSwapToValueTier: () => void;
  onUpgradePremium: () => void;
  onShowToast: (msg: string) => void;
  onSetCategoryFilter?: (cat: string) => void;
  onSetSearchQuery?: (q: string) => void;
  onSetFulfillmentType?: (type: 'pickup' | 'delivery') => void;
  onPlaceOrder?: () => void;
}

export function useVoiceControl({
  currentEvent,
  shoppingList,
  metrics,
  isEventDefined,
  isPortionsOpen,
  isCheckoutOpen,
  onSetEvent,
  onSetShoppingList,
  onGeneratePlan,
  onSelectPreset,
  onSetIsEventDefined,
  onSetIsPortionsOpen,
  onSetIsCheckoutOpen,
  onAutoTrimBudget,
  onSwapToValueTier,
  onUpgradePremium,
  onShowToast,
  onSetCategoryFilter,
  onSetSearchQuery,
  onSetFulfillmentType,
  onPlaceOrder,
}: UseVoiceControlProps) {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [lastCommand, setLastCommand] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('');
  const [ttsMuted, setTtsMuted] = useState<boolean>(false);

  const isSpeakingRef = useRef<boolean>(false);

  // Sync mute state with soundFX and voiceController
  useEffect(() => {
    soundFX.isMuted = ttsMuted;
    voiceController.ttsEnabled = !ttsMuted;
  }, [ttsMuted]);

  // Execute an action locally or handle response
  const executeVoiceAction = useCallback(
    async (rawCommand: string) => {
      if (!rawCommand.trim() || isProcessing) return;

      const cmd = rawCommand.trim();
      const lower = cmd.toLowerCase().replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
      setLastCommand(cmd);
      setLiveTranscript(cmd);
      setIsProcessing(true);

      // Fast-path immediate view switching for instant responsive feel
      if (
        lower.includes('checkout') ||
        lower.includes('check out') ||
        lower.includes('take me to check out') ||
        lower.includes('take me to checkout') ||
        lower.includes('go to check out') ||
        lower.includes('go to checkout') ||
        lower.includes('open check out') ||
        lower.includes('open checkout') ||
        lower.includes('proceed to check out') ||
        lower.includes('proceed to checkout') ||
        lower.includes('view cart') ||
        lower.includes('show cart') ||
        lower.includes('open cart') ||
        lower.includes('pay now')
      ) {
        onSetIsCheckoutOpen(true);
        onSetIsPortionsOpen(false);
        soundFX.playCommandSuccess();
      } else if (
        lower.includes('portion') ||
        lower.includes('how much food') ||
        lower.includes('portion guide') ||
        lower.includes('show portions') ||
        lower.includes('take me to portion')
      ) {
        onSetIsPortionsOpen(true);
        onSetIsCheckoutOpen(false);
        soundFX.playCommandSuccess();
      } else if (
        lower.includes('show list') ||
        lower.includes('shopping list') ||
        lower.includes('back to list') ||
        lower.includes('view items') ||
        lower.includes('close checkout') ||
        lower.includes('close portions')
      ) {
        onSetIsEventDefined(true);
        onSetIsCheckoutOpen(false);
        onSetIsPortionsOpen(false);
        soundFX.playCommandSuccess();
      }

      const currentView = isCheckoutOpen
        ? 'checkout'
        : isPortionsOpen
        ? 'portions'
        : !isEventDefined
        ? 'wizard'
        : 'list';

      try {
        const response = await fetch('/api/voice-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: cmd,
            currentEvent,
            currentItems: shoppingList,
            metrics,
            currentView,
          }),
        });

        const data = await response.json();

        if (data.success) {
          const { actionType, parameters, speechResponse } = data;

          setLastResponse(speechResponse);

          // Apply state actions
          switch (actionType) {
            case 'NAVIGATE_VIEW': {
              if (parameters?.view === 'checkout') {
                onSetIsCheckoutOpen(true);
                onSetIsPortionsOpen(false);
              } else if (parameters?.view === 'portions') {
                onSetIsPortionsOpen(true);
                onSetIsCheckoutOpen(false);
              } else if (parameters?.view === 'wizard') {
                onSetIsEventDefined(false);
                onSetIsCheckoutOpen(false);
                onSetIsPortionsOpen(false);
              } else if (parameters?.view === 'list') {
                onSetIsEventDefined(true);
                onSetIsCheckoutOpen(false);
                onSetIsPortionsOpen(false);
              }
              soundFX.playCommandSuccess();
              break;
            }

            case 'UPDATE_EVENT': {
              onSetEvent((prev) => ({
                ...prev,
                ...(parameters.guestCount && { guestCount: parameters.guestCount }),
                ...(parameters.targetBudget && { targetBudget: parameters.targetBudget }),
                ...(parameters.partyType && { partyType: parameters.partyType }),
                ...(parameters.theme && { theme: parameters.theme }),
                ...(parameters.venueType && { venueType: parameters.venueType }),
                ...(parameters.dietaryPreferences && {
                  dietaryPreferences: Array.from(
                    new Set([...prev.dietaryPreferences, ...parameters.dietaryPreferences])
                  ),
                }),
              }));
              soundFX.playCommandSuccess();
              break;
            }

            case 'LOAD_PRESET': {
              const targetPreset =
                PRESET_PARTIES.find((p) => p.id === parameters.presetId) ||
                PRESET_PARTIES[0];
              onSelectPreset(targetPreset);
              soundFX.playCommandSuccess();
              break;
            }

            case 'GENERATE_PLAN': {
              await onGeneratePlan(currentEvent);
              soundFX.playCommandSuccess();
              break;
            }

            case 'ADD_ITEM': {
              if (parameters.item) {
                const newItem: ShoppingItem = {
                  id: parameters.item.id || `voice-add-${Date.now()}`,
                  name: parameters.item.name || 'Party Item',
                  brand: parameters.item.brand || 'CymbalMart',
                  category: parameters.item.category || 'food',
                  subcategory: parameters.item.subcategory,
                  unitPrice: parameters.item.unitPrice || 4.99,
                  quantity: parameters.item.quantity || 1,
                  unit: parameters.item.unit || 'pack',
                  isChecked: true,
                  aisle: parameters.item.aisle || 'Aisle 3 - Grocery',
                  tier: (parameters.item.tier as BrandTier) || 'standard',
                  notes: parameters.item.notes || 'Added via Voice Control',
                  isCustom: true,
                };
                onSetShoppingList((prev) => [newItem, ...prev]);
                soundFX.playCommandSuccess();
                onShowToast(`🎤 Added "${newItem.name}" to cart`);
              }
              break;
            }

            case 'REMOVE_ITEM': {
              const targetId = parameters.targetItemId;
              const targetName = (parameters.targetName || '').toLowerCase();
              onSetShoppingList((prev) =>
                prev.filter((i) => {
                  if (targetId && i.id === targetId) return false;
                  if (targetName && i.name.toLowerCase().includes(targetName)) return false;
                  return true;
                })
              );
              soundFX.playCommandSuccess();
              onShowToast('🎤 Removed item from cart');
              break;
            }

            case 'UPDATE_QTY': {
              const targetId = parameters.targetItemId;
              const targetName = (parameters.targetName || '').toLowerCase();
              const newQty = parameters.newQty;
              const delta = parameters.delta;

              onSetShoppingList((prev) =>
                prev.map((i) => {
                  const isMatch = (targetId && i.id === targetId) || (targetName && i.name.toLowerCase().includes(targetName));
                  if (isMatch) {
                    const finalQty = newQty ? Math.max(1, newQty) : Math.max(1, (i.quantity || 1) + (delta || 1));
                    return { ...i, quantity: finalQty };
                  }
                  return i;
                })
              );
              soundFX.playCommandSuccess();
              onShowToast('🎤 Updated item quantity');
              break;
            }

            case 'SWAP_TIER': {
              if (parameters.tier === 'budget') {
                onSwapToValueTier();
              } else if (parameters.tier === 'premium') {
                onUpgradePremium();
              }
              soundFX.playCommandSuccess();
              break;
            }

            case 'OPTIMIZE_BUDGET': {
              onAutoTrimBudget();
              soundFX.playCommandSuccess();
              break;
            }

            case 'FILTER_CATEGORY': {
              if (parameters.category && onSetCategoryFilter) {
                onSetCategoryFilter(parameters.category);
                soundFX.playCommandSuccess();
              }
              break;
            }

            case 'SEARCH_ITEMS': {
              if (parameters.query !== undefined && onSetSearchQuery) {
                onSetSearchQuery(parameters.query);
                soundFX.playCommandSuccess();
              }
              break;
            }

            case 'CHECK_ALL': {
              onSetShoppingList((prev) =>
                prev.map((item) => ({ ...item, isChecked: Boolean(parameters.checked) }))
              );
              soundFX.playCommandSuccess();
              break;
            }

            case 'TOGGLE_ITEM': {
              const targetId = parameters.targetItemId;
              if (targetId) {
                onSetShoppingList((prev) =>
                  prev.map((i) =>
                    i.id === targetId ? { ...i, isChecked: parameters.isChecked ?? !i.isChecked } : i
                  )
                );
                soundFX.playCommandSuccess();
              }
              break;
            }

            case 'SET_FULFILLMENT': {
              if (parameters.fulfillmentType && onSetFulfillmentType) {
                onSetFulfillmentType(parameters.fulfillmentType);
                soundFX.playCommandSuccess();
              }
              break;
            }

            case 'PLACE_ORDER': {
              onSetIsCheckoutOpen(true);
              soundFX.playOrderSuccess();
              onPlaceOrder?.();
              break;
            }

            case 'READ_CART':
            case 'GENERAL_QA':
            default: {
              soundFX.playCommandSuccess();
              break;
            }
          }

          // Voice speech output
          if (speechResponse) {
            setIsSpeaking(true);
            isSpeakingRef.current = true;
            voiceController.speak(speechResponse, () => {
              setIsSpeaking(false);
              isSpeakingRef.current = false;
            });
          }
        }
      } catch (err) {
        console.error('Voice command execution failed:', err);
        soundFX.playError();
        setLastResponse("I didn't quite catch that. You can ask me to add items, trim budget, or checkout!");
      } finally {
        setIsProcessing(false);
      }
    },
    [
      isProcessing,
      isCheckoutOpen,
      isPortionsOpen,
      isEventDefined,
      currentEvent,
      shoppingList,
      metrics,
      onSetEvent,
      onSetShoppingList,
      onSelectPreset,
      onGeneratePlan,
      onSetIsCheckoutOpen,
      onSetIsPortionsOpen,
      onSetIsEventDefined,
      onShowToast,
      onSwapToValueTier,
      onUpgradePremium,
      onAutoTrimBudget,
      onSetCategoryFilter,
      onSetSearchQuery,
      onSetFulfillmentType,
      onPlaceOrder,
    ]
  );

  // Toggle voice listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      voiceController.stopListening();
      setIsListening(false);
      onShowToast('Voice listening stopped');
    } else {
      soundFX.playListeningStart();
      setIsListening(true);
      voiceController.startListening({
        continuous: true,
        wakeWord: false,
        onTranscript: (text) => {
          setLiveTranscript(text);
        },
        onCommand: (cmd) => {
          // Avoid executing while assistant itself is speaking
          if (!isSpeakingRef.current) {
            executeVoiceAction(cmd);
          }
        },
        onError: (err) => {
          onShowToast(err);
          setIsListening(false);
        },
        onListeningChange: (listening) => {
          setIsListening(listening);
        },
      });
      onShowToast('🎙️ Hands-Free Voice Control Active. Speak anytime!');
    }
  }, [isListening, executeVoiceAction, onShowToast]);

  const toggleTtsMute = useCallback(() => {
    setTtsMuted((prev) => !prev);
    if (!ttsMuted) {
      voiceController.stopSpeaking();
      setIsSpeaking(false);
    }
  }, [ttsMuted]);

  return {
    isListening,
    isProcessing,
    isSpeaking,
    liveTranscript,
    lastCommand,
    lastResponse,
    ttsMuted,
    toggleListening,
    toggleTtsMute,
    executeVoiceAction,
  };
}
