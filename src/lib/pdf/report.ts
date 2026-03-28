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
    if (startY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      startY = 20;
    }
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

  if (result.gaps_regra_negocio && result.gaps_regra_negocio.length > 0) {
    if (startY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      startY = 20;
    }
    autoTable(doc, {
      startY,
      head: [["Regra Incompleta", "Cenário Omitido", "Risco", "Pág"]],
      body: result.gaps_regra_negocio.map((g) => [g.regra, g.cenario_omitido, g.risco, g.pagina || "-"]),
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 70 },
        2: { cellWidth: 40 },
        3: { cellWidth: 20, halign: "center" },
      },
      styles: { fontSize: 9 },
    });
    startY = (doc as any).lastAutoTable.finalY + 15;
  }

  if (result.integracoes_e_dependencias && result.integracoes_e_dependencias.length > 0) {
    if (startY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      startY = 20;
    }
    autoTable(doc, {
      startY,
      head: [["Sistema / API", "Status Especificação", "Detalhe do que falta"]],
      body: result.integracoes_e_dependencias.map((sys) => [sys.sistema, sys.status_especificacao, sys.detalhe]),
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 100 },
      },
      styles: { fontSize: 9 },
    });
    startY = (doc as any).lastAutoTable.finalY + 15;
  }

  if (result.conflitos_cruzados && result.conflitos_cruzados.length > 0) {
    if (startY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      startY = 20;
    }
    autoTable(doc, {
      startY,
      head: [["Descrição", "Tipo", "Impacto", "Página", "Sugestão"]],
      body: result.conflitos_cruzados.map((c) => [
        c.descricao,
        c.tipo,
        c.impacto,
        c.pagina_referencia || "-",
        c.sugestao_correcao,
      ]),
      theme: "grid",
      headStyles: { fillColor: [139, 92, 246], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20, halign: "center" },
        4: { cellWidth: 60 },
      },
      styles: { fontSize: 8 },
    });
    startY = (doc as any).lastAutoTable.finalY + 15;
  }

  if (result.mensagens_e_estados_ausentes && result.mensagens_e_estados_ausentes.length > 0) {
    if (startY > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      startY = 20;
    }
    autoTable(doc, {
      startY,
      head: [["Mensagens e Estados Ausentes (Resiliência & UX)"]],
      body: result.mensagens_e_estados_ausentes.map((s) => [s]),
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241], textColor: 255 },
      styles: { fontSize: 10 },
    });
  }

  doc.save("Relatorio_AnaliseCritica_LupaDeRequisitos.pdf");
}

export function generateHTML(result: AnalysisResult) {
  const element = document.getElementById("report-content");
  if (!element) return;

  const reportHtml = element.innerHTML;
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="pt-BR" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Relatório - Lupa de Requisitos</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { darkMode: 'class' };
  </script>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 3rem; }
  </style>
</head>
<body class="bg-zinc-950 text-zinc-50 antialiased">
  <div class="max-w-7xl mx-auto space-y-10">
    <header class="text-center space-y-4 pb-8 mb-8 border-b border-zinc-800">
      <h1 class="text-4xl font-bold tracking-tight text-blue-400">Lupa de Requisitos</h1>
      <p class="text-xl text-zinc-300 font-medium">Relatório de Auditoria e Integridade</p>
      <p class="text-sm text-zinc-500">Gerado em: ${new Date().toLocaleString()}</p>
    </header>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">${reportHtml}</div>
  </div>
</body>
</html>
  `;

  const blob = new Blob([htmlTemplate], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Relatorio_AnaliseCritica_LupaDeRequisitos.html";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
