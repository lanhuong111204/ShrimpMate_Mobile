import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';

interface OtpInputProps {
  value: string[];
  onChangeOtp: (newOtp: string[]) => void;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChangeOtp,
  disabled = false,
  hasError = false,
  length = 6,
}: OtpInputProps) {
  const colors = useTheme();
  const inputsRef = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const isLargeCount = length >= 6;
  const boxHeight = isLargeCount ? 52 : 64;
  const fontSize = isLargeCount ? 20 : 28;
  const boxGap = isLargeCount ? 6 : 10;

  const handleChangeText = (text: string, index: number) => {
    // If text contains multiple digits (e.g. pasted code from SMS)
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const newOtp = [...value];
      for (let i = 0; i < length; i++) {
        newOtp[i] = cleaned[i] || '';
      }
      onChangeOtp(newOtp);
      const nextFocus = Math.min(cleaned.length, length - 1);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...value];
    newOtp[index] = cleaned;
    onChangeOtp(newOtp);

    // Auto advance if digit entered
    if (cleaned && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move to previous and clear it
        const newOtp = [...value];
        newOtp[index - 1] = '';
        onChangeOtp(newOtp);
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  return (
    <View style={[styles.container, { gap: boxGap }]}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] || '';
        const isFocused = focusedIndex === index;
        const borderColor = hasError
          ? colors.error
          : isFocused
          ? colors.primary
          : digit
          ? colors.primary + '80'
          : colors.outlineVariant;

        return (
          <View
            key={index}
            style={[
              styles.box,
              {
                height: boxHeight,
                backgroundColor: digit
                  ? colors.surfaceContainerHigh
                  : colors.surfaceContainerLowest,
                borderColor,
                borderWidth: isFocused ? 2.5 : 1.5,
              },
            ]}>
            <TextInput
              ref={(ref) => {
                inputsRef.current[index] = ref;
              }}
              style={[
                styles.input,
                {
                  fontSize,
                  color: hasError ? colors.error : colors.primary,
                },
              ]}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              keyboardType="number-pad"
              maxLength={index === 0 ? length : 1}
              selectTextOnFocus
              editable={!disabled}
              textAlign="center"
              testID={`otp-input-${index}`}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  box: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    width: '100%',
    height: '100%',
    fontWeight: '900',
    textAlign: 'center',
    padding: 0,
  },
});
