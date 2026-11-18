import { useSettings } from '../../data'
import type { AvatarPath } from '../../domain/avatar'

/** Gewählter Pfad der Verschmelzung (Standard: Dämon) */
export function useAvatarPath(): AvatarPath {
  return useSettings()?.avatarPath ?? 'demon'
}
