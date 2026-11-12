import { type ComponentProps } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { withUniwind } from 'uniwind';

const StyledLinearGradient = withUniwind(LinearGradient);

// Gradiente escuro no rodapé do card: dá contraste ao texto sobre a foto
export function BottomShade(props: Omit<ComponentProps<typeof StyledLinearGradient>, 'colors' | 'locations'>) {
  return (
    <StyledLinearGradient
      colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.85)']}
      locations={[0, 0.35, 1]}
      {...props}
    />
  );
}
