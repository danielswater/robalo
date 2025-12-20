import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useComandas } from "../context/ComandaContext";
import type { PaymentMethod } from "../models/firestoreModels";

const PRIMARY_GREEN = "#2E7D32";
const SECONDARY_BLUE = "#1976D2";
const BORDER = "#E0E0E0";
const BG = "#F5F5F5";
const WHITE = "#FFFFFF";
const TEXT = "#212121";
const MUTED = "#757575";
const ERROR_RED = "#D32F2F";

type Mode = "TODAY" | "CUSTOM";

function paymentLabel(p?: PaymentMethod | null) {
  if (p === "pix") return "Pix";
  if (p === "card") return "Cartao";
  if (p === "cash") return "Dinheiro";
  return "-";
}

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function maskDateInput(value: string) {
  const digits = (value || "").replace(/\D/g, "").slice(0, 8); // DDMMYYYY
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);

  if (digits.length <= 2) return dd;
  if (digits.length <= 4) return `${dd}/${mm}`;
  return `${dd}/${mm}/${yyyy}`;
}

function parseDatePtBR(text: string): Date | null {
  const clean = (text || "").trim();
  if (!clean) return null;

  const parts = clean.replace(/-/g, "/").split("/");
  if (parts.length !== 3) return null;

  const dd = Number(parts[0]);
  const mm = Number(parts[1]);
  const yyyy = Number(parts[2]);

  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
  if (yyyy < 2000 || yyyy > 2100) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  const d = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);

  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;

  return d;
}

