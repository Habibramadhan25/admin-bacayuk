import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { BookItem } from '../data/mockData';
import { MaterialIcon } from './MaterialIcon';

interface BookCardProps {
  key?: any;
  book: BookItem;
  onPress: (book: BookItem) => void;
  onToggleFavorite?: (book: BookItem) => void;
  variant?: 'portrait' | 'horizontal-progress' | 'favorite-grid';
  showProgress?: boolean;
  style?: StyleProp<ViewStyle>;
  customWidth?: number | string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  onToggleFavorite,
  variant = 'portrait',
  showProgress = false,
  style,
  customWidth,
}) => {
  const { colors, isDark } = useAppTheme();

  // Horizontal Card with Progress (Riwayat / Sedang Dibaca)
  if (variant === 'horizontal-progress') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(book)}
        style={[
          styles.horizontalCard,
          {
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outlineVariant,
          },
          style,
        ]}
      >
        <View style={styles.horizontalCoverWrapper}>
          <Image
            source={{ uri: book.coverUrl }}
            style={styles.fullCover}
            resizeMode="cover"
          />
        </View>

        <View style={styles.horizontalContent}>
          <View style={styles.horizontalHeaderRow}>
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: colors.secondaryContainer,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,
                  { color: colors.onSecondaryContainer },
                ]}
              >
                {book.progressPercentage === 100
                  ? '100% Selesai'
                  : `${book.progressPercentage || 0}% Selesai`}
              </Text>
            </View>
            {Boolean(book.lastReadTime) ? (
              <Text style={[styles.lastReadText, { color: colors.outline }]}>
                {book.lastReadTime}
              </Text>
            ) : null}
          </View>

          <Text
            style={[styles.horizontalTitle, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {book.title}
          </Text>
          <Text
            style={[styles.horizontalAuthor, { color: colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {book.author}
          </Text>

          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${book.progressPercentage || 0}%`,
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Favorite Grid Card
  if (variant === 'favorite-grid') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onPress(book)}
        style={[
          styles.portraitCard,
          customWidth ? { width: customWidth as any } : null,
          style,
        ]}
      >
        <View
          style={[
            styles.coverWrapper,
            {
              backgroundColor: colors.surfaceContainerLow,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Image
            source={{ uri: book.coverUrl }}
            style={styles.fullCover}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={[
              styles.favBadge,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant,
              },
            ]}
            onPress={() => onToggleFavorite && onToggleFavorite(book)}
          >
            <MaterialIcon
              name="favorite"
              size={14}
              color={colors.error}
              filled={true}
            />
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.portraitTitle, { color: colors.onSurface }]}
          numberOfLines={1}
        >
          {book.title}
        </Text>
        <Text
          style={[styles.portraitAuthor, { color: colors.onSurfaceVariant }]}
          numberOfLines={1}
        >
          {book.author}
        </Text>
        <View
          style={[
            styles.tagBadge,
            {
              backgroundColor: colors.surfaceContainerHigh,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.tagBadgeText, { color: colors.secondary }]}>
            {book.category}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Default Portrait Card (Home, Collection)
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(book)}
      style={[
        styles.portraitCard,
        customWidth ? { width: customWidth as any } : null,
        style,
      ]}
    >
      <View
        style={[
          styles.coverWrapper,
          {
            backgroundColor: colors.surfaceContainerLow,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <Image
          source={{ uri: book.coverUrl }}
          style={styles.fullCover}
          resizeMode="cover"
        />

        {/* Top-Right Star Rating Pill */}
        <View
          style={[
            styles.ratingPill,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <MaterialIcon
            name="star"
            size={12}
            color={colors.star}
            filled={true}
          />
          <Text
            style={[styles.ratingScoreText, { color: colors.onSurface }]}
          >
            {book.rating.toFixed(1)}
          </Text>
        </View>
      </View>

      <Text
        style={[styles.portraitTitle, { color: colors.onSurface }]}
        numberOfLines={1}
      >
        {book.title}
      </Text>
      <Text
        style={[styles.portraitAuthor, { color: colors.onSurfaceVariant }]}
        numberOfLines={1}
      >
        {book.author}
      </Text>

      <View
        style={[
          styles.tagBadge,
          {
            backgroundColor: colors.surfaceContainerHigh,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <Text style={[styles.tagBadgeText, { color: colors.secondary }]}>
          {book.category}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  portraitCard: {
    marginBottom: 16,
    cursor: 'pointer' as any,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  fullCover: {
    width: '100%',
    height: '100%',
  },
  ratingPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },
  ratingScoreText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 11,
    fontWeight: '600',
  },
  favBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
  },
  portraitAuthor: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    marginBottom: 6,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagBadgeText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 11,
    fontWeight: '600',
  },

  // Horizontal Card (Riwayat / Sedang Dibaca)
  horizontalCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 14,
  },
  horizontalCoverWrapper: {
    width: 60,
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  horizontalContent: {
    flex: 1,
  },
  horizontalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  categoryBadgeText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 10,
    fontWeight: '700',
  },
  lastReadText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 11,
  },
  horizontalTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  horizontalAuthor: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    marginBottom: 8,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#e5e2dd',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
