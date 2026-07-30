import type { CaptionTrack } from './types'
import type { ICaptionTrackSelector } from './interfaces'

export class CaptionTrackSelector implements ICaptionTrackSelector {
  select(tracks: readonly CaptionTrack[], preferredLanguage: string): CaptionTrack | null {
    if (!tracks.length) return null

    const exactManual = tracks.find(
      t => t.languageCode === preferredLanguage && t.kind === 'manual',
    )
    if (exactManual) return exactManual

    const prefixManual = tracks.find(
      t => t.languageCode.startsWith(preferredLanguage) && t.kind === 'manual',
    )
    if (prefixManual) return prefixManual

    const exactAny = tracks.find(t => t.languageCode === preferredLanguage)
    if (exactAny) return exactAny

    const prefixAny = tracks.find(t => t.languageCode.startsWith(preferredLanguage))
    if (prefixAny) return prefixAny

    if (preferredLanguage !== 'en') {
      const enManual = tracks.find(t => t.languageCode === 'en' && t.kind === 'manual')
      if (enManual) return enManual

      const enPrefixManual = tracks.find(
        t => t.languageCode.startsWith('en') && t.kind === 'manual',
      )
      if (enPrefixManual) return enPrefixManual

      const enAny = tracks.find(t => t.languageCode === 'en')
      if (enAny) return enAny

      const enPrefixAny = tracks.find(t => t.languageCode.startsWith('en'))
      if (enPrefixAny) return enPrefixAny
    }

    return tracks[0]
  }
}
