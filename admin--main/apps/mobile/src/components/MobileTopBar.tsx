import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';
import { MaterialIcon } from './MaterialIcon';
import {
  useStudentNotifications,
  formatStudentRelativeTime,
} from '../services/notificationStorage';

interface MobileTopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  onOpenBookId?: (bookId: string) => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  title = 'BacaYuk',
  showBack = false,
  onBack,
  onSettingsPress,
  onNotificationsPress,
  onOpenBookId,
}) => {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const [showModal, setShowModal] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useStudentNotifications();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.outlineVariant,
        },
      ]}
    >
      {showBack && onBack ? (
        <TouchableOpacity
          onPress={onBack}
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}
          activeOpacity={0.7}
        >
          <MaterialIcon
            name="arrow_back"
            size={22}
            color={colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.brandGroup}>
          <Image
            source={require('../assets/logo.png')}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </View>
      )}

      <Text
        style={[
          styles.title,
          {
            color: colors.primary,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.rightActions}>
        {/* Tombol Notifikasi */}
        <TouchableOpacity
          onPress={() => {
            if (onNotificationsPress) {
              onNotificationsPress();
            } else {
              setShowModal(!showModal);
            }
          }}
          style={[
            styles.actionBtn,
            {
              backgroundColor: showModal
                ? colors.surfaceContainerHighest
                : colors.surfaceContainer,
              position: 'relative',
            },
          ]}
          activeOpacity={0.7}
        >
          <MaterialIcon
            name="notifications"
            size={20}
            color={showModal ? colors.primary : colors.onSurfaceVariant}
          />
          {unreadCount > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#dc2626',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 3,
                borderWidth: 1,
                borderColor: colors.surface,
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 9,
                  fontWeight: '800',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainer }]}
          activeOpacity={0.7}
        >
          <MaterialIcon
            name={isDark ? 'dark_mode' : 'light_mode'}
            size={20}
            color={colors.primary}
            filled={true}
          />
        </TouchableOpacity>
      </View>

      {/* Modal / Popover Notifikasi Mobile */}
      {showModal ? (
        <View
          style={{
            position: 'absolute',
            top: 60,
            left: 8,
            right: 8,
            backgroundColor: colors.surfaceContainerLowest,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 10,
            zIndex: 100,
            maxHeight: 400,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.outlineVariant,
              backgroundColor: colors.surfaceContainerLow,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: colors.onSurface,
                }}
              >
                Notifikasi
              </Text>
              {unreadCount > 0 ? (
                <View
                  style={{
                    backgroundColor: '#fee2e2',
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                  }}
                >
                  <Text
                    style={{
                      color: '#991b1b',
                      fontSize: 10,
                      fontWeight: '700',
                    }}
                  >
                    {unreadCount} Baru
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {unreadCount > 0 ? (
                <TouchableOpacity onPress={markAllAsRead}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: colors.primary,
                    }}
                  >
                    Tandai dibaca
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: colors.onSurfaceVariant,
                  }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ maxHeight: 300, overflow: 'scroll' as any }}>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    markAsRead(n.id);
                    setShowModal(false);
                    if (n.targetId && onOpenBookId) {
                      onOpenBookId(n.targetId);
                    }
                  }}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.outlineVariant,
                    backgroundColor: !n.read
                      ? isDark
                        ? 'rgba(255,255,255,0.05)'
                        : '#faf5ec'
                      : 'transparent',
                    flexDirection: 'row',
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.surfaceContainer,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcon
                      name="menu_book"
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: colors.onSurface,
                      }}
                      numberOfLines={1}
                    >
                      {n.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: colors.onSurfaceVariant,
                        marginTop: 2,
                      }}
                      numberOfLines={2}
                    >
                      {n.message}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        color: colors.outline,
                        marginTop: 4,
                      }}
                    >
                      {formatStudentRelativeTime(n.time)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.onSurfaceVariant,
                  }}
                >
                  Belum ada notifikasi baru
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    position: 'sticky' as any,
    top: 0,
    zIndex: 40,
  },
  brandGroup: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Literata, serif' as any,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
