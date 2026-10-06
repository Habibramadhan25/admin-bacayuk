import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { BookItem } from '../data/mockData';
import { MaterialIcon } from '../components/MaterialIcon';
import { useResponsive } from '../hooks/useResponsive';

interface ReaderScreenProps {
  book: BookItem;
  onBack: () => void;
}

type PaperColorKey = 'white' | 'sepia' | 'green' | 'dark';

export const ReaderScreen: React.FC<ReaderScreenProps> = ({ book, onBack }) => {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { isDesktop, isMobile } = useResponsive();

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState<number>(19);
  const [paperColor, setPaperColor] = useState<PaperColorKey>(
    isDark ? 'dark' : 'white'
  );
  const [showSettings, setShowSettings] = useState(false);

  const chapters = book.chapters || [
    {
      id: 'c1',
      title: `1. ${book.title}`,
      content:
        'Di sebuah desa kecil, cerita bermula dengan penuh makna dan harapan.\n\n' +
        book.synopsis +
        '\n\nMatahari pagi bersinar cerah menembus celah dedaunan. Angin sejuk berhembus perlahan, membawa aroma tanah basah dan bisikan lembaran buku yang siap dibaca.',
    },
    {
      id: 'c2',
      title: '2. Jejak Langkah',
      content:
        'Setiap perjalanan dimulai dengan langkah pertama yang berani. Di balik tantangan yang menghadang, tersimpan tekad kuat yang tak tergoyahkan.',
    },
    {
      id: 'c3',
      title: '3. Cakrawala Baru',
      content:
        'Dunia terbentang luas di hadapan mereka yang gemar membaca dan merenungi ilmu pengetahuan.',
    },
  ];

  const currentChapter = chapters[activeChapterIndex] || chapters[0];

  const paperBackgrounds: Record<PaperColorKey, string> = {
    white: isDark ? '#161311' : '#fcf9f4',
    sepia: '#f4ecd8',
    green: '#e8f4e9',
    dark: '#161311',
  };

  const paperTextColors: Record<PaperColorKey, string> = {
    white: isDark ? '#eae1dd' : '#1c1c19',
    sepia: '#433422',
    green: '#1f3d24',
    dark: '#eae1dd',
  };

  const currentBg = paperBackgrounds[paperColor];
  const currentText = paperTextColors[paperColor];

  const handlePrev = () => {
    if (activeChapterIndex > 0) {
      setActiveChapterIndex(activeChapterIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeChapterIndex < chapters.length - 1) {
      setActiveChapterIndex(activeChapterIndex + 1);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentBg }]}>
      {/* Mobile Top Bar */}
      {isMobile ? (
        <View
          style={[
            styles.mobileHeader,
            {
              backgroundColor: currentBg,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
        >
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <MaterialIcon
              name="arrow_back"
              size={22}
              color={currentText}
            />
          </TouchableOpacity>
          <Text
            style={[styles.mobileTitle, { color: currentText }]}
            numberOfLines={1}
          >
            {book.title}
          </Text>
          <TouchableOpacity
            onPress={() => setShowSettings(!showSettings)}
            style={styles.iconBtn}
          >
            <MaterialIcon
              name="tune"
              size={20}
              color={currentText}
            />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.bodyLayout}>
        {/* Desktop Sidebar: Table of Contents & Progress */}
        {isDesktop ? (
          <View
            style={[
              styles.tocSidebar,
              {
                backgroundColor: colors.surface,
                borderRightColor: colors.outlineVariant,
              },
            ]}
          >
            {/* Header / Back */}
            <View style={styles.tocHeader}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onBack}
                style={styles.backButtonRow}
              >
                <MaterialIcon
                  name="arrow_back"
                  size={20}
                  color={colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.backToLibraryText,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  Kembali ke Detail
                </Text>
              </TouchableOpacity>

              <Text
                style={[styles.sidebarBookTitle, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {book.title}
              </Text>
              <Text
                style={[
                  styles.sidebarAuthor,
                  { color: colors.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {book.author}
              </Text>

              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <Text
                  style={[
                    styles.progressLabel,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {book.progressPercentage || 25}% selesai
                </Text>
              </View>
              <View
                style={[
                  styles.progressTrack,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${book.progressPercentage || 25}%`,
                      backgroundColor: colors.primaryContainer,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Chapters List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.chaptersList}
            >
              <Text
                style={[
                  styles.tocHeading,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                Daftar Isi
              </Text>
              {chapters.map((ch, idx) => {
                const isActive = idx === activeChapterIndex;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    activeOpacity={0.75}
                    onPress={() => setActiveChapterIndex(idx)}
                    style={[
                      styles.tocItem,
                      isActive
                        ? {
                            backgroundColor: colors.primaryContainer,
                          }
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tocItemText,
                        {
                          color: isActive
                            ? colors.onPrimaryContainer
                            : colors.onSurfaceVariant,
                          fontWeight: isActive ? '700' : '400',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {ch.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Reader Canvas Area */}
        <View style={styles.readerCanvasArea}>
          {/* Top Control Bar on Desktop */}
          {isDesktop ? (
            <View
              style={[
                styles.desktopToolbar,
                {
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={[
                  styles.toolbarBookName,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {book.title} • Bab {activeChapterIndex + 1}
              </Text>

              <View style={styles.toolbarControls}>
                {/* Font Size decrease / increase */}
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => setFontSize(Math.max(15, fontSize - 2))}
                >
                  <Text style={[styles.toolBtnText, { color: currentText }]}>
                    A-
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={() => setFontSize(Math.min(26, fontSize + 2))}
                >
                  <Text style={[styles.toolBtnText, { color: currentText }]}>
                    A+
                  </Text>
                </TouchableOpacity>

                {/* Paper Theme Colors */}
                <TouchableOpacity
                  style={[
                    styles.paperColorCircle,
                    { backgroundColor: '#fcf9f4', borderColor: colors.outlineVariant },
                  ]}
                  onPress={() => setPaperColor('white')}
                />
                <TouchableOpacity
                  style={[
                    styles.paperColorCircle,
                    { backgroundColor: '#f4ecd8', borderColor: colors.outlineVariant },
                  ]}
                  onPress={() => setPaperColor('sepia')}
                />
                <TouchableOpacity
                  style={[
                    styles.paperColorCircle,
                    { backgroundColor: '#e8f4e9', borderColor: colors.outlineVariant },
                  ]}
                  onPress={() => setPaperColor('green')}
                />
                <TouchableOpacity
                  style={[
                    styles.paperColorCircle,
                    { backgroundColor: '#161311', borderColor: colors.outlineVariant },
                  ]}
                  onPress={() => setPaperColor('dark')}
                />

                {/* Dark / Light Toggle */}
                <TouchableOpacity
                  style={styles.toolBtn}
                  onPress={toggleTheme}
                >
                  <MaterialIcon
                    name={isDark ? 'light_mode' : 'dark_mode'}
                    size={18}
                    color={currentText}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Reading Article Text Canvas */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.articleScroll}
          >
            <View style={styles.articleWrapper}>
              <View style={styles.chapterHeader}>
                <Text
                  style={[
                    styles.chapterKicker,
                    { color: colors.secondary },
                  ]}
                >
                  BAB {activeChapterIndex + 1}
                </Text>
                <Text
                  style={[
                    styles.chapterTitle,
                    { color: currentText },
                  ]}
                >
                  {currentChapter.title.replace(/^\d+\.\s*/, '')}
                </Text>
              </View>

              <View style={styles.paragraphsCol}>
                {currentChapter.content.split('\n\n').map((p, pIdx) => (
                  <Text
                    key={pIdx}
                    style={[
                      styles.paragraphText,
                      {
                        fontSize,
                        lineHeight: fontSize * 1.7,
                        color: currentText,
                      },
                    ]}
                  >
                    {p}
                  </Text>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Reader Navigation */}
          <View
            style={[
              styles.readerBottomNav,
              {
                backgroundColor: currentBg,
                borderTopColor: colors.outlineVariant,
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePrev}
              disabled={activeChapterIndex === 0}
              style={[
                styles.navPageBtn,
                { opacity: activeChapterIndex === 0 ? 0.3 : 1 },
              ]}
            >
              <MaterialIcon
                name="arrow_back"
                size={18}
                color={currentText}
              />
              <Text style={[styles.navPageBtnText, { color: currentText }]}>
                Sebelumnya
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.pageCounterPill,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.pageCounterText,
                  { color: colors.onPrimary },
                ]}
              >
                Bab {activeChapterIndex + 1} / {chapters.length}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={activeChapterIndex === chapters.length - 1}
              style={[
                styles.navPageBtn,
                {
                  opacity:
                    activeChapterIndex === chapters.length - 1 ? 0.3 : 1,
                },
              ]}
            >
              <Text style={[styles.navPageBtnText, { color: currentText }]}>
                Berikutnya
              </Text>
              <MaterialIcon
                name="arrow_forward"
                size={18}
                color={currentText}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  mobileHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  mobileTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 16,
    fontWeight: '700',
    maxWidth: 200,
  },
  bodyLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  tocSidebar: {
    width: 290,
    borderRightWidth: 1,
    paddingTop: 24,
    paddingBottom: 24,
    flexShrink: 0,
  },
  tocHeader: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backToLibraryText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '600',
  },
  sidebarBookTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sidebarAuthor: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  chaptersList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  tocHeading: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  tocItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  tocItemText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
  },
  readerCanvasArea: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
  },
  desktopToolbar: {
    height: 54,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  toolbarBookName: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '500',
  },
  toolbarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toolBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '700',
  },
  paperColorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
  },
  articleScroll: {
    paddingBottom: 100,
    paddingTop: 36,
  },
  articleWrapper: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  chapterHeader: {
    alignItems: 'center',
    marginBottom: 36,
  },
  chapterKicker: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chapterTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 44,
  },
  paragraphsCol: {
    gap: 20,
  },
  paragraphText: {
    fontFamily: 'Literata, Georgia, serif' as any,
    letterSpacing: 0.1,
  },
  readerBottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  navPageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  navPageBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '600',
  },
  pageCounterPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  pageCounterText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    fontWeight: '700',
  },
});
