/** Levenshtein edit distance with an early exit once `max` is exceeded. */
export function levenshtein(a: string, b: string, max = Number.POSITIVE_INFINITY): number {
	if (a === b) return 0;
	if (Math.abs(a.length - b.length) > max) return max + 1;
	const prev = new Array<number>(b.length + 1);
	const curr = new Array<number>(b.length + 1);
	for (let j = 0; j <= b.length; j++) prev[j] = j;
	for (let i = 1; i <= a.length; i++) {
		curr[0] = i;
		let rowMin = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const value = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
			curr[j] = value;
			if (value < rowMin) rowMin = value;
		}
		if (rowMin > max) return max + 1;
		for (let j = 0; j <= b.length; j++) prev[j] = curr[j] ?? 0;
	}
	return prev[b.length] ?? 0;
}
