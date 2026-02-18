import { useState, useLayoutEffect, RefObject } from 'react';

interface Position {
    top?: number;
    bottom?: number;
    left: number;
    maxHeight: number;
    transformOrigin: string;
}

export function useSmartPosition(
    triggerRef: RefObject<HTMLElement | null>,
    isOpen: boolean,
    buffer: number = 16 // Margin from screen edges
) {
    const [position, setPosition] = useState<Position | null>(null);

    useLayoutEffect(() => {
        if (!isOpen || !triggerRef.current) {
            setPosition(null);
            return;
        }

        const updatePosition = () => {
            if (!triggerRef.current) return;

            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            const spaceBelow = viewportHeight - rect.top - buffer; // Using rect.top to align with top of button if lateral, or bottom?
            // Sidebar popovers open to the RIGHT of the sidebar button usually.
            // Current implementation: `left: rect.right + 12`, `top: rect.top`.

            // Measure space from rect.top downwards vs rect.bottom upwards?
            // If alignment is "top-aligned to trigger":
            // Space Below = viewportHeight - rect.top - buffer.
            // Space Above = rect.bottom - buffer (if we flipped to align bottom of popover to bottom of trigger) OR rect.top - buffer (if we align bottom-to-top).

            // Let's assume the desire is:
            // Standard: Top of popover aligns with Top of Trigger.
            // Flipped: Bottom of popover aligns with Bottom of Trigger.

            const spaceBelowStart = viewportHeight - rect.top - buffer;
            const spaceAboveStart = rect.bottom - buffer; // available space if we align bottom of popover to bottom of trigger

            // Check desired height (rough estimate or measure content?)
            // Since we can't easily measure content before rendering, we'll try to use max available space.
            // But we prefer "Down" if it fits.
            // Let's assume a reasonable "preferred" max height for these menus is ~400px.
            const preferredHeight = 400;

            let shouldUseBottom = true; // "Bottom" here means expanding downwards

            // If space below is less than preferred AND space above is significantly larger, flip.
            if (spaceBelowStart < preferredHeight && spaceAboveStart > spaceBelowStart) {
                shouldUseBottom = false; // Flip to open upwards
            }

            if (shouldUseBottom) {
                setPosition({
                    top: rect.top,
                    left: rect.right + 12,
                    maxHeight: spaceBelowStart,
                    transformOrigin: 'top left'
                });
            } else {
                // Open Upwards
                // We align popover bottom to trigger bottom
                // So `top` is not set, `bottom` is set.
                // Distance from bottom of viewport to bottom of trigger = viewportHeight - rect.bottom
                setPosition({
                    bottom: viewportHeight - rect.bottom,
                    left: rect.right + 12,
                    maxHeight: spaceAboveStart,
                    transformOrigin: 'bottom left'
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true); // Capture scroll to update if needed

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen, triggerRef, buffer]);

    return {
        top: position?.top,
        bottom: position?.bottom,
        left: position?.left ?? 0,
        maxHeight: position?.maxHeight ?? 400,
        transformOrigin: position?.transformOrigin ?? 'top left',
        isReady: position !== null
    };
}
