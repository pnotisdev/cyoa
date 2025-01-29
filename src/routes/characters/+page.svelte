<script>
    import { onMount } from 'svelte';
    import { createCharacter, loadCharacter, removeCharacter, editCharacter } from '$lib/stores/characters';

    let characters = [];
    let newCharacter = { id: '', name: '', description: '' };
    let editCharacterId = '';
    let editCharacterData = { id: '', name: '', description: '' };

    async function loadCharacters() {
        const response = await fetch('/api/characters.json');
        const data = await response.json();
        characters = data.files.map(file => loadCharacter(file));
    }

    function handleCreate() {
        createCharacter(newCharacter);
        loadCharacters();
        newCharacter = { id: '', name: '', description: '' };
    }

    function handleEdit() {
        editCharacter(editCharacterId, editCharacterData);
        loadCharacters();
        editCharacterId = '';
        editCharacterData = { id: '', name: '', description: '' };
    }

    function handleRemove(id) {
        removeCharacter(id);
        loadCharacters();
    }

    onMount(() => {
        loadCharacters();
    });
</script>

<h1>Characters</h1>

<h2>Create Character</h2>
<input bind:value={newCharacter.id} placeholder="ID" />
<input bind:value={newCharacter.name} placeholder="Name" />
<input bind:value={newCharacter.description} placeholder="Description" />
<button on:click={handleCreate}>Create</button>

<h2>Edit Character</h2>
<input bind:value={editCharacterId} placeholder="ID of character to edit" />
<input bind:value={editCharacterData.name} placeholder="New Name" />
<input bind:value={editCharacterData.description} placeholder="New Description" />
<button on:click={handleEdit}>Edit</button>

<h2>Character List</h2>
<ul>
    {#each characters as character}
        <li>
            {character.name} - {character.description}
            <button on:click={() => handleRemove(character.id)}>Remove</button>
        </li>
    {/each}
</ul>