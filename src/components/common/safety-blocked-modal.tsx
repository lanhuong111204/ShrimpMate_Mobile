import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface SafetyBlockedModalProps {
  visible: boolean;
  onClose: () => void;
  pondName?: string;
  reasons?: string[];
  reason?: string;
  telemetrySnapshot?: {
    dissolvedOxygenMgL?: number | null;
    ph?: number | null;
    temperatureC?: number | null;
    ammoniaMgL?: number | null;
  } | null;
}

export function SafetyBlockedModal({
  visible,
  onClose,
  pondName,
  reasons,
  reason,
  telemetrySnapshot,
}: SafetyBlockedModalProps) {
  const reasonList =
    reasons && reasons.length > 0
      ? reasons
      : reason
      ? [reason]
      : [
          'Chỉ số chất lượng nước vượt ngưỡng an toàn QCVN hoặc thiết bị đo mất kết nối.',
        ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBadge}>
                <MaterialIcons name="gpp-bad" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>LỆNH CHO ĂN BỊ KHÓA AN TOÀN</Text>
                <Text style={styles.headerSub}>
                  Safety Rule Engine (UC018){pondName ? ` • ${pondName}` : ''}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={styles.body}>
            {/* Decision Banner */}
            <View style={styles.reasonBox}>
              <View style={styles.decisionRow}>
                <Text style={styles.decisionLabel}>QUYẾT ĐỊNH HỆ THỐNG:</Text>
                <View style={styles.blockedTag}>
                  <Text style={styles.blockedTagText}>BLOCKED (CẤM RẢI)</Text>
                </View>
              </View>
              {reasonList.map((item, idx) => (
                <Text key={idx} style={styles.reasonText}>
                  • {item}
                </Text>
              ))}
            </View>

            {/* Telemetry Snapshot */}
            {telemetrySnapshot && (
              <View style={styles.snapshotBox}>
                <Text style={styles.snapshotTitle}>SỐ ĐO CẢM BIẾN LÚC KIỂM DUYỆT:</Text>
                <View style={styles.snapshotGrid}>
                  <View style={styles.snapshotCell}>
                    <Text style={styles.snapshotCellLabel}>DO</Text>
                    <Text style={[styles.snapshotCellVal, { color: '#BA1A1A' }]}>
                      {telemetrySnapshot.dissolvedOxygenMgL ?? '--'} mg/L
                    </Text>
                  </View>
                  <View style={styles.snapshotCell}>
                    <Text style={styles.snapshotCellLabel}>pH</Text>
                    <Text style={styles.snapshotCellVal}>
                      {telemetrySnapshot.ph ?? '--'}
                    </Text>
                  </View>
                  <View style={styles.snapshotCell}>
                    <Text style={styles.snapshotCellLabel}>Nhiệt độ</Text>
                    <Text style={styles.snapshotCellVal}>
                      {telemetrySnapshot.temperatureC ?? '--'} °C
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Remediation Advice */}
            <View style={styles.adviceBox}>
              <Text style={styles.adviceText}>
                <Text style={{ fontWeight: '900' }}>BIỆN PHÁP KHẮC PHỤC: </Text>
                Để bảo vệ đàn tôm khỏi nguy cơ ngạt oxy và tồn đọng cám thối đáy ao, hệ thống đã chặn lệnh MQTT tới mâm phun. Hãy bật quạt nước tăng oxy hoặc kiểm tra lại trạm cảm biến trước khi cho ăn.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.confirmBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}>
              <Text style={styles.confirmBtnText}>Tôi Đã Hiểu & Đi Kiểm Tra Ao</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 48, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#DC2626',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  headerSub: {
    fontSize: 11,
    color: '#FEE2E2',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  reasonBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    gap: 6,
  },
  decisionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  decisionLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#991B1B',
  },
  blockedTag: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  blockedTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F1D1D',
    lineHeight: 18,
  },
  snapshotBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 6,
  },
  snapshotTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  snapshotCell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
    alignItems: 'center',
  },
  snapshotCellLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  snapshotCellVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0B1C30',
    marginTop: 2,
  },
  adviceBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 10,
  },
  adviceText: {
    fontSize: 11,
    color: '#78350F',
    lineHeight: 16,
  },
  confirmBtn: {
    backgroundColor: '#0B1C30',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default SafetyBlockedModal;
