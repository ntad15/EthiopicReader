import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.sub}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{'\u2190'} Go Home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  code: {
    fontFamily: Fonts.serifExtraBold,
    color: Colors.borderSubtle,
    fontSize: 96,
    fontWeight: '900',
    letterSpacing: -4,
  },
  title: {
    fontFamily: Fonts.serifBold,
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sub: {
    fontFamily: Fonts.bodyRegular,
    color: Colors.textMuted,
    fontSize: 15,
    marginBottom: 32,
  },
  link: {
    borderWidth: 1,
    borderColor: Colors.burgundy,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  linkText: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.burgundy,
    fontWeight: '700',
    fontSize: 14,
  },
});
