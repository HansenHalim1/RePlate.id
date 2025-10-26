export function formatIDR(value: number) {
  // Figma shows "Rp15.000" (no decimals, dot as thousands)
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
