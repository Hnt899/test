// shared/components/Modal.tsx
"use client";
import React, { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  // Закрытие по Esc
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* затемнение */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      {/* модальное окно */}
      <div className="relative z-10 w-full max-w-lg card">
        <div className="flex items-center justify-between border-b border-line p-4">
          <h3 className="text-[16px] font-semibold">{title}</h3>
          <button
            className="text-sub hover:text-ink text-lg leading-none"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
