export function formatKsh(amount: number, includeDecimals = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'KSh 0.00';
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  })}`;
}

export function formatKshCompact(amount: number): string {
  if (isNaN(amount)) return 'KSh 0';
  if (Math.abs(amount) >= 1_000_000) {
    return `KSh ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `KSh ${(amount / 1_000).toFixed(0)}K`;
  }
  return `KSh ${amount.toFixed(0)}`;
}
