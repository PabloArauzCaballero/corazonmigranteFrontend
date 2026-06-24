import React from "react";

export function renderStrong(text) {
    const s = String(text ?? "");
    const parts = s.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, i) => {
        const isStrong = part.startsWith("**") && part.endsWith("**");
        if (!isStrong) return <React.Fragment key={i}>{part}</React.Fragment>;

        const content = part.slice(2, -2);
        return (
            <strong key={i} className="font-semibold text-text-main-light dark:text-gray-100">
                {content}
            </strong>
        );
    });
}
