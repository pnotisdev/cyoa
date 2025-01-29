import { writable } from 'svelte/store';

export const messages = writable([]);

export function addMessage(role, content) {
    messages.update(msgs => [...msgs, { role, content, timestamp: new Date() }]);
}