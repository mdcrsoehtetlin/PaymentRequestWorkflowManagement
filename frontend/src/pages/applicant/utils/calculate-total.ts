export interface BreakdownItem {
  description: string;
  amount: string;
}

/**
 * @description Safely calculates the total amount from an array of breakdown items,
 * handling floating point precision and empty strings.
 * @param {BreakdownItem[]} items - Array of breakdown items.
 * @returns {string} The formatted total amount as a string.
 */
export const calculateTotal = (items: BreakdownItem[]): string => {
  const sum = items.reduce((total, item) => {
    const val = parseFloat(item.amount);
    return total + (isNaN(val) ? 0 : val);
  }, 0);

  // Format to 2 decimal places to handle JS floating point issues
  return sum.toFixed(2);
};
