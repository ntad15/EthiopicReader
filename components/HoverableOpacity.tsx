import React from 'react';
import { Pressable, PressableProps, Platform, StyleProp, ViewStyle } from 'react-native';

interface HoverableOpacityProps extends Omit<PressableProps, 'style'> {
  /** Base style (same as TouchableOpacity) */
  style?: StyleProp<ViewStyle>;
  /** Additional style applied on hover — web only */
  hoverStyle?: StyleProp<ViewStyle>;
  /** Opacity when pressed (default 0.7, matches TouchableOpacity) */
  activeOpacity?: number;
}

/**
 * Drop-in replacement for TouchableOpacity that adds:
 *  - cursor: pointer on web
 *  - configurable hover style on web
 *  - press opacity feedback on all platforms
 */
export default function HoverableOpacity({
  style,
  hoverStyle,
  activeOpacity = 0.7,
  children,
  ...props
}: HoverableOpacityProps) {
  return (
    <Pressable
      {...props}
      style={(state) => [
        style,
        Platform.OS === 'web' && ({ cursor: 'pointer' } as ViewStyle),
        state.pressed && { opacity: activeOpacity },
        Platform.OS === 'web' && state.hovered && hoverStyle,
      ]}
    >
      {children}
    </Pressable>
  );
}
