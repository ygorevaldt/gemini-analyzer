export type AnalysisResult = {
  projeto_resumo: string;
  funcionalidades_principais: string[];
  metricas_qualidade?: {
    rn_satisfatorias: number;
    rn_com_gaps: number;
    rf_satisfatorios: number;
    rf_com_gaps: number;
  };
  analise_integridade: string;
  falhas_logicas_e_excecoes: {
    problema: string;
    impacto: string;
    sessao: string;
    pagina: string;
    sugestao_correcao: string;
  }[];
  integracoes_e_dependencias: {
    sistema: string;
    status_especificacao: string;
    detalhe: string;
  }[];
  gaps_regra_negocio: {
    regra: string;
    cenario_omitido: string;
    risco: string;
    pagina: string;
  }[];
  mensagens_e_estados_ausentes: string[];
  conflitos_cruzados: {
    descricao: string;
    pagina_referencia: string;
    impacto: string;
    tipo: string;
    sugestao_correcao: string;
  }[];
  conclusao_tecnica: string;
};
