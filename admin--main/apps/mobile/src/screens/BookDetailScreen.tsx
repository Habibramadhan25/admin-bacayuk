import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { BookItem } from '../data/mockData';
import { MaterialIcon } from '../components/MaterialIcon';
import { MobileTopBar } from '../components/MobileTopBar';
import { useResponsive } from '../hooks/useResponsive';
import { useBookReviews, MobileReviewStorage } from '../services/reviewStorage';
import { UserStorage } from '../services/storage';

interface BookDetailScreenProps {
  book: BookItem;
  onBack: () => void;
  onStartReading: (book: BookItem) => void;
  onToggleFavorite: (book: BookItem) => void;
  isFavorite?: boolean;
}

export const BookDetailScreen: React.FC<BookDetailScreenProps> = ({
  book,
  onBack,
  onStartReading,
  onToggleFavorite,
  isFavorite = false,
}) => {
  const { colors, isDark } = useAppTheme();
  const { isDesktop, isMobile } = useResponsive();

  const { reviews } = useBookReviews(book.id);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [userName, setUserName] = useState('Rafli');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const currentUser = UserStorage.getActiveSessionUser();
  const [borrowLoan, setBorrowLoan] = useState<any | null>(() => {
    if (!currentUser) return null;
    const loans = UserStorage.getActiveLoans(currentUser.id);
    return loans.find((l: any) => l.bookId === book.id && l.status === 'Dipinjam') || null;
  });
  const [borrowMsg, setBorrowMsg] = useState<string | null>(null);

  const handleBorrow = () => {
    if (!currentUser) return;
    const res = UserStorage.borrowBook(currentUser.id, {
      id: book.id,
      title: book.title,
      coverUrl: book.coverUrl,
      author: book.author,
    });
    setBorrowMsg(res.message);
    if (res.loan) {
      setBorrowLoan(res.loan);
    }
    setTimeout(() => setBorrowMsg(null), 5000);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onBack();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [onBack]);

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Mobile Top Bar */}
      {isMobile ? (
        <MobileTopBar
          title={book.title}
          showBack={true}
          onBack={onBack}
        />
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop ? styles.scrollContentDesktop : null,
        ]}
      >
        <View style={styles.container}>
          {/* Breadcrumb Navigation (Desktop) */}
          {isDesktop ? (
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity
                onPress={onBack}
                style={styles.breadcrumbLink}
                activeOpacity={0.7}
              >
                <MaterialIcon
                  name="arrow_back"
                  size={18}
                  color={colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.breadcrumbText,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  Koleksi Buku
                </Text>
              </TouchableOpacity>
              <MaterialIcon
                name="chevron_right"
                size={18}
                color={colors.outline}
              />
              <Text
                style={[
                  styles.breadcrumbCurrent,
                  { color: colors.onSurface },
                ]}
              >
                Detail Buku
              </Text>
            </View>
          ) : null}

          {/* Main Book Detail Canvas */}
          <View
            style={[
              styles.detailCanvas,
              isDesktop ? styles.detailCanvasDesktop : null,
            ]}
          >
            {/* Left Column: Cover & Actions */}
            <View
              style={[
                styles.leftColumn,
                isDesktop ? styles.leftColumnDesktop : null,
              ]}
            >
              <View
                style={[
                  styles.coverWrapper,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant,
                  },
                ]}
              >
                <Image
                  source={{ uri: book.coverUrl }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsCol}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onStartReading(book)}
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <MaterialIcon
                    name="menu_book"
                    size={20}
                    color={colors.onPrimary}
                    filled={true}
                  />
                  <Text
                    style={[
                      styles.primaryBtnText,
                      { color: colors.onPrimary },
                    ]}
                  >
                    Mulai Membaca
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleBorrow}
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: borrowLoan ? '#ecfdf5' : isDark ? colors.surfaceContainerHigh : '#fff8ed',
                      borderColor: borrowLoan ? '#10b981' : '#d4c3a3',
                    },
                  ]}
                >
                  <MaterialIcon
                    name={borrowLoan ? 'verified' : 'assignment'}
                    size={20}
                    color={borrowLoan ? '#059669' : '#8a6d1c'}
                  />
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: borrowLoan ? '#059669' : '#3a2012', fontWeight: '700' },
                    ]}
                  >
                    {borrowLoan ? `Dipinjam (Jatuh Tempo: ${borrowLoan.dueDate})` : 'Pinjam Buku Ini (Sirkulasi)'}
                  </Text>
                </TouchableOpacity>

                {borrowMsg && (
                  <View style={{ backgroundColor: '#fef3c7', padding: 10, borderRadius: 10, marginTop: 4, borderWidth: 1, borderColor: '#fde68a' }}>
                    <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '700', textAlign: 'center' }}>{borrowMsg}</Text>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => onToggleFavorite(book)}
                  style={[
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark
                        ? colors.surfaceContainerHigh
                        : colors.surfaceContainerLowest,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <MaterialIcon
                    name={isFavorite ? 'favorite' : 'favorite_border'}
                    size={20}
                    color={isFavorite ? colors.error : colors.secondary}
                    filled={isFavorite}
                  />
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: isFavorite ? colors.error : colors.onSurface },
                    ]}
                  >
                    {isFavorite ? 'Tersimpan di Favorit' : 'Tambah ke Favorit'}
                  </Text>
                </TouchableOpacity>

                {book.fileUrl ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (typeof window !== 'undefined') {
                        window.open(book.fileUrl, '_blank');
                      }
                    }}
                    style={[
                      styles.linkActionBtn,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceContainerHigh
                          : colors.surfaceContainer,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <MaterialIcon
                      name="open_in_new"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.linkActionBtnText,
                        { color: colors.primary },
                      ]}
                    >
                      Buka Tautan Naskah
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {book.sourceUrl ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (typeof window !== 'undefined') {
                        window.open(book.sourceUrl, '_blank');
                      }
                    }}
                    style={[
                      styles.linkActionBtn,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceContainerHigh
                          : colors.surfaceContainer,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <MaterialIcon
                      name="language"
                      size={18}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.linkActionBtnText,
                        { color: colors.primary },
                      ]}
                      numberOfLines={1}
                    >
                      Sumber: {book.sourceName || 'Kunjungi Web Asal'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Right Column: Title, Rating, Metadata, Synopsis */}
            <View style={styles.rightColumn}>
              <View style={styles.titleSection}>
                <Text
                  style={[
                    styles.bookTitle,
                    isDesktop ? styles.bookTitleDesktop : null,
                    { color: colors.onSurface },
                  ]}
                >
                  {book.title}
                </Text>
                <Text
                  style={[
                    styles.bookAuthor,
                    { color: colors.secondary },
                  ]}
                >
                  {book.author}
                </Text>

                {/* Rating Row */}
                <View style={styles.ratingRow}>
                  <Text
                    style={[
                      styles.ratingScore,
                      { color: colors.onSurface },
                    ]}
                  >
                    {book.rating.toFixed(1)}
                  </Text>
                  <View style={styles.starsRow}>
                    <MaterialIcon name="star" size={18} color={colors.star} filled={true} />
                    <MaterialIcon name="star" size={18} color={colors.star} filled={true} />
                    <MaterialIcon name="star" size={18} color={colors.star} filled={true} />
                    <MaterialIcon name="star" size={18} color={colors.star} filled={true} />
                    <MaterialIcon name="star_half" size={18} color={colors.star} filled={true} />
                  </View>
                  <Text
                    style={[
                      styles.reviewsCountText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    ({book.reviewsCount || 1256} ulasan)
                  </Text>
                </View>
              </View>

              {/* 4-cell Metadata Grid */}
              <View style={styles.metadataGrid}>
                <View
                  style={[
                    styles.metaCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>
                    Kategori
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>
                    {book.category}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metaCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>
                    Bahasa
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>
                    {book.language}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metaCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>
                    Jumlah Halaman
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>
                    {book.totalPages}
                  </Text>
                </View>

                <View
                  style={[
                    styles.metaCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <Text style={[styles.metaLabel, { color: colors.onSurfaceVariant }]}>
                    Tahun Terbit
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.onSurface }]}>
                    {book.publishedYear || 2017}
                  </Text>
                </View>
              </View>

              {/* Synopsis / Description */}
              <View style={styles.synopsisSection}>
                <Text
                  style={[
                    styles.synopsisHeading,
                    { color: colors.onSurface },
                  ]}
                >
                  Deskripsi
                </Text>
                <Text
                  style={[
                    styles.synopsisBody,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {book.synopsis}
                </Text>
              </View>

              {/* Sumber Asal Naskah */}
              {(book.sourceName || book.sourceUrl) ? (
                <View
                  style={[
                    styles.sourceCard,
                    {
                      backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.sourceContent}>
                    <MaterialIcon name="language" size={22} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.sourceLabel, { color: colors.onSurfaceVariant }]}>
                        Sumber / Hak Cipta Asal Naskah
                      </Text>
                      <Text style={[styles.sourceTitle, { color: colors.onSurface }]}>
                        {book.sourceName || 'Tautan Sumber Daring'}
                      </Text>
                    </View>
                  </View>
                  {book.sourceUrl ? (
                    <TouchableOpacity
                      onPress={() => {
                        if (typeof window !== 'undefined') window.open(book.sourceUrl, '_blank');
                      }}
                      style={[
                        styles.sourceVisitBtn,
                        {
                          backgroundColor: colors.primary,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.sourceVisitBtnText, { color: colors.onPrimary }]}>
                        Kunjungi Sumber
                      </Text>
                      <MaterialIcon name="open_in_new" size={14} color={colors.onPrimary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {/* Ulasan & Rating Pembaca */}
              <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeaderRow}>
                  <div>
                    <Text
                      style={[
                        styles.synopsisHeading,
                        { color: colors.onSurface, marginBottom: 4 },
                      ]}
                    >
                      Ulasan Pembaca
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.onSurfaceVariant }}>
                      Pendapat dan review dari komunitas pembaca BacaYuk
                    </Text>
                  </div>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowReviewModal((prev) => !prev);
                      setSubmitSuccess(false);
                    }}
                    style={[
                      styles.reviewAddBtn,
                      {
                        backgroundColor: showReviewModal
                          ? colors.surfaceContainerHigh
                          : colors.primary,
                      },
                    ]}
                  >
                    <MaterialIcon
                      name={showReviewModal ? 'close' : 'rate_review'}
                      size={18}
                      color={showReviewModal ? colors.onSurface : colors.onPrimary}
                    />
                    <Text
                      style={[
                        styles.reviewAddBtnText,
                        {
                          color: showReviewModal
                            ? colors.onSurface
                            : colors.onPrimary,
                        },
                      ]}
                    >
                      {showReviewModal ? 'Batal' : 'Tulis Ulasan'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Rating Summary Card */}
                <View
                  style={[
                    styles.reviewSummaryCard,
                    {
                      backgroundColor: colors.surfaceContainer,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.reviewSummaryLeft}>
                    <Text
                      style={[
                        styles.reviewRatingScore,
                        { color: colors.onSurface },
                      ]}
                    >
                      {book.rating.toFixed(1)}
                    </Text>
                    <View style={styles.reviewStarsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialIcon
                          key={s}
                          name={s <= Math.round(book.rating) ? 'star' : 'star_border'}
                          size={20}
                          color={colors.star}
                          filled={s <= Math.round(book.rating)}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.reviewSummaryText,
                        { color: colors.onSurfaceVariant },
                      ]}
                    >
                      {reviews.length} ulasan terdaftar
                    </Text>
                  </View>
                </View>

                {/* Form Tulis Ulasan */}
                {showReviewModal ? (
                  <View
                    style={[
                      styles.reviewFormCard,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceContainerHigh
                          : colors.surfaceContainerLowest,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.reviewFormTitle,
                        { color: colors.onSurface },
                      ]}
                    >
                      Bagikan Pengalaman Membacamu
                    </Text>

                    {/* Star Rating Picker */}
                    <View style={{ marginBottom: 14 }}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Beri Rating: {userRating} dari 5 Bintang
                      </Text>
                      <View style={styles.starPickerRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            activeOpacity={0.7}
                            onPress={() => setUserRating(star)}
                            style={styles.starBtn}
                          >
                            <MaterialIcon
                              name="star"
                              size={28}
                              color={star <= userRating ? colors.star : colors.outlineVariant}
                              filled={star <= userRating}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Name Input */}
                    <View style={{ marginBottom: 14 }}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Nama Pengulas
                      </Text>
                      <TextInput
                        value={userName}
                        onChangeText={setUserName}
                        placeholder="Nama kamu..."
                        placeholderTextColor={colors.onSurfaceVariant}
                        style={[
                          styles.inputField,
                          {
                            color: colors.onSurface,
                            backgroundColor: colors.surfaceContainer,
                            borderColor: colors.outlineVariant,
                          },
                        ]}
                      />
                    </View>

                    {/* Comment Input */}
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Ulasan Buku
                      </Text>
                      <TextInput
                        value={userComment}
                        onChangeText={setUserComment}
                        placeholder="Ceritakan apa yang kamu sukai atau pelajari dari buku ini..."
                        placeholderTextColor={colors.onSurfaceVariant}
                        multiline={true}
                        numberOfLines={4}
                        style={[
                          styles.textareaField,
                          {
                            color: colors.onSurface,
                            backgroundColor: colors.surfaceContainer,
                            borderColor: colors.outlineVariant,
                          },
                        ]}
                      />
                    </View>

                    {reviewError ? (
                      <View style={[styles.successBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                        <MaterialIcon name="error_outline" size={18} color="#dc2626" />
                        <Text style={[styles.successBannerText, { color: '#991b1b' }]}>
                          {reviewError}
                        </Text>
                      </View>
                    ) : null}

                    {submitSuccess ? (
                      <View style={styles.successBanner}>
                        <MaterialIcon name="check_circle" size={18} color="#16a34a" />
                        <Text style={styles.successBannerText}>
                          Terima kasih! Ulasanmu berhasil dikirimkan.
                        </Text>
                      </View>
                    ) : null}

                    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setShowReviewModal(false);
                          setReviewError(null);
                        }}
                        style={[
                          styles.cancelReviewBtn,
                          { borderColor: colors.outlineVariant },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cancelReviewBtnText,
                            { color: colors.onSurfaceVariant },
                          ]}
                        >
                          Tutup
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          if (!userComment.trim()) {
                            setReviewError('Silakan tulis ulasan atau komentar terlebih dahulu.');
                            return;
                          }
                          setReviewError(null);
                          MobileReviewStorage.addReview({
                            bookId: book.id,
                            userName: userName.trim() || 'Pembaca BacaYuk',
                            rating: userRating,
                            comment: userComment.trim(),
                          });
                          setUserComment('');
                          setSubmitSuccess(true);
                          setTimeout(() => {
                            setSubmitSuccess(false);
                            setShowReviewModal(false);
                          }, 1200);
                        }}
                        style={[
                          styles.submitReviewBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <MaterialIcon name="send" size={16} color={colors.onPrimary} />
                        <Text
                          style={[
                            styles.submitReviewBtnText,
                            { color: colors.onPrimary },
                          ]}
                        >
                          Kirim Ulasan
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* List of Reviews */}
                <View style={styles.reviewList}>
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <View
                        key={rev.id}
                        style={[
                          styles.reviewItemCard,
                          {
                            backgroundColor: colors.surfaceContainer,
                            borderColor: colors.outlineVariant,
                          },
                        ]}
                      >
                        <View style={styles.reviewUserRow}>
                          {rev.userAvatar ? (
                            <Image
                              source={{ uri: rev.userAvatar }}
                              style={styles.reviewAvatar}
                            />
                          ) : (
                            <View
                              style={[
                                styles.reviewAvatarFallback,
                                { backgroundColor: colors.primaryContainer },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.reviewAvatarText,
                                  { color: colors.onPrimaryContainer },
                                ]}
                              >
                                {rev.userName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}

                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text
                                style={[
                                  styles.reviewUserName,
                                  { color: colors.onSurface },
                                ]}
                              >
                                {rev.userName}
                              </Text>
                              <View style={styles.reviewVerifiedBadge}>
                                <MaterialIcon name="verified" size={14} color="#16a34a" />
                                <Text style={styles.reviewVerifiedText}>Pembaca</Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <View style={{ flexDirection: 'row', gap: 1 }}>
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <MaterialIcon
                                    key={s}
                                    name={s <= rev.rating ? 'star' : 'star_border'}
                                    size={14}
                                    color={colors.star}
                                    filled={s <= rev.rating}
                                  />
                                ))}
                              </View>
                              <Text
                                style={[
                                  styles.reviewDateText,
                                  { color: colors.onSurfaceVariant },
                                ]}
                              >
                                • {new Date(rev.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.reviewCommentText,
                            { color: colors.onSurface },
                          ]}
                        >
                          {rev.comment}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View
                      style={[
                        styles.emptyReviewBox,
                        {
                          backgroundColor: colors.surfaceContainer,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <MaterialIcon
                        name="forum"
                        size={32}
                        color={colors.outline}
                      />
                      <Text
                        style={[
                          styles.emptyReviewTitle,
                          { color: colors.onSurface },
                        ]}
                      >
                        Belum ada ulasan untuk buku ini
                      </Text>
                      <Text
                        style={[
                          styles.emptyReviewSub,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Jadilah yang pertama membagikan pendapatmu tentang buku ini!
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  scrollContentDesktop: {
    paddingBottom: 40,
  },
  container: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  breadcrumbLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '500',
  },
  breadcrumbCurrent: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '700',
  },
  detailCanvas: {
    flexDirection: 'column',
    gap: 24,
  },
  detailCanvasDesktop: {
    flexDirection: 'row',
    gap: 48,
    alignItems: 'flex-start',
  },
  leftColumn: {
    width: '100%',
  },
  leftColumnDesktop: {
    width: 340,
    flexShrink: 0,
  },
  coverWrapper: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  actionButtonsCol: {
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '600',
  },
  rightColumn: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 28,
  },
  bookTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    marginBottom: 6,
  },
  bookTitleDesktop: {
    fontSize: 44,
    lineHeight: 52,
  },
  bookAuthor: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 14,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingScore: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 18,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewsCountText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
  },
  metadataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  metaCard: {
    flex: 1,
    minWidth: '45%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaLabel: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    marginBottom: 4,
  },
  metaValue: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '700',
  },
  synopsisSection: {
    marginBottom: 20,
  },
  synopsisHeading: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  synopsisBody: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 16,
    lineHeight: 26,
  },
  linkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkActionBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '700',
  },
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  sourceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
  },
  sourceLabel: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 11,
    fontWeight: '600',
  },
  sourceTitle: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  sourceVisitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sourceVisitBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewsSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  reviewAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  reviewAddBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewSummaryCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  reviewSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  reviewRatingScore: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 32,
    fontWeight: '800',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewSummaryText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '500',
  },
  reviewFormCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  reviewFormTitle: {
    fontFamily: 'Literata, Georgia, serif' as any,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  starPickerRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  starBtn: {
    padding: 2,
  },
  inputField: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  textareaField: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    marginBottom: 14,
  },
  successBannerText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    color: '#15803d',
    fontWeight: '600',
  },
  cancelReviewBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelReviewBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '600',
  },
  submitReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitReviewBtnText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewList: {
    gap: 14,
  },
  reviewItemCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewUserName: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    fontWeight: '700',
  },
  reviewVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewVerifiedText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '600',
  },
  reviewDateText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 11,
  },
  reviewCommentText: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyReviewBox: {
    padding: 36,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyReviewTitle: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyReviewSub: {
    fontFamily: 'Manrope, sans-serif' as any,
    fontSize: 13,
    textAlign: 'center',
  },
});
