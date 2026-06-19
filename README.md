# BDR - Camara dos Deputados

Projeto local para padronizar dados da Camara dos Deputados, carregar o PostgreSQL via Docker e servir um dashboard com backend FastAPI e frontend React/Vite.

## Estrutura

- `src/`: ETL em Python para ler os CSVs, padronizar os dados e gerar as respostas.
- `Banco/`: banco PostgreSQL, `docker-compose.yml` e schema inicial.
- `questoes/`: consultas, respostas e artefatos organizados por pergunta (`q1` a `q13`).
- `dashboard/backend`: API FastAPI usada pelo dashboard.
- `dashboard/frontend`: interface React/Vite original.
- `dashboard/frontend-v2`: segunda interface React/Vite.
- `dashboard/frontend-v3`: nova interface React/Vite independente.
- `respostas/`: pasta legada de execucoes anteriores; o fluxo atual usa `questoes/qN/respostas`.

Cada pergunta fica autocontida:

```text
questoes/
  qN/
    consultas/
    respostas/
    artifacts/
```

## Requisitos

- Python 3.11+
- Docker Desktop
- Node.js 20+ e npm
- PowerShell

## Primeira vez no projeto

Na raiz do projeto, crie o ambiente Python e instale as dependencias:

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
.\venv\Scripts\python.exe -m pip install -r dashboard/backend/requirements.txt
```

Instale tambem as dependencias do frontend:

```powershell
cd dashboard\frontend
npm install
cd ..\..
```

Para trabalhar no `frontend-v3`, instale as dependencias dele separadamente:

```powershell
cd dashboard\frontend-v3
npm install
cd ..\..
```

## Como subir o dashboard

Use 3 terminais separados.

### Terminal 1: banco de dados

Na raiz do projeto:

```powershell
cd Banco
docker compose up -d
cd ..
```

O banco sobe pela configuracao em `Banco/docker-compose.yml`.

### Terminal 2: backend

Na raiz do projeto:

```powershell


.\venv\Scripts\python.exe -m uvicorn app.main:app --app-dir dashboard/backend --reload --host 0.0.0.0 --port 8000
```

Quando estiver rodando, teste no navegador:

```text
http://localhost:8000/api/health
```

### Terminal 3: frontend

Na raiz do projeto:

```powershell
cd dashboard\frontend

npm run dev -- --host 0.0.0.0 --port 5173
```

Para abrir o frontend-v2:

```powershell
cd dashboard\frontend-v2
npm run dev -- --host 0.0.0.0 --port 5174
```

Para abrir o frontend-v3:

```powershell
cd dashboard\frontend-v3
npm run dev
```

Acesse os frontends em:

```text
Frontend original: http://localhost:5173
Frontend v2:       http://localhost:5174
Frontend v3:       http://localhost:5175
```

Os frontends enviam as chamadas `/api` para o backend em `http://127.0.0.1:8000`.

## Atalho com Makefile

Se preferir usar os atalhos do `Makefile`, rode pela raiz do projeto:

```powershell
make dashboard-install
make dashboard-api
```

Em outro terminal, tambem na raiz:

```powershell
make dashboard-web
```

Para abrir backend e frontend de uma vez em processos separados:

```powershell
make dashboard-dev
```

## Enderecos uteis

- Frontend original: `http://localhost:5173`
- Frontend v2: `http://localhost:5174`
- Frontend v3: `http://localhost:5175`
- Saude da API: `http://localhost:8000/api/health`
- Metadados: `http://localhost:8000/api/meta`

## Q8 - grafo de comunidades de voto

A Q8 combina o ranking de influencia legislativa com um complemento de comunidades de voto. O complemento fica em `questoes/q8/respostas/q8_influencia_por_voto_extra.txt` e e gerado por:

```powershell
python questoes\q8\scripts\gerar_comunidades_leiden.py
```

Metodologia do grafo da Q8:

- Considera somente votos binarios `Sim` e `Nao`.
- Nao trata abstencao como concordancia: abstencoes, obstrucoes, ausencias e Artigo 17 ficam fora desta rede.
- Da mais peso a votacoes divisivas usando `peso = 4*p*(1-p)`, em que `p` e a proporcao de votos `Sim`.
- Usa Kappa de Cohen ponderado, e nao concordancia bruta, para reduzir concordancia esperada por acaso.
- Mantem no grafo pares com pelo menos 100 votacoes em comum, cobertura minima de 50% e `kappa >= 0.40`.
- Detecta comunidades com Leiden usando o Kappa ponderado como peso das arestas.

## Problemas comuns

- Se `npm run dev` abrir outra porta, confira se a `5173` ja esta ocupada.
- Se o frontend abrir mas nao carregar dados, confirme se o backend esta rodando na porta `8000`.
- Se o backend reclamar de dependencia ausente, rode novamente:

```powershell
.\venv\Scripts\python.exe -m pip install -r dashboard/backend/requirements.txt
```

- Se o banco nao subir, confirme se o Docker Desktop esta aberto antes de rodar `docker compose up -d`.

## Observacoes

- O dashboard le os arquivos exportados via API, sem consultar o banco direto.
- O backend usa caminhos por pergunta em `questoes/qN` e ainda aceita fallback para `respostas/` quando necessario.
