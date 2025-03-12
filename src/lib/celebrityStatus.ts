export interface CelebrityResult {
	name: string;
	deceased?: boolean;
	disambiguation?: string[];
	error?: string;
}

export async function fetchCelebrityData(name: string): Promise<CelebrityResult> {
	const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
	const response = await fetch(url);
	if (!response.ok) {
		return { name, error: `Failed to fetch data for ${name}` };
	}
	const data = await response.json();

	if (data.type === 'disambiguation') {
		const disambiguationTitles = data.titles || [];
		return { name, disambiguation: disambiguationTitles };
	}

	const deceased = (data.description && data.description.includes('was')) || (data.extract && data.extract.includes('was'));
	return { name, deceased };
}
