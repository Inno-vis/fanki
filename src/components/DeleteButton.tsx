import { useState } from 'preact/hooks';
import { t } from '../i18n';
import { deleteCardLocally } from '../db';
import { loadFromDb } from '../store';
import { Sheet } from './Sheet';
import { showToast } from './Toast';

/**
 * 🗑️ next to 🚩 on the review screen: removes the card from THIS phone only (never the Sheet). Nothing happens
 * before the student confirms; Annuleren (or Escape / tapping outside) returns to the same card.
 */
export function DeleteButton({ cardId, onDeleted }: { cardId: string; onDeleted: (cardId: string) => void }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    await deleteCardLocally(cardId);
    setAsking(false);
    setBusy(false);
    onDeleted(cardId);
    await loadFromDb();
    showToast(t('card.deleted'));
  };
  return (
    <>
      <button class="delete-btn" aria-label={t('card.delete')} onClick={() => setAsking(true)}>
        🗑️
      </button>
      {asking && (
        <Sheet
          title={t('card.deleteConfirm')}
          onClose={() => setAsking(false)}
          footer={
            <div class="confirm-actions">
              <button class="btn btn-secondary" onClick={() => setAsking(false)}>
                {t('card.deleteCancel')}
              </button>
              <button class="btn btn-danger" disabled={busy} onClick={() => void confirm()}>
                {t('card.delete')}
              </button>
            </div>
          }
        >
          {null}
        </Sheet>
      )}
    </>
  );
}
