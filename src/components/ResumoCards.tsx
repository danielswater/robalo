import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useComandas } from "../context/ComandaContext";

const PRIMARY_GREEN = "#2E7D32";
const BORDER = "#E0E0E0";
const WHITE = "#FFFFFF";
const TEXT = "#212121";
const MUTED = "#757575";

type Props = {
  title?: string;
  start?: Date;
  endExclusive?: Date;
  containerStyle?: ViewStyle;
};

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export default function ResumoCards({ title, start, endExclusive, containerStyle }: Props) {
  const { comandas } = useComandas();

  const range = useMemo(() => {
    if (start && endExclusive) return { start, endExclusive };
    const todayStart = startOfDay(new Date());
    return { start: todayStart, endExclusive: addDays(todayStart, 1) };
  }, [start, endExclusive]);

  const summary = useMemo(() => {
    const startMs = range.start.getTime();
    const endMs = range.endExclusive.getTime();

    let total = 0;
    let pix = 0;
    let card = 0;
    let cash = 0;
    let count = 0;

    const byAttendant = new Map<string, number>();

    for (const c of comandas || []) {
      if (c.status !== "closed") continue;
      if (!c.closedAt) continue;

      const when = new Date(c.closedAt);
      const ms = when.getTime();
      if (!Number.isFinite(ms)) continue;
      if (ms < startMs || ms >= endMs) continue;

      const value = Number.isFinite(c.total) ? c.total : 0;
      total += value;
      count += 1;

      if (c.paymentMethod === "pix") pix += value;
      else if (c.paymentMethod === "card") card += value;
      else if (c.paymentMethod === "cash") cash += value;

      const name = (c.closedBy || c.currentAttendant || "Sem nome").trim() || "Sem nome";
      byAttendant.set(name, (byAttendant.get(name) || 0) + value);
    }

    const attendants = Array.from(byAttendant.entries()).sort((a, b) => b[1] - a[1]);

    return { total, pix, card, cash, count, attendants };
  }, [comandas, range.start, range.endExclusive]);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Text style={styles.sectionTitle}>{title || "Resumo do dia"}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Total do periodo</Text>
        <Text style={styles.bigValue}>{formatMoney(summary.total)}</Text>
        <Text style={styles.cardSub}>{summary.count} comanda(s) fechada(s)</Text>
      </View>

      <View style={styles.row}>
        <View style={[styles.smallCard, { flex: 1 }]}>
          <Text style={styles.smallTitle}>Pix</Text>
          <Text style={styles.smallValue}>{formatMoney(summary.pix)}</Text>
        </View>
        <View style={[styles.smallCard, { flex: 1 }]}>
          <Text style={styles.smallTitle}>Cartao</Text>
          <Text style={styles.smallValue}>{formatMoney(summary.card)}</Text>
        </View>
        <View style={[styles.smallCard, { flex: 1 }]}>
          <Text style={styles.smallTitle}>Dinheiro</Text>
          <Text style={styles.smallValue}>{formatMoney(summary.cash)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Por atendente</Text>
        {summary.attendants.length === 0 ? (
          <Text style={styles.muted}>Sem vendas no periodo.</Text>
        ) : (
          summary.attendants.map(([name, value]) => (
            <View key={name} style={styles.attRow}>
              <Text style={styles.attName}>{name}</Text>
              <Text style={styles.attValue}>{formatMoney(value)}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  sectionTitle: { marginBottom: 8, fontSize: 14, fontWeight: "900", color: TEXT },

  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 13, fontWeight: "900", color: MUTED },
  bigValue: { marginTop: 6, fontSize: 20, fontWeight: "900", color: PRIMARY_GREEN },
  cardSub: { marginTop: 4, fontSize: 12, color: MUTED, fontWeight: "700" },

  row: { flexDirection: "row", gap: 10, marginBottom: 10 },
  smallCard: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  smallTitle: { fontSize: 12, fontWeight: "900", color: MUTED },
  smallValue: { marginTop: 6, fontSize: 14, fontWeight: "900", color: TEXT },

  muted: { marginTop: 6, fontSize: 12, color: MUTED, fontWeight: "700" },
  attRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  attName: { fontSize: 13, fontWeight: "800", color: TEXT },
  attValue: { fontSize: 13, fontWeight: "800", color: PRIMARY_GREEN },
});
