import fs from 'fs';
import path from 'path';

const charactersDir = path.join(__dirname, '../characters');

export function createCharacter(character) {
  const filePath = path.join(charactersDir, `${character.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(character, null, 2));
}

export function loadCharacter(id) {
  const filePath = path.join(charactersDir, `${id}.json`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

export function removeCharacter(id) {
  const filePath = path.join(charactersDir, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function editCharacter(id, updatedCharacter) {
  const filePath = path.join(charactersDir, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(updatedCharacter, null, 2));
  }
}