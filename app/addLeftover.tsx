
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Leftover, LEFTOVER_CATEGORIES, DEFAULT_EXPIRY_DAYS } from '@/types/leftover';
import { leftoverStorage } from '@/utils/leftoverStorage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

export default function AddLeftoverScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [dateAdded, setDateAdded] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the leftover');
      return;
    }

    if (!daysUntilExpiry || parseInt(daysUntilExpiry) <= 0) {
      Alert.alert('Error', 'Please enter valid days until expiry');
      return;
    }

    const leftover: Leftover = {
      id: Date.now().toString(),
      name: name.trim(),
      dateAdded: dateAdded.toISOString(),
      daysUntilExpiry: parseInt(daysUntilExpiry),
      category: category || undefined,
      notes: notes.trim() || undefined,
      imageUri: imageUri || undefined,
    };

    try {
      await leftoverStorage.add(leftover);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.log('Error saving leftover:', error);
      Alert.alert('Error', 'Failed to save leftover');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker closes automatically after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setDateAdded(selectedDate);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const toggleDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePicker(!showDatePicker);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(selectedCategory);
    const defaultDays = DEFAULT_EXPIRY_DAYS[selectedCategory];
    if (defaultDays) {
      setDaysUntilExpiry(defaultDays.toString());
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos of your leftovers.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUri(null);
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      handlePickImage();
    } else {
      Alert.alert(
        'Add Photo',
        'Choose how you want to add a photo',
        [
          {
            text: 'Take Photo',
            onPress: handleTakePhoto,
          },
          {
            text: 'Choose from Library',
            onPress: handlePickImage,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const formatDateDisplay = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString(undefined, options);
  };

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoCard}>
          <IconSymbol
            ios_icon_name="bell.badge.fill"
            android_material_icon_name="notifications_active"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            You&apos;ll receive a notification when this item expires!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Photo (Optional)</Text>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={32}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.photoButton}
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="photo_camera"
                size={32}
                color={colors.primary}
              />
              <Text style={styles.photoButtonText}>
                {Platform.OS === 'web' ? 'Add Photo' : 'Take or Choose Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Chicken Soup"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date Added *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={toggleDatePicker}
            activeOpacity={0.8}
          >
            <View style={styles.dateButtonContent}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar_today"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.dateText}>{formatDateDisplay(dateAdded)}</Text>
            </View>
            <IconSymbol
              ios_icon_name={showDatePicker ? "chevron.up" : "chevron.down"}
              android_material_icon_name={showDatePicker ? "expand_less" : "expand_more"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.doneButton}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
              <DateTimePicker
                value={dateAdded}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                style={styles.datePicker}
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {LEFTOVER_CATEGORIES.map((cat, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Days Until Expiry *</Text>
          <TextInput
            style={styles.input}
            value={daysUntilExpiry}
            onChangeText={setDaysUntilExpiry}
            placeholder="e.g., 3"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
          <Text style={styles.helperText}>
            How many days from the date added until it expires
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>Save Leftover</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  datePickerContainer: {
    marginTop: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  datePicker: {
    width: '100%',
    backgroundColor: colors.card,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  photoButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: 12,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0px 4px 12px rgba(41, 171, 226, 0.3)',
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
