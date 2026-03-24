

## Plano: Renomear sistema para NewRender

Trocar todas as referências de "FCD ViewPrompt" / "FCD VIEWPROMPT" para **NewRender**, com a parte "RENDER" em cor fuchsia nas partes estilizadas do logo.

### Mapeamento de substituições

| De | Para |
|---|---|
| `FCD <span className="text-primary">VIEW</span>PROMPT` | `NEW<span className="text-primary">RENDER</span>` |
| `FCD VIEWPROMPT` (texto puro, uppercase) | `NEWRENDER` |
| `FCD ViewPrompt` (texto corrido) | `NewRender` |
| `FCDViewPrompt` (short_name) | `NewRender` |
| `ARCHVIZ INTELLIGENCE LAB` | `NEWRENDER` |
| `fcdviewprompt.com.br` (URLs/emails) | `newrender.com.br` |
| `suporte@fcdviewprompt.com.br` | `suporte@newrender.com.br` |

### Arquivos alterados

| Arquivo | Tipo de mudança |
|---|---|
| `index.html` | Meta tags, title, canonical, OG, Twitter |
| `public/manifest.json` | name, short_name |
| `public/sitemap.xml` | URLs do domínio |
| `public/robots.txt` | URL do sitemap |
| `src/components/fachadista/AppHeader.tsx` | Logo estilizado |
| `src/components/shared/LegalFooter.tsx` | Nome no footer + copyright + email |
| `src/pages/Login.tsx` | Logo estilizado + copyright |
| `src/pages/NotFound.tsx` | Logo estilizado |
| `src/pages/Terms.tsx` | Logo estilizado + conteúdo legal |
| `src/pages/Privacy.tsx` | Logo estilizado + conteúdo legal |
| `src/pages/Plans.tsx` | Email de contato no FAQ |
| `.lovable/memory/index.md` | Atualizar nome do projeto |

### Detalhes

- Nas partes estilizadas (header, login, 404, legal pages): `NEW<span className="text-primary">RENDER</span>`
- No copyright do footer: `© 2026 NEWRENDER`
- Emails mudam para `suporte@newrender.com.br`
- URLs canônicas mudam para `newrender.com.br`
- Nenhuma alteração funcional — apenas branding textual