export default function RelatoriosScreen() {
  const insets = useSafeAreaInsets();
  const { comandas, getComandaTotal } = useComandas();

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);

  const [mode, setMode] = useState<Mode>("TODAY");

  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [appliedStart, setAppliedStart] = useState<Date | null>(null);
  const [appliedEnd, setAppliedEnd] = useState<Date | null>(null);
  const [error, setError] = useState<string>("");

  const effectiveRange = useMemo(() => {
    if (mode === "TODAY") {
      return { start: todayStart, endExclusive: tomorrowStart, label: "Hoje" };
    }

    if (!appliedStart || !appliedEnd) {
      return { start: null as Date | null, endExclusive: null as Date | null, label: "Selecione um periodo" };
    }

    const start = startOfDay(appliedStart);
    const endExclusive = addDays(startOfDay(appliedEnd), 1);

    return {
      start,
      endExclusive,
      label: `${formatDate(start)} ate ${formatDate(appliedEnd)}`,
    };
  }, [mode, todayStart, tomorrowStart, appliedStart, appliedEnd]);

  const closedInRange = useMemo(() => {
    if (mode === "CUSTOM" && (!effectiveRange.start || !effectiveRange.endExclusive)) return [];

    const startMs = (effectiveRange.start as Date).getTime();
    const endMs = (effectiveRange.endExclusive as Date).getTime();

    return (comandas || [])
      .filter((c) => c.status === "closed")
      .filter((c) => {
        if (!c.closedAt) return false;
        const d = new Date(c.closedAt);
        const ms = d.getTime();
        if (Number.isNaN(ms)) return false;
        return ms >= startMs && ms < endMs;
      })
      .sort((a, b) => {
        const da = a.closedAt ? new Date(a.closedAt).getTime() : 0;
        const db = b.closedAt ? new Date(b.closedAt).getTime() : 0;
        return db - da;
      });
  }, [comandas, mode, effectiveRange.start, effectiveRange.endExclusive]);

  const totals = useMemo(() => {
    let total = 0;
    let pix = 0;
    let card = 0;
    let cash = 0;

    for (const c of closedInRange) {
      const t = getComandaTotal(c.id);
      total += t;

      if (c.paymentMethod === "pix") pix += t;
      else if (c.paymentMethod === "card") card += t;
      else if (c.paymentMethod === "cash") cash += t;
    }

    return { total, pix, card, cash, count: closedInRange.length };
  }, [closedInRange, getComandaTotal]);

  const subtitle =
    mode === "CUSTOM" && (!appliedStart || !appliedEnd)
      ? 'Escolha um periodo e toque em "Aplicar".'
      : totals.count === 0
        ? "Nenhuma comanda fechada nesse periodo."
        : `${totals.count} comanda(s) fechada(s) nesse periodo.`;

  const applyCustom = () => {
    const s = parseDatePtBR(startText);
    const e = parseDatePtBR(endText);

    if (!s || !e) {
      setError("Data invalida. Use DD/MM/AAAA.");
      return;
    }

    if (s.getTime() > e.getTime()) {
      setError("A data inicio nao pode ser depois da data fim.");
      return;
    }

    setError("");
    setAppliedStart(s);
    setAppliedEnd(e);
  };

  const clearCustom = () => {
    setStartText("");
    setEndText("");
    setAppliedStart(null);
    setAppliedEnd(null);
    setError("");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatorios</Text>
        <Text style={styles.subTitle}>{subtitle}</Text>
      </View>

      <View style={styles.modeBox}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === "TODAY" && styles.modeBtnSelected]}
          onPress={() => setMode("TODAY")}
        >
          <Text style={[styles.modeText, mode === "TODAY" && styles.modeTextSelected]}>Hoje</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, mode === "CUSTOM" && styles.modeBtnSelected]}
          onPress={() => setMode("CUSTOM")}
        >
          <Text style={[styles.modeText, mode === "CUSTOM" && styles.modeTextSelected]}>Periodo</Text>
        </TouchableOpacity>
      </View>

      {mode === "CUSTOM" ? (
        <View style={styles.customCard}>
          <Text style={styles.customTitle}>Periodo personalizado</Text>

          <View style={styles.inputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Inicio</Text>
              <TextInput
                value={startText}
                onChangeText={(v) => setStartText(maskDateInput(v))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#9E9E9E"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            <View style={{ width: 10 }} />

            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Fim</Text>
              <TextInput
                value={endText}
                onChangeText={(v) => setEndText(maskDateInput(v))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#9E9E9E"
                style={styles.input}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.customButtonsRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={clearCustom}>
              <Text style={styles.secondaryBtnText}>Limpar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={applyCustom}>
              <Text style={styles.primaryBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Text style={styles.periodLine}>Periodo: {effectiveRange.label}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total do periodo</Text>
        <Text style={styles.bigValue}>{formatMoney(totals.total)}</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.smallCard, { flex: 1 }]}>
          <Text style={styles.smallTitle}>Pix</Text>
          <Text style={styles.smallValue}>{formatMoney(totals.pix)}</Text>
        </View>
        <View style={[styles.smallCard, { flex: 1 }]}>
          <Text style={styles.smallTitle}>Cartao</Text>
          <Text style={styles.smallValue}>{formatMoney(totals.card)}</Text>
        </View>
        <View style={[styles.smallCard, { flex: 1 }]}>
          <Text style={styles.smallTitle}>Dinheiro</Text>
          <Text style={styles.smallValue}>{formatMoney(totals.cash)}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Comandas fechadas</Text>

      {mode === "CUSTOM" && (!appliedStart || !appliedEnd) ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Escolha um periodo e toque em "Aplicar".</Text>
        </View>
      ) : closedInRange.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhuma comanda fechada nesse periodo.</Text>
        </View>
      ) : (
        <FlatList
          data={closedInRange}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => {
            const total = getComandaTotal(item.id);
            const when = item.closedAt ? new Date(item.closedAt) : null;
            const time = when && !Number.isNaN(when.getTime()) ? formatTime(when) : "-";

            return (
              <View style={styles.listCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listTitle}>{item.nickname || "Sem apelido"}</Text>
                  <Text style={styles.listSub}>
                    {paymentLabel(item.paymentMethod)} - {time}
                  </Text>
                </View>
                <Text style={styles.listValue}>{formatMoney(total)}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 16 },

  header: { paddingTop: 12, paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: "900", color: TEXT },
  subTitle: { marginTop: 4, fontSize: 13, color: MUTED, fontWeight: "700" },

  modeBox: { flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 10 },
  modeBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeBtnSelected: { borderColor: SECONDARY_BLUE, backgroundColor: "#E3F2FD" },
  modeText: { fontSize: 13, fontWeight: "900", color: TEXT },
  modeTextSelected: { color: SECONDARY_BLUE },

  customCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  customTitle: { fontSize: 14, fontWeight: "900", color: TEXT, marginBottom: 10 },

  inputsRow: { flexDirection: "row" },
  inputLabel: { fontSize: 12, fontWeight: "900", color: MUTED, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: WHITE,
    color: TEXT,
  },

  error: { marginTop: 10, color: ERROR_RED, fontSize: 13, fontWeight: "800" },

  customButtonsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  primaryBtn: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: WHITE, fontSize: 14, fontWeight: "900" },

  secondaryBtn: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
  },
  secondaryBtnText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: "900" },

  periodLine: { fontSize: 12, color: MUTED, fontWeight: "700", marginBottom: 10 },

  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
  },
  cardTitle: { fontSize: 13, fontWeight: "900", color: MUTED },
  bigValue: { marginTop: 6, fontSize: 20, fontWeight: "900", color: PRIMARY_GREEN },

  row: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  smallTitle: { fontSize: 12, fontWeight: "900", color: MUTED },
  smallValue: { marginTop: 6, fontSize: 14, fontWeight: "900", color: TEXT },

  sectionTitle: { marginTop: 14, marginBottom: 10, fontSize: 14, fontWeight: "900", color: TEXT },

  empty: {
    flex: 1,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
  },
  emptyText: { fontSize: 14, color: MUTED, fontWeight: "700" },

  listCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  listTitle: { fontSize: 16, fontWeight: "900", color: TEXT },
  listSub: { marginTop: 4, fontSize: 12, color: MUTED, fontWeight: "700" },
  listValue: { marginLeft: 12, fontSize: 14, fontWeight: "900", color: PRIMARY_GREEN },
});
