/*
 * Avatar: alle 10 Charakterlevel eine neue Ausrüstung oder Verwandlung (99 Stufen bis Level 990).
 * Mittelalter-Fantasy: Schwert, Rüstung, Grimoire, Waldgeister und Dämonen.
 * Jeder Eintrag erhöht einen Zähler (z. B. „sword“ 2 = Langschwert),
 * die Grafik zeichnet anhand dieser Zähler.
 * Ab Stufe 80 beginnt die Verschmelzung – je nach gewähltem Pfad mit einem Waldgeist oder einem Dämon.
 */

export type AvatarKey =
  | 'armor'
  | 'legs'
  | 'sword'
  | 'belt'
  | 'head'
  | 'shoulders'
  | 'cape'
  | 'arms'
  | 'grimoire'
  | 'tree'
  | 'posture'
  | 'magic'
  | 'shield'
  | 'scar'
  | 'spirit'
  | 'moon'
  | 'raven'
  | 'castle'
  | 'demon'
  | 'star'
  | 'mountain'
  | 'banner'
  | 'firefly'
  | 'ruin'
  | 'leaves'
  | 'fusion'
  | 'apex'

/** Pfad der Verschmelzung ab Stufe 80 */
export type AvatarPath = 'spirit' | 'demon'

export const AVATAR_PATH_LABEL: Record<AvatarPath, string> = {
  spirit: 'Waldgeist',
  demon: 'Dämon',
}

export interface AvatarUnlock {
  /** Stufe 1–99, erreicht bei Charakterlevel step × 10 */
  step: number
  key: AvatarKey
  label: string
  /** abweichende Bezeichnung auf dem Dämonen-Pfad */
  demon?: string
}

const L = (step: number, key: AvatarKey, label: string, demon?: string): AvatarUnlock => ({ step, key, label, demon })

