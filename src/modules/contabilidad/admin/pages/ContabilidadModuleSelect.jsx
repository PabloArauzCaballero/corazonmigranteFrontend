
import React from "react";

export default function ContabilidadModuleSelect({ value, onChange, options }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
            <label className="block text-xs font-semibold text-slate-600 mb-2">
                ¿Qué deseas gestionar?
            </label>

            <div className="relative">
                <select
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {options.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>

                <span className="material-icons absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    expand_more
                </span>
            </div>
        </div>
    );
}
