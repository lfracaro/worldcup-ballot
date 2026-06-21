function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function decimalToFractional(decimal: number): string {
  if (!decimal || decimal <= 1) return "N/A";
  // For very long-shot odds, skip the fraction simplification loop which can produce "1/0"
  if (decimal > 100) return `${Math.round(decimal - 1)}/1`;
  const precision = 100;
  let num = Math.round((decimal - 1) * precision);
  let den = precision;
  const g = gcd(num, den);
  num = num / g;
  den = den / g;

  // If either side exceeds 2 digits, scale down to the nearest clean fraction.
  // Guard against den rounding to 0 (happens with very large odds like 2000/1+).
  while ((num > 99 || den > 99) && den > 1) {
    num = Math.round(num / 10);
    den = Math.round(den / 10);
    if (den === 0) return `${num}/1`;
    const g2 = gcd(num, den);
    num = num / g2;
    den = den / g2;
  }

  if (den === 0) return `${Math.round(decimal - 1)}/1`;
  return `${num}/${den}`;
}
