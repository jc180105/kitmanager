import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function ExportButton({ kitnets }) {
    const [isOpen, setIsOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
    };

    // Prepare data for export
    const prepareData = () => {
        return kitnets.map(k => ({
            'Número': k.numero,
            'Status': k.status === 'livre' ? 'Livre' : 'Alugada',
            'Valor': formatCurrency(k.valor),
            'Descrição': k.descricao || '-',
            'Inquilino': k.inquilino_nome || '-',
            'Telefone': k.inquilino_telefone || '-',
            'Data Entrada': formatDate(k.data_entrada),
            'Vencimento': k.dia_vencimento ? `Dia ${k.dia_vencimento}` : '-',
            'Pagamento': k.status === 'alugada' ? (k.pago_mes ? 'Pago' : 'Pendente') : '-',
        }));
    };

    // Export to PDF
    const exportToPDF = async () => {
        setExporting(true);
        setIsOpen(false);

        try {
            const doc = new jsPDF();

            // Calculate stats
            const livres = kitnets.filter(k => k.status === 'livre').length;
            const alugadas = kitnets.filter(k => k.status === 'alugada').length;
            const kitnetsAlugadas = kitnets.filter(k => k.status === 'alugada');
            const pagos = kitnetsAlugadas.filter(k => k.pago_mes).length;
            const pendentes = kitnetsAlugadas.length - pagos;
            const receitaEsperada = kitnetsAlugadas.reduce((sum, k) => sum + parseFloat(k.valor || 0), 0);
            const receitaRecebida = kitnetsAlugadas.filter(k => k.pago_mes).reduce((sum, k) => sum + parseFloat(k.valor || 0), 0);
            const receitaPendente = receitaEsperada - receitaRecebida;
            const taxaOcupacao = kitnets.length > 0 ? ((alugadas / kitnets.length) * 100).toFixed(1) : 0;

            // Header background
            doc.setFillColor(15, 23, 42); // slate-900
            doc.rect(0, 0, 220, 45, 'F');

            // Title
            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.text('KitManager', 14, 18);

            doc.setFontSize(14);
            doc.setTextColor(16, 185, 129); // emerald
            doc.text('Relatório de Kitnets', 14, 28);

            // Date
            doc.setFontSize(9);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 38);

            // Stats boxes - Row 1
            const boxY = 52;
            const boxHeight = 22;
            const boxWidth = 44;
            const gap = 4;

            // Box 1: Total
            doc.setFillColor(30, 41, 59); // slate-800
            doc.roundedRect(14, boxY, boxWidth, boxHeight, 3, 3, 'F');
            doc.setFontSize(18);
            doc.setTextColor(255, 255, 255);
            doc.text(String(kitnets.length), 36, boxY + 10, { align: 'center' });
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text('Total', 36, boxY + 17, { align: 'center' });

            // Box 2: Livres
            doc.setFillColor(16, 185, 129, 30); // emerald with opacity
            doc.roundedRect(14 + boxWidth + gap, boxY, boxWidth, boxHeight, 3, 3, 'F');
            doc.setFontSize(18);
            doc.setTextColor(16, 185, 129);
            doc.text(String(livres), 36 + boxWidth + gap, boxY + 10, { align: 'center' });
            doc.setFontSize(8);
            doc.setTextColor(16, 185, 129);
            doc.text('Livres', 36 + boxWidth + gap, boxY + 17, { align: 'center' });

            // Box 3: Alugadas
            doc.setFillColor(239, 68, 68, 30); // red with opacity
            doc.roundedRect(14 + (boxWidth + gap) * 2, boxY, boxWidth, boxHeight, 3, 3, 'F');
            doc.setFontSize(18);
            doc.setTextColor(239, 68, 68);
            doc.text(String(alugadas), 36 + (boxWidth + gap) * 2, boxY + 10, { align: 'center' });
            doc.setFontSize(8);
            doc.setTextColor(239, 68, 68);
            doc.text('Alugadas', 36 + (boxWidth + gap) * 2, boxY + 17, { align: 'center' });

            // Box 4: Taxa Ocupação
            doc.setFillColor(59, 130, 246, 30); // blue with opacity
            doc.roundedRect(14 + (boxWidth + gap) * 3, boxY, boxWidth, boxHeight, 3, 3, 'F');
            doc.setFontSize(18);
            doc.setTextColor(59, 130, 246);
            doc.text(`${taxaOcupacao}%`, 36 + (boxWidth + gap) * 3, boxY + 10, { align: 'center' });
            doc.setFontSize(8);
            doc.setTextColor(59, 130, 246);
            doc.text('Ocupação', 36 + (boxWidth + gap) * 3, boxY + 17, { align: 'center' });

            // Financial Summary Section
            const finY = boxY + boxHeight + 8;
            doc.setFillColor(30, 41, 59);
            doc.roundedRect(14, finY, 182, 28, 3, 3, 'F');

            doc.setFontSize(10);
            doc.setTextColor(148, 163, 184);
            doc.text('RESUMO FINANCEIRO', 20, finY + 8);

            // Financial stats
            const finStatsY = finY + 16;
            doc.setFontSize(9);

            // Receita Esperada
            doc.setTextColor(148, 163, 184);
            doc.text('Esperado:', 20, finStatsY);
            doc.setTextColor(255, 255, 255);
            doc.text(formatCurrency(receitaEsperada), 20, finStatsY + 6);

            // Receita Recebida
            doc.setTextColor(148, 163, 184);
            doc.text('Recebido:', 70, finStatsY);
            doc.setTextColor(16, 185, 129);
            doc.text(formatCurrency(receitaRecebida), 70, finStatsY + 6);

            // Pendente
            doc.setTextColor(148, 163, 184);
            doc.text('Pendente:', 120, finStatsY);
            doc.setTextColor(245, 158, 11); // amber
            doc.text(formatCurrency(receitaPendente), 120, finStatsY + 6);

            // Pagos/Pendentes count
            doc.setTextColor(148, 163, 184);
            doc.text(`Pagos: ${pagos} | Pendentes: ${pendentes}`, 165, finStatsY + 3);

            // Table - Only rented units
            const tableY = finY + 36;

            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text('Kitnets Alugadas', 14, tableY);

            const rentedData = kitnets
                .filter(k => k.status === 'alugada')
                .map(k => [
                    String(k.numero).padStart(2, '0'),
                    k.inquilino_nome || '-',
                    k.inquilino_telefone || '-',
                    formatCurrency(k.valor),
                    k.dia_vencimento ? `Dia ${k.dia_vencimento}` : '-',
                    k.pago_mes ? '✓ Pago' : '⏳ Pendente',
                ]);

            if (rentedData.length > 0) {
                autoTable(doc, {
                    head: [['Nº', 'Inquilino', 'Telefone', 'Valor', 'Vencimento', 'Status Pagto']],
                    body: rentedData,
                    startY: tableY + 4,
                    styles: { fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
                    alternateRowStyles: { fillColor: [241, 245, 249] },
                    columnStyles: {
                        0: { cellWidth: 12, halign: 'center' },
                        1: { cellWidth: 45 },
                        2: { cellWidth: 35 },
                        3: { cellWidth: 28, halign: 'right' },
                        4: { cellWidth: 25, halign: 'center' },
                        5: { cellWidth: 30, halign: 'center' },
                    },
                    didParseCell: (data) => {
                        if (data.column.index === 5 && data.section === 'body') {
                            if (data.cell.raw.includes('Pago')) {
                                data.cell.styles.textColor = [16, 185, 129];
                                data.cell.styles.fontStyle = 'bold';
                            } else {
                                data.cell.styles.textColor = [245, 158, 11];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    },
                });
            } else {
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.text('Nenhuma kitnet alugada no momento.', 14, tableY + 12);
            }

            // All units table on new page
            doc.addPage();

            // Header
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 220, 25, 'F');
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.text('Lista Completa de Kitnets', 14, 16);

            const allData = kitnets.map(k => [
                String(k.numero).padStart(2, '0'),
                k.status === 'livre' ? 'Livre' : 'Alugada',
                formatCurrency(k.valor),
                (k.descricao || '-').substring(0, 25),
                k.inquilino_nome || '-',
            ]);

            autoTable(doc, {
                head: [['Nº', 'Status', 'Valor', 'Descrição', 'Inquilino']],
                body: allData,
                startY: 32,
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [71, 85, 105] },
                alternateRowStyles: { fillColor: [241, 245, 249] },
                columnStyles: {
                    0: { cellWidth: 12, halign: 'center' },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 28, halign: 'right' },
                    3: { cellWidth: 60 },
                    4: { cellWidth: 50 },
                },
                didParseCell: (data) => {
                    if (data.column.index === 1 && data.section === 'body') {
                        if (data.cell.raw === 'Livre') {
                            data.cell.styles.textColor = [16, 185, 129];
                            data.cell.styles.fontStyle = 'bold';
                        } else {
                            data.cell.styles.textColor = [239, 68, 68];
                            data.cell.styles.fontStyle = 'bold';
                        }
                    }
                },
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text(`KitManager - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
            }

            doc.save(`kitnets_relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
        } finally {
            setExporting(false);
        }
    };

    // Export to Excel
    const exportToExcel = async () => {
        setExporting(true);
        setIsOpen(false);

        try {
            const data = prepareData();

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Main sheet
            const ws = XLSX.utils.json_to_sheet(data);

            // Set column widths
            ws['!cols'] = [
                { wch: 8 },  // Número
                { wch: 10 }, // Status
                { wch: 12 }, // Valor
                { wch: 30 }, // Descrição
                { wch: 25 }, // Inquilino
                { wch: 15 }, // Telefone
                { wch: 15 }, // Data Entrada
                { wch: 12 }, // Vencimento
                { wch: 12 }, // Pagamento
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Kitnets');

            // Summary sheet
            const livres = kitnets.filter(k => k.status === 'livre').length;
            const alugadas = kitnets.filter(k => k.status === 'alugada').length;
            const kitnetsAlugadas = kitnets.filter(k => k.status === 'alugada');
            const pagos = kitnetsAlugadas.filter(k => k.pago_mes).length;
            const pendentes = kitnetsAlugadas.length - pagos;
            const receitaEsperada = kitnetsAlugadas.reduce((sum, k) => sum + parseFloat(k.valor || 0), 0);
            const receitaRecebida = kitnetsAlugadas.filter(k => k.pago_mes).reduce((sum, k) => sum + parseFloat(k.valor || 0), 0);

            const summaryData = [
                { 'Métrica': 'Total de Kitnets', 'Valor': kitnets.length },
                { 'Métrica': 'Kitnets Livres', 'Valor': livres },
                { 'Métrica': 'Kitnets Alugadas', 'Valor': alugadas },
                { 'Métrica': 'Taxa de Ocupação', 'Valor': `${((alugadas / kitnets.length) * 100).toFixed(1)}%` },
                { 'Métrica': '', 'Valor': '' },
                { 'Métrica': 'FINANCEIRO', 'Valor': '' },
                { 'Métrica': 'Receita Esperada', 'Valor': formatCurrency(receitaEsperada) },
                { 'Métrica': 'Receita Recebida', 'Valor': formatCurrency(receitaRecebida) },
                { 'Métrica': 'Receita Pendente', 'Valor': formatCurrency(receitaEsperada - receitaRecebida) },
                { 'Métrica': 'Inquilinos Pagos', 'Valor': pagos },
                { 'Métrica': 'Inquilinos Pendentes', 'Valor': pendentes },
            ];

            const wsSummary = XLSX.utils.json_to_sheet(summaryData);
            wsSummary['!cols'] = [{ wch: 25 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo');

            // Save
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, `kitnets_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error('Erro ao exportar Excel:', error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={exporting || kitnets.length === 0}
                className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                aria-label="Exportar relatório"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} aria-hidden="true" />
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button
                        onClick={exportToPDF}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                        <FileText className="w-5 h-5 text-red-400" aria-hidden="true" />
                        <div>
                            <p className="font-medium">PDF</p>
                            <p className="text-xs text-slate-400">Relatório completo</p>
                        </div>
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-slate-700 transition-colors border-t border-slate-700"
                    >
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                        <div>
                            <p className="font-medium">Excel</p>
                            <p className="text-xs text-slate-400">Planilha com resumo</p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}

export default ExportButton;
