# 02 - Requisitos Não Funcionais

## Desempenho

* O mapa deve apresentar a última localização conhecida da carga em tempo próximo do real.
* As consultas principais do painel administrativo devem responder em tempo adequado para uso operacional.
* O envio de pontos GPS deve suportar múltiplos motoristas ativos em simultâneo.

## Segurança

* Autenticação baseada em JWT.
* Autorização por perfil e permissões.
* Senhas armazenadas com hash seguro.
* Acesso aos dados limitado ao perfil do utilizador.

## Auditoria

* Alterações relevantes em cargas, viagens, entregas e incidentes devem ficar registadas em histórico.
* Eventos operacionais devem guardar data, hora e utilizador responsável.

## Disponibilidade

* O backend deve ser modular e preparado para implantação independente do frontend.
* O sistema deve recuperar a última localização conhecida quando a transmissão GPS estiver indisponível.

## Usabilidade

* Interface simples e responsiva.
* Fluxos curtos para ações frequentes, como criar carga, atribuir motorista e confirmar entrega.

## Manutenibilidade

* Arquitetura modular.
* APIs desacopladas do frontend.
* Backend orientado ao domínio.
* Código organizado por módulos e responsabilidades.
