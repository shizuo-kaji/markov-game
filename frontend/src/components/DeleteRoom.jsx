import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/useI18n.js";
import { api, readStorage, writeStorage } from "../utils/api.js";
import Icon from "./Icon.jsx";

export default function DeleteRoom({ room, onDeleted }) {
  const { t } = useI18n();
  const dialog = useRef(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ownerToken = readStorage(`owner:${room.id}`);
  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);
  if (!ownerToken) return null;
  const remove = async () => {
    setBusy(true);
    setError("");
    try {
      await api(`/rooms/${room.id}`, { method: "DELETE", ownerToken });
    } catch (err) {
      if (err.status !== 404) {
        setError(
          err.status
            ? err.message
            : "削除できませんでした。接続を確認して再試行してください。",
        );
        setBusy(false);
        return;
      }
    }
    writeStorage(`owner:${room.id}`, null);
    writeStorage(`session:${room.id}`, null);
    setOpen(false);
    setBusy(false);
    onDeleted?.();
  };
  return (
    <>
      <button
        className="button small delete-room-button"
        onClick={() => setOpen(true)}
        aria-label={t("{0}を削除", [room.name])}
      >
        <Icon name="trash" size={16} />
        {t("削除")}
      </button>
      {open &&
        createPortal(
          <dialog
            ref={dialog}
            className="delete-dialog"
            aria-labelledby={`delete-title-${room.id}`}
            onClose={() => {
              setOpen(false);
              setError("");
            }}
            onCancel={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            <h2 id={`delete-title-${room.id}`}>
              {t("「{0}」を削除しますか？", [room.name])}
            </h2>
            <p>{t("参加中の人も退出します。")}</p>
            {error && (
              <p className="error-text" role="alert">
                {t(error)}
              </p>
            )}
            <div className="dialog-actions">
              <button
                className="button"
                disabled={busy}
                onClick={() => dialog.current.close()}
              >
                {t("キャンセル")}
              </button>
              <button
                className="button danger"
                disabled={busy}
                onClick={remove}
              >
                {busy ? t("削除中…") : t("ルームを削除")}
              </button>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
