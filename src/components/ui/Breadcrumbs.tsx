"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumbs() {
    const pathname = usePathname();

    // If we are at the root dashboard page, we might not need breadcrumbs at all.
    if (pathname === "/dashboard" || pathname === "/") {
        return null;
    }

    const segments = pathname.split('/').filter(Boolean);

    return (
        <nav className="flex items-center space-x-1 text-sm text-zinc-400 mb-6">
            <Link href="/dashboard" className="flex items-center hover:text-white transition-colors">
                <Home className="w-4 h-4" />
                <span className="sr-only">Dashboard</span>
            </Link>

            {segments.map((segment, index) => {
                // Skip the "dashboard" segment itself since the home icon acts as the dashboard link
                if (segment === 'dashboard') return null;

                const href = `/${segments.slice(0, index + 1).join('/')}`;
                const isLast = index === segments.length - 1;

                // Format the segment to be title case and handle dashes or IDs
                let title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

                // If the segment implies it's an ID (like a UUID or long string), we can shorten it or just display it.
                // For simplicity, we just display it.
                if (title.length > 20) {
                    title = `${title.substring(0, 8)}...`;
                }

                return (
                    <div key={href} className="flex items-center space-x-1">
                        <ChevronRight className="w-4 h-4 text-zinc-600" />
                        {isLast ? (
                            <span className="text-zinc-200 font-medium">{title}</span>
                        ) : (
                            <Link href={href} className="hover:text-white transition-colors">
                                {title}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
