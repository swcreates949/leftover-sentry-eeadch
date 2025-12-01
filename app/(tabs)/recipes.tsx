
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { RecipeSuggestion } from '@/types/recipe';
import { Leftover } from '@/types/leftover';
import { leftoverStorage } from '@/utils/leftoverStorage';
import { getRecipeSuggestions, rateRecipe } from '@/utils/supabaseClient';
import * as Haptics from 'expo-haptics';
import AdBanner from '@/components/AdBanner';
import { BannerAdSize } from 'react-native-google-mobile-ads';

export default function RecipesScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);

  // Responsive sizing
  const padding = width * 0.04;
  const headerPadding = width * 0.05;
  const fontSize = Math.min(width * 0.04, 16);
  const titleSize = Math.min(width * 0.045, 17);
  const iconSize = Math.min(width * 0.07, 28);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const leftoverData = await leftoverStorage.getAll();
      setLeftovers(leftoverData);

      if (leftoverData.length === 0) {
        setSuggestions([]);
        return;
      }

      const recipeSuggestions = await getRecipeSuggestions(leftoverData);
      setSuggestions(recipeSuggestions);
    } catch (error) {
      console.log('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSuggestions();
    }, [])
  );

  const handleRating = async (recipeId: string, rating: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const leftoverNames = leftovers.map(l => l.name);
    const success = await rateRecipe(recipeId, rating, leftoverNames);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setSuggestions(prev =>
        prev.map(s =>
          s.id === recipeId ? { ...s, userRating: rating } : s
        )
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const renderStarRating = (recipe: RecipeSuggestion) => {
    const ratings = [1, 2, 3, 4, 5];
    
    return (
      <View style={[styles.ratingContainer, { marginTop: height * 0.02, paddingTop: height * 0.02 }]}>
        <Text style={[styles.ratingLabel, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.01 }]}>
          Rate this recipe:
        </Text>
        <View style={styles.starsContainer}>
          {ratings.map((rating, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                onPress={() => handleRating(recipe.id, rating)}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
              >
                <IconSymbol
                  ios_icon_name={
                    recipe.userRating && rating <= recipe.userRating
                      ? 'fork.knife.circle.fill'
                      : 'fork.knife.circle'
                  }
                  android_material_icon_name="restaurant"
                  size={Math.min(width * 0.07, 28)}
                  color={
                    recipe.userRating && rating <= recipe.userRating
                      ? colors.warning
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  };

  const renderRecipeCard = (recipe: RecipeSuggestion, index: number) => {
    const isExpanded = selectedRecipe === recipe.id;

    return (
      <React.Fragment key={index}>
        <TouchableOpacity
          style={[styles.recipeCard, { padding }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedRecipe(isExpanded ? null : recipe.id);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.recipeHeader}>
            <View style={styles.recipeHeaderLeft}>
              <View style={[styles.iconContainer, { width: width * 0.12, height: width * 0.12, borderRadius: width * 0.06 }]}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={iconSize}
                  color={colors.primary}
                />
              </View>
              <View style={styles.recipeHeaderText}>
                <Text style={[styles.recipeName, { fontSize: titleSize }]} numberOfLines={1}>
                  {recipe.name}
                </Text>
                <View style={[styles.matchBadge, { paddingHorizontal: width * 0.02, paddingVertical: height * 0.005 }]}>
                  <Text style={[styles.matchScore, { fontSize: Math.min(width * 0.032, 12) }]}>
                    {recipe.matchScore}% Match
                  </Text>
                </View>
              </View>
            </View>
            <IconSymbol
              ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={isExpanded ? 'expand_less' : 'expand_more'}
              size={Math.min(width * 0.055, 22)}
              color={colors.textSecondary}
            />
          </View>

          {recipe.description && (
            <Text style={[styles.recipeDescription, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.01 }]} numberOfLines={isExpanded ? undefined : 2}>
              {recipe.description}
            </Text>
          )}

          {isExpanded && (
            <View style={[styles.expandedContent, { marginTop: height * 0.015, paddingTop: height * 0.015 }]}>
              {recipe.matchedIngredients.length > 0 && (
                <View style={[styles.matchSection, { marginBottom: height * 0.015 }]}>
                  <Text style={[styles.matchSectionTitle, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.01 }]}>
                    Matched Ingredients:
                  </Text>
                  <View style={styles.tagContainer}>
                    {recipe.matchedIngredients.map((ingredient, idx) => (
                      <React.Fragment key={idx}>
                        <View style={[styles.tag, { paddingHorizontal: width * 0.03, paddingVertical: height * 0.008 }]}>
                          <Text style={[styles.tagText, { fontSize: Math.min(width * 0.032, 12) }]}>
                            {ingredient}
                          </Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              )}

              {recipe.matchedCategories.length > 0 && (
                <View style={[styles.matchSection, { marginBottom: height * 0.015 }]}>
                  <Text style={[styles.matchSectionTitle, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.01 }]}>
                    Matched Categories:
                  </Text>
                  <View style={styles.tagContainer}>
                    {recipe.matchedCategories.map((category, idx) => (
                      <React.Fragment key={idx}>
                        <View style={[styles.tag, styles.categoryTag, { paddingHorizontal: width * 0.03, paddingVertical: height * 0.008 }]}>
                          <Text style={[styles.tagText, { fontSize: Math.min(width * 0.032, 12) }]}>
                            {category}
                          </Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              )}

              {recipe.prep_time_minutes && (
                <View style={[styles.infoRow, { marginBottom: height * 0.01 }]}>
                  <IconSymbol
                    ios_icon_name="clock"
                    android_material_icon_name="schedule"
                    size={Math.min(width * 0.04, 16)}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.infoText, { fontSize: Math.min(width * 0.035, 13) }]}>
                    {recipe.prep_time_minutes} minutes
                  </Text>
                </View>
              )}

              {recipe.difficulty && (
                <View style={[styles.infoRow, { marginBottom: height * 0.01 }]}>
                  <IconSymbol
                    ios_icon_name="chart.bar"
                    android_material_icon_name="bar_chart"
                    size={Math.min(width * 0.04, 16)}
                    color={colors.textSecondary}
                  />
                  <Text style={[styles.infoText, { fontSize: Math.min(width * 0.035, 13) }]}>
                    {recipe.difficulty}
                  </Text>
                </View>
              )}

              {recipe.instructions && (
                <View style={[styles.instructionsSection, { marginTop: height * 0.015, marginBottom: height * 0.02 }]}>
                  <Text style={[styles.instructionsTitle, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.01 }]}>
                    Instructions:
                  </Text>
                  <Text style={[styles.instructionsText, { fontSize: Math.min(width * 0.035, 13) }]}>
                    {recipe.instructions}
                  </Text>
                </View>
              )}

              {renderStarRating(recipe)}
            </View>
          )}
        </TouchableOpacity>
      </React.Fragment>
    );
  };

  return (
    <View style={commonStyles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 48 : 16, paddingHorizontal: headerPadding, paddingBottom: height * 0.02 }]}>
        <Text style={[styles.headerTitle, { fontSize: Math.min(width * 0.07, 28) }]}>Recipe Suggestions</Text>
        <Text style={[styles.headerSubtitle, { fontSize }]}>
          Based on your {leftovers.length} leftover{leftovers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.emptyText, { fontSize, marginTop: height * 0.02 }]}>Finding recipes...</Text>
          </View>
        ) : leftovers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="refrigerator"
              android_material_icon_name="kitchen"
              size={Math.min(width * 0.18, 70)}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { fontSize: Math.min(width * 0.055, 22), marginTop: height * 0.02 }]}>
              No leftovers yet
            </Text>
            <Text style={[styles.emptyText, { fontSize }]}>
              Add some leftovers first to get recipe suggestions
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { marginTop: height * 0.025, paddingHorizontal: width * 0.06, paddingVertical: height * 0.015 }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/leftovers');
              }}
            >
              <Text style={[styles.addButtonText, { fontSize }]}>Go to Leftovers</Text>
            </TouchableOpacity>
          </View>
        ) : suggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={Math.min(width * 0.18, 70)}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { fontSize: Math.min(width * 0.055, 22), marginTop: height * 0.02 }]}>
              No matches found
            </Text>
            <Text style={[styles.emptyText, { fontSize }]}>
              We couldn&apos;t find any recipes matching your current leftovers
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={[styles.resultsText, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.01 }]}>
              Found {suggestions.length} recipe{suggestions.length !== 1 ? 's' : ''}
            </Text>
            
            {/* Ad Banner after first 2 recipes */}
            {suggestions.slice(0, 2).map((recipe, index) => renderRecipeCard(recipe, index))}
            
            {suggestions.length > 2 && (
              <AdBanner size={BannerAdSize.MEDIUM_RECTANGLE} />
            )}
            
            {suggestions.slice(2).map((recipe, index) => renderRecipeCard(recipe, index + 2))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  headerTitle: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
  },
  listContainer: {
    gap: 10,
  },
  resultsText: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recipeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  recipeHeaderText: {
    flex: 1,
  },
  recipeName: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  matchBadge: {
    backgroundColor: colors.success + '20',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  matchScore: {
    fontWeight: '600',
    color: colors.success,
  },
  recipeDescription: {
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchSection: {
  },
  matchSectionTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 10,
  },
  categoryTag: {
    backgroundColor: colors.warning + '20',
  },
  tagText: {
    fontWeight: '500',
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  instructionsSection: {
  },
  instructionsTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  instructionsText: {
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  ratingContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingLabel: {
    fontWeight: '600',
    color: colors.text,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  addButtonText: {
    fontWeight: '600',
    color: '#ffffff',
  },
});
