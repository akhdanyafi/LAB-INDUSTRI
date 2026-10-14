import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
    Font,
} from '@react-pdf/renderer';

// Register font for Indonesian characters
Font.register({
    family: 'Helvetica',
    fonts: [],
});

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 40,
        color: '#000',
    },
    // === HEADER ===
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    logo: {
        width: 60,
        height: 40,
        objectFit: 'contain',
    },
    headerCenter: {
        flex: 1,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 2,
    },
    headerPeriod: {
        fontSize: 9,
        textAlign: 'center',
        marginTop: 1,
    },
    divider: {
        borderBottomWidth: 2,
        borderBottomColor: '#000',
        marginBottom: 10,
    },
    // === SECTION ===
    sectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    // === TABLE A ===
    tableA: {
        borderWidth: 1,
        borderColor: '#000',
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        minHeight: 20,
    },
    tableRowLast: {
        flexDirection: 'row',
        minHeight: 20,
    },
    tableCellLabel: {
        width: '30%',
        backgroundColor: '#5B9BD5',
        borderRightWidth: 1,
        borderRightColor: '#000',
        paddingHorizontal: 6,
        paddingVertical: 4,
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        color: '#fff',
        justifyContent: 'center',
    },
    tableCellValue: {
        flex: 1,
        paddingHorizontal: 6,
        paddingVertical: 4,
        fontSize: 9,
        justifyContent: 'center',
    },
    // === SECTION B ===
    sectionB: {
        marginBottom: 8,
    },
    sectionBTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 4,
    },
    sectionBSubtitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginLeft: 10,
        marginBottom: 2,
    },
    fieldRow: {
        flexDirection: 'row',
        marginBottom: 2,
        marginLeft: 10,
    },
    fieldLabel: {
        width: '35%',
        fontSize: 9,
    },
    fieldColon: {
        width: 8,
        fontSize: 9,
    },
    fieldValue: {
        flex: 1,
        fontSize: 9,
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
        marginBottom: 2,
    },
    checkboxLabel: {
        fontSize: 9,
        marginLeft: 4,
    },
    checkbox: {
        width: 10,
        height: 10,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        width: 6,
        height: 6,
        backgroundColor: '#000',
    },
    // Kendala / Tindak Lanjut
    numberedList: {
        marginLeft: 10,
        marginBottom: 6,
    },
    numberedItem: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    numberedNumber: {
        width: 14,
        fontSize: 9,
    },
    numberedLine: {
        flex: 1,
        borderBottomWidth: 0.5,
        borderBottomColor: '#000',
        paddingBottom: 1,
        fontSize: 9,
        minHeight: 14,
    },
    // === CLOSING ===
    closingText: {
        fontSize: 9,
        textAlign: 'justify',
        marginTop: 8,
        marginBottom: 16,
    },
    // === SIGNATURE ===
    signatureRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 4,
    },
    signatureBlock: {
        width: '40%',
        alignItems: 'center',
    },
    signatureTitle: {
        fontSize: 9,
        marginBottom: 2,
        textAlign: 'center',
    },
    signatureSpace: {
        height: 50,
    },
    signatureName: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        borderTopWidth: 0.5,
        borderTopColor: '#000',
        paddingTop: 3,
        width: '100%',
    },
    signatureId: {
        fontSize: 8,
        textAlign: 'center',
        marginTop: 1,
    },
});

interface BeritaAcaraData {
    // Info praktikum
    courseName: string;
    courseCode: string;
    lecturerName: string | null;
    assistantName: string;
    assistantId: string;
    partnerName?: string | null;
    partnerId?: string | null;
    batch: string;
    roomName: string;
    practicumDate: Date | string;
    startTime: string;
    endTime: string;
    // Data pelaksanaan
    moduleTitle?: string;
    attendeeCount: number;
    totalStudents?: number;
    condition: 'Lancar' | 'Kurang Lancar' | 'Terkendala';
    description: string;
    issues: string | null;
    followUp: string | null;
    // Verifikasi
    verifiedByName?: string | null;
    verifiedById?: string | null;
    lecturerId?: string | null;
    /** Tanda tangan asprak pengisi (data URL gambar). */
    assistantSignature?: string | null;
}

function formatFullDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function splitLines(text: string | null, count: number = 3): string[] {
    if (!text) return Array(count).fill('');
    const lines = text.split('\n').filter(l => l.trim()).slice(0, count);
    while (lines.length < count) lines.push('');
    return lines;
}

interface CheckboxProps {
    checked: boolean;
    label: string;
}

function Checkbox({ checked, label }: CheckboxProps) {
    return (
        <View style={styles.checkboxRow}>
            <View style={styles.checkbox}>
                {checked && <View style={styles.checkboxChecked} />}
            </View>
            <Text style={styles.checkboxLabel}>{label}</Text>
        </View>
    );
}

export function BeritaAcaraPDF({ data, logoUrl }: { data: BeritaAcaraData; logoUrl?: string }) {
    const issueLines = splitLines(data.issues, 3);
    const followUpLines = splitLines(data.followUp, 3);
    const notHadir = data.totalStudents ? data.totalStudents - data.attendeeCount : null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* ===== HEADER ===== */}
                <View style={styles.headerRow}>
                    {logoUrl ? (
                        <Image src={logoUrl} style={styles.logo} />
                    ) : (
                        <View style={{ width: 60 }} />
                    )}
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>BERITA ACARA PELAKSANAAN PRAKTIKUM PROGRAM STUDI TEKNIK INDUSTRI</Text>
                        <Text style={styles.headerSubtitle}>UNIVERSITAS AL AZHAR INDONESIA — PERIODE SEMESTER GENAP 2025-2026</Text>
                    </View>
                    <View style={{ width: 60 }} />
                </View>
                <View style={styles.divider} />

                {/* ===== SECTION A ===== */}
                <Text style={styles.sectionTitle}>A. INFORMASI PRAKTIKUM</Text>
                <View style={styles.tableA}>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCellLabel}><Text>Mata Kuliah Praktikum</Text></View>
                        <View style={styles.tableCellValue}><Text>{data.courseCode} - {data.courseName}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCellLabel}><Text>Dosen Pengampu</Text></View>
                        <View style={styles.tableCellValue}><Text>{data.lecturerName || '-'}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCellLabel}><Text>Asisten Praktikum</Text></View>
                        <View style={styles.tableCellValue}>
                            <Text>1. {data.assistantName} ({data.assistantId})</Text>
                            <Text>2. {data.partnerId ? `${data.partnerName || data.partnerId} (${data.partnerId})` : '-'}</Text>
                        </View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCellLabel}><Text>Kelas / Angkatan</Text></View>
                        <View style={styles.tableCellValue}><Text>{data.batch}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCellLabel}><Text>Ruang Laboratorium</Text></View>
                        <View style={styles.tableCellValue}><Text>{data.roomName}</Text></View>
                    </View>
                    <View style={styles.tableRow}>
                        <View style={styles.tableCellLabel}><Text>Hari/Tanggal Pelaksanaan</Text></View>
                        <View style={styles.tableCellValue}><Text>{formatFullDate(data.practicumDate)}</Text></View>
                    </View>
                    <View style={styles.tableRowLast}>
                        <View style={styles.tableCellLabel}><Text>Waktu Pelaksanaan</Text></View>
                        <View style={styles.tableCellValue}><Text>{data.startTime} - {data.endTime} WIB</Text></View>
                    </View>
                </View>

                {/* ===== SECTION B ===== */}
                <Text style={styles.sectionBTitle}>B. PELAKSANAAN PRAKTIKUM</Text>

                {/* B.1 Pelaksanaan */}
                <Text style={styles.sectionBSubtitle}>1.   Pelaksanaan</Text>
                <Text style={{ ...styles.fieldRow as any, fontSize: 9, marginBottom: 4 }}>
                    {'        '}Praktikum telah dilaksanakan dengan keterangan sebagai berikut:
                </Text>
                <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Judul Materi/Modul Praktikum</Text>
                    <Text style={styles.fieldColon}>:</Text>
                    <Text style={styles.fieldValue}>{data.moduleTitle || '-'}</Text>
                </View>
                <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Jumlah Mahasiswa Hadir</Text>
                    <Text style={styles.fieldColon}>:</Text>
                    <Text style={styles.fieldValue}>{data.attendeeCount} mahasiswa</Text>
                </View>
                <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Jumlah Mahasiswa Tidak Hadir</Text>
                    <Text style={styles.fieldColon}>:</Text>
                    <Text style={styles.fieldValue}>{notHadir !== null ? `${notHadir} mahasiswa` : '-'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 2 }}>
                    <Text style={{ fontSize: 9, width: '35%' }}>Kondisi Praktikum</Text>
                    <Text style={{ fontSize: 9, width: 8 }}>:</Text>
                    <Checkbox checked={data.condition === 'Lancar'} label="Lancar" />
                    <View style={{ width: 10 }} />
                    <Checkbox checked={data.condition === 'Kurang Lancar'} label="Kurang Lancar" />
                    <View style={{ width: 10 }} />
                    <Checkbox checked={data.condition === 'Terkendala'} label="Terkendala" />
                </View>
                <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Deskripsi Singkat Pelaksanaan</Text>
                    <Text style={styles.fieldColon}>:</Text>
                    <Text style={styles.fieldValue}>{data.description}</Text>
                </View>

                {/* B.2 Kendala */}
                <View style={{ marginTop: 6 }}>
                    <Text style={styles.sectionBSubtitle}>2.   Kendala</Text>
                    <Text style={{ ...styles.fieldRow as any, fontSize: 9, marginBottom: 4 }}>
                        {'        '}Kendala teknis maupun non-teknis yang ditemui pada praktikum hari ini:
                    </Text>
                    <View style={styles.numberedList}>
                        {issueLines.map((line, idx) => (
                            <View key={idx} style={styles.numberedItem}>
                                <Text style={styles.numberedNumber}>{idx + 1})</Text>
                                <Text style={styles.numberedLine}>{line}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* B.3 Tindak Lanjut */}
                <View style={{ marginTop: 4 }}>
                    <Text style={styles.sectionBSubtitle}>3.   Tindak Lanjut</Text>
                    <Text style={{ ...styles.fieldRow as any, fontSize: 9, marginBottom: 4 }}>
                        {'        '}Solusi dan rencana tindak lanjut untuk kendala tersebut:
                    </Text>
                    <View style={styles.numberedList}>
                        {followUpLines.map((line, idx) => (
                            <View key={idx} style={styles.numberedItem}>
                                <Text style={styles.numberedNumber}>{idx + 1})</Text>
                                <Text style={styles.numberedLine}>{line}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ===== CLOSING ===== */}
                <Text style={styles.closingText}>
                    Demikian berita acara ini dibuat dengan sebenar-benarnya sebagai bentuk laporan pelaksanaan praktikum dan pertanggungjawaban Asisten Praktikum.
                </Text>

                {/* ===== SIGNATURE ===== */}
                <View style={{ alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 9 }}>Mengetahui,</Text>
                </View>
                <View style={styles.signatureRow}>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureTitle}>Dosen Pengampu</Text>
                        <View style={styles.signatureSpace} />
                        <Text style={styles.signatureName}>{data.lecturerName || '(....................)'}</Text>
                        <Text style={styles.signatureId}>NIDN: {data.lecturerId || '.'}</Text>
                    </View>
                    <View style={styles.signatureBlock}>
                        <Text style={styles.signatureTitle}>Asisten Praktikum</Text>
                        <View style={{ ...styles.signatureSpace, alignItems: 'center', justifyContent: 'flex-end' }}>
                            {data.assistantSignature ? (
                                // eslint-disable-next-line jsx-a11y/alt-text
                                <Image src={data.assistantSignature} style={{ maxHeight: 48, maxWidth: 140, objectFit: 'contain' }} />
                            ) : null}
                        </View>
                        <Text style={styles.signatureName}>{data.assistantName}</Text>
                        <Text style={styles.signatureId}>NIM: {data.assistantId}</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
}
