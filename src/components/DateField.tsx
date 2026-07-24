import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { colors } from '../theme';
import { formatDate } from '../utils/format';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function DateField({ label, value, onChange, minimumDate, maximumDate }: DateFieldProps) {
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const dateValue = value ? new Date(`${value}T00:00:00`) : new Date();

  function openPicker() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: dateValue,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (_event, selected) => {
          if (selected) onChange(toIso(selected));
        },
      });
    } else {
      setShowIOSPicker((prev) => !prev);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={openPicker} style={styles.input}>
        <Text style={value ? styles.value : styles.placeholder}>
          {value ? formatDate(value) : 'Selecionar data'}
        </Text>
      </Pressable>
      {showIOSPicker ? (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_event, selected) => {
              if (selected) onChange(toIso(selected));
            }}
          />
          <Pressable onPress={() => setShowIOSPicker(false)} style={styles.doneButton}>
            <Text style={styles.doneText}>Concluir</Text>
          </Pressable>
        </View>
      ) : null}
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
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  value: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: {
    fontSize: 16,
    color: colors.textMuted,
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
});
