import { useState } from 'preact/hooks';
import type { Card } from '../types';
import { t } from '../i18n';
import { CardFace } from '../components/CardFace';

// Stage 2: flip through the session (Dutch → French). Stage 3 replaces "Volgende kaart" with FSRS rating buttons.
export function Review({ cards, onExit }: { cards: Card[]; onExit: () => void }) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[i];

  if (!card) {
    return (
      <main class="review review-done">
        <p class="done-big">{t('review.done')}</p>
        <button class="btn btn-primary btn-huge" onClick={onExit}>
          {t('review.back')}
        </button>
      </main>
    );
  }

  const next = () => {
    setRevealed(false);
    setI(i + 1);
  };

  return (
    <main class="review">
      <p class="review-progress muted">{t('review.progress', { i: i + 1, n: cards.length })}</p>
      <CardFace card={card} revealed={revealed} />
      <div class="review-actions">
        {revealed ? (
          <button class="btn btn-primary btn-huge" onClick={next}>
            {t('review.next')}
          </button>
        ) : (
          <button class="btn btn-primary btn-huge" onClick={() => setRevealed(true)}>
            {t('review.show')}
          </button>
        )}
      </div>
    </main>
  );
}
