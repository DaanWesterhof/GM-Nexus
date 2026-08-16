import { appDataDir, join, basename, extname } from '@tauri-apps/api/path';
import { copyFile, mkdir, exists } from '@tauri-apps/plugin-fs';

export async function saveImageToAppFolder(sourcePath: string): Promise<string> {
  if (!sourcePath || sourcePath.startsWith('http')) {
    return sourcePath;
  }

  try {
    const appDataDirPath = await appDataDir();
    const imagesDir = await join(appDataDirPath, 'images');

    // Ensure the images directory exists
    if (!(await exists(imagesDir))) {
      await mkdir(imagesDir, { recursive: true });
    }

    const fileName = await basename(sourcePath);
    // Use a timestamp or UUID to avoid collisions
    const fileExt = await extname(sourcePath);
    const baseNameWithoutExt = fileName.replace(new RegExp(`\\.${fileExt}$`), '');
    const newFileName = `${baseNameWithoutExt}-${Date.now()}.${fileExt}`;
    const targetPath = await join(imagesDir, newFileName);

    await copyFile(sourcePath, targetPath);

    return targetPath;
  } catch (error) {
    console.error('Failed to save image to app folder:', error);
    // Fallback to original path if copy fails
    return sourcePath;
  }
}
