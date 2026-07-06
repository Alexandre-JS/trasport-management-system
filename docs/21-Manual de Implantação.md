# 21 - Manual de Implantação

## Pré-requisitos

* Node.js 18.12 ou superior.
* pnpm 10.x.
* PostgreSQL.
* Serviço de armazenamento compatível com S3 ou Supabase Storage.

## Configuração

* Configurar variáveis de ambiente do backend.
* Configurar ligação à base de dados.
* Configurar JWT secret.
* Configurar armazenamento de ficheiros.
* Configurar provedor de mapas.

## Comandos principais

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
```

## Produção

* Executar migrações da base de dados.
* Gerar build dos aplicativos.
* Configurar HTTPS.
* Configurar logs e monitorização.
* Configurar backups da base de dados.
