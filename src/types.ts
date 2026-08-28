export type CategoryType = 'food' | 'beverage' | 'decor' | 'tableware' | 'activities';

export type BrandTier = 'budget' | 'standard' | 'premium';

export interface ItemAlternative {
  tier: BrandTier;
  name: string;
  brand: string;
  unitPrice: number;
  savingsOrPremiumDiff?: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  brand: string;
  category: CategoryType;
  subcategory?: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  isChecked: boolean;
  aisle: string;
  tier: BrandTier;
  notes?: string;
  dietaryTags?: string[];
  alternatives?: ItemAlternative[];
  isCustom?: boolean;
}

export interface PartyEvent {
  id: string;
  title: string;
  partyType: string;
  theme: string;
  targetBudget: number;
  guestCount: number;
  adultCount: number;
  childCount: number;
  durationHours: number;
  venueType: 'indoor' | 'backyard' | 'park' | 'pool' | 'rented_venue';
  dietaryPreferences: string[];
  specialRequests: string;
  vibeDescription?: string;
}

export interface AIProposedAction {
  type: 'add_item' | 'remove_item' | 'update_qty' | 'swap_item' | 'budget_cut' | 'navigate_checkout' | 'open_portions' | 'open_wizard';
  description: string;
  item?: Partial<ShoppingItem>;
  targetItemId?: string;
  newQty?: number;
  savingsAmount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  proposedActions?: AIProposedAction[];
  appliedActionId?: string;
}

export interface BudgetMetrics {
  targetBudget: number;
  subtotal: number;
  estimatedTax: number;
  memberDiscount: number;
  finalTotal: number;
  remainingBudget: number;
  isOverBudget: boolean;
  costPerGuest: number;
  totalItemsCount: number;
  categoryBreakdown: Record<CategoryType, number>;
}

export interface PresetPartyPlan {
  id: string;
  title: string;
  partyType: string;
  theme: string;
  guestCount: number;
  targetBudget: number;
  description: string;
  tagline: string;
  dietaryPreferences: string[];
  venueType: 'indoor' | 'backyard' | 'park' | 'pool' | 'rented_venue';
  specialRequests: string;
  items: Omit<ShoppingItem, 'id'>[];
}
