<script lang="ts">
	import { debounce } from '$lib/debounce';
	import { fetchCelebritySuggestions, type WikidataSearchResult } from '$lib/predictiveSearch';
	import { fetchCelebrityData, type CelebrityResult } from '$lib/celebrityStatus';
	import type { ChangeEventHandler } from 'svelte/elements';

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

	function handleFileLoading(e: Event) {
		const files = (e.currentTarget as HTMLInputElement).files;

		if (!files) {
			alert('file non caricato!');
			return false;
		}

		const reader = new FileReader();

		reader.onload = function (e) {
			const deathList = e.target?.result;

			if (deathList && typeof deathList == 'string') {
				celebrityNames = deathList.split('\n').map((el) => el.trim());
				return true;
			}

			alert('lista invalida, controlla che sia nel formato corretto!');
			return false;
		};

		reader.readAsText(files[0]);
	}
</script>

<main>
	<h1>Ma è morto?!</h1>
	<h2>
		Carica una lista di nomi (Un nome singolo per ogni riga) oppure scrivi i nomi nei campi
		sottostanti e premi "Verifica Loculi" per verificare se il tuo vip è morto o meno!
	</h2>

	<input type="file" name="" id="" accept=".txt" onchange={handleFileLoading} />

	{#each celebrityNames as name, index}
		<div class="input-group">
			<input
				type="text"
				disabled={isLoading}
				bind:value={celebrityNames[index]}
				placeholder="Enter celebrity name"
				oninput={(e) => handleInput(index, (e.target as HTMLInputElement)?.value)}
			/>
			<button
				onclick={() => removeInput(index)}
				disabled={celebrityNames.length === 1 || isLoading}
			>
				Rimuovi
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
		<button disabled={isLoading} onclick={addInput}>Aggiungi nome</button>
		<button disabled={isLoading || celebrityNames.join().trim() === ''} onclick={checkCelebrities}
			>Verifica Loculi</button
		>
	</div>

	{#if Object.keys(disambiguationChoices).length > 0}
		<h2>Risultati ambigui</h2>
		{#each Object.entries(disambiguationChoices) as [originalName, choices]}
			<div>
				<p>Ci sono risultati per"{originalName}". seleziona uno:</p>
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
		<h2>Cimitero:</h2>
		<ul role="list">
			{#each results as result}
				<li>
					{result.name}: {result.error ? result.error : result.deceased ? '🪦' : '😊'}
				</li>
			{/each}
		</ul>
	{/if}
</main>
