import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { Search } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import PrimaryButton from './PrimaryButton';

interface EmptyStateProps {
  icon?: React.ReactNode;
  imageSource?: ImageSourcePropType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export default function EmptyState({ icon, imageSource, title, description, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <View testID={testID} style={styles.container}>
      {imageSource ? (
        <Image source={imageSource} style={styles.illustration} resizeMode="contain" />
      ) : (
        <View style={styles.iconCircle}>
          {typeof icon === 'string' ? (
            <Text style={{ color: Colors.primaryDark, fontSize: 16 }}>{icon}</Text>
          ) : (
            icon || <Search size={32} color={Colors.primaryDark} />
          )}
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction && (
        <PrimaryButton title={actionLabel} onPress={onAction} style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  illustration: {
    width: 240,
    height: 180,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    marginTop: spacing.xxl,
  },
});
