import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Colors from "@/constants/colors";
import { borderRadius, fontSize, fontWeight, spacing } from "@/constants/theme";

export default function ModalScreen() {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={() => router.back()}
    >
      <Pressable style={styles.overlay} onPress={() => router.back()}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>PeSoGle</Text>
          <Text style={styles.description}>
            AI-Driven Academic Mentorship Platform
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    margin: spacing.xl,
    alignItems: "center",
    minWidth: 300,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: Colors.primaryDark,
    marginBottom: spacing.md,
  },
  description: {
    textAlign: "center",
    marginBottom: spacing.xxl,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontSize: fontSize.md,
  },
  closeButton: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 100,
  },
  closeButtonText: {
    color: Colors.white,
    fontWeight: fontWeight.semibold,
    textAlign: "center",
    fontSize: fontSize.md,
  },
});
