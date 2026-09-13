export type CurrencyType = 'Toman' | 'Rial' | 'USD' | 'EUR';

export function formatCurrency(
  rawPriceToman: number,
  currency: CurrencyType = 'Toman',
  exchangeRate = 62000
): string {
  if (!rawPriceToman || isNaN(rawPriceToman)) return '۰ تومان';

  switch (currency) {
    case 'Rial':
      return `${(rawPriceToman * 10).toLocaleString('fa-IR')} ریال`;
    case 'USD': {
      const usdVal = (rawPriceToman / exchangeRate).toFixed(2);
      return `$${usdVal} USD`;
    }
    case 'EUR': {
      const eurRate = exchangeRate * 1.08;
      const eurVal = (rawPriceToman / eurRate).toFixed(2);
      return `€${eurVal} EUR`;
    }
    case 'Toman':
    default:
      return `${rawPriceToman.toLocaleString('fa-IR')} تومان`;
  }
}
