
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
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();
  const [name, setName] = useState('');
  const [dateAdded, setDateAdded] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [daysUntilExpiry, setDaysUntilExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Responsive sizing
  const padding = width * 0.05;
  const fontSize = Math.min(width * 0.04, 16);
  const labelSize = Math.min(width * 0.042, 16);
  const iconSize = Math.min(width * 0.07, 28);

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
    console.log('Date change event:', event.type, selectedDate);
    
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
      
      if (event.type === 'set' && selectedDate) {
        setDateAdded(selectedDate);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      if (selectedDate) {
        setDateAdded(selectedDate);
      }
    }
  };

  const toggleDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePicker(!showDatePicker);
  };

  const closeDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePicker(false);
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
        contentContainerStyle={[styles.scrollContent, { padding, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { padding: width * 0.04 }]}>
          <IconSymbol
            ios_icon_name="bell.badge.fill"
            android_material_icon_name="notifications_active"
            size={Math.min(width * 0.055, 22)}
            color={colors.primary}
          />
          <Text style={[styles.infoText, { fontSize: Math.min(width * 0.035, 13) }]}>
            You&apos;ll receive a notification when this item expires!
          </Text>
        </View>

        <View style={[styles.section, { marginBottom: height * 0.02 }]}>
          <Text style={[styles.label, { fontSize: labelSize, marginBottom: height * 0.01 }]}>
            Photo (Optional)
          </Text>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={[styles.image, { height: height * 0.25 }]} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
                activeOpacity={0.8}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={iconSize}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.photoButton, { padding: height * 0.025 }]}
              onPress={showImageOptions}
              activeOpacity={0.8}
            >
              <IconSymbol
                ios_icon_name="camera.fill"
                android_material_icon_name="photo_camera"
                size={iconSize}
                color={colors.primary}
              />
              <Text style={[styles.photoButtonText, { fontSize }]}>
                {Platform.OS === 'web' ? 'Add Photo' : 'Take or Choose Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.section, { marginBottom: height * 0.02 }]}>
          <Text style={[styles.label, { fontSize: labelSize, marginBottom: height * 0.01 }]}>Name *</Text>
          <TextInput
            style={[styles.input, { padding: width * 0.04, fontSize }]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Chicken Soup"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={[styles.section, { marginBottom: height * 0.02 }]}>
          <Text style={[styles.label, { fontSize: labelSize, marginBottom: height * 0.01 }]}>Date Added *</Text>
          <TouchableOpacity
            style={[styles.dateButton, { padding: width * 0.04 }]}
            onPress={toggleDatePicker}
            activeOpacity={0.8}
          >
            <View style={styles.dateButtonContent}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar_today"
                size={Math.min(width * 0.05, 18)}
                color={colors.primary}
              />
              <Text style={[styles.dateText, { fontSize }]}>{formatDateDisplay(dateAdded)}</Text>
            </View>
            <IconSymbol
              ios_icon_name={showDatePicker ? "chevron.up" : "chevron.down"}
              android_material_icon_name={showDatePicker ? "expand_less" : "expand_more"}
              size={Math.min(width * 0.05, 18)}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          
          {showDatePicker && Platform.OS === 'ios' && (
            <View style={styles.datePickerContainer}>
              <View style={[styles.datePickerHeader, { paddingHorizontal: width * 0.04, paddingVertical: height * 0.015 }]}>
                <Text style={[styles.datePickerTitle, { fontSize }]}>Select Date</Text>
                <TouchableOpacity
                  onPress={closeDatePicker}
                  style={[styles.doneButton, { paddingHorizontal: width * 0.04, paddingVertical: height * 0.008 }]}
                >
                  <Text style={[styles.doneButtonText, { fontSize: Math.min(width * 0.035, 14) }]}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={dateAdded}
                mode="date"
                display="inline"
                onChange={handleDateChange}
                maximumDate={new Date()}
                themeVariant="light"
              />
            </View>
          )}
          
          {showDatePicker && Platform.OS === 'android' && (
            <DateTimePicker
              value={dateAdded}
              mode="date"
              display="calendar"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={[styles.section, { marginBottom: height * 0.02 }]}>
          <Text style={[styles.label, { fontSize: labelSize, marginBottom: height * 0.01 }]}>Category</Text>
          <View style={styles.categoryGrid}>
            {LEFTOVER_CATEGORIES.map((cat, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    { paddingHorizontal: width * 0.04, paddingVertical: height * 0.012 },
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { fontSize: Math.min(width * 0.035, 13) },
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

        <View style={[styles.section, { marginBottom: height * 0.02 }]}>
          <Text style={[styles.label, { fontSize: labelSize, marginBottom: height * 0.01 }]}>
            Days Until Expiry *
          </Text>
          <TextInput
            style={[styles.input, { padding: width * 0.04, fontSize }]}
            value={daysUntilExpiry}
            onChangeText={setDaysUntilExpiry}
            placeholder="e.g., 3"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
          />
          <Text style={[styles.helperText, { fontSize: Math.min(width * 0.032, 12), marginTop: height * 0.008 }]}>
            How many days from the date added until it expires
          </Text>
        </View>

        <View style={[styles.section, { marginBottom: height * 0.02 }]}>
          <Text style={[styles.label, { fontSize: labelSize, marginBottom: height * 0.01 }]}>
            Notes (Optional)
          </Text>
          <TextInput
            style={[styles.input, styles.textArea, { padding: width * 0.04, fontSize, minHeight: height * 0.12 }]}
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
          style={[styles.saveButton, { padding: height * 0.02 }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={[styles.saveButtonText, { fontSize: Math.min(width * 0.045, 17) }]}>
            Save Leftover
          </Text>
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
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontWeight: '500',
    color: colors.primary,
    lineHeight: 18,
  },
  section: {
  },
  label: {
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    paddingTop: 12,
  },
  helperText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    color: colors.text,
    fontWeight: '500',
  },
  datePickerContainer: {
    marginTop: 10,
    backgroundColor: colors.card,
    borderRadius: 10,
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  datePickerTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  doneButtonText: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontWeight: '500',
    color: colors.text,
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  photoButton: {
    backgroundColor: colors.card,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    gap: 10,
  },
  photoButtonText: {
    fontWeight: '600',
    color: colors.primary,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 14,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    boxShadow: '0px 4px 12px rgba(41, 171, 226, 0.3)',
    elevation: 4,
  },
  saveButtonText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
