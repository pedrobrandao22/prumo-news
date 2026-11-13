# Backup do banco do Prumo

O robô **Backup do banco** (.github/workflows/backup.yml) copia o banco todo dia às 4h41 (Brasília) e guarda a cópia
por 30 dias na aba **Actions** do GitHub (cada execução tem um arquivo `prumo-backup-AAAA-MM-DD-…`).
A cópia é criptografada com a senha `BACKUP_SENHA`: sem ela, o arquivo não abre. **Guarde essa senha no gerenciador
de senhas**; se ela se perder, as cópias se perdem junto.

O que vai na cópia:
- `app.dump`: tudo do app (tabelas, dados, funções, regras de acesso) do schema `public`.
- `contas.dump`: as contas (`auth.users`, `auth.identities`) e a lista de fotos (`storage.objects`; os arquivos das
  fotos em si ficam no Storage do Supabase e não entram na cópia).

## Baixar e abrir uma cópia
1. GitHub › Actions › "Backup do banco" › a execução do dia › Artifacts › baixar. Vem um .zip com o arquivo `.gpg`.
2. Abrir (num computador com `gpg`, `tar` e o PostgreSQL 17 instalado):
   ```
   gpg -d prumo-AAAA-MM-DD-HHhMM.tar.gz.gpg | tar -xzf -
   ```
   (pede a senha `BACKUP_SENHA`; saem `app.dump` e `contas.dump`.)

## Restaurar (só se o banco se perder — pedir ajuda ao Claude, sem passar senha nem chave para ele)
Num projeto Supabase novo (ou no mesmo, vazio), com a connection string dele em `$URL`:
```
pg_restore --no-owner --no-privileges -d "$URL" app.dump
pg_restore --data-only --disable-triggers -d "$URL" contas.dump
```
Depois: trocar no app a URL e a chave publicável, se o projeto for outro (build.py), e rodar de novo o SQL de
segurança mais recente.

## Se o robô ficar vermelho
- "Falta o segredo …": criar o segredo (Settings › Secrets and variables › Actions).
- Erro de conexão/senha: a senha do banco mudou; atualizar `SUPABASE_DB_URL` com a string nova (Connect › Session pooler).
- "server version mismatch": o Supabase subiu de versão do Postgres; trocar `17` pela versão nova no backup.yml.
