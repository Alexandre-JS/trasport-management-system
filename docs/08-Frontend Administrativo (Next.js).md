# 08 - Frontend Administrativo (Next.js)

## Tecnologia

* Next.js
* Tailwind CSS

## Telas principais

* Login
* Dashboard
* Clientes
* Motoristas
* Camiões
* Cargas
* Viagens
* Rastreamento em mapa
* Incidentes
* Entregas
* Relatórios
* Utilizadores e permissões

## Dashboard

Indicadores:

* Cargas em trânsito
* Cargas entregues
* Cargas pendentes
* Motoristas ativos
* Camiões em viagem
* Entregas do dia

## Fluxos administrativos

* Cadastrar cliente.
* Cadastrar motorista.
* Cadastrar camião.
* Criar carga.
* Criar viagem.
* Atribuir motorista e camião.
* Acompanhar viagem no mapa.
* Encerrar viagem.
* Consultar relatórios.

## Estrutura inicial do projeto

O frontend administrativo deve manter a seguinte separação:

* `app/` para rotas do App Router.
* `components/` para layout, navegação e componentes reutilizáveis.
* `services/` para integração futura com a API.
* `types/` para contratos TypeScript.
* `utils/` para constantes e funções auxiliares.

Chamadas HTTP não devem ser feitas diretamente nos componentes de tela; devem passar pela camada de `services`.

## Integração futura com API

O app web deve usar `NEXT_PUBLIC_API_BASE_URL` para configurar a URL do backend. A primeira versão inclui `services/api-client.ts` como ponto único de chamadas HTTP para evitar acoplamento entre componentes e API.
