export type AreaColorOption = {
  label: string
  value: string
}

export const AREA_COLOR_PALETTE: readonly AreaColorOption[] = [
  { label: 'Blush', value: '#f8b4c4' },
  { label: 'Rose', value: '#d94f70' },
  { label: 'Berry', value: '#9f3157' },
  { label: 'Lavender', value: '#c4a7e7' },
  { label: 'Purple', value: '#8055b5' },
  { label: 'Plum', value: '#56315f' },
  { label: 'Sky', value: '#8bc9ee' },
  { label: 'Blue', value: '#3f83c5' },
  { label: 'Navy', value: '#27466f' },
  { label: 'Aqua', value: '#79d4cf' },
  { label: 'Teal', value: '#278c88' },
  { label: 'Forest', value: '#376a4a' },
  { label: 'Mint', value: '#a8dbb5' },
  { label: 'Green', value: '#5a9d62' },
  { label: 'Olive', value: '#7d8038' },
  { label: 'Lemon', value: '#f4dc65' },
  { label: 'Gold', value: '#d9a62e' },
  { label: 'Orange', value: '#e98236' },
  { label: 'Peach', value: '#f6b27c' },
  { label: 'Coral', value: '#e76f51' },
  { label: 'Red', value: '#c94949' },
  { label: 'Burgundy', value: '#7c3038' },
  { label: 'Cream', value: '#f4ead4' },
  { label: 'Sand', value: '#cdb993' },
  { label: 'Taupe', value: '#9b877b' },
  { label: 'Gray', value: '#858589' },
  { label: 'Charcoal', value: '#48464d' },
  { label: 'Black', value: '#242126' },
] as const

const NAMED_COLORS: Readonly<Record<string, string>> = {
  black: '#000000',
  blue: '#3f83c5',
  green: '#5a9d62',
  orange: '#e98236',
  red: '#c94949',
  white: '#ffffff',
}

export function resolveColorHex(color: string): string {
  const normalized = color.trim().toLowerCase()
  if (/^#[\da-f]{6}$/.test(normalized)) return normalized
  if (/^#[\da-f]{3}$/.test(normalized)) {
    return `#${normalized.slice(1).split('').map((part) => `${part}${part}`).join('')}`
  }
  return NAMED_COLORS[normalized] ?? '#81767b'
}

export function getAreaColorDisplayName(color: string): string {
  const normalized = color.trim().toLowerCase()
  if (Object.hasOwn(NAMED_COLORS, normalized)) {
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`
  }

  const resolved = resolveColorHex(color)
  const preset = AREA_COLOR_PALETTE.find(
    (option) => option.value.toLowerCase() === resolved,
  )
  return preset?.label ?? `Custom · ${resolved.toUpperCase()}`
}

function channelLuminance(channel: number): number {
  const value = channel / 255
  return value <= 0.04045
    ? value / 12.92
    : ((value + 0.055) / 1.055) ** 2.4
}

export function getReadableTextColor(color: string): '#ffffff' | '#2f282a' {
  const hex = resolveColorHex(color)
  const red = Number.parseInt(hex.slice(1, 3), 16)
  const green = Number.parseInt(hex.slice(3, 5), 16)
  const blue = Number.parseInt(hex.slice(5, 7), 16)
  const luminance =
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  const whiteContrast = 1.05 / (luminance + 0.05)
  const darkContrast = (luminance + 0.05) / 0.05

  return whiteContrast >= darkContrast ? '#ffffff' : '#2f282a'
}
