import { Alert, Platform } from 'react-native';

interface ConfirmOptions {
  destructive?: boolean;
}

/**
 * Alert.alert() es un no-op en react-native-web (ver
 * node_modules/react-native-web/dist/exports/Alert): en web nunca dispara el
 * callback de confirmación, así que cualquier acción que dependiera de él
 * (finalizar partido, eliminar campeonato, etc.) no hacía nada al tocar el
 * botón. Este helper usa window.confirm en web y Alert.alert nativo en
 * iOS/Android.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
  options?: ConfirmOptions
): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: confirmLabel, style: options?.destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
