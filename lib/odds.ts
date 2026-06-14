function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function decimalToFractional(decimal: number): string {
  const precision = 100;
  let num = Math.round((decimal - 1) * precision);
  let den = precision;
  const g = gcd(num, den);
  num = num / g;
  den = den / g;

  // If either side exceeds 2 digits, scale down to the nearest clean fraction
  while ((num > 99 || den > 99) && den > 1) {
    num = Math.round(num / 10);
    den = Math.round(den / 10);
    const g2 = gcd(num, den);
    num = num / g2;
    den = den / g2;
  }

  return `${num}/${den}`;
}
