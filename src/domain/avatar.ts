/*
 * Avatar: alle 10 Charakterlevel eine neue Ausrüstung oder Verwandlung (99 Stufen bis Level 990).
 * Jeder Eintrag erhöht einen Zähler (z. B. „mouth“ 1 = Halstuch, 2 = Gasmaske, 3 = Filterkanister),
 * die Grafik zeichnet anhand dieser Zähler.
 */

export type AvatarKey =
  | 'mouth'
  | 'headwear'
  | 'eyes'
  | 'backpack'
  | 'legs'
  | 'arms'
  | 'belt'
  | 'weapon'
  | 'shoulders'
  | 'coat'
  | 'chest'
  | 'wrist'
  | 'posture'
  | 'scar'
  | 'tally'
  | 'building'
  | 'crow'
  | 'star'
  | 'moon'
  | 'drone'
  | 'ash'
  | 'wire'
  | 'searchlight'
  | 'tower'
  | 'monolith'
  | 'trail'
  | 'glitch'
  | 'halo'
  | 'echo'
  | 'banner'
  | 'wind'
  | 'apex'

export interface AvatarUnlock {
  /** Stufe 1–99, erreicht bei Charakterlevel step × 10 */
  step: number
  key: AvatarKey
  label: string
}

const L = (step: number, key: AvatarKey, label: string): AvatarUnlock => ({ step, key, label })

