import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export function getPublicChampionshipUrl(slug: string): string {
  return `https://pentagolazo.app/public/${slug}`;
}

export function getPublicPlayerUrl(code: string): string {
  return `https://pentagolazo.app/ficha/${code}`;
}

export async function shareText(message: string, title?: string): Promise<void> {
  await Share.share({ message, title });
}

export async function copyToClipboard(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}
