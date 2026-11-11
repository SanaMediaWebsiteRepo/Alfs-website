export function formatKwacha(amount: number): string {
  const rounded = Math.round(amount);
  return 'K' + rounded.toLocaleString('en-US');
}

export function parseKwacha(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}
