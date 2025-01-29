const KOBOLD_BASE_URL = 'http://localhost:5001';

async function handleResponse(response, endpoint) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `API Error (${endpoint}): ${response.status} ${response.statusText}\n` +
            `Response: ${errorText}`
        );
    }
    return response.json();
}

export async function getModelInfo() {
    const response = await fetch(`${KOBOLD_BASE_URL}/api/v1/model`);
    return handleResponse(response, 'model');
}

export async function getVersion() {
    const response = await fetch(`${KOBOLD_BASE_URL}/api/v1/info/version`);
    return handleResponse(response, 'version');
}

export async function generateResponse(prompt) {
    const payload = {
        prompt,
        max_context_length: 2048,
        max_length: 100,
        temperature: 0.7,
        top_p: 0.9
    };

    console.log('Sending request:', payload);

    const response = await fetch(`${KOBOLD_BASE_URL}/api/v1/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    const result = await handleResponse(response, 'generate');
    console.log('Received response:', result);
    
    return result.results[0].text;
}

export async function generateResponseStream(prompt) {
    const payload = {
        prompt,
        max_context_length: 2048,
        max_length: 100,
        temperature: 0.7,
        top_p: 0.9
    };

    console.log('Sending streaming request:', payload);

    const response = await fetch(`${KOBOLD_BASE_URL}/api/extra/generate/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.body) {
        throw new Error('ReadableStream not yet supported in this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
            const chunk = decoder.decode(value, { stream: true });
            result += chunk;
        }
    }

    console.log('Streaming complete');
    return result;
}