export const AVATAR_UNLOCKS: AvatarUnlock[] = [
  L(1, 'mouth', 'Halstuch gegen den Staub'),
  L(2, 'headwear', 'Kapuze'),
  L(3, 'backpack', 'Rucksack'),
  L(4, 'eyes', 'Schutzbrille'),
  L(5, 'legs', 'Stiefel'),
  L(6, 'arms', 'Armbinden'),
  L(7, 'belt', 'Werkzeuggürtel'),
  L(8, 'weapon', 'Eisenrohr'),
  L(9, 'building', 'Erste Ruine am Horizont'),
  L(10, 'mouth', 'Gasmaske'),
  L(11, 'posture', 'Aufrechter Gang'),
  L(12, 'shoulders', 'Schulterplatte'),
  L(13, 'building', 'Zweite Ruine'),
  L(14, 'backpack', 'Funkantenne'),
  L(15, 'belt', 'Taschen am Gürtel'),
  L(16, 'crow', 'Eine Krähe folgt dir'),
  L(17, 'coat', 'Langer Mantel'),
  L(18, 'scar', 'Eine Narbe verheilt'),
  L(19, 'tally', 'Erste Kerbe im Rohr'),
  L(20, 'drone', 'Begleit-Drohne'),
  L(21, 'building', 'Dritte Ruine'),
  L(22, 'legs', 'Knieschoner'),
  L(23, 'wrist', 'Handgelenk-Display'),
  L(24, 'ash', 'Ascheregen'),
  L(25, 'tally', 'Zweite Kerbe'),
  L(26, 'eyes', 'Nachtsicht-Linsen'),
  L(27, 'building', 'Vierte Ruine'),
  L(28, 'moon', 'Toter Mond'),
  L(29, 'chest', 'Gurtzeug'),
  L(30, 'mouth', 'Filterkanister'),
  L(31, 'crow', 'Zweite Krähe'),
  L(32, 'shoulders', 'Zweite Schulterplatte'),
  L(33, 'tally', 'Dritte Kerbe'),
  L(34, 'wire', 'Stacheldraht'),
  L(35, 'building', 'Fünfte Ruine'),
  L(36, 'arms', 'Kabel am Arm'),
  L(37, 'scar', 'Zweite Narbe verheilt'),
  L(38, 'weapon', 'Speerspitze'),
  L(39, 'star', 'Ein Stern durchbricht den Smog'),
  L(40, 'drone', 'Drohnen-Scheinwerfer'),
  L(41, 'building', 'Sechste Ruine'),
  L(42, 'chest', 'Brustpanzer'),
  L(43, 'tally', 'Vierte Kerbe'),
  L(44, 'searchlight', 'Suchscheinwerfer'),
  L(45, 'crow', 'Dritte Krähe'),
  L(46, 'belt', 'Laterne'),
  L(47, 'building', 'Siebte Ruine'),
  L(48, 'coat', 'Zerrissener Mantel'),
  L(49, 'star', 'Zweiter Stern'),
  L(50, 'headwear', 'Helm'),
  L(51, 'building', 'Achte Ruine'),
  L(52, 'tally', 'Fünfte Kerbe'),
  L(53, 'ash', 'Dichter Ascheregen'),
  L(54, 'arms', 'Mechanischer Arm'),
  L(55, 'crow', 'Vierte Krähe'),
  L(56, 'tower', 'Wachturm'),
  L(57, 'building', 'Neunte Ruine'),
  L(58, 'scar', 'Letzte Narbe verheilt'),
  L(59, 'star', 'Dritter Stern'),
  L(60, 'eyes', 'Leuchtendes Auge'),
  L(61, 'building', 'Zehnte Ruine'),
  L(62, 'tally', 'Sechste Kerbe'),
  L(63, 'legs', 'Panzerstiefel'),
  L(64, 'backpack', 'Satellitenschüssel'),
  L(65, 'searchlight', 'Zweiter Scheinwerfer'),
  L(66, 'weapon', 'Speer mit Draht'),
  L(67, 'crow', 'Fünfte Krähe'),
  L(68, 'monolith', 'Monolith'),
  L(69, 'star', 'Vierter Stern'),
  L(70, 'drone', 'Zweite Drohne'),
  L(71, 'building', 'Elfte Ruine'),
  L(72, 'shoulders', 'Dornen auf den Schulterplatten'),
  L(73, 'tally', 'Siebte Kerbe'),
  L(74, 'chest', 'Energiekern'),
  L(75, 'trail', 'Spuren im Staub'),
  L(76, 'headwear', 'Helmkamm'),
  L(77, 'glitch', 'Störsignal'),
  L(78, 'moon', 'Gesprungener Mond'),
  L(79, 'star', 'Fünfter Stern'),
  L(80, 'coat', 'Wehender Umhang'),
  L(81, 'arms', 'Zweiter mechanischer Arm'),
  L(82, 'tally', 'Achte Kerbe'),
  L(83, 'halo', 'Aura-Ring'),
  L(84, 'ash', 'Aschesturm'),
  L(85, 'posture', 'Siegerpose'),
  L(86, 'banner', 'Fahne'),
  L(87, 'echo', 'Schatten-Echo'),
  L(88, 'tally', 'Neunte Kerbe'),
  L(89, 'halo', 'Doppelter Ring'),
  L(90, 'weapon', 'Lichtstab'),
  L(91, 'eyes', 'Visier-Schlitz'),
  L(92, 'backpack', 'Schubdüsen'),
  L(93, 'echo', 'Zweites Echo'),
  L(94, 'tally', 'Zehnte Kerbe'),
  L(95, 'halo', 'Dreifacher Ring'),
  L(96, 'headwear', 'Antennenkrone'),
  L(97, 'wind', 'Sturm'),
  L(98, 'glitch', 'Die Realität bricht'),
  L(99, 'apex', 'Lichtgestalt'),
]

export type AvatarCounts = Record<AvatarKey, number>

export interface AvatarState {
  /** 0–99 */
  step: number
  counts: AvatarCounts
  unlocked: AvatarUnlock[]
  next: AvatarUnlock | null
}

const ZERO = Object.fromEntries(AVATAR_UNLOCKS.map((u) => [u.key, 0])) as AvatarCounts

export const avatarStep = (characterLevel: number) => Math.max(0, Math.min(99, Math.floor(characterLevel / 10)))

export function avatarState(characterLevel: number): AvatarState {
  const step = avatarStep(characterLevel)
  const unlocked = AVATAR_UNLOCKS.filter((u) => u.step <= step)
  const counts = { ...ZERO }
  for (const u of unlocked) counts[u.key]++
  return { step, counts, unlocked, next: AVATAR_UNLOCKS.find((u) => u.step === step + 1) ?? null }
}

/** Was zwischen zwei Charakterlevels neu dazugekommen ist */
export function unlocksBetween(fromLevel: number, toLevel: number): AvatarUnlock[] {
  const a = avatarStep(fromLevel)
  const b = avatarStep(toLevel)
  return AVATAR_UNLOCKS.filter((u) => u.step > a && u.step <= b)
}
