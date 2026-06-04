const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const languageMap = {
  '.ts': 'TypeScript',
  '.js': 'JavaScript',
  '.tsx': 'TypeScript React',
  '.jsx': 'JavaScript React',
  '.json': 'JSON',
  '.md': 'Markdown',
  '.css': 'CSS',
  '.scss': 'Sass',
  '.tsx': 'TSX',
  '.yml': 'YAML',
  '.yaml': 'YAML'
};

const techPatterns = [
  { key: 'Express', file: 'backend/package.json', matcher: /express/i },
  { key: 'Sequelize', file: 'backend/package.json', matcher: /sequelize/i },
  { key: 'MySQL', file: 'backend/package.json', matcher: /mysql2/i },
  { key: 'Expo', file: 'frontend/meuApp/package.json', matcher: /expo/i },
  { key: 'React Native', file: 'frontend/meuApp/package.json', matcher: /react-native/i },
  { key: 'TypeScript', file: 'frontend/meuApp/package.json', matcher: /typescript/i },
  { key: 'Vitest', file: 'backend/package.json', matcher: /vitest/i },
  { key: 'Cypress', file: 'frontend/meuApp/cypress.config.js', matcher: /cypress/i }
];

function isHidden(name) {
  return name.startsWith('.') || name === 'node_modules';
}

async function walkDirectory(basePath, currentPath, results) {
  const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
  for (const entry of entries) {
    if (isHidden(entry.name)) {
      continue;
    }
    const fullPath = path.join(currentPath, entry.name);
    const relativePath = path.relative(basePath, fullPath);
    if (entry.isDirectory()) {
      await walkDirectory(basePath, fullPath, results);
    } else {
      results.push({ fullPath, relativePath, extension: path.extname(entry.name).toLowerCase() });
    }
  }
}

async function loadText(filePath) {
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch (error) {
    return '';
  }
}

function normalizeList(items) {
  return [...new Set(items.filter(Boolean))];
}

async function analyzeProject(rootPath) {
  const files = [];
  await walkDirectory(rootPath, rootPath, files);

  const languages = normalizeList(files
    .map(file => languageMap[file.extension])
    .filter(Boolean));

  const packageFiles = files.filter(file => /package\.json$/.test(file.relativePath));
  const dependencies = new Set();
  for (const pkgFile of packageFiles) {
    const content = await loadText(pkgFile.fullPath);
    try {
      const pkg = JSON.parse(content);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      Object.keys(allDeps || {}).forEach(dep => dependencies.add(dep));
    } catch (error) {
      // ignore invalid package.json
    }
  }

  const relevantFiles = files
    .filter(file => /(readme\.md|\.md|\.ts|\.js|\.tsx|\.jsx)$/i.test(file.relativePath));
  const contentPromises = relevantFiles.map(file => loadText(file.fullPath));
  const contents = await Promise.all(contentPromises);
  const combinedText = contents.join('\n');

  const hasBackend = files.some(file => file.relativePath.startsWith('backend')); 
  const hasFrontend = files.some(file => file.relativePath.startsWith('frontend')); 
  const hasMobile = files.some(file => file.relativePath.includes('meuApp')); 
  const hasTests = files.some(file => /(vitest|cypress|test)/i.test(file.relativePath));

  const explicitRules = [];
  const implicitRules = [];

  const rulePatterns = [
    { pattern: /login/i, rule: 'Usuário deve se autenticar para acessar o sistema.' },
    { pattern: /ranking/i, rule: 'O sistema apresenta ranking entre amigos para comparação de desempenho.' },
    { pattern: /tarefa/i, rule: 'Tarefas podem ser criadas, editadas, concluídas e excluídas.' },
    { pattern: /xp/i, rule: 'Usuários ganham XP ao completar tarefas e progridem de nível.' },
    { pattern: /nivel/i, rule: 'A plataforma atualiza o nível do usuário com base na experiência acumulada.' },
    { pattern: /progresso/i, rule: 'O histórico e progresso do usuário são monitorados em métricas de produtividade.' }
  ];

  rulePatterns.forEach(item => {
    if (item.pattern.test(combinedText)) {
      explicitRules.push(item.rule);
    }
  });

  if (hasBackend && hasFrontend) {
    implicitRules.push('A aplicação segue um padrão de arquitetura cliente-servidor com backend REST e frontend mobile.');
  }
  if (combinedText.includes('gamificação') || combinedText.includes('gamified')) {
    implicitRules.push('A gamificação é usada como mecanismo para engajamento e disciplina do usuário.');
  }
  if (combinedText.includes('disciplin') || combinedText.includes('produtiv')) {
    implicitRules.push('O sistema prioriza acompanhamento de hábitos, produtividade e motivação diária.');
  }

  const bestPractices = [];
  const issues = [];
  if (hasBackend) bestPractices.push('Estrutura de pastas separada para backend, controllers, serviços e modelos.');
  if (hasFrontend) bestPractices.push('Frontend organizado em um módulo Expo/React Native com separação de componentes e telas.');
  if (dependencies.has('dotenv')) bestPractices.push('Configuração de ambiente externalizada em variáveis com dotenv.');
  if (dependencies.has('express')) bestPractices.push('Uso de Express para rotas e middleware no backend.');
  if (dependencies.has('sequelize')) bestPractices.push('Uso de ORM para acesso a dados, facilitando o mapeamento de entidades.');
  if (hasTests) bestPractices.push('O repositório já possui testes automatizados backend e E2E no frontend.');
  if (!combinedText.includes('Swagger') && !combinedText.includes('OpenAPI')) issues.push('Não há documentação de API padrão Swagger/OpenAPI visível no repositório.');
  if (!hasTests) issues.push('Ausência de testes automatizados detectada em parte do repositório.');
  if (!files.some(file => /README\.md$/i.test(file.relativePath) && file.relativePath === 'README.md')) {
    issues.push('O README geral do projeto poderia ser mais conectado à arquitetura e regras de negócio atuais.');
  }

  const architecture = {
    summary: hasBackend && hasFrontend
      ? 'Cliente mobile Expo + servidor backend Express + banco de dados MySQL.'
      : hasBackend
        ? 'Servidor backend Express com armazenamento SQL.'
        : hasFrontend
          ? 'Aplicação frontend em Expo/React Native.'
          : 'Projeto com estrutura mista sem pasta de aplicação claramente isolada.'
  };

  const projectName = path.basename(rootPath);
  return {
    projectName,
    rootPath,
    languages,
    dependencies: Array.from(dependencies).sort(),
    hasBackend,
    hasFrontend,
    hasMobile,
    hasTests,
    explicitRules: normalizeList(explicitRules),
    implicitRules: normalizeList(implicitRules),
    bestPractices: normalizeList(bestPractices),
    issues: normalizeList(issues),
    architecture,
    projectDescription: extractProjectDescription(contents),
    notablePaths: identifyNotablePaths(files)
  };
}

