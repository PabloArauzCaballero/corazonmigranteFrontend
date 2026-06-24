import React from "react";

export default function PageHeader({
    breadcrumb = [],
    title,
    subtitle,
    action,
}) {
    return (
        <div className="bg-brand-cream border-b border-slate-200 px-10 py-10">
            <div className="max-w-[1600px] mx-auto">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] mb-3 uppercase tracking-widest font-bold">
                    {breadcrumb.map((b, idx) => (
                        <React.Fragment key={`${b.label}-${idx}`}>
                            <span className={b.active ? "text-primary" : ""}>{b.label}</span>
                            {idx < breadcrumb.length - 1 && (
                                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-display text-slate-900 mb-3 font-bold tracking-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-slate-500 text-lg max-w-2xl font-light">{subtitle}</p>
                        )}
                    </div>

                    {action && <div className="flex items-center gap-3 pb-1">{action}</div>}
                </div>
            </div>
        </div>
    );
}
