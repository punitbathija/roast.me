import ResumeUpload from "@/components/ResumeUpload";

function MarqueeBulbs() {
  const bulbs = Array.from({ length: 24 });
  return (
    <div aria-hidden className="flex justify-between px-4 pt-4 sm:px-10">
      {bulbs.map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-spotlight shadow-[0_0_6px_2px_rgba(245,194,66,0.6)] motion-safe:animate-pulse"
          style={{ animationDelay: `${(i % 4) * 0.25}s`, animationDuration: "2.2s" }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <MarqueeBulbs />

      <section className="flex flex-1 flex-col items-center justify-center gap-10 px-4 py-16 text-center sm:py-24">
        <div className="space-y-4">
          <span className="font-display text-sm tracking-[0.4em] text-spotlight">
            Roast.me
          </span>
          <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-paper sm:text-7xl">
            YOUR RESUME
            <br />
            <span className="text-roast-red">GETS ROASTED</span>
          </h1>
          <p className="mx-auto max-w-md text-balance text-sm text-smoke sm:text-base">
            Upload it. Answer a few questions you&apos;ll regret answering
            honestly. Leave with material you didn&apos;t know you had.
          </p>
        </div>

        <ResumeUpload />

        <p className="max-w-sm text-xs text-smoke/60">
          Nothing&apos;s saved unless you want it saved. The mic stays off
          until you say so.
        </p>
      </section>

      <footer className="px-4 pb-6 text-center text-xs text-smoke/40">
        roast.me — built to make you laugh at yourself first.
      </footer>
    </main>
  );
}