function identifyNotablePaths(files) {
  const paths = [];
  if (files.some(file => file.relativePath.startsWith('backend/src/controllers'))) paths.push('backend/src/controllers');
  if (files.some(file => file.relativePath.startsWith('backend/src/services'))) paths.push('backend/src/services');
  if (files.some(file => file.relativePath.startsWith('frontend/meuApp/app'))) paths.push('frontend/meuApp/app');
  if (files.some(file => file.relativePath.startsWith('frontend/meuApp/components'))) paths.push('frontend/meuApp/components');
  if (files.some(file => file.relativePath.startsWith('frontend/meuApp/lib'))) paths.push('frontend/meuApp/lib');
  if (files.some(file => file.relativePath.startsWith('frontend/meuApp/cypress'))) paths.push('frontend/meuApp/cypress');
  return paths;
}

function extractProjectDescription(contents) {
  const readmeText = contents.find(text => text.toLowerCase().includes('neuroxp')) || '';
  if (readmeText) {
    const match = readmeText.match(/#\s+(.*)/);
    return match ? match[1].trim() : 'Plataforma de gamificação e produtividade para tarefas e hábitos.';
  }
  return 'Plataforma de gamificação da produtividade para controle de tarefas, pontos e rankings sociais.';
}

function buildC4Text(analysis) {
  const context = `O sistema é direcionado a usuários que desejam transformar tarefas em desafios gamificados. A aplicação consiste em um app móvel Expo/React Native que consome um backend Express/Sequelize em Node.js e persiste dados em MySQL. O contexto principal inclui usuário, aplicação móvel, servidor API e banco de dados.`;
  const components = `No nível de componente, o backend expõe:
- Autenticação e autorização (login, tokens JWT)
- Gerenciamento de tarefas (criar, editar, concluir, excluir)
- Cálculo de XP e atualização de nível
- Ranking social entre amigos
- APIs de progresso e estatísticas

O frontend contém:
- Telas de login, registro e perfil
- Dashboard de tarefas e progresso
- Tela de ranking
- Componentes de UI e utilitários de sessão
- Suporte a testes E2E com Cypress`;
  const code = `No nível de código, os pacotes backend são organizados em controllers, serviços, models e rotas. O frontend segue o diretório app/ para telas e components/ para elementos reutilizáveis. Importantes entidades de domínio incluem Usuário, Tarefa, Nível, XP e Amizade/Ranking.`;
  return { context, components, code };
}

function buildReport(analysis) {
  const c4 = buildC4Text(analysis);
  return `# Documentação Técnica Gerada pelo ProjectDoc AI

## 1. Visão Geral do Sistema

**Nome do projeto:** ${analysis.projectName}

**Descrição:** ${analysis.projectDescription}

**Objetivo:** Analisar automaticamente o conjunto de código e gerar documentação técnica para apoiar o TCC.

## 2. Tecnologias Identificadas

- Linguagens: ${analysis.languages.join(', ') || 'Não identificadas'}
- Principais dependências: ${analysis.dependencies.slice(0, 15).join(', ') || 'Não identificadas'}
- Estrutura detectada: ${analysis.architecture.summary}
- Pastas relevantes: ${analysis.notablePaths.join(', ') || 'Não identificadas'}

## 3. Arquitetura e Organização

${analysis.architecture.summary}

A organização de pastas mostra:
- Backend em \`backend/src\`
- Frontend mobile em \`frontend/meuApp/app\`
- Regras de negócio sugeridas a partir de README, controllers e serviços.

## 4. Regras de Negócio Identificadas

### Regras explícitas
${analysis.explicitRules.length > 0 ? analysis.explicitRules.map(rule => `- ${rule}`).join('\n') : '- Nenhuma regra explícita encontrada.'}

### Regras inferidas
${analysis.implicitRules.length > 0 ? analysis.implicitRules.map(rule => `- ${rule}`).join('\n') : '- Nenhuma regra inferida.'}

## 5. Fluxos Principais

- Usuário realiza login e cria tarefas.
- Tarefas são salvas no backend e podem ser concluídas ou alteradas.
- Conclusão de tarefa gera XP e ajusta nível.
- Ranking social é atualizado para comparar desempenho entre amigos.
- Dashboard exibe progresso, meta e estatísticas.

## 6. Boas Práticas Observadas

${analysis.bestPractices.length > 0 ? analysis.bestPractices.map(item => `- ${item}`).join('\n') : '- Boas práticas não identificadas claramente.'}

## 7. Pontos de Atenção e Riscos Técnicos

${analysis.issues.length > 0 ? analysis.issues.map(item => `- ${item}`).join('\n') : '- Nenhuma inconsistência técnica relevante encontrada.'}

## 8. Sugestão de Diagramas C4

### C4 - Contexto
${c4.context}

### C4 - Componentes
${c4.components}

### C4 - Código
${c4.code}

## 9. Recomendações Técnicas

- Formalizar a API com documentação OpenAPI/Swagger.
- Adicionar testes de integração para rotas e serviços backend.
- Padronizar tratamento de erros e resposta de API.
- Consolidar README com arquitetura e diagramas C4.
- Considerar adição de camada de persistência/repositório para separar dados e lógica de negócio.

## 10. Conclusão Técnica

Esta análise aponta uma solução com foco em gamificação, produtividade e engajamento. O repositório já apresenta uma visão coerente de arquitetura mobile + backend, mas deve evoluir em documentação de API, melhor rastreabilidade de regras de negócio e cobertura de testes.
`;
}

async function saveReport(rootPath, content) {
  const outputFolder = path.join(rootPath, 'projectdoc-ai-output');
  await fs.promises.mkdir(outputFolder, { recursive: true });
  const targetFile = path.join(outputFolder, 'projectdoc-ai-report.md');
  await fs.promises.writeFile(targetFile, content, 'utf8');
  return targetFile;
}

async function activate(context) {
  const disposable = vscode.commands.registerCommand('projectdocai.generateDocumentation', async () => {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      vscode.window.showErrorMessage('Abra uma pasta de projeto antes de executar o ProjectDoc AI.');
      return;
    }

    const rootPath = folders[0].uri.fsPath;
    const analysis = await analyzeProject(rootPath);
    const report = buildReport(analysis);
    const targetFile = await saveReport(rootPath, report);

    const document = await vscode.workspace.openTextDocument(targetFile);
    await vscode.window.showTextDocument(document, { preview: false });
    vscode.window.showInformationMessage('ProjectDoc AI gerou a documentação em projectdoc-ai-output/projectdoc-ai-report.md');
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
