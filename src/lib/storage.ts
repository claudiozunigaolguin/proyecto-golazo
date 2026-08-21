import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET = 'golazo-media';

export async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Necesitamos permiso para acceder a tus fotos');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (result.canceled) return null;
  return result.assets[0] ?? null;
}

function extensionFromAsset(asset: ImagePicker.ImagePickerAsset): string {
  const fromUri = asset.uri.split('.').pop()?.split('?')[0];
  if (fromUri && fromUri.length <= 5) return fromUri;
  if (asset.mimeType === 'image/png') return 'png';
  return 'jpg';
}

/**
 * Sube un asset ya elegido (ver pickImage) a `<carpeta>/<championshipId>/<entityId>`
 * del bucket público golazo-media. La ruta codifica el championship_id porque
 * las políticas RLS de storage.objects validan permisos a partir de ese
 * segmento (ver supabase/migrations/0004_storage.sql).
 */
export async function uploadImage(
  pathWithoutExtension: string,
  asset: ImagePicker.ImagePickerAsset
): Promise<string> {
  const ext = extensionFromAsset(asset);
  const fullPath = `${pathWithoutExtension}.${ext}`;

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fullPath, blob, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fullPath);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Conveniencia: elige y sube en un solo paso (para editar una entidad que ya existe). */
export async function pickAndUploadImage(pathWithoutExtension: string): Promise<string | null> {
  const asset = await pickImage();
  if (!asset) return null;
  return uploadImage(pathWithoutExtension, asset);
}

export function teamLogoPath(championshipId: string, teamId: string): string {
  return `team-logos/${championshipId}/${teamId}`;
}

export function championshipLogoPath(championshipId: string): string {
  return `championship-logos/${championshipId}/logo`;
}

export function playerPhotoPath(championshipId: string, playerId: string): string {
  return `player-photos/${championshipId}/${playerId}`;
}

export function athletePhotoPath(athleteId: string): string {
  return `athlete-photos/${athleteId}/photo`;
}
