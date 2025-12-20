import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY_GREEN = "#2E7D32";
const BG = "#F5F5F5";
const BORDER = "#E0E0E0";
const WHITE = "#FFFFFF";
const TEXT = "#212121";

export default function AppSplash() {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Ionicons name="fish-outline" size={52} color={PRIMARY_GREEN} />
      </View>
      <Text style={styles.title}>Banca do Robalo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: TEXT,
  },
});
