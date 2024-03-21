export function diffLines(a: string, b: string) {
	if (a === b) return;

	const aLines = a.split('\n');
	const bLines = b.split('\n');
	const diff: number[] = [];

	for (let i = 0; i < Math.max(aLines.length, bLines.length); i++) {
		if (aLines[i] !== bLines[i]) diff.push(i);
	}

	return diff;
}
