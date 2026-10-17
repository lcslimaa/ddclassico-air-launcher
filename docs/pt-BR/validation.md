# Validação da reorganização

[English](../en/validation.md) · [Índice](README.md)

Verificações realizadas em 16 de outubro de 2026, no macOS, com AIR SDK 51.4.1:

- 33 testes Node do helper, 12 testes Python e 2 scripts de teste Node das ferramentas aprovados.
- Build dos dois launchers produtivos e dos três probes aprovado.
- Links relativos e paridade dos documentos atuais em português e inglês verificados automaticamente.
- Sintaxe de cada script shell verificada individualmente.
- Cópia sem `.local/`, `build/` e dependências passou nos testes e na checagem da documentação.
- Ausência do SDK ou adaptador privado produz falha explícita. Com o adaptador e seus metadados locais, o build passou em caminho com espaços e a partir de outro diretório de trabalho.
- Transformação do adaptador comparada com a anterior usando as mesmas entradas locais: saídas equivalentes.
- Revisão independente comparou as fontes produtivas ActionScript e o transporte de sessão com a pasta anterior. As fontes foram preservadas; as mudanças de organização ajustam caminhos e entradas.

O jogo **ainda precisa ser validado manualmente pela nova pasta**, conforme o [roteiro de testes](testing.md). O relato de gameplay anterior pertence à versão anterior; não representa aprovação desta migração. Nenhum login foi feito para estas verificações.

O Git é somente local, sem remoto. O commit inicial usa identidade técnica local `DDClassico migration <migration@local.invalid>`; configure sua identidade antes dos próximos commits. Os recursos privados mínimos preparados nesta máquina continuam fora do Git; outra cópia precisará providenciá-los conforme o [guia de build](build.md).
