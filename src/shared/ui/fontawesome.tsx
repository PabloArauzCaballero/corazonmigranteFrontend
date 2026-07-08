import type { SVGProps } from "react";

export type FaIconName =
  | "pencil"
  | "calendar-days"
  | "upload"
  | "floppy-disk"
  | "plus"
  | "ban"
  | "circle-check"
  | "lock"
  | "clock"
  | "image"
  | "spinner";

const paths: Record<FaIconName, string[]> = {
  pencil: ["M15.6 2.9 17.1 4.4c1.2 1.2 1.2 3.1 0 4.3L7.6 18.2 2 20l1.8-5.6 9.5-9.5c1.2-1.2 3.1-1.2 4.3 0Z", "M12.2 6 14 4.2 15.8 6 14 7.8 12.2 6Z"],
  "calendar-days": ["M6 2v3M16 2v3M3.5 8h15", "M5 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z", "M7 11h2M11 11h2M15 11h2M7 15h2M11 15h2M15 15h2"],
  upload: ["M11 16V5", "M7 9l4-4 4 4", "M4 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"],
  "floppy-disk": ["M4 3h11l4 4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z", "M7 3v6h8V3", "M7 15h8v6H7z"],
  plus: ["M11 4v14M4 11h14"],
  ban: ["M11 20a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M5 5l12 12"],
  "circle-check": ["M11 20a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M7 11.5l2.5 2.5L15.5 8"],
  lock: ["M6 10V8a5 5 0 0 1 10 0v2", "M5 10h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17 20H5a1.5 1.5 0 0 1-1.5-1.5v-7A1.5 1.5 0 0 1 5 10Z", "M11 14v2"],
  clock: ["M11 20a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M11 6v5l3 2"],
  image: ["M4 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z", "M7 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z", "M3 17l5-5 3 3 2-2 5 5"],
  spinner: ["M11 2a9 9 0 1 0 9 9", "M20 4v5h-5"],
};

export function FaIcon({ name, className, ...props }: SVGProps<SVGSVGElement> & { name: FaIconName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
      {...props}
    >
      {paths[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
