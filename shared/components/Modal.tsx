// shared/components/Modal.tsx
"use client";
import React, { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
  hideHeader = false,
  dialogClassName,
  contentClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  hideHeader?: boolean;
  dialogClassName?: string;
  contentClassName?: string;
}) {
  // Закрытие по Esc
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  const dialogClasses = ["relative z-10 w-full max-w-lg card", dialogClassName]
    .filter(Boolean)
    .join(" ");
  const contentClasses = ["p-4", contentClassName].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* затемнение */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* модальное окно */}
      <div className={dialogClasses}>
        {!hideHeader && (
          <div className="flex items-center justify-between border-b border-line p-4">
            <h3 className="text-[16px] font-semibold">{title}</h3>
            <button
              className="text-sub hover:text-ink text-lg leading-none"
              onClick={onClose}
              type="button"
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        )}
        <div className={contentClasses}>{children}</div>
      </div>
    </div>
  );
}
