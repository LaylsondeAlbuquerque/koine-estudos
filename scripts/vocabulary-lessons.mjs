// The authored JSON is the source of truth. The former generator predated the
// expanded question bank and would silently discard reviewed exercises.
console.error('Este gerador foi desativado: sobrescreveria aulas e perguntas revisadas. Edite data/vocabulary-lessons.json diretamente e execute npm run check. Nenhum arquivo foi alterado.');
process.exitCode = 1;
