
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { RecipeSuggestion } from '@/types/recipe';
import { Leftover } from '@/types/leftover';
import { leftoverStorage } from '@/utils/leftoverStorage';
import { getRecipeSuggestions, rateRecipe } from '@/utils/supabaseClient';
import * as Haptics from 'expo-haptics';

export default function RecipesScreen() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);

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
      
      // Update the local state
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
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Rate this recipe:</Text>
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
                  size={32}
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
          style={styles.recipeCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedRecipe(isExpanded ? null : recipe.id);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.recipeHeader}>
            <View style={styles.recipeHeaderLeft}>
              <View style={styles.iconContainer}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.recipeHeaderText}>
                <Text style={styles.recipeName} numberOfLines={1}>
                  {recipe.name}
                </Text>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchScore}>{recipe.matchScore}% Match</Text>
                </View>
              </View>
            </View>
            <IconSymbol
              ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={isExpanded ? 'expand_less' : 'expand_more'}
              size={24}
              color={colors.textSecondary}
            />
          </View>

          {recipe.description && (
            <Text style={styles.recipeDescription} numberOfLines={isExpanded ? undefined : 2}>
              {recipe.description}
            </Text>
          )}

          {isExpanded && (
            <View style={styles.expandedContent}>
              {recipe.matchedIngredients.length > 0 && (
                <View style={styles.matchSection}>
                  <Text style={styles.matchSectionTitle}>Matched Ingredients:</Text>
                  <View style={styles.tagContainer}>
                    {recipe.matchedIngredients.map((ingredient, idx) => (
                      <React.Fragment key={idx}>
                        <View style={styles.tag}>
                          <Text style={styles.tagText}>{ingredient}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              )}

              {recipe.matchedCategories.length > 0 && (
                <View style={styles.matchSection}>
                  <Text style={styles.matchSectionTitle}>Matched Categories:</Text>
                  <View style={styles.tagContainer}>
                    {recipe.matchedCategories.map((category, idx) => (
                      <React.Fragment key={idx}>
                        <View style={[styles.tag, styles.categoryTag]}>
                          <Text style={styles.tagText}>{category}</Text>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              )}

              {recipe.prep_time_minutes && (
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="clock"
                    android_material_icon_name="schedule"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>{recipe.prep_time_minutes} minutes</Text>
                </View>
              )}

              {recipe.difficulty && (
                <View style={styles.infoRow}>
                  <IconSymbol
                    ios_icon_name="chart.bar"
                    android_material_icon_name="bar_chart"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoText}>{recipe.difficulty}</Text>
                </View>
              )}

              {recipe.instructions && (
                <View style={styles.instructionsSection}>
                  <Text style={styles.instructionsTitle}>Instructions:</Text>
                  <Text style={styles.instructionsText}>{recipe.instructions}</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipe Suggestions</Text>
        <Text style={styles.headerSubtitle}>
          Based on your {leftovers.length} leftover{leftovers.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.emptyText}>Finding recipes...</Text>
          </View>
        ) : leftovers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="refrigerator"
              android_material_icon_name="kitchen"
              size={80}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No leftovers yet</Text>
            <Text style={styles.emptyText}>
              Add some leftovers first to get recipe suggestions
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/leftovers');
              }}
            >
              <Text style={styles.addButtonText}>Go to Leftovers</Text>
            </TouchableOpacity>
          </View>
        ) : suggestions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="magnifyingglass"
              android_material_icon_name="search"
              size={80}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptyText}>
              We couldn&apos;t find any recipes matching your current leftovers
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <Text style={styles.resultsText}>
              Found {suggestions.length} recipe{suggestions.length !== 1 ? 's' : ''}
            </Text>
            {suggestions.map((recipe, index) => renderRecipeCard(recipe, index))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  listContainer: {
    gap: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  recipeCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recipeHeaderText: {
    flex: 1,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  matchBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  matchScore: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  recipeDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchSection: {
    marginBottom: 12,
  },
  matchSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryTag: {
    backgroundColor: colors.warning + '20',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  instructionsSection: {
    marginTop: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  ratingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
