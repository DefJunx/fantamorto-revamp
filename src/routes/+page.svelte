<script lang="ts">
	import { debounce } from '$lib/debounce';
	import { fetchCelebritySuggestions, type WikidataSearchResult } from '$lib/predictiveSearch';
	import { fetchCelebrityData, type CelebrityResult } from '$lib/celebrityStatus';

	let celebrityNames = $state<string[]>(['']);
	let results = $state<CelebrityResult[]>([]);
	let disambiguationChoices = $state<Record<string, string[]>>({});
	let selectedDisambiguations = $state<Record<string, string>>({});
	let suggestions = $state<Record<number, WikidataSearchResult[]>>({});

	function addInput() {
		celebrityNames = [...celebrityNames, ''];
	}

	function removeInput(index: number) {
		if (celebrityNames.length > 1) {
			celebrityNames = celebrityNames.filter((_, i) => i !== index);
			delete suggestions[index];
		}
	}

	async function checkCelebrities() {
		results = [];
		disambiguationChoices = {};
		selectedDisambiguations = {};

		for (const name of celebrityNames) {
			if (name.trim()) {
				const result = await fetchCelebrityData(name.trim());
				if (result.disambiguation) {
					disambiguationChoices[name] = result.disambiguation;
				} else {
					results.push(result);
				}
			}
		}
	}

	async function handleDisambiguationSelection(originalName: string, selectedName: string) {
		selectedDisambiguations[originalName] = selectedName;
		const result = await fetchCelebrityData(selectedName);
		results = [...results, result];
		delete disambiguationChoices[originalName];
	}

	const debouncedFetchSuggestions = debounce(async (index: number, query: string) => {
		try {
			const fetchedSuggestions = await fetchCelebritySuggestions(query);
			suggestions = { ...suggestions, [index]: fetchedSuggestions };
		} catch (error) {
			console.error(error);
		}
	}, 300);

	function handleInput(index: number, value: string) {
		celebrityNames[index] = value;
		if (value.trim()) {
			debouncedFetchSuggestions(index, value.trim());
		} else {
			delete suggestions[index];
		}
	}

	function selectSuggestion(index: number, suggestion: WikidataSearchResult) {
		celebrityNames[index] = suggestion.label;
		delete suggestions[index];
	}
</script>

<main>
	<h1>Celebrity Status Checker</h1>
	{#each celebrityNames as name, index}
		<div class="input-group">
			<input
				type="text"
				bind:value={celebrityNames[index]}
				placeholder="Enter celebrity name"
				oninput={(e) => handleInput(index, e?.target.value)}
			/>
			<button onclick={() => removeInput(index)} disabled={celebrityNames.length === 1}>
				Remove
			</button>
			{#if suggestions[index]?.length}
				<ul class="suggestions">
					{#each suggestions[index] as suggestion}
						<button type="button" onclick={() => selectSuggestion(index, suggestion)}>
							<strong>{suggestion.label}</strong><br />
							<em>{suggestion.description}</em>
						</button>
					{/each}
				</ul>
			{/if}
		</div>
	{/each}
	<button onclick={addInput}>Add Another Celebrity</button>
	<button onclick={checkCelebrities}>Check Status</button>

	{#if Object.keys(disambiguationChoices).length > 0}
		<h2>Disambiguation Choices</h2>
		{#each Object.entries(disambiguationChoices) as [originalName, choices]}
			<div>
				<p>Multiple matches found for "{originalName}". Please select the correct one:</p>
				<ul>
					{#each choices as choice}
						<li>
							<button onclick={() => handleDisambiguationSelection(originalName, choice)}>
								{choice}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	{/if}

	{#if results.length > 0}
		<h2>Results</h2>
		<ul>
			{#each results as result}
				<li>
					{result.name}: {result.error ? result.error : result.deceased ? 'Deceased' : 'Alive'}
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	main {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
		text-align: center;
	}
	.input-group {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	input {
		width: 100%;
		padding: 0.5rem;
		font-size: 1rem;
	}
	button {
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		font-size: 1rem;
	}
	.suggestions {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ccc;
		list-style: none;
		padding: 0;
		margin: 0;
		z-index: 10;
	}
</style>
