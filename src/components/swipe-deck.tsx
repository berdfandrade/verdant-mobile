import { Pressable, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { FeedProfile } from '@/api/types';
import { BottomShade } from '@/components/bottom-shade';
import { AppText, Icon, Image, type IconName } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ageFrom, firstName, formatDistance, mainPhoto } from '@/lib/profile';

export type SwipeDirection = 'like' | 'pass';

interface SwipeCardProps {
  profile: FeedProfile;
  onSwiped: (profile: FeedProfile, direction: SwipeDirection) => void;
}

// Quanto o card precisa andar (fração da largura) para contar como like/pass
const SWIPE_THRESHOLD = 0.28;
const VELOCITY_THRESHOLD = 800;

// Card do Descobrir (Figma: 03 · Descobrir): foto, dados e os botões de passar/curtir
export function SwipeCard({ profile, onSwiped }: SwipeCardProps) {
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const offScreen = width * 1.5;

  const finish = (direction: SwipeDirection) => onSwiped(profile, direction);

  const flyAway = (direction: SwipeDirection) => {
    'worklet';
    translateX.value = withTiming(direction === 'like' ? offScreen : -offScreen, { duration: 220 }, done => {
      if (done) scheduleOnRN(finish, direction);
    });
  };

  const pan = usePanGesture({
    onUpdate: event => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.3;
    },
    onDeactivate: event => {
      const passedDistance = Math.abs(event.translationX) > width * SWIPE_THRESHOLD;
      const fastFlick = Math.abs(event.velocityX) > VELOCITY_THRESHOLD;

      if (passedDistance || fastFlick) {
        flyAway(event.translationX > 0 ? 'like' : 'pass');
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${interpolate(translateX.value, [-width, 0, width], [-14, 0, 14])}deg` },
    ],
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, width * SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));
  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width * SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  const photo = mainPhoto(profile);
  const age = ageFrom(profile.birthDate);
  const name = firstName(profile.fullName);
  const distance = formatDistance(profile.distance);

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityLabel={`Perfil de ${name}`}
        className="absolute inset-0 overflow-hidden rounded-3xl bg-surface shadow-lg"
        style={cardStyle}>
        {photo ? (
          <Image source={{ uri: photo }} className="absolute inset-0" contentFit="cover" transition={200} />
        ) : (
          <View className="absolute inset-0 items-center justify-center bg-primary">
            <AppText tone="none" className="text-[120px] leading-[140px] font-extrabold text-white/85">
              {name.charAt(0)}
            </AppText>
          </View>
        )}

        {profile.verified ? (
          <View className="absolute left-4 top-4 z-10 flex-row items-center gap-1 rounded-full bg-black/45 px-3 py-1">
            <Icon name="checkmark-circle" size={14} colorClassName="accent-primary" />
            <AppText variant="micro" tone="white" className="font-semibold">
              Perfil verificado
            </AppText>
          </View>
        ) : null}

        <Animated.View
          className="absolute left-6 top-14 z-10 -rotate-[14deg] rounded-lg border-[3px] border-like px-2 py-1"
          style={likeStyle}>
          <AppText tone="none" className="text-[28px] leading-8 font-extrabold text-like">
            CURTIR
          </AppText>
        </Animated.View>
        <Animated.View
          className="absolute right-6 top-14 z-10 rotate-[14deg] rounded-lg border-[3px] border-pass px-2 py-1"
          style={passStyle}>
          <AppText tone="none" className="text-[28px] leading-8 font-extrabold text-pass">
            PASSAR
          </AppText>
        </Animated.View>

        <BottomShade className="absolute inset-x-0 bottom-0 gap-1.5 p-5 pt-20">
          <AppText tone="white" className="text-[26px] leading-8 font-extrabold">
            {name}
            {age !== null ? `, ${age}` : ''}
          </AppText>
          {profile.profession?.[0] ? <InfoLine icon="briefcase-outline" text={profile.profession[0]} /> : null}
          {distance ? <InfoLine icon="location-outline" text={`a ${distance} de você`} /> : null}

          <View className="mt-3 flex-row items-center justify-center gap-5">
            <RoundAction icon="close" label="Passar" onPress={() => flyAway('pass')} />
            <RoundAction icon="heart" label="Curtir" primary onPress={() => flyAway('like')} />
          </View>
        </BottomShade>
      </Animated.View>
    </GestureDetector>
  );
}

function InfoLine({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Icon name={icon} size={15} colorClassName="accent-white" />
      <AppText variant="caption" tone="white-soft" numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

function RoundAction({
  icon,
  label,
  primary = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'items-center justify-center rounded-full shadow-md active:scale-95 active:opacity-80',
        primary ? 'size-16 bg-primary' : 'size-[52px] bg-white',
      )}>
      <Icon name={icon} size={primary ? 30 : 26} colorClassName={primary ? 'accent-white' : 'accent-pass'} />
    </Pressable>
  );
}
