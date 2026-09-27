/**
 * Financial & Date Formatting Utilities for French Family Budget
 */

export function formatCurrency(amount: number, symbol = 'Ar'): string {
  if (isNaN(amount)) return `0 ${symbol}`;
  const isAriary = symbol === 'Ar' || symbol.toLowerCase().includes('ariary') || symbol === 'mga';
  const hasDecimals = amount % 1 !== 0;
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isAriary && !hasDecimals ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${symbol}`;
}

export function formatPercentage(value: number): string {
  if (isNaN(value)) return '0 %';
  return `${value.toFixed(1).replace('.', ',')} %`;
}

export function formatMonthYear(monthStr: string): string {
  // monthStr is "YYYY-MM"
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const formatted = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  // Capitalize first letter (e.g. "Septembre 2026")
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatDateShort(dateStr: string): string {
  // dateStr is "YYYY-MM-DD"
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function formatDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function getDaysInMonth(monthStr: string): number {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

export function getCurrentMonthStr(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
