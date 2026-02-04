"use client";

export function BackgroundPattern() {
    return (
        <div className="absolute inset-0 z-0 h-screen w-full pointer-events-none overflow-hidden">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 h-full w-full bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,white,transparent)]"
                style={{
                    backgroundImage: "var(--background-image-grid)",
                }}
            />
        </div>
    );
}
