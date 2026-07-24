import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

interface PhotoCaptureProps {
  uri: string | null;
  onChange: (uri: string | null) => void;
}

export function PhotoCapture({ uri, onChange }: PhotoCaptureProps) {
  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso à câmera para fotografar a nota fiscal.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  }

  async function pickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar um comprovante.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Foto da nota fiscal</Text>
      {uri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri }} style={styles.preview} />
          <Pressable style={styles.removeButton} onPress={() => onChange(null)}>
            <Text style={styles.removeButtonText}>Remover foto</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          <Pressable style={styles.captureButton} onPress={takePhoto}>
            <Text style={styles.captureIcon}>📷</Text>
            <Text style={styles.captureText}>Tirar foto</Text>
          </Pressable>
          <Pressable style={styles.captureButton} onPress={pickFromGallery}>
            <Text style={styles.captureIcon}>🖼️</Text>
            <Text style={styles.captureText}>Galeria</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  captureButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  captureIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  captureText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  previewWrap: {
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  removeButton: {
    marginTop: 10,
  },
  removeButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
});
