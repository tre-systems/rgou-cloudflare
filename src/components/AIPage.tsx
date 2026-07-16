import { useEffect } from 'react';
import { ArrowLeft, Github } from 'lucide-react';
import deployedBenchmarkMarkdown from '../../docs/AI-DEPLOYED-RESULTS.md?raw';
import { benchmarkWinRate, parseDeployedAiBenchmark } from '../lib/ai-results';
import SiteBackdrop from './SiteBackdrop';

const BENCHMARK = parseDeployedAiBenchmark(deployedBenchmarkMarkdown);

function percentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function AIPage() {
  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/oracle-ai') {
      window.history.replaceState(
        window.history.state,
        '',
        `/ai${window.location.search}${window.location.hash}`
      );
    }

    const previousTitle = document.title;
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousCanonical = canonical?.href;
    const previousDescription = description?.content;

    document.title = 'About the AIs · Royal Game of Ur';
    canonical?.setAttribute('href', 'https://gameofur.org/ai');
    description?.setAttribute(
      'content',
      'How the three Royal Game of Ur opponents work and how they compare against each other.'
    );

    return () => {
      document.title = previousTitle;
      if (canonical && previousCanonical) canonical.href = previousCanonical;
      if (description && previousDescription) description.content = previousDescription;
    };
  }, []);

  const classicVsMl = benchmarkWinRate(BENCHMARK, 'Classic-Browser', 'ML-Classic');
  const mlVsClassic = benchmarkWinRate(BENCHMARK, 'ML-Classic', 'Classic-Browser');
  const oracleVsClassic = benchmarkWinRate(BENCHMARK, 'Oracle-V1', 'Classic-Browser');
  const oracleVsMl = benchmarkWinRate(BENCHMARK, 'Oracle-V1', 'ML-Classic');

  return (
    <>
      <SiteBackdrop />
      <main className="relative z-10 min-h-screen" data-testid="ai-page">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-9">
          <nav className="flex items-center justify-between border-b border-line-soft pb-5">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-bone-muted transition-colors hover:text-bone"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Play the game
            </a>
            <span className="text-xs text-faint">AI notes · July 2026</span>
          </nav>

          <article className="py-12 sm:py-16">
            <header className="border-b border-line pb-10 sm:pb-12">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-brass">
                About the AIs
              </p>
              <h1 className="display-title max-w-3xl text-4xl leading-tight text-bone sm:text-6xl">
                Three different ways to play Ur
              </h1>
              <div className="mt-7 max-w-2xl space-y-4 text-base leading-7 text-bone-muted">
                <p>
                  There are three computer opponents on this site. They use the same rules engine
                  and see the same legal moves, but they decide between those moves in quite
                  different ways.
                </p>
                <p>
                  I have kept all three because the differences are more interesting than pretending
                  they form a neat easy, medium and hard ladder. Oracle is the strongest at the
                  moment, Classic is a traditional search player, and Machine Learning is an
                  experiment in teaching a small network from Classic&apos;s decisions.
                </p>
              </div>
              <a
                href="/"
                className="mt-7 inline-flex items-center rounded-lg border border-brass px-4 py-2 text-sm font-semibold text-brass-light transition-colors hover:bg-brass/10"
              >
                Choose an opponent
              </a>
            </header>

            <section className="border-b border-line py-10 sm:py-12" aria-labelledby="systems">
              <div className="grid gap-7 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <h2 id="systems" className="text-sm font-semibold text-bone">
                  How they work
                </h2>
                <div className="divide-y divide-line">
                  <section className="pb-7">
                    <h3 className="text-xl font-semibold text-bone">Classic AI</h3>
                    <p className="mt-3 text-base leading-7 text-bone-muted">
                      Classic looks ahead through possible moves and dice rolls, then scores the
                      positions it can reach. The browser version searches three levels deep. It is
                      the most conventional of the three and the easiest to reason about.
                    </p>
                  </section>
                  <section className="py-7">
                    <h3 className="text-xl font-semibold text-bone">Machine Learning AI</h3>
                    <p className="mt-3 text-base leading-7 text-bone-muted">
                      The ML opponent learned from simulated positions labelled by a deeper Classic
                      search. At runtime its value and policy networks estimate the position and the
                      best piece to move. That gives it a different, and sometimes less consistent,
                      style.
                    </p>
                  </section>
                  <section className="pt-7">
                    <h3 className="text-xl font-semibold text-bone">Oracle AI</h3>
                    <p className="mt-3 text-base leading-7 text-bone-muted">
                      For Oracle I used the published strong solution of the game as the teacher.
                      The complete tablebase is 827 MB, so I trained a much smaller network from a
                      sample of it. Rust still generates every legal move; the network only compares
                      the resulting positions.
                    </p>
                  </section>
                </div>
              </div>
            </section>

            <section className="border-b border-line py-10 sm:py-12" aria-labelledby="matches">
              <div className="grid gap-7 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <h2 id="matches" className="text-sm font-semibold text-bone">
                  What the matches say
                </h2>
                <div>
                  <div className="space-y-4 text-base leading-7 text-bone-muted">
                    <p>
                      I benchmarked the same three opponents that people can actually choose on the
                      site. Each pair played {BENCHMARK.gamesPerMatch} games, split evenly between
                      the two seats and using deterministic dice streams.
                    </p>
                    <p>
                      Read across each row: the number is that opponent&apos;s win rate against the
                      opponent at the top. ML is short for Machine Learning AI.
                    </p>
                  </div>

                  <div className="mt-6 overflow-hidden rounded-xl border border-line">
                    <table
                      className="w-full table-fixed text-sm"
                      aria-label="Deployed AI win rates"
                    >
                      <caption className="sr-only">
                        Win-rate matrix for the three opponents available in the browser
                      </caption>
                      <thead className="bg-surface-inset text-xs text-muted">
                        <tr>
                          <th scope="col" className="w-[29%] px-3 py-3 text-left font-medium">
                            Plays as
                          </th>
                          {BENCHMARK.opponents.map(opponent => (
                            <th
                              key={opponent.id}
                              scope="col"
                              className="px-2 py-3 text-center font-medium"
                              title={opponent.label}
                            >
                              {opponent.shortLabel}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {BENCHMARK.opponents.map(row => (
                          <tr key={row.id} className="border-t border-line">
                            <th
                              scope="row"
                              className="px-3 py-3 text-left text-xs font-medium text-bone"
                              title={row.label}
                            >
                              {row.shortLabel}
                            </th>
                            {BENCHMARK.opponents.map(column => {
                              const value = BENCHMARK.winRates[row.id]?.[column.id];
                              return (
                                <td
                                  key={column.id}
                                  className="px-2 py-3 text-center tabular-nums text-bone-muted"
                                >
                                  {value === null ? '—' : percentage(value)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-7 space-y-4 text-base leading-7 text-bone-muted">
                    <p>
                      The main result is not subtle. Oracle won {percentage(oracleVsClassic)}{' '}
                      against Classic and {percentage(oracleVsMl)} against ML. The Classic and ML
                      contest was almost even: ML won {percentage(mlVsClassic)} and Classic won{' '}
                      {percentage(classicVsMl)}. I would not turn that small gap into a claim that
                      one is generally better. They simply play differently.
                    </p>
                    <p>
                      Dice are still part of the game, so these are useful comparisons rather than
                      precise ratings. The figures come directly from the generated report and will
                      change with it when an opponent changes.
                    </p>
                    <p className="text-xs text-muted">Benchmark run: {BENCHMARK.generatedAt}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="border-b border-line py-10 sm:py-12" aria-labelledby="why-three">
              <div className="grid gap-5 sm:grid-cols-[10rem_1fr] sm:gap-10">
                <h2 id="why-three" className="text-sm font-semibold text-bone">
                  Why keep all three?
                </h2>
                <div className="space-y-4 text-base leading-7 text-bone-muted">
                  <p>
                    There is a temptation to remove an older opponent whenever a stronger one
                    appears. I do not think that helps here. Classic shows what runtime search can
                    do. ML shows what a network trained on that search learned. Oracle shows what
                    changes once solved-game data is available.
                  </p>
                  <p>
                    Together they are a small, useful history of the project, and watch mode lets
                    you put any two of them against each other.
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
                  {[
                    ['Current browser-opponent results', 'docs/AI-DEPLOYED-RESULTS.md'],
                    ['How the AI system is built', 'docs/AI-SYSTEM.md'],
                    ['Oracle training and reproducibility', 'docs/ORACLE-AI.md'],
                  ].map(([label, path], index, links) => (
                    <a
                      key={path}
                      href={`https://github.com/tre-systems/rgou-cloudflare/blob/main/${path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center justify-between pb-3 text-bone-muted transition-colors hover:text-bone ${
                        index < links.length - 1 ? 'border-b border-line' : ''
                      }`}
                    >
                      {label}
                      <Github className="h-4 w-4 text-faint" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </section>
          </article>

          <footer className="flex flex-col gap-3 border-t border-line-soft py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Royal Game of Ur · About the AIs</span>
            <a href="/" className="transition-colors hover:text-bone">
              Choose a game
            </a>
          </footer>
        </div>
      </main>
    </>
  );
}
