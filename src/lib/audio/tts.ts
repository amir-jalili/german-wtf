/**
 * German text-to-speech via the Web Speech API (ARCHITECTURE §2). Works offline on most
 * phones once a German voice is installed; silently does nothing where unsupported.
 */
export function canSpeak(): boolean {
	return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

function germanVoice(): SpeechSynthesisVoice | undefined {
	const voices = speechSynthesis.getVoices();
	return (
		voices.find((v) => v.lang === 'de-DE' && /anna|petra|helena|markus|viktor/i.test(v.name)) ??
		voices.find((v) => v.lang === 'de-DE') ??
		voices.find((v) => v.lang.startsWith('de'))
	);
}

export interface SpeakOptions {
	/** 0.5–2; default 0.95 (slightly slower than native). */
	rate?: number;
}

export function speak(text: string, options: SpeakOptions = {}): void {
	if (!canSpeak()) return;
	speechSynthesis.cancel();
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = 'de-DE';
	utterance.rate = options.rate ?? 0.95;
	const voice = germanVoice();
	if (voice) utterance.voice = voice;
	speechSynthesis.speak(utterance);
}
