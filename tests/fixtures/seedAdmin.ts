import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
export async function seedTestAdmin(directory: string) {
  await mkdir(path.join(directory, 'data'), { recursive: true });
  await writeFile(path.join(directory, 'data', 'admin.json'), await readFile(new URL('./admin.json', import.meta.url)));
}
