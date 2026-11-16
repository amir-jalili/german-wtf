import { messages, type Locale, type MessageKey } from './messages';

class I18n {
	locale = $state<Locale>('en');

	/** Translate a key; falls back to English, then to the key itself. */
	t = (key: MessageKey): string => {
		const dict: Record<string, string> = messages[this.locale];
		return dict[key] ?? messages.en[key] ?? key;
	};
}

export const i18n = new I18n();
export const t = i18n.t;
