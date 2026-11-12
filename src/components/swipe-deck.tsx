import { forwardRef, useImperativeHandle } from 'react';
import { View, useWindowDimensions } from 'react-native';
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
import { AppText, Image } from '@/components/ui';
import { ageFrom, firstName, formatDistance, mainPhoto } from '@/lib/profile';

export type SwipeDirection = 'like' | 'pass';

export interface SwipeCardHandle {
  swipe: (direction: SwipeDirection) => void;
}

interface SwipeCardProps {
  profile: FeedProfile;
  onSwiped: (profile: FeedProfile, direction: SwipeDirection) => void;
}

// Quanto o card precisa andar (fração da largura) para contar como like/pass
const SWIPE_THRESHOLD = 0.28;
const VELOCITY_THRESHOLD = 800;

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { profile, onSwiped },
  ref,
) {
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

  // Botões de like/pass também animam o card
  useImperativeHandle(ref, () => ({ swipe: direction => flyAway(direction) }));

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

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        accessibilityLabel={`Perfil de ${firstName(profile.fullName)}`}
        className="absolute inset-0 overflow-hidden rounded-3xl bg-surface shadow-lg"
        style={cardStyle}>
        {photo ? (
          <Image source={{ uri: photo }} className="absolute inset-0" contentFit="cover" transition={200} />
        ) : (
          <View className="absolute inset-0 items-center justify-center bg-primary">
            <AppText tone="none" className="text-[120px] leading-[140px] font-extrabold text-white/85">
              {firstName(profile.fullName).charAt(0)}
            </AppText>
          </View>
        )}

        <Animated.View
          className="absolute left-6 top-8 z-10 -rotate-[14deg] rounded-lg border-[3px] border-like px-2 py-1"
          style={likeStyle}>
          <AppText tone="none" className="text-[28px] leading-8 font-extrabold text-like">
            CURTIR
          </AppText>
        </Animated.View>
        <Animated.View
          className="absolute right-6 top-8 z-10 rotate-[14deg] rounded-lg border-[3px] border-pass px-2 py-1"
          style={passStyle}>
          <AppText tone="none" className="text-[28px] leading-8 font-extrabold text-pass">
            PASSAR
          </AppText>
        </Animated.View>

        <BottomShade className="absolute inset-x-0 bottom-0 gap-1 p-6 pt-16">
          <AppText variant="title" tone="white">
            {firstName(profile.fullName)}
            {age !== null ? `, ${age}` : ''}
          </AppText>
          <AppText tone="white-soft">
            {[profile.profession?.[0], formatDistance(profile.distance)].filter(Boolean).join(' · ')}
          </AppText>
          {profile.description?.[0] ? (
            <AppText numberOfLines={2} tone="white-soft">
              {profile.description[0]}
            </AppText>
          ) : null}
          {profile.interests?.length ? (
            <View className="mt-2 flex-row flex-wrap gap-1">
              {profile.interests.slice(0, 4).map(interest => (
                <View key={interest} className="rounded-full bg-white/20 px-2 py-0.5">
                  <AppText variant="caption" tone="white">
                    {interest}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </BottomShade>
      </Animated.View>
    </GestureDetector>
  );
});
