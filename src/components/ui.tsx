import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { SafeAreaView as RNSafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { withUniwind } from 'uniwind';

import { cn } from '@/lib/cn';
import { firstName } from '@/lib/profile';

// Componentes de terceiros que passam a aceitar className
export const SafeAreaView = withUniwind(RNSafeAreaView);
export const Image = withUniwind(ExpoImage);
export const Icon = withUniwind(Ionicons);

export type IconName = keyof typeof Ionicons.glyphMap;

// ---------- Texto ----------

type TextVariant = 'title' | 'subtitle' | 'body' | 'label' | 'caption' | 'micro';

// 'none': a cor vem do className de quem usa
type TextTone = 'none' | 'default' | 'muted' | 'primary' | 'danger' | 'white' | 'white-soft';

const textVariants: Record<TextVariant, string> = {
  title: 'text-[30px] leading-9 font-bold',
  subtitle: 'text-xl leading-[26px] font-bold',
  body: 'text-base leading-[22px]',
  label: 'text-sm leading-5 font-semibold',
  caption: 'text-[13px] leading-[18px]',
  micro: 'text-[11px] leading-[14px]',
};

// A cor fica separada do tamanho: o Uniwind não resolve conflitos (ex.: text-foreground + text-danger)
const textTones: Record<TextTone, string> = {
  none: '',
  default: 'text-foreground',
  muted: 'text-muted',
  primary: 'text-primary',
  danger: 'text-danger',
  white: 'text-white',
  'white-soft': 'text-white/85',
};

export function AppText({
  variant = 'body',
  tone,
  className,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const color = textTones[tone ?? (variant === 'caption' || variant === 'micro' ? 'muted' : 'default')];
  return <Text className={cn(textVariants[variant], color, className)} {...rest} />;
}

// ---------- Tela ----------

export function Screen({
  children,
  edges = ['top'],
  padded = true,
  className,
}: {
  children: ReactNode;
  edges?: Edge[];
  padded?: boolean;
  className?: string;
}) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      <View className={cn('w-full max-w-content flex-1 self-center', padded && 'px-4', className)}>{children}</View>
    </SafeAreaView>
  );
}

// ---------- Botão ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const buttonVariants: Record<ButtonVariant, { container: string; text: string; accent: string }> = {
  primary: { container: 'bg-primary', text: 'text-on-primary', accent: 'accent-on-primary' },
  secondary: { container: 'bg-surface border border-line', text: 'text-foreground', accent: 'accent-foreground' },
  ghost: { container: 'bg-transparent', text: 'text-primary', accent: 'accent-primary' },
  danger: { container: 'bg-transparent', text: 'text-danger', accent: 'accent-danger' },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled,
  icon,
  className,
  ...rest
}: Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: IconName;
  className?: string;
}) {
  const isDisabled = !!disabled || loading;
  const styles = buttonVariants[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'min-h-[50px] items-center justify-center rounded-full px-6 active:opacity-85 disabled:opacity-60',
        styles.container,
        className,
      )}
      {...rest}>
      {loading ? (
        <ActivityIndicator colorClassName={styles.accent} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon && <Icon name={icon} size={18} colorClassName={styles.accent} />}
          <Text className={cn('text-base font-bold', styles.text)}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ---------- Campo de texto ----------

export function TextField({
  label,
  error,
  className,
  ...rest
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View className="gap-1">
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColorClassName="accent-muted"
        cursorColorClassName="accent-primary"
        selectionColorClassName="accent-primary"
        className={cn(
          'min-h-[50px] rounded-2xl border bg-surface px-4 text-base text-foreground web:outline-none',
          error ? 'border-danger' : 'border-line focus:border-primary',
          className,
        )}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------- Seleção em "chips" ----------

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: { label: string; value: T }[];
  value: T | '';
  onChange: (value: T) => void;
  error?: string;
}) {
  return (
    <View className="gap-1">
      <AppText variant="label">{label}</AppText>
      <View className="flex-row flex-wrap gap-2">
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              className={cn(
                'rounded-full border px-4 py-2 active:opacity-80',
                selected ? 'border-primary bg-primary' : 'border-line bg-surface',
              )}>
              <Text className={cn('font-semibold', selected ? 'text-on-primary' : 'text-foreground')}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------- Avatar ----------

export function Avatar({ uri, name, size = 48 }: { uri?: string; name?: string; size?: number }) {
  const initial = firstName(name).charAt(0).toUpperCase() || '?';
  // Tamanho é dinâmico (prop), então vai em style; cores e forma ficam no className
  const shape = { width: size, height: size };

  if (uri) {
    return (
      <Image source={{ uri }} style={shape} className="rounded-full bg-surface" contentFit="cover" transition={150} />
    );
  }

  return (
    <View style={shape} className="items-center justify-center rounded-full bg-primary">
      <Text style={{ fontSize: size * 0.4 }} className="font-bold text-on-primary">
        {initial}
      </Text>
    </View>
  );
}

// ---------- Estados ----------

export function CenteredState({
  icon,
  title,
  message,
  action,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 p-6">
      {icon && (
        <View className="size-20 items-center justify-center rounded-full bg-surface">
          <Icon name={icon} size={40} colorClassName="accent-primary" />
        </View>
      )}
      <AppText variant="subtitle" className="text-center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="caption" className="text-center">
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" colorClassName="accent-primary" />
    </View>
  );
}
