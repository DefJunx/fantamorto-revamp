<script lang="ts">
	import '$lib/assets/reset.css';
	import '$lib/assets/style.css';

	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

{@render children()}

