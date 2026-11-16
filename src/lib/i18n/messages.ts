/**
 * UI strings. English is the default; a German UI option is planned (ROADMAP P2.8).
 * Grammar terms are shown bilingually where they appear (PRODUCT_SPEC §6).
 */
export const messages = {
	en: {
		'app.name': 'Grammatik Gym',
		'nav.today': 'Today',
		'nav.map': 'Map',
		'nav.mistakes': 'Mistakes',
		'nav.stats': 'Stats',
		'nav.settings': 'Settings',
		'today.title': 'Today',
		'today.empty': 'Nothing scheduled yet. Pick a grammar point on the Map to start.',
		'map.title': 'Grammar map',
		'mistakes.title': 'Mistakes',
		'stats.title': 'Stats',
		'settings.title': 'Settings',
		'settings.version': 'Version',
		'error.title': 'Something went wrong',
		'error.body':
			'The app hit an error. Your progress is safe. Copy the debug info and send it to AJ.',
		'error.copy': 'Copy debug info',
		'error.copied': 'Copied',
		'error.home': 'Back to Today',
		'update.available': 'New version ready',
		'update.reload': 'Reload',
		'update.later': 'Later',
		'case.nom': 'Nominativ',
		'case.akk': 'Akkusativ',
		'case.dat': 'Dativ',
		'case.gen': 'Genitiv'
	}
} as const;

export type MessageKey = keyof (typeof messages)['en'];
export type Locale = keyof typeof messages;
