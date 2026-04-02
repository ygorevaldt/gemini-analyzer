import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "@/types/analysis";

export function generatePDF(result: AnalysisResult) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let startY = 20;

  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235);
  doc.text("Lupa de Requisitos", pageWidth / 2, startY, { align: "center" });

  startY += 8;
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text(`Relatório de Análise Crítica - ${new Date().toLocaleDateString()}`, pageWidth / 2, startY, {
    align: "center",
  });

  startY += 20;
  const overviewRows = [
    ["Funcionalidades", String(result.funcionalidades_principais.length)],
    ["Gaps de RN/RF", String(result.gaps_regra_negocio?.length ?? 0)],
    ["Falhas/Exceções", String(result.falhas_logicas_e_excecoes?.length ?? 0)],
    ["Conflitos Cross-Chunk", String(result.conflitos_cruzados?.length ?? 0)],
  ];

  autoTable(doc, {
    startY,
    head: [["Métrica", "Valor"]],
    body: overviewRows,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 40, halign: "center" },
    },
  });

  startY = (doc as any).lastAutoTable.finalY + 12;

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("Resumo do Projeto", 14, startY);
  startY += 8;

  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  let splitText = doc.splitTextToSize(result.projeto_resumo, pageWidth - 28);
  doc.text(splitText, 14, startY);
  startY += splitText.length * 5 + 8;

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Análise de Integridade", 14, startY);
  startY += 6;
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  splitText = doc.splitTextToSize(result.analise_integridade, pageWidth - 28);
  doc.text(splitText, 14, startY);
  startY += splitText.length * 5 + 8;

  if (result.metricas_qualidade) {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Métricas Quantitativas", 14, startY);
    startY += 6;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `RNs Satisfatórias: ${result.metricas_qualidade.rn_satisfatorias}  |  RNs com Gaps: ${result.metricas_qualidade.rn_com_gaps}`,
      14,
      startY,
    );
    startY += 5;
    doc.text(
      `RFs Satisfatórios: ${result.metricas_qualidade.rf_satisfatorios}  |  RFs com Gaps/Falhas: ${result.metricas_qualidade.rf_com_gaps}`,
      14,
      startY,
    );
    startY += 10;
  }

  if (result.conflitos_cruzados && result.conflitos_cruzados.length > 0) {
    if (startY > doc.internal.pageSize.getHeight() - 120) {
      doc.addPage();
      startY = 20;
    }

    const conflictCounts = result.conflitos_cruzados.reduce((acc: Record<string, number>, item) => {
      const type = item.tipo || "Não Identificado";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("Conflitos Document-Wide", 14, startY);
    startY += 8;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(`Total de conflitos globais detectados: ${result.conflitos_cruzados.length}`, 14, startY);
    startY += 6;

    autoTable(doc, {
      startY,
      head: [["Tipo de Conflito", "Quantidade"]],
      body: Object.entries(conflictCounts).map(([tipo, quantidade]) => [tipo, quantidade.toString()]),
      theme: "grid",
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 40, halign: "center" },
      },
    });
    startY = (doc as any).lastAutoTable.finalY + 12;
  }

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text("Conclusão Técnica", 14, startY);
  startY += 6;
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  splitText = doc.splitTextToSize(result.conclusao_tecnica, pageWidth - 28);
  doc.text(splitText, 14, startY);
  startY += splitText.length * 5 + 12;

  autoTable(doc, {
    startY,
    head: [["Core Features / Funcionalidades Principais"]],
    body: result.funcionalidades_principais.map((f) => [f]),
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 10 },
  });
  startY = (doc as any).lastAutoTable.finalY + 15;

  if (result.falhas_logicas_e_excecoes && result.falhas_logicas_e_excecoes.length > 0) {
    autoTable(doc, {
      startY,
      head: [["Problema / Exceção Ausente", "Impacto", "Seção", "Pág", "Sugestão de Correção"]],
      body: result.falhas_logicas_e_excecoes.map((f) => [
        f.problema,
        f.impacto,
        f.sessao || "-",
        f.pagina || "-",
        f.sugestao_correcao,
      ]),
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20 },
        2: { cellWidth: 30 },
        3: { cellWidth: 15, halign: "center" },
        4: { cellWidth: 65 },
      },
      styles: { fontSize: 9 },
    });
    startY = (doc as any).lastAutoTable.finalY + 15;
  }

  doc.save("Relatorio_AnaliseCritica_LupaDeRequisitos.pdf");
}

