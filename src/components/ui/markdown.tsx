import React from 'react';

interface MarkdownProps {
    content: string;
    className?: string;
}

export const Markdown = ({ content, className = "" }: MarkdownProps) => {
    if (!content) return null;

    // Split by newlines to handle paragraphs/breaks
    const lines = content.split('\n');

    return (
        <div className={`text-sm leading-relaxed ${className}`}>
            {lines.map((line, i) => (
                <p key={i} className={`min-h-[1em] ${i < lines.length - 1 ? 'mb-1' : ''}`}>
                    {parseLine(line)}
                </p>
            ))}
        </div>
    );
};

const parseLine = (text: string): React.ReactNode[] => {
    if (!text) return [];

    // Regex for bold (**text**), cubic bezier for italics (*text*), and links ([text](url))
    // We need a way to tokenize string. 
    // Simple approach: split by patterns and map.

    // Let's use a simpler approach for a lightweight parser:
    // We can use a regex with capturing groups to split the string.

    // Order: Links -> Bold -> Italic (to prevent nesting issues in simple regex)
    // Note: This is basic. Nested markdown might handle poorly, but sufficient for status updates.

    const parts: React.ReactNode[] = [];
    let remaining = text;

    // Helper to push text
    const pushText = (t: string) => {
        if (t) parts.push(<span key={parts.length}>{t}</span>);
    };

    // We will parse character by character or use a more robust regex split if possible.
    // For simplicity and React safety, creating an element tree is best.

    // Regex to match markdown tokens: 
    // \[([^\]]+)\]\(([^)]+)\)  -> Links
    // \*\*([^*]+)\*\*          -> Bold
    // \*([^*]+)\*              -> Italic

    // We can stick to a simpler strategy: formatting functions.

    // Strategy: 
    // 1. Split by links.
    // 2. Map resulting parts and split by bold.
    // 3. Map resulting parts and split by italics.

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const italicRegex = /\*([^*]+)\*/g;

    const parseItalics = (str: string): React.ReactNode[] => {
        const result: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        // Reset regex state just in case (though creating new one is properly safe)
        const regex = new RegExp(italicRegex);

        while ((match = regex.exec(str)) !== null) {
            if (match.index > lastIndex) {
                result.push(str.substring(lastIndex, match.index));
            }
            result.push(<em key={`em-${match.index}`} className="italic">{match[1]}</em>);
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < str.length) {
            result.push(str.substring(lastIndex));
        }
        return result;
    };

    const parseBold = (str: string): React.ReactNode[] => {
        const result: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;
        const regex = new RegExp(boldRegex);

        while ((match = regex.exec(str)) !== null) {
            if (match.index > lastIndex) {
                result.push(...parseItalics(str.substring(lastIndex, match.index)));
            }
            result.push(<strong key={`strong-${match.index}`} className="font-bold">{match[1]}</strong>);
            lastIndex = regex.lastIndex;
        }
        if (lastIndex < str.length) {
            result.push(...parseItalics(str.substring(lastIndex)));
        }
        return result;
    }

    // Main parsing loop for links
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            // Parse text before link for bold/italics
            parts.push(...parseBold(text.substring(lastIndex, match.index)));
        }
        // Link component
        parts.push(
            <a
                key={`link-${match.index}`}
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline hover:text-indigo-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
            >
                {match[1]}
            </a>
        );
        lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(...parseBold(text.substring(lastIndex)));
    }

    return parts;
};
