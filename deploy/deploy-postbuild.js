/**
 * Corre no servidor da Hostinger no fim do build da API (ver deploy/stage-zip.sh,
 * que o copia para a raiz do zip e o acrescenta ao script `build`).
 *
 * A Hostinger não copia o `.env` para a raiz da app em runtime, e o Passenger
 * arranca a app com entry file `main.js` na pasta `dist`. Por isso:
 *  1. copia o `.env` (incluído no zip) para `dist/`;
 *  2. cria um shim `dist/main.js` que carrega o `.env` e arranca o bundle
 *     real (`nest build` emite `dist/src/main.js` porque o tsconfig inclui
 *     `prisma/` além de `src/`).
 */
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');

fs.copyFileSync(path.join(__dirname, '.env'), path.join(dist, '.env'));

fs.writeFileSync(
  path.join(dist, 'main.js'),
  "require('dotenv').config({ path: require('path').join(__dirname, '.env') });\n" +
    "require('./src/main.js');\n"
);

console.log('[deploy-postbuild] .env copiado para dist/ e shim dist/main.js criado');
