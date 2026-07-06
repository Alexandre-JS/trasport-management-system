# 03 - Regras de Negócio

* Uma carga deve estar associada a um cliente.
* Uma viagem deve estar associada a uma carga.
* Uma viagem só pode iniciar quando possuir motorista e camião atribuídos.
* Um motorista só deve visualizar viagens atribuídas a ele.
* Um cliente só deve visualizar as suas próprias cargas.
* A recolha deve ser confirmada antes de a carga entrar em trânsito.
* A entrega deve ser confirmada pelo motorista para encerrar o ciclo operacional.
* A empresa pode encerrar a viagem após a confirmação da entrega.
* Incidentes podem ser reportados durante a viagem.
* Pontos GPS devem ser associados à viagem/carga em curso.
* O histórico da carga deve permanecer disponível após a entrega.
* Uma carga cancelada não deve seguir para estados operacionais posteriores.
