# Início rápido

[English](../en/quickstart.md) · [Índice](README.md)

O projeto contém um helper Electron e um aplicativo AIR. Use macOS para reproduzir o ambiente validado. É necessário Node.js/npm compatível com Electron 44.4.5, Python 3, Bash e o AIR SDK HARMAN com `amxmlc` e `adl`. Java/JPEXS é necessário somente para preparar novamente o adaptador, não para executar um build já preparado. Windows não tem pacote ou validação disponíveis.

Configure o caminho do SDK em cada terminal, sem adicioná-lo ao Git:

```bash
export DDCLASSICO_AIR_SDK='/caminho/para/AIRSDK'
npm test
npm run build
npm run start:pilot
```

O primeiro início instala as dependências fixadas do helper usando seu lockfile. Para instalar explicitamente: `npm ci --prefix apps/login-helper`. Os testes de lógica não exigem Electron instalado nem uma conta. O build exige os recursos privados descritos em [build](build.md); um clone limpo não contém o jogo.

O modo integrado é `npm run start:pilot`. `npm start` preserva o modo clássico. Os wrappers `run-layout-pilot.sh` e `run-login-helper.sh` também continuam disponíveis. Feche o helper/jogo anterior antes de iniciar outra tentativa. Na migração, não execute a pasta antiga e a nova juntas: os locks pertencem ao diretório de runtime de cada cópia.

Faça login no site oficial dentro do helper e escolha o servidor. O jogo abre no AIR quando os parâmetros forem capturados. Não é necessário gerar HAR ou exportar sessão para o fluxo normal. Novas execuções precisam de parâmetros frescos; não reutilize arquivos de sessões antigas.

Antes de considerar o novo checkout validado, execute a lista de [testes](testing.md). A compilação não comprova login nem jogabilidade.
