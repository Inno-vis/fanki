import type { Card } from '../types';
import type { Mode } from '../session';
import { clozeParts, dutchText, flagLabel, visibleFlags } from '../display';

/**
 * One card in a given direction.
 *   nl_fr     front: Dutch (with de/het)      back: French
 *   fr_nl     front: French                   back: Dutch (with de/het)
 *   cloze     front: sentence with a blank + French translation    back: the missing word filled in
 *   question  front: French prompt            back: expected Dutch answer
 *   oneway    front: nl (Dutch prompt)        back: answer
 */
export function CardFace({ card, mode, revealed }: { card: Card; mode: Mode; revealed: boolean }) {
  const shown = visibleFlags(card);
  const flags =
    shown.length > 0 ? (
      <div class="flags">
        {shown.map((f) => (
          <span class={`flag flag-${f}`} key={f}>
            {flagLabel(f)}
          </span>
        ))}
      </div>
    ) : null;

  const dutchWord = (
    <>
      {card.type === 'word' && card.article && <span class={`article article-${card.article}`}>{card.article} </span>}
      {card.type === 'word' ? card.nl : dutchText(card)}
    </>
  );

  const example = card.example_nl ? (
    <p class="card-example">
      <span lang="nl">{card.example_nl}</span>
      {card.example_fr && (
        <span class="card-example-fr" lang="fr">
          {card.example_fr}
        </span>
      )}
    </p>
  ) : null;

  // enkel (oneway): the Dutch prompt, then the answer (display text; she rates herself).
  if (mode === 'oneway') {
    return (
      <article class="card" aria-live="polite">
        {flags}
        <p class="card-prompt card-prompt-big" lang="nl">
          {card.nl}
        </p>
        {card.fr && (
          <p class="card-prompt" lang="fr">
            {card.fr}
          </p>
        )}
        {revealed && (
          <div class="card-back">
            <p class="card-answer" lang="nl">
              {card.answer}
            </p>
            {example}
          </div>
        )}
      </article>
    );
  }

  if (mode === 'cloze') {
    const c = clozeParts(card.nl);
    return (
      <article class="card" aria-live="polite">
        {flags}
        <p class="card-sentence" lang="nl">
          {c.before}
          {revealed ? <mark class="cloze-answer">{c.answer}</mark> : <span class="cloze-blank">＿＿＿</span>}
          {c.after}
        </p>
        <p class="card-prompt" lang="fr">
          {card.fr}
        </p>
      </article>
    );
  }

  const nlFront = mode === 'nl_fr' || mode === 'listen';
  return (
    <article class="card" aria-live="polite">
      {flags}
      {nlFront ? (
        <p class="card-front" lang="nl">
          {dutchWord}
        </p>
      ) : (
        <p class={mode === 'question' ? 'card-prompt card-prompt-big' : 'card-front'} lang="fr">
          {card.fr}
        </p>
      )}
      {revealed && (
        <div class="card-back">
          {nlFront ? (
            <p class="card-answer" lang="fr">
              {card.fr}
            </p>
          ) : (
            <p class="card-answer" lang="nl">
              {dutchWord}
            </p>
          )}
          {example}
        </div>
      )}
    </article>
  );
}
