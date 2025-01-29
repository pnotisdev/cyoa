<script>
    import { getModelInfo, getVersion, generateResponseStream } from '$lib/api/kobold';
    import { onMount } from 'svelte';
    import { messages, addMessage } from '$lib/stores/messages';
    import characterData from '$lib/characters/Alex.json';
    import { goto } from '$app/navigation';

    const uiConfig = {
        title: 'Chat Interface',
        status: {
            connected: 'Connected',
            disconnected: 'Disconnected'
        },
        loading: 'Generating response...',
        input: {
            placeholder: 'Type your message...',
            sendButton: 'Send'
        },
        errors: {
            connection: (msg) => `Failed to connect to KoboldCPP: ${msg}`,
            generation: (msg) => `Error: Failed to get response - ${msg}`
        }
    };

    const layoutConfig = {
        chatWindowHeight: '70vh',
        maxWidth: '4xl'
    };

    let modelInfo = null;
    let version = null;
    let error = null;
    let userInput = '';
    let isLoading = false;
    let isConnected = false;
    let character = characterData;

    onMount(async () => {
        try {
            [modelInfo, version] = await Promise.all([
                getModelInfo(),
                getVersion()
            ]);
            isConnected = true;
        } catch (e) {
            error = uiConfig.errors.connection(e.message);
            console.error('Connection error:', e);
        }
    });

    async function handleSubmit() {
        if (!userInput.trim()) return;
        
        addMessage('user', userInput);
        isLoading = true;

        try {
            const conversationHistory = $messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
            const prompt = `${character.name}, ${character.description}\n${conversationHistory}\nUser: ${userInput}\n${character.name}:`;
            const responseStream = await generateResponseStream(prompt);
            
            console.log('Raw response:', responseStream); // Log the raw response

            let accumulatedResponse = '';
            const reader = responseStream.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                accumulatedResponse += decoder.decode(value, { stream: true });
            }

            console.log('Accumulated response:', accumulatedResponse); // Log the accumulated response

            // Check if the response contains the expected delimiter
            const splitResponse = accumulatedResponse.split(`${character.name}:`);
            if (splitResponse.length > 1) {
                const characterResponse = splitResponse[1].trim();
                addMessage(character.name, characterResponse);
            } else {
                // Handle the case where the response does not contain the expected delimiter
                const fallbackResponse = accumulatedResponse.split('Output:')[1]?.trim();
                if (fallbackResponse) {
                    addMessage(character.name, fallbackResponse);
                } else {
                    throw new Error('Unexpected response format');
                }
            }
        } catch (error) {
            const errorMessage = uiConfig.errors.generation(error.message);
            addMessage('system', errorMessage);
            console.error('Generation error:', error);
        } finally {
            isLoading = false;
            userInput = '';
        }
    }

    function navigateToCharacters() {
        goto('/characters');
    }
</script>

<div class="min-h-screen bg-gray-900 text-gray-100 p-4">
    <div class="max-w-{layoutConfig.maxWidth} mx-auto">
        <div class="flex items-center gap-3 mb-6">
            <h1 class="text-xl font-medium">{uiConfig.title}</h1>
            {#if error}
                <div class="flex items-center text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 101.414 1.414L10 11.414l1.293 1.293a1 1 001.414-1.414L11.414 10l1.293-1.293a1 1 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                    <span class="ml-2">{uiConfig.status.disconnected}</span>
                </div>
            {:else if isConnected}
                <div class="flex items-center text-green-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 00-1.414 1.414l2 2a1 1 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                    <span class="ml-2">{uiConfig.status.connected}</span>
                </div>
            {/if}
        </div>

        <button on:click={navigateToCharacters} class="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Manage Characters
        </button>

        <div class="space-y-4">
            <div class="bg-gray-800 p-4 rounded-lg">
                <h2 class="text-lg font-semibold">{character.name}</h2>
                <p class="text-gray-400">{character.description}</p>
            </div>

            <div class="h-[{layoutConfig.chatWindowHeight}] overflow-y-auto rounded-lg bg-gray-800 p-4 custom-scrollbar">
                {#each $messages as message}
                    <div class="mb-4 p-3 rounded-lg {
                        message.role === 'user' ? 'bg-gray-700' :
                        message.role === character.name ? 'bg-gray-600' :
                        'bg-red-900'
                    }">
                        <span class="text-sm text-gray-400 mb-1 block">{message.role}</span>
                        <p class="whitespace-pre-wrap">{message.content}</p>
                    </div>
                {/each}
                
                {#if isLoading}
                    <div class="text-center text-gray-400 py-2">
                        <div class="animate-pulse">{uiConfig.loading}</div>
                    </div>
                {/if}
            </div>

            <form on:submit|preventDefault={handleSubmit} class="flex gap-3">
                <input 
                    type="text" 
                    bind:value={userInput}
                    placeholder={uiConfig.input.placeholder}
                    disabled={isLoading}
                    class="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg 
                           text-gray-100 placeholder-gray-500 focus:outline-none 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                    type="submit" 
                    disabled={isLoading}
                    class="px-6 py-3 bg-blue-600 text-white rounded-lg
                           disabled:bg-gray-700 disabled:text-gray-500
                           hover:bg-blue-700 transition-colors"
                >
                    {uiConfig.input.sendButton}
                </button>
            </form>
        </div>
    </div>
</div>

<style>
    :root {
        --scrollbar-width: 8px;
        --scrollbar-track: #1f2937;
        --scrollbar-thumb: #4b5563;
        --scrollbar-thumb-hover: #6b7280;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: var(--scrollbar-width);
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: var(--scrollbar-track);
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb);
        border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: var(--scrollbar-thumb-hover);
    }
</style>