# ProjectDoc AI

ProjectDoc AI é uma skill protótipo para VS Code que analisa automaticamente um projeto de software aberto e gera documentação técnica organizada. O foco é dar suporte a projetos de TCC com regras de negócio, arquitetura, boas práticas e sugestões de diagramas C4.

## Instalação

1. Abra o workspace do projeto no VS Code.
2. Navegue até `projectdoc-ai` e instale as dependências se desejar usar o desenvolvimento local: `npm install`.
3. Instale a extensão localmente em modo de desenvolvimento se quiser testar no VS Code.

> Observação: esta extensão é um protótipo em JavaScript e não depende de serviços externos. Ela analisa a estrutura do repositório com heurísticas e gera documentação textual automática.

## Uso

1. Abra a paleta de comandos do VS Code (`Ctrl+Shift+P`).
2. Execute `ProjectDoc AI: Analyze Project and Generate Documentation`.
3. O relatório será gerado em `projectdoc-ai-output/projectdoc-ai-report.md` e aberto automaticamente.

## Funcionalidades

- Analisa diretórios e arquivos relevantes
- Identifica linguagens, frameworks e dependências
- Extrai regras de negócio explícitas e inferidas
- Detecta boas práticas e potenciais riscos técnicos
- Sugere estrutura de diagramas C4 de Contexto, Componentes e Código
- Gera documentação textual em formato Markdown

## Justificativa de implementação

Esta solução foi construída como um protótipo leve para atender aos critérios do TCC:

- `análise consistente`: varredura automática de estruturas e arquivos do workspace
- `texto técnico e objetivo`: saída em Markdown segmentada por seções
- `reutilizável`: pode ser adaptada para diferentes projetos sem reescrita completa
- `separação de responsabilidades`: análise, geração de texto e persistência de relatório estão isoladas em funções distintas
- `sem dependência de conteúdo manual excessivo`: o relatório é gerado a partir da leitura do repositório e de padrões detectados

## Extensibilidade futura

- integrar um provedor de IA externo (OpenAI, Anthropic) para refinamento de descrições
- adicionar comparador de versões e análise de mudanças
- detectar inconsistências entre código e documentação existente
- gerar relatórios executivos para bancas e professores

## Exemplo de saída

Veja o arquivo `projectdoc-ai/example-output.md` para um relatório gerado em um projeto real.
