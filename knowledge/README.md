# Base de conhecimento

Os materiais de estudo **não são versionados** neste repositório — cada pessoa coloca aqui o próprio conteúdo autorizado.

Organize seus arquivos por namespace e faça a ingestão no banco vetorial:

```bash
npm run ingest -- --namespace course --path ./knowledge/course
```

Formatos suportados: `.md`, `.txt`, `.json`, `.csv`, `.html` e `.htm`. Cada nova ingestão substitui os chunks anteriores da mesma fonte e namespace.
