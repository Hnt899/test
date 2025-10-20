"use client";

import Modal from "./Modal";

export default function ConfirmDialog({
  open, onClose, title = "Подтверждение", text, onConfirm, loading = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  text?: string;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p>{text ?? "Вы уверены?"}</p>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 border rounded" onClick={onClose}>Отмена</button>
          <button className="px-3 py-2 rounded bg-red-600 text-white disabled:opacity-50" disabled={loading} onClick={() => onConfirm()}>
            {loading ? "Удаляем…" : "Удалить"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
