/**
 * Determines whether to use black or white text based on background color brightness.
 * Uses the YIQ formula for calculating perceived brightness.
 */
export function getContrastColor(hexColor: string | null | undefined): "text-white" | "text-black" {
    if (!hexColor) return "text-white";

    // Remove # if present
    const cleanHex = hexColor.replace("#", "");

    // Convert to RGB
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Calculate brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 140 ? "text-black" : "text-white";
}
