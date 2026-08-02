export interface AudioServicePort {
  getAudioUrl(word: string): Promise<string>
  play(word: string): Promise<void>
  getAvailableVoices(): Promise<string[]>
}
