export type Question =
  | { id: string; type: "scale"; prompt: string; min: number; max: number; minLabel: string; maxLabel: string }
  | { id: string; type: "choice"; prompt: string; options: string[] }
  | { id: string; type: "text"; prompt: string; placeholder: string };

export const questions: Question[] = [
  {
    id: "fiction-level",
    type: "scale",
    prompt: "On a scale of 1 to 10, how much of this resume is fiction?",
    min: 1,
    max: 10,
    minLabel: "Documentary",
    maxLabel: "Marvel Cinematic Universe",
  },
  {
    id: "buzzwords",
    type: "choice",
    prompt: "How many buzzwords did you cram in just to sound smart?",
    options: ["A tasteful few", "A concerning amount", "It's basically bingo"],
  },
  {
    id: "gap",
    type: "text",
    prompt: "Longest gap on this resume — what were you actually doing?",
    placeholder: "Be honest, we already know it wasn't 'consulting'",
  },
  {
    id: "template",
    type: "choice",
    prompt: "Did a template do most of the actual work here?",
    options: ["No, all me", "Kind of", "Yes, and it deserves the credit"],
  },
  {
    id: "proudest",
    type: "text",
    prompt: "What's the one line you're proudest of that nobody will ever ask about?",
    placeholder: "Type it. We'll ask about it.",
  },
];
