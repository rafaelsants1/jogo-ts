# Corre, Brasília!

Endless runner **satírico** para terminal, com câmera lateral 2D, escrito em TypeScript puro e sem dependências de produção.

O personagem corre da esquerda para a direita por 3 pistas de profundidade (cima = fundo, meio, baixo = frente). Você troca de pista e pula para coletar coins e desviar de obstáculos. No primeiro tropeço, um vilão começa a te perseguir.

| Personagem            | Coin    | Rótulo no HUD | Vilão               |
|-----------------------|---------|---------------|---------------------|
| Jair Bolsonaro (Mito) | fuzil   | FUZIS         | Alexandre de Moraes |
| Lula                  | picanha | PICANHAS      | Petrolão            |
| Renan Santos          | onça    | ONÇAS         | Flávio Bolsonaro    |

> **Aviso:** é uma sátira. Os personagens são caricaturas em ASCII com o mesmo nível de detalhe e o mesmo tratamento. O jogo não contém falas nem citações atribuídas a pessoas reais: os textos são só nomes, rótulos e mensagens de sistema.

## Requisitos

- Node.js 20 ou mais novo para jogar (`npm start`). Para os testes (`npm test`), Node.js 21 ou mais novo (veja Decisões).
- Um terminal com suporte a cor truecolor (24 bits), de pelo menos **80×24**.

## Como rodar

```bash
npm install
npm start
```

Outros comandos:

```bash
npm test          # testes (node:test)
npx tsc --noEmit  # checagem de tipos
```

## Controles

| Tecla              | Ação                               |
|--------------------|------------------------------------|
| ↑ / W              | pista de cima                      |
| ↓ / S              | pista de baixo                     |
| Espaço             | pular                              |
| Enter              | confirmar / jogar de novo          |
| ← / → (ou A / D)   | escolher personagem no menu        |
| P                  | pausar / continuar                 |
| M                  | voltar ao menu (tela de game over) |
| Q / Ctrl+C         | sair                               |

## Regras

- O mundo rola a **20 colunas/s**, sem aceleração. 1 coluna = 1 metro.
- **Score = distância + 10 × coins.**
- **Pulo:** dura 600 ms e eleva o sprite em 2 linhas. Durante o pulo você passa por cima de obstáculos baixos e pega coins elevadas. Não há pulo duplo, mas dá para trocar de pista no ar.
- **Cavalete** (obstáculo baixo): pode ser pulado. Bater nele é um tropeço.
- **Ônibus** (obstáculo alto): não pode ser pulado. Bater nele é game over ("Você foi cancelado!").
- **Vilão:** no primeiro tropeço, o vilão entra pela esquerda e corre 4 colunas atrás de você. Um segundo tropeço enquanto ele está ativo é game over, com a mensagem do vilão: "Alexandre de Moraes te censurou!", "Petrolão te prendeu!" ou "Flávio Bolsonaro te miliciou!". Depois de 8 s sem tropeçar, ele fica para trás e sai da tela. A barra na linha 2 mostra quanto tempo falta.
- O gerador nunca bloqueia as 3 pistas com ônibus na mesma coluna, então todo trecho tem solução.

## Terminais recomendados

Funcionam bem os terminais com truecolor e tela alternativa: **Windows Terminal**, terminal integrado do **VS Code**, **iTerm2**, **GNOME Terminal**, **Konsole**, **Kitty**, **Alacritty** e **WezTerm**.

Evite o console antigo do Windows (`conhost`, aberto direto pelo `cmd.exe` em versões antigas) e o Terminal.app do macOS, que não têm truecolor completo: as cores saem aproximadas.

## Estrutura

```
src/main.ts                 bootstrap, troca de cenas, game loop, ciclo de vida do terminal
src/terminal/screen.ts      buffer de células, diff por frame, entrada e saída do modo raw
src/terminal/input.ts       stdin raw → fila de ações abstratas
src/game/types.ts           tipos do estado
src/game/config.ts          constantes de jogo (velocidade, tamanhos, tempos)
src/game/update.ts          update(state, actions, dtMs) puro
src/game/spawner.ts         RNG semeável + geração de padrões
src/game/collision.ts       AABB por pista
src/content/characters.ts   personagens, coins, vilões e obstáculos
src/scenes/scene.ts         interface Scene + classe abstrata BaseScene
src/scenes/menu.ts, play.ts, gameover.ts
src/scenes/ui.ts            paleta e helpers de desenho
tests/                      testes de update, colisão, spawner, sprites e input
```

### Arquitetura (POO)

- `Scene` (interface) é o contrato que o `main.ts` usa: `tick(actions, dtMs)` e `render(screen)`.
- `BaseScene` (classe abstrata) implementa `Scene` com o padrão *template method*: conta o tempo da cena e limpa o fundo, e delega o resto para os métodos abstratos `onTick` e `draw`.
- `MenuScene`, `PlayScene` e `GameOverScene` estendem `BaseScene`.
- A regra do jogo (`update`, `collision`, `spawner`) continua funcional e pura. Ela não importa nada de `src/terminal/` nem usa `process`, `Date.now()` ou `Math.random()`. Tempo chega como `dtMs` e a aleatoriedade vem de um RNG semeado guardado no estado.

## Decisões

Interpretações tomadas onde a especificação estava aberta ou se contradizia:

1. **Velocidade:** 20 colunas/s (valor sugerido).
2. **Sprites das coins:** os exemplos do enunciado usam `≈`, `°` e `ω`, que estão fora da faixa permitida (ASCII + U+2500 a U+259F). Prevaleceu a regra, então picanha = `(▓)` e onça = `▚o▞`. O fuzil `═╦─` foi mantido. Um teste valida dimensões e caracteres de todos os sprites.
3. **Comando de teste:** `node --test tests/` falha no Node 21 ou mais novo (o argumento virou glob e o Node tenta importar a pasta). O script usa `node --import tsx --test "tests/**/*.test.ts"`, e o Node expande o glob sozinho, inclusive no Windows. Por isso os testes exigem Node 21 ou mais novo. O Node 20 já saiu de suporte.
4. **"4 colunas atrás":** ficam 4 colunas vazias entre o vilão e o jogador.
5. **Vilão saindo:** enquanto ele sai da tela, já não conta como ativo. Um tropeço nesse momento o chama de volta, como se fosse o primeiro.
6. **Pulo:** o sprite fica 2 linhas acima durante os 600 ms inteiros, sem arco. Coins no chão só são pegas em pé, e coins elevadas só no pulo.
7. **Nome no HUD:** cada personagem tem um `hudName` em maiúsculas (ex.: `JAIR BOLSONARO`). O nome do menu continua completo.
8. **Linha de status:** a linha 2 mostra o nome do vilão e a barra do tempo restante enquanto ele persegue. É assim que o nome do vilão aparece no HUD sem estourar 80 colunas na linha 1.
9. **Teclas extras:** ←/→ (e A/D) no menu e M para voltar ao menu no game over, conforme a tela de game over pede.
10. **Terminal pequeno:** se ficar menor que 80×24, todas as cenas param, não só a de jogo, até o tamanho voltar.
11. **Autowrap:** o jogo desliga a quebra automática de linha (`\x1b[?7l`) enquanto roda, para que escrever na última célula da tela não role o terminal. Ela é religada na saída.
