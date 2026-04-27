import type { CyclePhase } from "@/lib/cycle";

export type PhaseInsight = {
  phase: CyclePhase;
  title: string;
  mood: string;
  food: string;
  selfCare: string;
  activity: string;
};

export const PHASE_INSIGHTS: Record<CyclePhase, PhaseInsight> = {
  menstrual: {
    phase: "menstrual",
    title: "Menstrual phase",
    mood:
      "Some people feel more inward or low on energy during bleeding — others feel fine. Whatever you feel is valid, not a flaw.",
    food:
      "Warm, nourishing meals and steady hydration often feel good. Iron-rich foods like lentils or leafy greens are a gentle idea for some — not medical nutrition advice.",
    selfCare:
      "Heat on your belly, softer plans, and permission to rest can help. Skip the pressure to “push through.”",
    activity:
      "Light walking, stretching, or restorative yoga if you enjoy them — swap intensity anytime your body says no.",
  },
  follicular: {
    phase: "follicular",
    title: "Follicular phase",
    mood:
      "Many notice a gradual lift in motivation after their period — some don't notice a change at all. Both are normal.",
    food:
      "Balanced plates with protein and complex carbs can support steady energy for lots of people.",
    selfCare:
      "Try one small reset: tidy a corner, open a window, or take a short walk — tiny wins count.",
    activity:
      "Build movement you actually like — dance, bike, strength — at a pace that feels good today.",
  },
  ovulation: {
    phase: "ovulation",
    title: "Mid-cycle",
    mood:
      "Some feel more social or confident around mid-cycle — others feel no shift. This is a rough timing guess, not a hormone reading.",
    food:
      "Keep water nearby and choose snacks that feel satisfying if your day is busy.",
    selfCare:
      "Connect with people if you want to — boundaries still matter. Say yes to what feels kind.",
    activity:
      "Mix it up: a brisk walk, a class, or playful movement — curiosity over pressure.",
  },
  luteal: {
    phase: "luteal",
    title: "Luteal phase",
    mood:
      "Some people feel more sensitive or tired before their next period — self-kindness (and softer expectations) can help.",
    food:
      "Regular meals and foods like nuts or seeds are a common gentle choice for some — not a treatment or guarantee.",
    selfCare:
      "Earlier wind-downs, cozy routines, and less screen stimulation before bed if that suits you.",
    activity:
      "Moderate movement, pilates, or easy yoga — comfort beats personal records here.",
  },
};
