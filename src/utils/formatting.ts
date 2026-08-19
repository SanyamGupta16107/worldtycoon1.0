export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0';
  }
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

export function formatCompactNumber(amount: number): string {
  if (isNaN(amount)) return '$0';
  if (Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(amount)}`;
}

export function formatPercentage(multiplier: number): string {
  const percent = Math.round((multiplier - 1) * 100);
  if (percent > 0) return `+${percent}%`;
  if (percent < 0) return `${percent}%`;
  return '0%';
}
