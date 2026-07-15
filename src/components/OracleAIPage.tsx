import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink, Github } from 'lucide-react';
import SiteBackdrop from './SiteBackdrop';

const REVEAL = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
} as const;

const PROCESS = [
  {
    index: '01',
    title: 'Read the solution',
    body: 'Sample exact win probabilities from the published 827 MB Finkel-rules tablebase.',
  },
  {
    index: '02',
    title: 'Remove accidents',
    body: 'Describe each position in 32 semantic values, independent of colour and piece numbering.',
  },
  {
    index: '03',
    title: 'Distil the value',
    body: 'Train a compact network against soft probabilities, then test on positions it never saw.',
  },
  {
    index: '04',
    title: 'Keep moves legal',
    body: 'Let Rust enumerate every valid successor; the network only estimates which is strongest.',
  },
] as const;

const FACTS = [
  ['137.9m', 'stored states'],
  ['0.344%', 'held-out mean error'],
  ['29,057', 'model parameters'],
  ['Local', 'browser inference'],
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
      'How Oracle AI distils the strongly solved Royal Game of Ur into a compact local browser opponent.'
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
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
          <nav className="flex items-center justify-between border-b border-line-soft pb-5">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-bone-muted transition-colors hover:text-bone"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Play the game
            </a>
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-faint">
              Research note · 2026
            </span>
          </nav>

          <motion.article
            className="pb-12 pt-14 sm:pb-16 sm:pt-20"
            initial="hidden"
            animate="visible"
            variants={REVEAL}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <header className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)] lg:items-end">
              <div>
                <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-brass">
                  Introducing Oracle AI
                </p>
                <h1 className="display-title max-w-3xl text-5xl leading-[0.98] text-bone sm:text-7xl">
                  A solved game,
                  <br />
                  distilled for the browser.
                </h1>
              </div>
              <div className="border-l border-line pl-5 sm:pl-7">
                <p className="text-base leading-7 text-bone-muted">
                  We turned a complete mathematical solution into a small local opponent—without
                  shipping the tablebase or replacing the game&apos;s existing AIs.
                </p>
                <a
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-brass bg-brass px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brass-light hover:bg-brass-light"
                >
                  Play against Oracle
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </header>

            <section
              className="mt-14 grid grid-cols-2 border-y border-line sm:mt-20 sm:grid-cols-4"
              aria-label="Oracle AI at a glance"
            >
              {FACTS.map(([value, label], index) => (
                <div
                  key={label}
                  className={`py-5 sm:px-6 sm:py-7 ${
                    index % 2 === 1 ? 'border-l border-line' : ''
                  } ${index > 1 ? 'border-t border-line sm:border-t-0' : ''} ${
                    index > 0 ? 'sm:border-l' : ''
                  }`}
                >
                  <div className="display-title text-3xl text-bone sm:text-4xl">{value}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    {label}
                  </div>
                </div>
              ))}
            </section>

            <section className="grid gap-10 border-b border-line py-14 sm:py-20 lg:grid-cols-[0.55fr_1.45fr]">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
                  The method
                </p>
                <h2 className="display-title text-4xl text-bone sm:text-5xl">From proof to play</h2>
                <p className="mt-5 max-w-sm text-sm leading-6 text-bone-muted">
                  The rules engine and the learned model have deliberately separate jobs. That
                  makes legality deterministic and the approximation measurable.
                </p>
              </div>
              <ol className="grid border-t border-line md:grid-cols-2">
                {PROCESS.map((step, index) => (
                  <li
                    key={step.index}
                    className={`border-b border-line py-6 md:px-7 ${
                      index % 2 === 1 ? 'md:border-l' : ''
                    }`}
                  >
                    <div className="font-mono text-[10px] tracking-[0.18em] text-brass">
                      {step.index}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-bone">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-bone-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="grid gap-10 border-b border-line py-14 sm:py-20 lg:grid-cols-2 lg:gap-20">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
                  Why it is different
                </p>
                <h2 className="display-title text-4xl text-bone sm:text-5xl">
                  Taught by exact probabilities, not a stronger heuristic.
                </h2>
              </div>
              <div className="space-y-7 text-base leading-7 text-bone-muted">
                <p>
                  Classic AI searches forward and evaluates the positions it reaches. The original
                  ML AI learns from those searches. Oracle instead learns from the published strong
                  solution: the optimal pre-roll win probability for every reachable state.
                </p>
                <p>
                  Its input has no player colour, dice roll, persistent piece identity, duplicated
                  field, or padding. Equivalent positions look equivalent to the network. For each
                  roll, Rust builds the legal next positions and Oracle compares their values.
                </p>
                <p className="border-l-2 border-brass pl-5 text-bone">
                  The full solution remains training data. Only the compact model and the existing
                  Rust rules engine reach your browser.
                </p>
              </div>
            </section>

            <section className="grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brass">
                  Honest by design
                </p>
                <h2 className="display-title max-w-2xl text-4xl text-bone sm:text-5xl">
                  “Oracle” names the teacher, not a claim of perfect play.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-7 text-bone-muted">
                  The source tablebase is exact to its stored precision; the deployed neural
                  network is an approximation learned from a representative sample. We pin the
                  source hash, separate training, validation, and test positions, preserve model
                  provenance, and benchmark the result against every existing opponent.
                </p>
                <p className="mt-6 max-w-2xl border-l-2 border-brass pl-5 text-base leading-7 text-bone">
                  On 100,000 unseen positions, mean error was 0.344 percentage points and 95% of
                  predictions were within 0.884 points. The compressed production model is 269
                  KiB—82% smaller than the earlier ML model.
                </p>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-bone-muted">
                  In the generated 2,250-game comparison, Oracle averaged a 93.1% win rate across
                  nine opponents and 1.6 ms per move on the test machine. Match results are
                  stochastic; held-out tablebase error remains the primary quality measure.
                </p>
              </div>
              <aside className="surface-inset rounded-xl p-6 sm:p-7" aria-label="Further reading">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-bone">
                  Read the work
                </h3>
                <div className="mt-5 space-y-4">
                  <a
                    href="https://github.com/tre-systems/rgou-cloudflare/blob/main/docs/ORACLE-AI.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 text-sm text-bone-muted transition-colors hover:text-bone"
                  >
                    Technical write-up
                    <Github className="h-4 w-4 text-faint group-hover:text-brass" aria-hidden="true" />
                  </a>
                  <a
                    href="https://royalur.net/file/solved/Solving_the_RGU_Report.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 border-t border-line pt-4 text-sm text-bone-muted transition-colors hover:text-bone"
                  >
                    Solution report
                    <ExternalLink
                      className="h-4 w-4 text-faint group-hover:text-brass"
                      aria-hidden="true"
                    />
                  </a>
                  <a
                    href="https://huggingface.co/sothatsit/RoyalUrModels"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 border-t border-line pt-4 text-sm text-bone-muted transition-colors hover:text-bone"
                  >
                    Published tablebase
                    <ExternalLink
                      className="h-4 w-4 text-faint group-hover:text-brass"
                      aria-hidden="true"
                    />
                  </a>
                </div>
              </aside>
            </section>
          </motion.article>

          <footer className="flex flex-col gap-3 border-t border-line-soft py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Royal Game of Ur · Oracle AI</span>
            <a href="/" className="transition-colors hover:text-bone">
              Choose an opponent
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
