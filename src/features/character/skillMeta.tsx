import { BookOpen, Dumbbell, GraduationCap, HeartPulse, Music, Sparkles, Wrench } from 'lucide-react'
import type { ReactNode } from 'react'
import type { SkillKey } from '../../domain/characterSheet'

export const SKILL_ICON: Record<SkillKey, ReactNode> = {
  academic: <GraduationCap className="size-5" />,
  sport: <Dumbbell className="size-5" />,
  health: <HeartPulse className="size-5" />,
  hygiene: <Sparkles className="size-5" />,
  reading: <BookOpen className="size-5" />,
  music: <Music className="size-5" />,
  project: <Wrench className="size-5" />,
}

/** Farbe pro Baum (Text + Balken) */
export const SKILL_COLOR: Record<SkillKey, { text: string; bar: string; ring: string }> = {
  academic: { text: 'text-violet-300', bar: 'bg-violet-400', ring: 'ring-violet-500/30' },
  sport: { text: 'text-sky-300', bar: 'bg-sky-400', ring: 'ring-sky-500/30' },
  health: { text: 'text-rose-300', bar: 'bg-rose-400', ring: 'ring-rose-500/30' },
  hygiene: { text: 'text-teal-300', bar: 'bg-teal-400', ring: 'ring-teal-500/30' },
  reading: { text: 'text-amber-300', bar: 'bg-amber-400', ring: 'ring-amber-500/30' },
  music: { text: 'text-fuchsia-300', bar: 'bg-fuchsia-400', ring: 'ring-fuchsia-500/30' },
  project: { text: 'text-orange-300', bar: 'bg-orange-400', ring: 'ring-orange-500/30' },
}

/** Kurze Erklärung, wie das Level entsteht (wird auf der Detailseite gezeigt). */
export const SKILL_RULES: Record<SkillKey, string> = {
  academic:
    'Notendurchschnitt aller bestandenen Module, gewichtet nach ECTS. 1,0 → 1000, 2,0 → 750, 3,0 → 500, 4,0 → 250. Nicht bestandene Prüfungen zählen nicht, bis sie bestanden sind.',
  sport:
    '60 % Leistung + 40 % Trainingskonstanz. Leistung: dein bester Wert je Übung (geschätztes Maximalgewicht im Verhältnis zum Körpergewicht) gegen Kraft-Standards – Anfänger 150, Mittel 500, Elite 850, darüber nur noch langsam Richtung 1000. Werte älter als 8 Wochen verlieren pro Woche 1 %. Konstanz: Erfüllung deines Trainingsplans pro Woche, ein Jahr durchgehend → 900.',
  health:
    '70 % Routinen (Schlaf, Aufstehen …) + 30 % Körperwerte (BMI, Körperfett im Idealbereich). Routinen: ein Jahr durchgehend erfüllt → 900; lässt du nach, sinkt der Wert halb so schnell wieder.',
  hygiene:
    'Konstanz deiner Pflege-Routinen (Zähne, Duschen, Aufräumen …). Ein Jahr durchgehend erfüllt → 900, zwei Jahre → 990. Lässt du nach, sinkt der Wert halb so schnell wieder.',
  reading:
    'Obergrenze × (70 % Lesevolumen + 30 % Wochenziel-Disziplin). Schwere Bücher zählen 2,5-fach, mittlere 1,5-fach. Obergrenze nach deinem Mix: nur leichte Bücher → max. 500, mittlere → 800, schwere → 1000.',
  music:
    'Dein Meilenstein auf der Leiter (bestätigst du selbst) ist das Mindestlevel. Übungsstunden heben dich innerhalb der Stufe, aber nie über den nächsten Meilenstein. Rund 10.000 Stunden für Profi-Niveau.',
  project:
    '40 % Erfahrung (Stunden, ~10.000 h für Profi-Niveau) + 35 % erreichte Meilensteine (klein 1, mittel 3, groß 8 Punkte) + 25 % Konstanz (Wochen mit mindestens 3 h Projektzeit).',
}
