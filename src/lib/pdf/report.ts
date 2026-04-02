import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "@/types/analysis";

export function generatePDF(result: AnalysisResult) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let startY = 20;

  // Header
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

  // Overview Table
  const overviewRows = [
    ["Funcionalidades Principais", String(result.funcionalidades_principais.length)],
    ["Gaps de Regra de Negócio", String(result.gaps_regra_negocio?.length ?? 0)],
    ["Falhas Lógicas e Exceções", String(result.falhas_logicas_e_excecoes?.length ?? 0)],
    ["Conflitos Cruzados", String(result.conflitos_cruzados?.length ?? 0)],
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

  // Projeto Resumo
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text("Resumo do Projeto", 14, startY);
  startY += 8;
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  let splitText = doc.splitTextToSize(result.projeto_resumo, pageWidth - 28);
  doc.text(splitText, 14, startY);
  startY += splitText.length * 5 + 10;

  // Analise Integridade
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Análise de Integridade", 14, startY);
  startY += 6;
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  splitText = doc.splitTextToSize(result.analise_integridade, pageWidth - 28);
  doc.text(splitText, 14, startY);
  startY += splitText.length * 5 + 10;

  // Conclusão Técnica
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Parecer e Conclusão Técnica", 14, startY);
  startY += 6;
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  splitText = doc.splitTextToSize(result.conclusao_tecnica, pageWidth - 28);
  doc.text(splitText, 14, startY);
  startY += splitText.length * 5 + 15;

  // Tables
  const checkNewPage = (neededRows: number = 3) => {
    if (startY > doc.internal.pageSize.getHeight() - (neededRows * 10)) {
      doc.addPage();
      startY = 20;
    }
  };

  // Funcionalidades
  checkNewPage();
  autoTable(doc, {
    startY,
    head: [["Funcionalidades Principais"]],
    body: result.funcionalidades_principais.map(f => [f]),
    theme: "grid",
    headStyles: { fillColor: [16, 185, 129], textColor: 255 },
    styles: { fontSize: 9 },
  });
  startY = (doc as any).lastAutoTable.finalY + 12;

  // Falhas e Exceções
  if (result.falhas_logicas_e_excecoes?.length > 0) {
    checkNewPage();
    autoTable(doc, {
      startY,
      head: [["Falha Lógica / Exceção", "Impacto", "Seção", "Pág", "Sugestão"]],
      body: result.falhas_logicas_e_excecoes.map(f => [
        f.problema,
        f.impacto,
        f.sessao || "-",
        f.pagina || "-",
        f.sugestao_correcao
      ]),
      theme: "grid",
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 50 }, 4: { cellWidth: 60 } }
    });
    startY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Gaps de Regra de Negócio
  if (result.gaps_regra_negocio?.length > 0) {
    checkNewPage();
    autoTable(doc, {
      startY,
      head: [["Regra de Negócio", "Cenário Omitido", "Risco", "Pág"]],
      body: result.gaps_regra_negocio.map(g => [
        g.regra,
        g.cenario_omitido,
        g.risco,
        g.pagina || "-"
      ]),
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 70 } }
    });
    startY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Integrações
  if (result.integracoes_e_dependencias?.length > 0) {
    checkNewPage();
    autoTable(doc, {
      startY,
      head: [["Sistema / API", "Status", "Detalhe do que falta", "Pág", "Impacto"]],
      body: result.integracoes_e_dependencias.map(i => [
        i.sistema,
        i.status_especificacao,
        i.detalhe,
        i.pagina || "-",
        i.impacto || "-"
      ]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 2: { cellWidth: 80 } }
    });
    startY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Conflitos Cruzados
  if (result.conflitos_cruzados?.length > 0) {
    checkNewPage();
    autoTable(doc, {
      startY,
      head: [["Descrição do Conflito", "Tipo", "Impacto", "Pág", "Sugestão"]],
      body: result.conflitos_cruzados.map(c => [
        c.descricao,
        c.tipo,
        c.impacto,
        c.pagina_referencia || "-",
        c.sugestao_correcao
      ]),
      theme: "grid",
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 60 }, 4: { cellWidth: 50 } }
    });
    startY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Estados Ausentes
  if (result.mensagens_e_estados_ausentes?.length > 0) {
    checkNewPage();
    autoTable(doc, {
      startY,
      head: [["Sugestões de Resiliência e UX (Estados Ausentes)"]],
      body: result.mensagens_e_estados_ausentes.map(s => [s]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 9 },
    });
  }

  doc.save("Relatorio_Auditoria_LupaDeRequisitos.pdf");
}

export function generateHTML(result: AnalysisResult) {
  const element = document.getElementById("report-content");
  if (!element) return;

  const reportHtml = element.innerHTML;
  const metrics = result.metricas_qualidade || { rn_satisfatorias: 0, rn_com_gaps: 0, rf_satisfatorios: 0, rf_com_gaps: 0 };
  
  const dashboardHtml = `
    <section class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 text-zinc-100">
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
  `;

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório - Lupa de Requisitos</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 4rem 2rem; background-color: #09090b; color: #f4f4f5; }
    #html-report-container { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body class="dark bg-zinc-950">
  <div id="html-report-container">
    <header class="text-center space-y-4 pb-12 mb-12 border-b border-zinc-800">
      <h1 class="text-5xl font-black tracking-tighter text-blue-500 uppercase">Lupa de Requisitos</h1>
      <p class="text-xl text-zinc-400">Relatório de Auditoria e Integridade Técnica</p>
      <p class="text-sm text-zinc-600">Gerado em: ${new Date().toLocaleString()}</p>
    </header>
    ${dashboardHtml}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      ${reportHtml}
    </div>
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
