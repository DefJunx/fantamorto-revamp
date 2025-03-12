<script lang="ts">
	import { debounce } from '$lib/debounce';
	import { fetchCelebritySuggestions, type WikidataSearchResult } from '$lib/predictiveSearch';
	import { fetchCelebrityData, type CelebrityResult } from '$lib/celebrityStatus';

	let celebrityNames = $state(['']);
	let isLoading = $state(false);
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

		try {
			isLoading = true;
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
			isLoading = false;
		} catch (error) {
			isLoading = false;
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
				disabled={isLoading}
				bind:value={celebrityNames[index]}
				placeholder="Enter celebrity name"
				oninput={(e) => handleInput(index, e?.target.value)}
			/>
			<button
				onclick={() => removeInput(index)}
				disabled={celebrityNames.length === 1 || isLoading}
			>
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

	<div class="actions">
		<button disabled={isLoading} onclick={addInput}>Add Another Celebrity</button>
		<button disabled={isLoading || celebrityNames.join().trim() === ''} onclick={checkCelebrities}
			>Check Status</button
		>
	</div>

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
		<ul role="list">
			{#each results as result}
				<li>
					{result.name}: {result.error ? result.error : result.deceased ? 'Deceased' : 'Alive'}
				</li>
			{/each}
		</ul>
	{/if}
</main>
