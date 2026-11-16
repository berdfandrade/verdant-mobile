import { Pressable, View } from 'react-native';

import { AppText, Icon, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import { MONTHS, WEEKDAY_HEADERS, addMonths, dayKey, isSameDay, monthGrid, startOfDay } from '@/lib/dates';

/*
  Calendário do mês (Figma: 07 · Dates). Hoje fica em verde; dias com date ganham um ponto.
  Com `onSelectDay`, os dias viram botões e o escolhido também fica em verde.
*/
export function MonthCalendar({
  month,
  onChangeMonth,
  markedDays,
  selectedDay,
  onSelectDay,
  minDay,
}: {
  month: Date;
  onChangeMonth: (month: Date) => void;
  /** Chaves de dayKey() dos dias com date */
  markedDays?: Set<string>;
  selectedDay?: Date | null;
  onSelectDay?: (day: Date) => void;
  /** Dias antes deste ficam desabilitados */
  minDay?: Date;
}) {
  const today = new Date();
  const min = minDay ? startOfDay(minDay) : null;

  return (
    <View className="gap-2 rounded-3xl bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <MonthArrow icon="chevron-back" label="Mês anterior" onPress={() => onChangeMonth(addMonths(month, -1))} />
        <View className="items-center">
          <AppText className="text-lg font-bold">{MONTHS[month.getMonth()]}</AppText>
          <AppText variant="micro">{month.getFullYear()}</AppText>
        </View>
        <MonthArrow icon="chevron-forward" label="Próximo mês" onPress={() => onChangeMonth(addMonths(month, 1))} />
      </View>

      <View className="flex-row">
        {WEEKDAY_HEADERS.map(name => (
          <AppText key={name} variant="micro" className="flex-1 text-center font-semibold">
            {name}
          </AppText>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {monthGrid(month).map(day => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = isSameDay(day, today);
          const selected = !!selectedDay && isSameDay(day, selectedDay);
          const disabled = !onSelectDay || !inMonth || (!!min && day < min);
          // Com seleção, só o dia escolhido fica cheio; hoje vira contorno
          const filled = selected || (isToday && !selectedDay);
          const marked = markedDays?.has(dayKey(day)) && inMonth;

          return (
            <Pressable
              key={day.toISOString()}
              disabled={disabled}
              onPress={() => onSelectDay?.(day)}
              accessibilityRole={onSelectDay ? 'button' : undefined}
              accessibilityState={{ selected, disabled }}
              accessibilityLabel={`${day.getDate()} de ${MONTHS[day.getMonth()]}${marked ? ', com date' : ''}`}
              className="h-12 w-[14.2857%] items-center justify-center">
              <View
                className={cn(
                  'size-9 items-center justify-center rounded-full',
                  filled && 'bg-primary',
                  isToday && !filled && 'border-2 border-primary',
                )}>
                <AppText
                  tone="none"
                  className={cn(
                    'font-semibold',
                    filled ? 'text-on-primary' : inMonth && !(min && day < min) ? 'text-foreground' : 'text-muted/50',
                  )}>
                  {day.getDate()}
                </AppText>
              </View>
              <View className={cn('mt-0.5 size-1 rounded-full', marked ? 'bg-primary' : 'bg-transparent')} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MonthArrow({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-10 items-center justify-center rounded-xl bg-background active:opacity-70">
      <Icon name={icon} size={18} colorClassName="accent-foreground" />
    </Pressable>
  );
}
