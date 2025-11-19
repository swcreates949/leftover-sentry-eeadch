
import React from "react";
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, useWindowDimensions, Image } from "react-native";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/components/IconSymbol";
import { colors, commonStyles } from "@/styles/commonStyles";
import * as Haptics from "expo-haptics";

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  
  // Calculate responsive sizes based on screen dimensions
  const scale = Math.min(width / 375, 1.2); // Base on iPhone SE width, max scale 1.2
  const iconSize = Math.min(width * 0.18, 70);
  const heroTitleSize = Math.min(width * 0.08, 32);
  const heroSubtitleSize = Math.min(width * 0.045, 16);
  const chevronSize = Math.min(width * 0.055, 22);

  const handleNavigateToLeftovers = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/leftovers');
  };

  const handleNavigateToRecipes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/recipes');
  };

  return (
    <View style={[commonStyles.container]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: width * 0.05 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { paddingVertical: height * 0.03 }]}>
          <IconSymbol
            ios_icon_name="refrigerator"
            android_material_icon_name="kitchen"
            size={iconSize}
            color={colors.primary}
          />
          <Text style={[styles.heroTitle, { fontSize: heroTitleSize, marginTop: height * 0.015 }]}>
            Leftover Tracker
          </Text>
          <Text style={[styles.heroSubtitle, { fontSize: heroSubtitleSize, paddingHorizontal: width * 0.05 }]}>
            Never waste food again! Track what&apos;s in your fridge and get recipe ideas.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.featureCard, { padding: width * 0.04 }]}
          onPress={handleNavigateToLeftovers}
          activeOpacity={0.7}
        >
          <View style={[styles.featureIconContainer, { width: width * 0.12, height: width * 0.12, borderRadius: width * 0.06 }]}>
            <IconSymbol
              ios_icon_name="list.bullet"
              android_material_icon_name="list"
              size={Math.min(width * 0.07, 28)}
              color={colors.primary}
            />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, { fontSize: Math.min(width * 0.045, 17) }]}>
              Track Your Leftovers
            </Text>
            <Text style={[styles.featureDescription, { fontSize: Math.min(width * 0.035, 13) }]}>
              Add items to your fridge and see how many days they have left
            </Text>
          </View>
          <Image
            source={require('@/assets/images/4ff59fe4-a563-4d9b-9f5f-84f5af0fe16c.png')}
            style={{ width: chevronSize, height: chevronSize, tintColor: colors.textSecondary }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.featureCard, styles.recipeCard, { padding: width * 0.04 }]}
          onPress={handleNavigateToRecipes}
          activeOpacity={0.7}
        >
          <View style={[styles.featureIconContainer, styles.recipeIconContainer, { width: width * 0.12, height: width * 0.12, borderRadius: width * 0.06 }]}>
            <IconSymbol
              ios_icon_name="lightbulb.fill"
              android_material_icon_name="lightbulb"
              size={Math.min(width * 0.07, 28)}
              color="#ffffff"
            />
          </View>
          <View style={styles.featureContent}>
            <Text style={[styles.featureTitle, styles.recipeTitle, { fontSize: Math.min(width * 0.045, 17) }]}>
              Get Recipe Ideas
            </Text>
            <Text style={[styles.featureDescription, styles.recipeDescription, { fontSize: Math.min(width * 0.035, 13) }]}>
              Discover recipes based on your leftovers and rate them
            </Text>
          </View>
          <Image
            source={require('@/assets/images/4ff59fe4-a563-4d9b-9f5f-84f5af0fe16c.png')}
            style={{ width: chevronSize, height: chevronSize, tintColor: '#ffffff' }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={[styles.infoSection, { marginBottom: height * 0.025 }]}>
          <Text style={[styles.sectionTitle, { fontSize: Math.min(width * 0.055, 22), marginBottom: height * 0.015 }]}>
            How It Works
          </Text>
          
          <View style={[styles.stepCard, { padding: width * 0.035 }]}>
            <View style={[styles.stepNumber, { width: width * 0.09, height: width * 0.09, borderRadius: width * 0.045 }]}>
              <Text style={[styles.stepNumberText, { fontSize: Math.min(width * 0.045, 18) }]}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { fontSize: Math.min(width * 0.04, 15) }]}>Add Leftovers</Text>
              <Text style={[styles.stepDescription, { fontSize: Math.min(width * 0.035, 13) }]}>
                Tap the + button to add items when you put them in the fridge
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { padding: width * 0.035 }]}>
            <View style={[styles.stepNumber, { width: width * 0.09, height: width * 0.09, borderRadius: width * 0.045 }]}>
              <Text style={[styles.stepNumberText, { fontSize: Math.min(width * 0.045, 18) }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { fontSize: Math.min(width * 0.04, 15) }]}>Track Freshness</Text>
              <Text style={[styles.stepDescription, { fontSize: Math.min(width * 0.035, 13) }]}>
                See at a glance how many days each item has left
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { padding: width * 0.035 }]}>
            <View style={[styles.stepNumber, { width: width * 0.09, height: width * 0.09, borderRadius: width * 0.045 }]}>
              <Text style={[styles.stepNumberText, { fontSize: Math.min(width * 0.045, 18) }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { fontSize: Math.min(width * 0.04, 15) }]}>Get Recipe Ideas</Text>
              <Text style={[styles.stepDescription, { fontSize: Math.min(width * 0.035, 13) }]}>
                Browse recipe suggestions that match your leftovers and rate them
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { padding: width * 0.035 }]}>
            <View style={[styles.stepNumber, { width: width * 0.09, height: width * 0.09, borderRadius: width * 0.045 }]}>
              <Text style={[styles.stepNumberText, { fontSize: Math.min(width * 0.045, 18) }]}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { fontSize: Math.min(width * 0.04, 15) }]}>Reduce Waste</Text>
              <Text style={[styles.stepDescription, { fontSize: Math.min(width * 0.035, 13) }]}>
                Get notified when items are about to expire so you can use them in time
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.tipsSection, { marginBottom: height * 0.025 }]}>
          <Text style={[styles.sectionTitle, { fontSize: Math.min(width * 0.055, 22), marginBottom: height * 0.015 }]}>
            Food Safety Tips
          </Text>
          <View style={[styles.tipCard, { padding: width * 0.035 }]}>
            <IconSymbol
              ios_icon_name="thermometer"
              android_material_icon_name="thermostat"
              size={Math.min(width * 0.055, 22)}
              color={colors.secondary}
            />
            <Text style={[styles.tipText, { fontSize: Math.min(width * 0.037, 14) }]}>
              Keep your fridge at 40°F (4°C) or below
            </Text>
          </View>
          <View style={[styles.tipCard, { padding: width * 0.035 }]}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={Math.min(width * 0.055, 22)}
              color={colors.secondary}
            />
            <Text style={[styles.tipText, { fontSize: Math.min(width * 0.037, 14) }]}>
              Most leftovers are safe for 3-4 days
            </Text>
          </View>
          <View style={[styles.tipCard, { padding: width * 0.035 }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={Math.min(width * 0.055, 22)}
              color={colors.warning}
            />
            <Text style={[styles.tipText, { fontSize: Math.min(width * 0.037, 14) }]}>
              When in doubt, throw it out!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 120,
  },
  heroSection: {
    alignItems: 'center',
  },
  heroTitle: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  recipeCard: {
    backgroundColor: colors.primary,
    marginBottom: 20,
  },
  featureIconContainer: {
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipeIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  recipeTitle: {
    color: '#ffffff',
  },
  featureDescription: {
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  recipeDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  infoSection: {
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    marginBottom: 10,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  stepNumber: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontWeight: '800',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  stepDescription: {
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tipsSection: {
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    marginBottom: 10,
    gap: 10,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  tipText: {
    flex: 1,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
  },
});
