import fs from 'fs';
import path from 'path';

export async function get() {
    const charactersDir = path.join(process.cwd(), 'src/lib/characters');
    const files = fs.readdirSync(charactersDir);
    return {
        body: {
            files: files.map(file => file.replace('.json', ''))
        }
    };
}