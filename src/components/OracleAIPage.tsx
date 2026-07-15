import { useEffect } from 'react';
import { ArrowLeft, ExternalLink, Github } from 'lucide-react';
import SiteBackdrop from './SiteBackdrop';

const RESULTS = [
  ['137,892,016', 'states in the tablebase'],
  ['0.344 points', 'mean error on unseen positions'],
  ['29,057', 'model parameters'],
  ['269 KiB', 'compressed download'],
] as const;

export default function OracleAIPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousCanonical = canonical?.href;
    const previousDescription = description?.content;

    document.title = 'Oracle AI · Royal Game of Ur';
    canonical?.setAttribute('href', 'https://gameofur.org/oracle-ai');
    description?.setAttribute(
      'content',
      'How the solved Royal Game of Ur was used to train a small local browser opponent.'
    );

    return () => {
      document.title = previousTitle;
      if (canonical && previousCanonical) canonical.href = previousCanonical;
      if (description && previousDescription) description.content = previousDescription;
    };
  }, []);

  return (
    <>
      <SiteBackdrop />
      <main className="relative z-10 min-h-screen" data-testid="oracle-ai-page">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-9">
          <nav className="flex items-center justify-between border-b border-line-soft pb-5">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-bone-muted transition-colors hover:text-bone"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Play the game
            </a>
            <span className="text-xs text-faint">Project note · July 2026</span>
          </nav>

          <article className="py-12 sm:py-16">
            <header className="border-b border-line pb-10 sm:pb-12">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">
                Oracle AI
              </p>
              <h1 className="display-title max-w-3xl text-4xl leading-tight text-bone sm:text-6xl">
                Using the solved game to build a better opponent
              </h1>
              <div className="mt-7 max-w-2xl space-y-4 text-base leading-7 text-bone-muted">
                <p>
                  A strong solution now exists for the Finkel rules, so I wanted to see whether it
                  could improve the game on this site. The complete tablebase is 827 MB, which is
                  far too large to send to a browser.
                </p>
                <p>
                  Instead, I used the tablebase as training data for a small neural network. The
                  result is the new Oracle opponent. Classic AI and the earlier ML model are still
                  available, both for comparison and because they take genuinely different
                  approaches.
                </p>
              </div>
              <a
                href="/"
                className="mt-7 inline-flex items-center rounded-lg border border-brass px-4 py-2 text-sm font-semibold text-brass-light transition-colors hover:bg-brass/10"
              >
                Play against Oracle
              </a>
            </header>

            <section className="border-b border-line py-10 sm:py-12" aria-labelledby="approach">
              <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <h2 id="approach" className="text-sm font-semibold text-bone">
                  What I changed
                </h2>
                <div className="space-y-4 text-base leading-7 text-bone-muted">
                  <p>
                    The network is trained to estimate the exact pre-roll win probability for a
                    position. Its 32 inputs describe occupied squares and the number of pieces at
                    the start and finish. Colour and piece numbering are deliberately left out, so
                    equivalent positions have the same representation.
                  </p>
                  <p>
                    Rust still applies the rules and generates every legal next position. The
                    network only compares those positions. This keeps illegal moves out of the model
                    and means the existing rules tests still cover Oracle.
                  </p>
                </div>
              </div>
            </section>

            <section className="border-b border-line py-10 sm:py-12" aria-labelledby="results">
              <div className="grid gap-7 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <h2 id="results" className="text-sm font-semibold text-bone">
                  Results
                </h2>
                <div>
                  <dl className="grid grid-cols-2 border-l border-t border-line">
                    {RESULTS.map(([value, label]) => (
                      <div key={label} className="border-b border-r border-line p-4 sm:p-5">
                        <dt className="text-lg font-semibold text-bone sm:text-xl">{value}</dt>
                        <dd className="mt-1 text-xs leading-5 text-muted">{label}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 space-y-4 text-base leading-7 text-bone-muted">
                    <p>
                      On 100,000 test positions that were not used for training, 95% of predictions
                      were within 0.884 percentage points of the tablebase value.
                    </p>
                    <p>
                      In the current 2,250-game comparison, Oracle won 88% against the deployed ML
                      model and 92% against Classic at search depth 3. It averaged 1.6 ms per move
                      on the test machine. Match results include the luck of the dice, so the
                      held-out tablebase error is the more useful measure of model quality.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b border-line py-10 sm:py-12" aria-labelledby="limits">
              <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <h2 id="limits" className="text-sm font-semibold text-bone">
                  A note on the name
                </h2>
                <div className="space-y-4 text-base leading-7 text-bone-muted">
                  <p>
                    Oracle is named after its teacher. The tablebase is exact to its stored
                    precision, but the deployed network is still an approximation and can rank two
                    close moves incorrectly.
                  </p>
                  <p>
                    The model and the Rust rules engine run locally in the browser. The tablebase is
                    only used during training and is not part of the download.
                  </p>
                </div>
              </div>
            </section>

            <section className="py-10 sm:py-12" aria-labelledby="details">
              <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <h2 id="details" className="text-sm font-semibold text-bone">
                  More detail
                </h2>
                <div className="grid gap-3 text-sm">
                  <a
                    href="https://github.com/tre-systems/rgou-cloudflare/blob/main/docs/ORACLE-AI.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border-b border-line pb-3 text-bone-muted transition-colors hover:text-bone"
                  >
                    Implementation and reproducibility notes
                    <Github className="h-4 w-4 text-faint" aria-hidden="true" />
                  </a>
                  <a
                    href="https://royalur.net/file/solved/Solving_the_RGU_Report.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between border-b border-line pb-3 text-bone-muted transition-colors hover:text-bone"
                  >
                    Strong solution report
                    <ExternalLink className="h-4 w-4 text-faint" aria-hidden="true" />
                  </a>
                  <a
                    href="https://huggingface.co/sothatsit/RoyalUrModels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-bone-muted transition-colors hover:text-bone"
                  >
                    Published tablebase
                    <ExternalLink className="h-4 w-4 text-faint" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </section>
          </article>

          <footer className="flex flex-col gap-3 border-t border-line-soft py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Royal Game of Ur · Oracle AI</span>
            <a href="/" className="transition-colors hover:text-bone">
              Choose a game
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
