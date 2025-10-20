"use client";
export default function BTXLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-extrabold tracking-wide text-[#0F62FE] ${className}`}>
      BTX
      <span
        className="inline-block translate-y-[2px] sm:translate-y-[-4px]"
        style={{ fontSize: "1em", lineHeight: 1 }}
      >
        •
      </span>
    </div>
  );
}
