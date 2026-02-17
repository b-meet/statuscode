import React from 'react';

interface MarkdownProps {
    content: string;
    className?: string;
}

export const Markdown = ({ content, className }: MarkdownProps) => {
    if (!content) return null;

    // Simple parser for **bold**, *italic*, and [link](url)
    // We split by newlines first to handle paragraphs/breaks
    const lines = content.split('\n');

    return (
        <div className={className}>
            {lines.map((line, i) => (
                <p key={i} className={i < lines.length - 1 ? "mb-1" : ""}>
                    {parseLine(line)}
                </p>
            ))}
        </div>
    );
};

const parseLine = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Regex for **bold**, *italic*, [link](url)
    // Priority: Bold, then Link, then Italic
    const regex = /(\*\*(.*?)\*\*)|(\[(.*?)\]\((.*?)\))|(\*(.*?)\*)/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
        // Push text before match
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }

        if (match[1]) { // Bold: **text**
            parts.push(<strong key={match.index} className="font-bold">{match[2]}</strong>);
        } else if (match[3]) { // Link: [text](url)
            parts.push(
                <a
                    key={match.index}
                    href={match[5].match(/^https?:\/\//) ? match[5] : `https://${match[5]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:opacity-80 transition-opacity"
                >
                    {match[4]}
                </a>
            );
        } else if (match[6]) { // Italic: *text*
            parts.push(<em key={match.index} className="italic">{match[7]}</em>);
        }

        lastIndex = regex.lastIndex;
    }

    // Push remaining text
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }

    if (parts.length === 0) return [text];

    return parts;
};
