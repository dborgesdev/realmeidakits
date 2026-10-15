# Re Almeida Kits — Assets da Home (instruções para o Codex)

Este pacote contém os assets visuais aprovados para a **V1 da home**.

## Objetivo

Usar estes arquivos como imagens finais da primeira versão visual, sem substituir por placeholders.

## Estrutura sugerida no projeto

Salvar os arquivos em:

```text
public/images/home/
```

## Arquivos e aplicação

### 1) Hero principal

- Arquivo: `public/images/home/hero-running-kit-pickup.png`
- Seção: Hero
- Uso: imagem principal da home, aplicada como imagem de destaque da seção inicial.
- Proporção: 16:9
- Observação: manter enquadramento com foco na corredora à direita e espaço visual livre à esquerda para headline, texto e CTAs.

### 2) Card de evento — Circuito Rio Antigo

- Arquivo: `public/images/home/event-circuito-rio-antigo.png`
- Seção: Corridas disponíveis
- Card: “Circuito Rio Antigo”
- Proporção: 4:3
- Observação: usar como thumbnail/capa do card.

### 3) Card de evento — Corrida da Primavera

- Arquivo: `public/images/home/event-corrida-primavera.png`
- Seção: Corridas disponíveis
- Card: “Corrida da Primavera”
- Proporção: 4:3
- Observação: usar como thumbnail/capa do card.

### 4) Card de evento — Desafio 10K da Cidade

- Arquivo: `public/images/home/event-desafio-10k-cidade.png`
- Seção: Corridas disponíveis
- Card: “Desafio 10K da Cidade”
- Proporção: 4:3
- Observação: usar como thumbnail/capa do card.

### 5) Card de modalidade — Kit Oficial

- Arquivo: `public/images/home/modality-kit-oficial.png`
- Seção: Escolha sua modalidade
- Card: “Kit Oficial”
- Proporção: 4:3
- Observação: usar como imagem principal do card.

### 6) Card de modalidade — Associado à APPAI

- Arquivo: `public/images/home/modality-associado-appai.png`
- Seção: Escolha sua modalidade
- Card: “Associado à APPAI”
- Proporção: 4:3
- Observação: usar como imagem principal do card.

## Regras de implementação para o Codex

1. Não trocar estes assets por placeholders.
2. Não adicionar texto embutido nas imagens.
3. Aplicar textos, datas, localização e CTAs no layout em HTML/React, não dentro da arte.
4. Preferir uso via `public/` para facilitar manutenção.
5. Garantir `object-fit: cover` nos cards e preservar o enquadramento do hero.
6. No hero, priorizar responsividade preservando a leitura do texto no desktop e mobile.
7. Se necessário, usar overlay sutil no hero apenas para contraste do texto, sem escurecer excessivamente a imagem.
8. Não alterar a identidade visual das imagens.

## Sugestão de mapeamento de dados

```ts
export const homeImages = {
  hero: "/images/home/hero-running-kit-pickup.png",
  events: {
    circuitoRioAntigo: "/images/home/event-circuito-rio-antigo.png",
    corridaPrimavera: "/images/home/event-corrida-primavera.png",
    desafio10kCidade: "/images/home/event-desafio-10k-cidade.png",
  },
  modalities: {
    kitOficial: "/images/home/modality-kit-oficial.png",
    associadoAppai: "/images/home/modality-associado-appai.png",
  },
};
```

## Conteúdo textual

Os títulos, descrições, datas, localização e CTAs devem seguir `docs/project.md` e não devem ser inferidos a partir das imagens.

## Observação final

Este pacote cobre os principais assets da home. O escopo revisado da V1 não inclui área da corredora nem painel administrativo em React. Administração futura no wp-admin; Minha Conta do WooCommerce será avaliada posteriormente. O conceito visual define aparência; os documentos do projeto definem regras de negócio.