export const AVATAR_UNLOCKS: AvatarUnlock[] = [
  L(1, 'armor', 'Lederwams'),
  L(2, 'legs', 'Lederstiefel'),
  L(3, 'sword', 'Eisenschwert'),
  L(4, 'belt', 'Gürtel'),
  L(5, 'head', 'Kapuze'),
  L(6, 'shoulders', 'Lederschulter'),
  L(7, 'cape', 'Reiseumhang'),
  L(8, 'arms', 'Armschienen'),
  L(9, 'grimoire', 'Ein Grimoire erwacht'),
  L(10, 'armor', 'Kettenhemd'),
  L(11, 'tree', 'Der Wald beginnt'),
  L(12, 'posture', 'Aufrechter Gang'),
  L(13, 'sword', 'Langschwert'),
  L(14, 'belt', 'Gürteltasche'),
  L(15, 'magic', 'Funken in der Hand'),
  L(16, 'legs', 'Beinschienen'),
  L(17, 'grimoire', 'Das Siegel leuchtet'),
  L(18, 'shield', 'Rundschild'),
  L(19, 'shoulders', 'Schulterplatte'),
  L(20, 'scar', 'Eine Narbe verheilt'),
  L(21, 'spirit', 'Ein Irrlicht folgt dir'),
  L(22, 'magic', 'Magiekreis'),
  L(23, 'tree', 'Zweiter Baum'),
  L(24, 'head', 'Stirnreif'),
  L(25, 'cape', 'Ordensmantel'),
  L(26, 'moon', 'Mond über dem Wald'),
  L(27, 'armor', 'Brustpanzer'),
  L(28, 'raven', 'Ein Rabe'),
  L(29, 'castle', 'Burg in der Ferne'),
  L(30, 'arms', 'Panzerhandschuhe'),
  L(31, 'magic', 'Schwebende Runen'),
  L(32, 'tree', 'Dritter Baum'),
  L(33, 'belt', 'Dolch'),
  L(34, 'demon', 'Augen im Dunkel des Waldes'),
  L(35, 'shoulders', 'Zweite Schulterplatte'),
  L(36, 'spirit', 'Zweites Irrlicht'),
  L(37, 'grimoire', 'Die Seiten füllen sich'),
  L(38, 'sword', 'Verzierte Parierstange'),
  L(39, 'star', 'Ein Stern'),
  L(40, 'mountain', 'Berge am Horizont'),
  L(41, 'scar', 'Zweite Narbe verheilt'),
  L(42, 'tree', 'Vierter Baum'),
  L(43, 'legs', 'Panzerstiefel'),
  L(44, 'magic', 'Zweiter Magiekreis'),
  L(45, 'shield', 'Wappenschild'),
  L(46, 'raven', 'Zweiter Rabe'),
  L(47, 'belt', 'Heiltränke'),
  L(48, 'grimoire', 'Das Grimoire öffnet sich'),
  L(49, 'banner', 'Ordensbanner'),
  L(50, 'cape', 'Pelzkragen'),
  L(51, 'demon', 'Ein Dämon lauert'),
  L(52, 'armor', 'Verzierter Panzer'),
  L(53, 'tree', 'Fünfter Baum'),
  L(54, 'magic', 'Aura'),
  L(55, 'arms', 'Verzierte Handschuhe'),
  L(56, 'castle', 'Türme der Burg'),
  L(57, 'spirit', 'Ein Waldgeist erscheint'),
  L(58, 'sword', 'Runenklinge'),
  L(59, 'star', 'Zweiter Stern'),
  L(60, 'head', 'Edelstein im Stirnreif'),
  L(61, 'firefly', 'Glühwürmchen'),
  L(62, 'shoulders', 'Flügel-Schulterplatten'),
  L(63, 'grimoire', 'Seiten umkreisen dich'),
  L(64, 'scar', 'Letzte Narbe verheilt'),
  L(65, 'tree', 'Sechster Baum'),
  L(66, 'armor', 'Wappen auf der Brust'),
  L(67, 'ruin', 'Steinkreis'),
  L(68, 'demon', 'Dämonentor'),
  L(69, 'magic', 'Magie umhüllt die Klinge'),
  L(70, 'raven', 'Dritter Rabe'),
  L(71, 'star', 'Dritter Stern'),
  L(72, 'spirit', 'Der Waldgeist wächst'),
  L(73, 'castle', 'Fahnen auf der Burg'),
  L(74, 'sword', 'Großschwert'),
  L(75, 'leaves', 'Fallende Blätter'),
  L(76, 'tree', 'Siebter Baum'),
  L(77, 'grimoire', 'Zweites Siegel'),
  L(78, 'moon', 'Blutmond'),
  L(79, 'star', 'Vierter Stern'),
  L(80, 'fusion', 'Geistverschmelzung', 'Dämonenpakt'),
  L(81, 'demon', 'Gebannter Dämon'),
  L(82, 'fusion', 'Leuchtende Male', 'Dämonenmale'),
  L(83, 'magic', 'Dritter Magiekreis'),
  L(84, 'leaves', 'Blättersturm'),
  L(85, 'fusion', 'Flügel aus Licht', 'Schattenschwingen'),
  L(86, 'posture', 'Schwert erhoben'),
  L(87, 'tree', 'Achter Baum'),
  L(88, 'fusion', 'Geweih aus Licht', 'Hörner'),
  L(89, 'grimoire', 'Das Grimoire glüht'),
  L(90, 'sword', 'Königsklinge'),
  L(91, 'fusion', 'Augen aus Licht', 'Dämonenaugen'),
  L(92, 'cape', 'Königsmantel'),
  L(93, 'magic', 'Magiesturm'),
  L(94, 'spirit', 'Uralter Waldgeist'),
  L(95, 'fusion', 'Eins mit dem Wald', 'Eins mit dem Dämon'),
  L(96, 'castle', 'Die Burg erstrahlt'),
  L(97, 'demon', 'Das Tor ist versiegelt'),
  L(98, 'star', 'Sternenhimmel'),
  L(99, 'apex', 'Magierkönig'),
]

/** Bezeichnung passend zum gewählten Pfad */
export const unlockLabel = (u: AvatarUnlock, path: AvatarPath) => (path === 'demon' && u.demon ? u.demon : u.label)

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
