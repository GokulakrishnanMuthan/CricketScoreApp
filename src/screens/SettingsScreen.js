import React, { useState } from 'react';
import {
    View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform
} from 'react-native';
import { Text, Card, Button, Portal, Dialog, ActivityIndicator } from 'react-native-paper';
import { Download, Upload, Database, CheckCircle, AlertCircle, Shield } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { exportAllData, importAllData } from '../database/database';

// ── helpers ───────────────────────────────────────────────────────────────────

const getBackupFileName = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `cricket_backup_${y}_${m}_${d}.json`;
};

// ── component ─────────────────────────────────────────────────────────────────

const SettingsScreen = () => {
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);

    // Result dialog
    const [resultDialog, setResultDialog] = useState({
        visible: false,
        success: true,
        title: '',
        message: '',
    });

    // Import confirmation dialog
    const [importDialog, setImportDialog] = useState({
        visible: false,
        fileUri: null,
        fileName: '',
        parsedData: null,
    });

    // ── Export ────────────────────────────────────────────────────────────────

    const handleExport = async () => {
        setExporting(true);
        try {
            const data = await exportAllData();
            const json = JSON.stringify(data, null, 2);
            const fileName = getBackupFileName();
            const fileUri = FileSystem.cacheDirectory + fileName;

            await FileSystem.writeAsStringAsync(fileUri, json, {
                encoding: 'utf8',
            });

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/json',
                    dialogTitle: 'Save or Share Cricket Backup',
                    UTI: 'public.json',
                });
            } else {
                setResultDialog({
                    visible: true,
                    success: true,
                    title: 'Export Ready',
                    message: `Backup saved to:\n${fileUri}`,
                });
            }
        } catch (err) {
            console.error('Export error:', err);
            setResultDialog({
                visible: true,
                success: false,
                title: 'Export Failed',
                message: 'Something went wrong while exporting. Please try again.',
            });
        } finally {
            setExporting(false);
        }
    };

    // ── Import (pick file) ────────────────────────────────────────────────────

    const handleImportPick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });

            if (result.canceled || !result.assets || result.assets.length === 0) return;

            const asset = result.assets[0];
            const content = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: 'utf8',
            });

            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch {
                setResultDialog({
                    visible: true,
                    success: false,
                    title: 'Invalid File',
                    message: 'The selected file is not a valid JSON file.',
                });
                return;
            }

            // Basic validation
            if (!parsed || parsed.app !== 'CricketScoreApp' || !parsed.data) {
                setResultDialog({
                    visible: true,
                    success: false,
                    title: 'Invalid Backup',
                    message: 'This file is not a valid Cricket Score App backup. Please select the correct file.',
                });
                return;
            }

            // Show confirmation dialog with summary
            setImportDialog({
                visible: true,
                fileUri: asset.uri,
                fileName: asset.name || 'backup.json',
                parsedData: parsed,
            });
        } catch (err) {
            console.error('Import pick error:', err);
            setResultDialog({
                visible: true,
                success: false,
                title: 'Error',
                message: 'Could not read the selected file. Please try again.',
            });
        }
    };

    // ── Import (confirm & restore) ────────────────────────────────────────────

    const handleImportConfirm = async () => {
        setImportDialog(prev => ({ ...prev, visible: false }));
        setImporting(true);
        try {
            await importAllData(importDialog.parsedData);
            setResultDialog({
                visible: true,
                success: true,
                title: 'Backup Restored',
                message: 'All data has been restored successfully! Your players, matches, and scoring data are back.',
            });
        } catch (err) {
            console.error('Import error:', err);
            const msg = err.message === 'INVALID_BACKUP'
                ? 'The backup file format is invalid. Only files exported from this app are supported.'
                : 'Restore failed. The file may be corrupted. Please try a different backup.';
            setResultDialog({
                visible: true,
                success: false,
                title: 'Restore Failed',
                message: msg,
            });
        } finally {
            setImporting(false);
        }
    };

    // ── render summary stats from parsed backup ───────────────────────────────

    const renderBackupSummary = (data) => {
        if (!data || !data.data) return null;
        const { players = [], matches = [], balls = [] } = data.data;
        return (
            <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Backup Contents</Text>
                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNum}>{players.length}</Text>
                        <Text style={styles.summaryLabel}>Players</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNum}>{matches.length}</Text>
                        <Text style={styles.summaryLabel}>Matches</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNum}>{balls.length}</Text>
                        <Text style={styles.summaryLabel}>Balls</Text>
                    </View>
                </View>
                {data.exportedAt && (
                    <Text style={styles.summaryDate}>
                        Exported: {new Date(data.exportedAt).toLocaleString('en-IN')}
                    </Text>
                )}
            </View>
        );
    };

    // ── UI ────────────────────────────────────────────────────────────────────

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* ── Header banner ── */}
            <View style={styles.heroBanner}>
                <Database size={36} color="white" />
                <View style={{ marginLeft: 16 }}>
                    <Text style={styles.heroTitle}>Data Backup & Restore</Text>
                    <Text style={styles.heroSub}>
                        Keep your match data safe and transfer it between devices
                    </Text>
                </View>
            </View>

            {/* ── Export card ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                            <Download size={22} color="#2E7D32" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.cardTitle}>Export Data</Text>
                            <Text style={styles.cardDesc}>
                                Save all players, matches, innings and ball-by-ball data as a JSON backup file
                            </Text>
                        </View>
                    </View>

                    <View style={styles.featureList}>
                        {['Players & profiles', 'Match history & scores', 'Innings & ball-by-ball data'].map(f => (
                            <View key={f} style={styles.featureRow}>
                                <View style={styles.featureDot} />
                                <Text style={styles.featureText}>{f}</Text>
                            </View>
                        ))}
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleExport}
                        loading={exporting}
                        disabled={exporting || importing}
                        buttonColor="#2E7D32"
                        style={styles.actionBtn}
                        contentStyle={{ height: 50 }}
                        icon={() => <Download size={18} color="white" />}
                    >
                        {exporting ? 'Exporting…' : 'Export Backup'}
                    </Button>
                </Card.Content>
            </Card>

            {/* ── Import card ── */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                            <Upload size={22} color="#1565C0" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text style={styles.cardTitle}>Import Data</Text>
                            <Text style={styles.cardDesc}>
                                Restore a previous backup from your device. Existing records will be updated, no duplicates created.
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.featureList, styles.warningBox]}>
                        <AlertCircle size={15} color="#E65100" />
                        <Text style={styles.warningText}>
                            {' '}Importing will merge the backup with your current data. This cannot be undone.
                        </Text>
                    </View>

                    <Button
                        mode="contained"
                        onPress={handleImportPick}
                        loading={importing}
                        disabled={exporting || importing}
                        buttonColor="#1565C0"
                        style={styles.actionBtn}
                        contentStyle={{ height: 50 }}
                        icon={() => <Upload size={18} color="white" />}
                    >
                        {importing ? 'Restoring…' : 'Select Backup File'}
                    </Button>
                </Card.Content>
            </Card>

            {/* ── Info card ── */}
            <Card style={[styles.card, styles.infoCard]}>
                <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Shield size={18} color="#1B4D3E" />
                        <Text style={[styles.cardTitle, { marginLeft: 8 }]}>How it works</Text>
                    </View>
                    {[
                        '1. Tap Export to generate cricket_backup_YYYY_MM_DD.json',
                        '2. Share or save the file using your device\'s options',
                        '3. To restore, tap Import and select the .json file',
                        '4. The app validates the file before restoring',
                    ].map(item => (
                        <Text key={item} style={styles.howText}>{item}</Text>
                    ))}
                </Card.Content>
            </Card>

            {/* ── Import confirmation dialog ── */}
            <Portal>
                <Dialog
                    visible={importDialog.visible}
                    onDismiss={() => setImportDialog(prev => ({ ...prev, visible: false }))}
                    style={styles.dialog}
                >
                    <View style={styles.dialogIconRow}>
                        <Upload size={28} color="#1565C0" />
                    </View>
                    <Dialog.Title style={styles.dialogTitle}>Restore Backup?</Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.dialogFileName}>{importDialog.fileName}</Text>
                        {renderBackupSummary(importDialog.parsedData)}
                        <Text style={styles.dialogWarning}>
                            Existing records will be updated. New records will be added.
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button
                            mode="outlined"
                            onPress={() => setImportDialog(prev => ({ ...prev, visible: false }))}
                            style={styles.cancelBtn}
                            labelStyle={{ color: '#666', fontWeight: '700' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            mode="contained"
                            onPress={handleImportConfirm}
                            buttonColor="#1565C0"
                            style={styles.confirmBtn}
                            labelStyle={{ color: 'white', fontWeight: '700' }}
                        >
                            Restore
                        </Button>
                    </Dialog.Actions>
                </Dialog>

                {/* ── Result dialog ── */}
                <Dialog
                    visible={resultDialog.visible}
                    onDismiss={() => setResultDialog(prev => ({ ...prev, visible: false }))}
                    style={[styles.dialog, { borderTopColor: resultDialog.success ? '#2E7D32' : '#EF5350' }]}
                >
                    <View style={styles.dialogIconRow}>
                        {resultDialog.success
                            ? <CheckCircle size={32} color="#2E7D32" />
                            : <AlertCircle size={32} color="#EF5350" />
                        }
                    </View>
                    <Dialog.Title style={[styles.dialogTitle, { color: resultDialog.success ? '#1B4D3E' : '#B71C1C' }]}>
                        {resultDialog.title}
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text style={styles.resultMessage}>{resultDialog.message}</Text>
                    </Dialog.Content>
                    <Dialog.Actions style={styles.dialogActions}>
                        <Button
                            mode="contained"
                            onPress={() => setResultDialog(prev => ({ ...prev, visible: false }))}
                            buttonColor={resultDialog.success ? '#2E7D32' : '#EF5350'}
                            style={{ flex: 1, borderRadius: 10 }}
                            labelStyle={{ color: 'white', fontWeight: '700' }}
                        >
                            OK
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F4F2' },
    content: { padding: 16 },

    heroBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1B4D3E',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 4,
    },
    heroTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
    heroSub: { color: '#A5D6A7', fontSize: 12, marginTop: 4, lineHeight: 17 },

    card: { borderRadius: 16, marginBottom: 16, elevation: 3, backgroundColor: 'white' },
    infoCard: { backgroundColor: '#F8FAF9' },

    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    iconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1B4D3E', marginBottom: 4 },
    cardDesc: { fontSize: 13, color: '#666', lineHeight: 18 },

    featureList: { marginBottom: 16 },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    featureDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4C8C4A', marginRight: 10 },
    featureText: { fontSize: 13, color: '#444' },

    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF3E0',
        borderRadius: 10,
        padding: 10,
    },
    warningText: { fontSize: 12, color: '#E65100', flex: 1, lineHeight: 17 },

    actionBtn: { borderRadius: 12 },

    howText: { fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 19 },

    // dialogs
    dialog: {
        borderRadius: 20,
        backgroundColor: 'white',
        borderTopWidth: 5,
        borderTopColor: '#1565C0',
    },
    dialogIconRow: { alignItems: 'center', marginTop: 20, marginBottom: 4 },
    dialogTitle: { textAlign: 'center', fontWeight: '800', fontSize: 20, color: '#1B4D3E' },
    dialogFileName: { textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 12 },
    dialogWarning: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 12 },
    dialogActions: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
    cancelBtn: { flex: 1, borderRadius: 10, borderColor: '#ddd' },
    confirmBtn: { flex: 1, borderRadius: 10 },
    resultMessage: { textAlign: 'center', color: '#555', fontSize: 14, lineHeight: 21 },

    // summary box inside import confirm
    summaryBox: {
        backgroundColor: '#F0F4F2',
        borderRadius: 12,
        padding: 14,
    },
    summaryTitle: { fontSize: 12, fontWeight: '700', color: '#666', marginBottom: 10, textAlign: 'center' },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryNum: { fontSize: 22, fontWeight: '800', color: '#1B4D3E' },
    summaryLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
    summaryDate: { fontSize: 11, color: '#999', textAlign: 'center', marginTop: 10 },
});

export default SettingsScreen;
