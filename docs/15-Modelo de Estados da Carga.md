# 15 - Modelo de Estados da Carga

## Estados

* Criada
* Planeada
* Aguardando Recolha
* Recolhida
* Em Trânsito
* Próxima do Destino
* Entregue
* Cancelada
* Com Incidente

## Transições principais

* Criada → Planeada
* Planeada → Aguardando Recolha
* Aguardando Recolha → Recolhida
* Recolhida → Em Trânsito
* Em Trânsito → Próxima do Destino
* Próxima do Destino → Entregue
* Qualquer estado operacional → Com Incidente
* Criada ou Planeada → Cancelada

## Observações

* O estado "Com Incidente" não precisa encerrar a viagem.
* Após resolução do incidente, a carga pode voltar ao fluxo operacional.
* "Entregue" representa conclusão operacional da carga.
