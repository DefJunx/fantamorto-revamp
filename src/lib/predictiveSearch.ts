// src/lib/predictiveSearch.ts

export interface WikidataSearchResult {
	id: string;
	label: string;
	description: string;
}

export async function fetchCelebritySuggestions(query: string): Promise<WikidataSearchResult[]> {
	if (!query) return [];
	const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&type=item&format=json&origin=*`;
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch suggestions for ${query}`);
	}
	const data = await response.json();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return data.search.map((item: any) => ({
		id: item.id,
		label: item.label,
		description: item.description
	}));
}
