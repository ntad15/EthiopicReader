import { Tabs, usePathname, router } from 'expo-router';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';

const DESKTOP_BREAKPOINT = 768;

/* ── Tab definitions ── */
const TAB_ITEMS: {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: 'index', title: 'Home', icon: 'home', iconOutline: 'home-outline' },
  { name: 'settings', title: 'Settings', icon: 'settings', iconOutline: 'settings-outline' },
];

/* ── Sidebar nav items (desktop) ── */
const SIDEBAR_ITEMS: {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  isStack?: boolean;
}[] = [
  { title: 'Home', icon: 'home-outline', route: '/' },
  { title: 'Settings', icon: 'settings-outline', route: '/settings' },
];

/* ── Mobile Bottom Tab Bar ── */
function MobileTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[tabBarStyles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TAB_ITEMS.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        if (routeIndex === -1) return null;
        const isFocused = state.index === routeIndex;

        return (
          <TouchableOpacity
            key={tab.name}
            style={tabBarStyles.tab}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
          >
            {isFocused && <View style={tabBarStyles.indicator} />}
            <Ionicons
              name={isFocused ? tab.icon : tab.iconOutline}
              size={24}
              color={isFocused ? Colors.burgundy : Colors.textDim}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ── Layout ── */
export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const pathname = usePathname();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* ── Desktop sidebar ── */}
        {isDesktop && (
          <View style={deskStyles.sidebar}>
            {SIDEBAR_ITEMS.map((item, idx) => {
              const isActive =
                (item.route === '/' && (pathname === '/' || pathname === '')) ||
                (item.route !== '/' && pathname === item.route);

              return (
                <HoverableOpacity
                  key={idx}
                  style={[deskStyles.sideItem, isActive && deskStyles.sideItemActive]}
                  hoverStyle={!isActive ? deskStyles.sideItemHover : undefined}
                  onPress={() => {
                    if (item.isStack) {
                      router.push(item.route as any);
                    } else {
                      router.navigate(item.route as any);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isActive ? Colors.burgundy : Colors.textMuted}
                  />
                  <View style={deskStyles.sideTextWrap}>
                    <Text
                      style={[deskStyles.sideTitle, isActive && deskStyles.sideTitleActive]}
                    >
                      {item.title}
                    </Text>
                    {item.subtitle && (
                      <Text style={deskStyles.sideSub}>{item.subtitle}</Text>
                    )}
                  </View>
                </HoverableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Tab screens ── */}
        <View style={{ flex: 1 }}>
          <Tabs
            tabBar={(props: any) =>
              isDesktop ? null : <MobileTabBar {...props} />
            }
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: Colors.background },
            }}
          >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="bookmarks" options={{ href: null }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
          </Tabs>
        </View>
      </View>
    </View>
  );
}

/* ── Mobile tab bar styles ── */
const tabBarStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
});

/* ── Desktop styles ── */
const deskStyles = StyleSheet.create({
  /* Sidebar */
  sidebar: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.borderSubtle,
    paddingHorizontal: 12,
    paddingTop: 20,
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2,
    gap: 12,
  },
  sideItemActive: {
    backgroundColor: Colors.burgundyDim,
  },
  sideItemHover: {
    backgroundColor: Colors.accentDim,
  },
  sideTextWrap: {
    flex: 1,
  },
  sideTitle: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.textMuted,
  },
  sideTitleActive: {
    color: Colors.burgundy,
  },
  sideSub: {
    fontFamily: Fonts.bodyRegular,
    fontSize: 11,
    color: Colors.textDim,
    marginTop: 1,
  },
});
