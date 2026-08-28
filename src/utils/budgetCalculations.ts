import { ShoppingItem, BudgetMetrics, CategoryType } from '../types';

export function calculateBudgetMetrics(
  items: ShoppingItem[],
  targetBudget: number,
  guestCount: number
): BudgetMetrics {
  const activeItems = items.filter((item) => item.isChecked);

  const subtotal = activeItems.reduce(
    (sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 1),
    0
  );

  // CymbalMart Host Club 5% Member Savings on orders
  const memberDiscount = subtotal > 0 ? Number((subtotal * 0.05).toFixed(2)) : 0;
  const taxableSubtotal = Math.max(0, subtotal - memberDiscount);
  const estimatedTax = Number((taxableSubtotal * 0.075).toFixed(2));
  const finalTotal = Number((taxableSubtotal + estimatedTax).toFixed(2));

  const remainingBudget = Number((targetBudget - finalTotal).toFixed(2));
  const isOverBudget = finalTotal > targetBudget;
  const costPerGuest =
    guestCount > 0 ? Number((finalTotal / guestCount).toFixed(2)) : finalTotal;

  const categoryBreakdown: Record<CategoryType, number> = {
    food: 0,
    beverage: 0,
    decor: 0,
    tableware: 0,
    activities: 0,
  };

  activeItems.forEach((item) => {
    if (categoryBreakdown[item.category] !== undefined) {
      categoryBreakdown[item.category] += (item.unitPrice || 0) * (item.quantity || 1);
    }
  });

  // Round category numbers
  (Object.keys(categoryBreakdown) as CategoryType[]).forEach((cat) => {
    categoryBreakdown[cat] = Number(categoryBreakdown[cat].toFixed(2));
  });

  return {
    targetBudget,
    subtotal: Number(subtotal.toFixed(2)),
    memberDiscount,
    estimatedTax,
    finalTotal,
    remainingBudget,
    isOverBudget,
    costPerGuest,
    totalItemsCount: activeItems.reduce((sum, it) => sum + (it.quantity || 1), 0),
    categoryBreakdown,
  };
}
