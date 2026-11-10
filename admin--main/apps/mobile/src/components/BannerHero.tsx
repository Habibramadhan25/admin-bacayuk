import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { useCurations, MobilePromoBanner } from '../services/curationStorage';

interface BannerHeroProps {
  onExplorePress?: (category?: string) => void;
  onSelectBookById?: (bookId: string) => void;
}

export const BannerHero: React.FC<BannerHeroProps> = ({ 
  onExplorePress,
  onSelectBookById 
}) => {
  const { colors, isDark } = useAppTheme();
  const { banners } = useCurations();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto rotate banner every 5 seconds if multiple banners exist
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const currentBanner: MobilePromoBanner = banners[currentIndex] || {
    id: 'default',
    title: 'Temukan Buku Favoritmu',
    subtitle: 'Baca kapan saja, di mana saja. Perluas wawasan, hidup lebih bermakna.',
    buttonText: 'Jelajahi Koleksi',
    targetType: 'explore',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    status: 'Active',
    order: 1
  };

  const handleAction = () => {
    if (currentBanner.targetType === 'book' && currentBanner.targetValue && onSelectBookById) {
      onSelectBookById(currentBanner.targetValue);
    } else if (currentBanner.targetType === 'category' && currentBanner.targetValue && onExplorePress) {
      onExplorePress(currentBanner.targetValue);
    } else if (onExplorePress) {
      onExplorePress();
    }
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? colors.surfaceContainerHigh
              : (currentBanner.bgColor ? currentBanner.bgColor : colors.secondaryContainer),
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.textColumn}>
          {currentBanner.badge ? (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{currentBanner.badge}</Text>
            </View>
          ) : null}

          <Text
            style={[
              styles.title,
              {
                color: currentBanner.bgColor ? '#ffffff' : colors.primary,
              },
            ]}
            numberOfLines={2}
          >
            {currentBanner.title}
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: currentBanner.bgColor 
                  ? '#e2e8f0' 
                  : (isDark ? colors.onSurfaceVariant : colors.onSecondaryContainer),
              },
            ]}
            numberOfLines={2}
          >
            {currentBanner.subtitle}
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleAction}
            style={[
              styles.button,
              {
                backgroundColor: currentBanner.bgColor ? '#ffffff' : colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: currentBanner.bgColor ? '#2a160b' : colors.onPrimary,
                },
              ]}
            >
              {currentBanner.buttonText || 'Jelajahi Koleksi'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Book Cover Illustration */}
        <View style={styles.imageColumn}>
          <Image
            source={{
              uri: currentBanner.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
            }}
            style={styles.heroBookCover}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.dotsRow}>
          {banners.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setCurrentIndex(idx)}
              style={[
                styles.dot,
                idx === currentIndex
                  ? [styles.activeDot, { backgroundColor: colors.primary }]
                  : { backgroundColor: colors.outlineVariant },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 180,
  },
  textColumn: {
    flex: 1,
    maxWidth: 500,
    zIndex: 2,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#8a6d1c',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    fontWeight: '700',
  },
  imageColumn: {
    marginLeft: 14,
    zIndex: 1,
  },
  heroBookCover: {
    width: 88,
    height: 126,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  activeDot: {
    width: 22,
    height: 7,
    borderRadius: 4,
  },
});
