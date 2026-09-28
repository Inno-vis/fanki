import type { Card } from '../types';
import { dutchText, flagLabel } from '../display';

/** Front (Dutch) and, when revealed, back (French + examples) of a card. */
export function CardFace({ card, revealed }: { card: Card; revealed: boolean }) {
  return (
    <article class="card" aria-live="polite">
      {card.flags.length > 0 && (
        <div class="flags">
          {card.flags.map((f) => (
            <span class={`flag flag-${f}`} key={f}>
              {flagLabel(f)}
            </span>
          ))}
        </div>
      )}
      <p class="card-front" lang="nl">
        {card.type === 'word' && card.article && <span class={`article article-${card.article}`}>{card.article} </span>}
        {card.type === 'word' ? card.nl : dutchText(card)}
      </p>
      {revealed && (
        <div class="card-back">
          <p class="card-answer" lang="fr">
            {card.fr}
          </p>
          {card.example_nl && (
            <p class="card-example">
              <span lang="nl">{card.example_nl}</span>
              {card.example_fr && (
                <span class="card-example-fr" lang="fr">
                  {card.example_fr}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
