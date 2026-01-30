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
        }));
    };

    // Export to PDF
    const exportToPDF = async () => {
        setExporting(true);
        setIsOpen(false);

        try {
            const doc = new jsPDF();
            const data = prepareData();

            // Title
            doc.setFontSize(20);
            doc.setTextColor(16, 185, 129); // Emerald color
            doc.text('Relatório de Kitnets', 14, 22);

            // Date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

            // Stats
            const livres = kitnets.filter(k => k.status === 'livre').length;
            const alugadas = kitnets.filter(k => k.status === 'alugada').length;
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(`Total: ${kitnets.length} | Livres: ${livres} | Alugadas: ${alugadas}`, 14, 40);

            // Table
            autoTable(doc, {
                head: [['Nº', 'Status', 'Valor', 'Descrição', 'Inquilino', 'Telefone']],
                body: data.map(row => [
                    row['Número'],
                    row['Status'],
                    row['Valor'],
                    row['Descrição'].substring(0, 30),
                    row['Inquilino'],
                    row['Telefone'],
                ]),
                startY: 48,
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [16, 185, 129] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 25 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 50 },
                    4: { cellWidth: 35 },
                    5: { cellWidth: 30 },
                },
            });

            doc.save(`kitnets_${new Date().toISOString().split('T')[0]}.pdf`);
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
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Kitnets');

            // Summary sheet
            const livres = kitnets.filter(k => k.status === 'livre').length;
            const alugadas = kitnets.filter(k => k.status === 'alugada').length;
            const totalValor = kitnets.reduce((sum, k) => sum + parseFloat(k.valor || 0), 0);

            const summaryData = [
                { 'Métrica': 'Total de Kitnets', 'Valor': kitnets.length },
                { 'Métrica': 'Kitnets Livres', 'Valor': livres },
                { 'Métrica': 'Kitnets Alugadas', 'Valor': alugadas },
                { 'Métrica': 'Taxa de Ocupação', 'Valor': `${((alugadas / kitnets.length) * 100).toFixed(1)}%` },
                { 'Métrica': 'Receita Potencial', 'Valor': formatCurrency(totalValor) },
                { 'Métrica': 'Receita Atual (Alugadas)', 'Valor': formatCurrency(kitnets.filter(k => k.status === 'alugada').reduce((sum, k) => sum + parseFloat(k.valor || 0), 0)) },
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
                            <p className="text-xs text-slate-400">Documento formatado</p>
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
