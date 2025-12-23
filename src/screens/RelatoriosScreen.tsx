import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useComandas } from "../context/ComandaContext";
import type { PaymentMethod, PaymentSplit } from "../models/firestoreModels";
import { useAppAlert } from "../components/AppAlert";

const PRIMARY_GREEN = "#2E7D32";
const SECONDARY_BLUE = "#1976D2";
const BG = "#F5F5F5";
const WHITE = "#FFFFFF";
const TEXT = "#212121";
const MUTED = "#757575";
const BORDER = "#E0E0E0";

type Mode = "today" | "period";

type AttendantTotal = {
  name: string;
  total: number;
};

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function parseDatePtBR(value: string) {
  const parts = value.split("/");
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts.map((v) => Number(v));
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function maskDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseClosedDate(value?: string | null) {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const [yyyy, mm, dd] = parts.map((v) => Number(v));
  if (!dd || !mm || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (Number.isNaN(d.getTime())) return null;
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function paymentLabel(p: PaymentMethod) {
  if (p === "cash") return "Dinheiro";
  if (p === "card") return "Cartao";
  if (p === "mixed") return "Misto";
  return "Pix";
}

function paymentLabelFromSplit(split?: PaymentSplit | null, method?: PaymentMethod | null) {
  if (split) {
    const methods = [
      split.pix > 0 ? "pix" : null,
      split.card > 0 ? "card" : null,
      split.cash > 0 ? "cash" : null,
    ].filter(Boolean) as PaymentMethod[];

    if (methods.length === 1) return paymentLabel(methods[0]);
    if (methods.length > 1) return "Misto";
  }

  if (method) return paymentLabel(method);
  return "Pagamento";
}

export default function RelatoriosScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { comandas, ordersLoading } = useComandas();
  const { show } = useAppAlert();

  const [mode, setMode] = useState<Mode>("today");
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [appliedStart, setAppliedStart] = useState<Date | null>(null);
  const [appliedEnd, setAppliedEnd] = useState<Date | null>(null);

  const range = useMemo(() => {
    if (mode === "today") {
      const start = startOfDay(new Date());
      const end = addDays(start, 1);
      return {
        start,
        end,
        label: "Hoje",
      };
    }

    if (!appliedStart || !appliedEnd) return null;
    const start = startOfDay(appliedStart);
    const end = addDays(startOfDay(appliedEnd), 1);
    const label = `${formatDate(start)} ate ${formatDate(addDays(end, -1))}`;
    return { start, end, label };
  }, [mode, appliedStart, appliedEnd]);

  const closedInRange = useMemo(() => {
    if (mode === "period" && !range) return [];

    const list = (comandas || []).filter((c) => c.status === "closed");

    const filtered = list.filter((c) => {
      const closedAt = c.closedAt ? new Date(c.closedAt) : null;
      const closedDate = parseClosedDate(c.closedDate || "");
      const when = closedAt && !Number.isNaN(closedAt.getTime()) ? closedAt : closedDate;
      if (!when) return false;
      return when >= range!.start && when < range!.end;
    });

    filtered.sort((a, b) => {
      const aDate = a.closedAt ? new Date(a.closedAt) : parseClosedDate(a.closedDate || "");
      const bDate = b.closedAt ? new Date(b.closedAt) : parseClosedDate(b.closedDate || "");
      const aTime = aDate && !Number.isNaN(aDate.getTime()) ? aDate.getTime() : 0;
      const bTime = bDate && !Number.isNaN(bDate.getTime()) ? bDate.getTime() : 0;
      return bTime - aTime;
    });

    return filtered;
  }, [comandas, range, mode]);

  const totals = useMemo(() => {
    const byPayment: PaymentSplit = {
      pix: 0,
      card: 0,
      cash: 0,
    };
    const byAttendant: Record<string, number> = {};

    let total = 0;

    closedInRange.forEach((c) => {
      const amount = Number(c.total || 0);
      if (!Number.isFinite(amount)) return;

      total += amount;
      if (c.paymentSplit) {
        const splitPix = Number(c.paymentSplit.pix || 0);
        const splitCard = Number(c.paymentSplit.card || 0);
        const splitCash = Number(c.paymentSplit.cash || 0);
        byPayment.pix += Number.isFinite(splitPix) ? splitPix : 0;
        byPayment.card += Number.isFinite(splitCard) ? splitCard : 0;
        byPayment.cash += Number.isFinite(splitCash) ? splitCash : 0;
      } else if (c.paymentMethod === "pix") {
        byPayment.pix += amount;
      } else if (c.paymentMethod === "card") {
        byPayment.card += amount;
      } else if (c.paymentMethod === "cash") {
        byPayment.cash += amount;
      }

      const att = (c.closedBy || c.currentAttendant || "Atendente").trim() || "Atendente";
      byAttendant[att] = (byAttendant[att] || 0) + amount;
    });

    const attendants: AttendantTotal[] = Object.entries(byAttendant)
      .map(([name, value]) => ({ name, total: value }))
      .sort((a, b) => b.total - a.total);

    return { total, byPayment, attendants };
  }, [closedInRange]);

  const onApply = () => {
    const start = parseDatePtBR(startInput);
    const end = parseDatePtBR(endInput);

    if (!start || !end) {
      show("Período invalido", "Digite as duas datas no formato dd/mm/aaaa.");
      return;
    }

    if (end < start) {
      show("Período invalido", "A data final precisa ser maior ou igual a inicial.");
      return;
    }

    setAppliedStart(start);
    setAppliedEnd(end);
  };

  const onClear = () => {
    setStartInput("");
    setEndInput("");
    setAppliedStart(null);
    setAppliedEnd(null);
  };

  const periodText = range ? `Período: ${range.label}` : `Escolha um período e toque em "Aplicar".`;
  const countText = `${closedInRange.length} comanda(s)`;

  const emptyMessage =
    mode === "period" && !range
      ? 'Escolha um período e toque em "Aplicar".'
      : "Nenhuma comanda fechada nesse período.";

  return (
    <FlatList
      style={styles.container}
      data={closedInRange}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        <View style={styles.headerContent}>
          <View style={styles.segment}>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === "today" && styles.segmentBtnActive]}
              onPress={() => setMode("today")}
            >
              <Text style={[styles.segmentText, mode === "today" && styles.segmentTextActive]}>Hoje</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentBtn, mode === "period" && styles.segmentBtnActive]}
              onPress={() => setMode("period")}
            >
              <Text style={[styles.segmentText, mode === "period" && styles.segmentTextActive]}>Período</Text>
            </TouchableOpacity>
          </View>

          {mode === "period" ? (
            <View style={styles.periodCard}>
              <Text style={styles.sectionTitle}>Período personalizado</Text>
              <View style={styles.periodRow}>
                <View style={styles.periodCol}>
                  <Text style={styles.inputLabel}>Inicio</Text>
                  <TextInput
                    value={startInput}
                    onChangeText={(v) => setStartInput(maskDateInput(v))}
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor="#9E9E9E"
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
                <View style={styles.periodCol}>
                  <Text style={styles.inputLabel}>Fim</Text>
                  <TextInput
                    value={endInput}
                    onChangeText={(v) => setEndInput(maskDateInput(v))}
                    placeholder="dd/mm/aaaa"
                    placeholderTextColor="#9E9E9E"
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.periodButtons}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={onClear}>
                  <Text style={styles.secondaryBtnText}>Limpar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={onApply}>
                  <Text style={styles.primaryBtnText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.summaryCard}>
            <View style={styles.summaryTop}>
              <Text style={styles.summaryTitle}>Total do período</Text>
              <Text style={styles.summaryCount}>{countText}</Text>
            </View>
            <Text style={styles.summaryAmount}>{formatMoney(totals.total)}</Text>
            <Text style={styles.summaryMeta}>{periodText}</Text>

            <View style={styles.paymentRow}>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Pix</Text>
                <Text style={styles.paymentValue}>{formatMoney(totals.byPayment.pix)}</Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Cartão</Text>
                <Text style={styles.paymentValue}>{formatMoney(totals.byPayment.card)}</Text>
              </View>
              <View style={styles.paymentItem}>
                <Text style={styles.paymentLabel}>Dinheiro</Text>
                <Text style={styles.paymentValue}>{formatMoney(totals.byPayment.cash)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.attCard}>
            <Text style={styles.sectionTitle}>Por atendente</Text>
            {totals.attendants.length === 0 ? (
              <Text style={styles.emptyText}>Sem vendas nesse período.</Text>
            ) : (
              totals.attendants.map((a) => (
                <View key={a.name} style={styles.attRow}>
                  <Text style={styles.attName}>{a.name}</Text>
                  <Text style={styles.attValue}>{formatMoney(a.total)}</Text>
                </View>
              ))
            )}
          </View>

          <Text style={styles.listTitle}>Comandas fechadas</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyCard}>
          {ordersLoading ? (
            <>
              <ActivityIndicator size="small" color={MUTED} />
              <Text style={[styles.emptyText, { marginTop: 8 }]}>Carregando...</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const method = paymentLabelFromSplit(item.paymentSplit, item.paymentMethod);
        const time = formatTime(item.closedAt);
        const subtitle = time ? `${method} - ${time}` : method;
        const total = Number(item.total || 0);

        return (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate("ComandaDetalhe", { id: item.id, nickname: item.nickname })}
          >
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.nickname || "Sem apelido"}</Text>
                <Text style={styles.cardSub}>{subtitle}</Text>
              </View>
              <Text style={styles.cardValue}>{formatMoney(Number.isFinite(total) ? total : 0)}</Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerContent: { padding: 16, paddingBottom: 8, gap: 12 },

  segment: {
    flexDirection: "row",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: "hidden",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentBtnActive: { backgroundColor: "#E8F5E9" },
  segmentText: { fontSize: 14, fontWeight: "800", color: MUTED },
  segmentTextActive: { color: PRIMARY_GREEN },

  periodCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "900", color: TEXT, marginBottom: 10 },
  periodRow: { flexDirection: "row", gap: 10 },
  periodCol: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: MUTED, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: WHITE,
    color: TEXT,
  },
  periodButtons: { flexDirection: "row", gap: 10, marginTop: 12 },
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
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
    backgroundColor: WHITE,
  },
  secondaryBtnText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: "900" },

  summaryCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
  },
  summaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryTitle: { fontSize: 14, fontWeight: "900", color: TEXT },
  summaryCount: { fontSize: 12, color: MUTED, fontWeight: "700" },
  summaryAmount: { marginTop: 6, fontSize: 22, fontWeight: "900", color: PRIMARY_GREEN },
  summaryMeta: { marginTop: 4, fontSize: 12, color: MUTED, fontWeight: "700" },

  paymentRow: { flexDirection: "row", marginTop: 12, gap: 10 },
  paymentItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#FAFAFA",
  },
  paymentLabel: { fontSize: 12, color: MUTED, fontWeight: "700" },
  paymentValue: { marginTop: 4, fontSize: 13, fontWeight: "900", color: TEXT },

  attCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
  },
  attRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  attName: { fontSize: 14, fontWeight: "800", color: TEXT },
  attValue: { fontSize: 14, fontWeight: "900", color: PRIMARY_GREEN },

  listTitle: { fontSize: 15, fontWeight: "900", color: TEXT, marginTop: 6 },

  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "900", color: TEXT },
  cardSub: { marginTop: 4, fontSize: 12, color: MUTED },
  cardValue: { fontSize: 14, fontWeight: "900", color: PRIMARY_GREEN },

  emptyCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    backgroundColor: WHITE,
  },
  emptyText: { fontSize: 13, color: MUTED, fontWeight: "700" },
});
