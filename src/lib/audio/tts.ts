/**
 * German text-to-speech via the Web Speech API (ARCHITECTURE §2). Works offline on most
 * phones once a German voice is installed; silently does nothing where unsupported.
 */
export function canSpeak(): boolean {
	return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Preferences from Settings (P2.8c); set once by the layout, used by every speak(). */
const prefs = { rate: 0.95, voiceName: '' };
export function setSpeechPrefs(next: { rate: number; voiceName: string }): void {
	prefs.rate = next.rate;
	prefs.voiceName = next.voiceName;
}

/** The German voices this device offers (may be empty until the browser loads them). */
export function germanVoices(): SpeechSynthesisVoice[] {
	if (!canSpeak()) return [];
	return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('de'));
}

function germanVoice(): SpeechSynthesisVoice | undefined {
	const voices = speechSynthesis.getVoices();
	const chosen = prefs.voiceName && voices.find((v) => v.name === prefs.voiceName);
	if (chosen) return chosen;
	return (
		voices.find((v) => v.lang === 'de-DE' && /anna|petra|helena|markus|viktor/i.test(v.name)) ??
		voices.find((v) => v.lang === 'de-DE') ??
		voices.find((v) => v.lang.startsWith('de'))
	);
}

export interface SpeakOptions {
	/** 0.5–2; default: the Settings rate (0.95, slightly slower than native). */
	rate?: number;
}

export function speak(text: string, options: SpeakOptions = {}): void {
	if (!canSpeak()) return;
	speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = 'de-DE';
	utterance.rate = options.rate ?? prefs.rate;
	const voice = germanVoice();
	if (voice) utterance.voice = voice;
	speechSynthesis.speak(utterance);
}
