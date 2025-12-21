import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AlertButtonStyle = "default" | "cancel" | "destructive";

type AlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: AlertButtonStyle;
};

type AlertPayload = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

type AlertContextValue = {
  show: (title: string, message?: string, buttons?: AlertButton[]) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const DEFAULT_BUTTONS: AlertButton[] = [{ text: "OK" }];

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<AlertPayload | null>(null);

  const show = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
    const nextButtons = buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS;
    setCurrent({
      title,
      message,
      buttons: nextButtons,
    });
  }, []);

  const close = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      <Modal transparent visible={!!current} animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.title}>{current?.title}</Text>
            {current?.message ? <Text style={styles.message}>{current.message}</Text> : null}

            <View style={styles.buttonsWrap}>
              {(current?.buttons || []).map((btn, idx) => {
                const isDestructive = btn.style === "destructive";
                const isCancel = btn.style === "cancel";
                return (
                  <TouchableOpacity
                    key={`${btn.text}-${idx}`}
                    style={[styles.button, isDestructive && styles.buttonDestructive]}
                    onPress={() => {
                      close();
                      if (btn.onPress) {
                        Promise.resolve(btn.onPress()).catch(() => {});
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isDestructive && styles.buttonTextDestructive,
                        isCancel && styles.buttonTextCancel,
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAppAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error("useAppAlert precisa estar dentro do AlertProvider");
  }
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#212121",
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: "#616161",
  },
  buttonsWrap: {
    marginTop: 16,
    gap: 10,
  },
  button: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  buttonDestructive: {
    borderColor: "#D32F2F",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2E7D32",
  },
  buttonTextDestructive: {
    color: "#D32F2F",
  },
  buttonTextCancel: {
    color: "#424242",
  },
});