export function generateHTML(result: AnalysisResult) {
  const element = document.getElementById("report-content");
  if (!element) return;

  const reportHtml = element.innerHTML;
  
  // Custom dashboard for HTML export
  const metrics = result.metricas_qualidade || { rn_satisfatorias: 0, rn_com_gaps: 0, rf_satisfatorios: 0, rf_com_gaps: 0 };
  
  const dashboardHtml = `
    <section class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
      <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <p class="text-xs uppercase tracking-widest text-zinc-500 mb-2">RNs OK</p>
        <p class="text-3xl font-bold text-emerald-500">${metrics.rn_satisfatorias}</p>
      </div>
      <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <p class="text-xs uppercase tracking-widest text-zinc-500 mb-2">RNs c/ Gaps</p>
        <p class="text-3xl font-bold text-orange-500">${metrics.rn_com_gaps}</p>
      </div>
      <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <p class="text-xs uppercase tracking-widest text-zinc-500 mb-2">RFs OK</p>
        <p class="text-3xl font-bold text-blue-500">${metrics.rf_satisfatorios}</p>
      </div>
      <div class="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <p class="text-xs uppercase tracking-widest text-zinc-500 mb-2">RFs Falhos</p>
        <p class="text-3xl font-bold text-red-500">${metrics.rf_com_gaps}</p>
      </div>
    </section>

    <section class="bg-blue-600/10 p-8 rounded-3xl border border-blue-500/20 mb-10">
      <h2 class="text-xl font-bold text-blue-400 mb-4 uppercase tracking-wider">Saúde do Documento</h2>
      <div class="w-full bg-zinc-800 h-4 rounded-full overflow-hidden flex">
        <div style="width: ${Math.max(5, (metrics.rn_satisfatorias / (metrics.rn_satisfatorias + metrics.rn_com_gaps + 0.1)) * 100)}%" class="bg-emerald-500 h-full"></div>
        <div style="width: ${Math.max(5, (metrics.rn_com_gaps / (metrics.rn_satisfatorias + metrics.rn_com_gaps + 0.1)) * 100)}%" class="bg-orange-500 h-full"></div>
      </div>
      <div class="flex justify-between mt-2 text-xs text-zinc-500 font-medium">
        <span>Conformidade RN</span>
        <span>Atenção Sugerida</span>
      </div>
    </section>
  `;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório - Lupa de Requisitos</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { darkMode: 'class' };
  </script>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 4rem 2rem; background-color: #09090b; color: #f4f4f5; }
    #html-report-container { max-width: 1200px; margin: 0 auto; }
    .grid { display: grid; }
    @media (min-width: 1024px) { .lg\\:grid-cols-2 { grid-template-cols: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body class="dark">
  <div id="html-report-container">
    <header class="text-center space-y-4 pb-12 mb-12 border-b border-zinc-800">
      <h1 class="text-5xl font-black tracking-tighter text-blue-500">LUPA DE REQUISITOS</h1>
      <p class="text-2xl text-zinc-400 font-light italic">Relatório de Auditoria Técnica de Software</p>
      <p class="text-sm text-zinc-600 uppercase tracking-widest mt-4">Gerado em: ${new Date().toLocaleString()}</p>
    </header>
    
    ${dashboardHtml}

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      ${reportHtml}
    </div>

    <footer class="mt-20 pt-10 border-t border-zinc-800 text-center text-zinc-600 text-xs">
      <p>Gerado automaticamente pela Lupa de Requisitos via Multi-Agent AI Pipeline.</p>
    </footer>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlTemplate], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Relatorio_Auditoria_LupaDeRequisitos.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
