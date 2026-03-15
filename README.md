# ARENA — Guia Completo do Jogo

## Visão Geral
**ARENA** é um jogo de ação multijogador em tempo real, jogado no browser. Os jogadores competem numa arena 2D de vista superior, enfrentando inimigos controlados pelo computador e outros jogadores. O objetivo é sobreviver, eliminar inimigos, apanhar colecionáveis e acumular a maior pontuação possível.

---

## Como Começar
1. Na tela inicial, insere o teu **nome** (máx. 16 caracteres)
2. Define o **nome da sala** (Room name) — se deixares vazio, entras na sala "default"
3. Clica em **ENTER ARENA** ou pressiona Enter
4. Partilha o nome da sala com amigos para jogarem juntos

---

## Controlos
| Ação | Teclas |
|------|--------|
| **Mover** | W / A / S / D ou Setas |
| **Apontar** | Mover o rato |
| **Disparar** | Clique esquerdo do rato (mantém premido para disparo contínuo) |
| **Dash (investida rápida)** | Barra de Espaço |
| **Recarregar munição** | R |
| **Respawn (após morte)** | R |

---

## Mecânicas de Combate

### Munição e Recarregamento
- O jogador tem um **carregador de 8 balas**
- Cada tiro consome 1 bala; quando o carregador esvazia, o **recarregamento automático** inicia
- Podes também recarregar manualmente com **R** a qualquer momento (se não tiveres carregador cheio)
- Durante o recarregamento, não podes disparar — uma **barra de progresso** mostra o tempo restante
- Os projéteis têm um **tempo de vida de 2 segundos** e viajam a grande velocidade (600 unidades/s), deixando um **rastro visual** (trail) atrás

### Dash (Investida)
- Pressiona **Espaço** para executar um dash rápido (800 de velocidade, durante 120ms)
- O dash vai **na direção do movimento** atual; se estiveres parado, vai na direção da mira
- Tem um **cooldown de 2 segundos** entre utilizações
- O HUD mostra se o dash está **READY** ou o tempo restante

### Invencibilidade Temporária
- Após levar dano, o jogador fica **invencível durante 0.5 segundos**
- Durante esse período, o jogador **pisca** visualmente
- Um **efeito vermelho** cobre brevemente o ecrã quando levas dano

---

## Inimigos
- O mundo começa com **15 inimigos** (quadrados coloridos)
- **Estado Passivo** (púrpura/lilás): movem-se lentamente (60 unidades/s) em direções aleatórias, ricocheteando nas paredes
- **Estado Agressivo** (vermelho/rosa): quando um jogador entra no **raio de deteção (450 unidades)**, o inimigo torna-se agressivo e persegue-o a **170 unidades/s**
- Quando mudam de estado, fazem um breve efeito de **glitch visual** (tremor)
- Colidir com um inimigo causa **20 de dano** ao jogador
- Matar um inimigo com um tiro dá **10 pontos** e **spawn de um novo inimigo** noutra posição

---

## Colecionáveis e Pickups

### Colecionáveis (Quadrados Ciano)
- Existem **15 colecionáveis** no mapa, com **animação pulsante** e **brilho**
- Apanhá-los dá **50 pontos**
- Sempre que um é apanhado, um novo **surge aleatoriamente** no mapa e um **novo inimigo** também aparece (a dificuldade aumenta indiretamente)

### Pontos Dropped (Diamantes Dourados)
- Quando um jogador **morre com pontos**, a sua **pontuação total é dropped** como um item colecionável em forma de diamante dourado
- Têm uma etiqueta com o **valor em pontos** visível
- **Expiram após 30 segundos** se não forem apanhados
- Qualquer jogador (ou o próprio, após respawn) pode apanhá-los

### Health Pickups (Cruzes Verdes)
- Surgem periodicamente a cada **15 segundos**, com um máximo de **3 no mapa** em simultâneo
- Têm uma **animação pulsante** e brilho verde
- Ao apanhar, o jogador **recupera toda a vida**
- Só podem ser apanhados por jogadores com **vida abaixo do máximo**

---

## Sistema de Pontuação e Scaling

A pontuação afeta diretamente as tuas estatísticas — quanto mais pontos tiveres, mais poderoso ficas no ataque, mas mais vulnerável e pesado te tornas:

| Stat | Base (0 pts) | Efeito | Mínimo/Máximo |
|------|-------------|--------|---------------|
| **Attack Speed** (cooldown entre tiros) | 150ms | ↓ Diminui com pontos (disparas mais rápido) | Mín: 50ms |
| **Reload Time** (tempo de recarga) | 1500ms (1.5s) | ↓ Diminui com pontos (recarregas mais rápido) | Mín: 500ms |
| **Player Size** (raio do jogador) | 16px | ↑ Aumenta com pontos (ficas maior e mais fácil de acertar) | Máx: 32px |
| **Movement Speed** | 310 | ↓ Diminui com pontos (ficas mais lento) | Mín: 190 |
| **Dash Cooldown** | 2.0s | Fixo (por agora) | — |

A fórmula geral é: `valor = base / (1 + score × fator)` para cooldowns e velocidade, e `valor = base + score × fator` para o tamanho. Isto cria um **risco-recompensa natural**: jogadores com muitos pontos disparam e recarregam mais rápido, mas são alvos maiores e mais lentos.

---

## Morte e Respawn
- O jogador tem **100 de vida**
- Projéteis causam **25 de dano** cada
- Inimigos causam **20 de dano** por colisão
- Ao morrer:
  - A pontuação é **dropped como item colecionável** no local da morte
  - Um ecrã de **GAME OVER** aparece com a pontuação final
  - Pressiona **R** para **respawn** — reapareces numa posição aleatória perto do centro, com vida cheia, pontuação a zero e carregador cheio
  - Matar outro jogador dá um bónus de **100 pontos**

---

## Interface (HUD)

O ecrã de jogo mostra:

### Canto Superior Esquerdo — Painel STATS
- ATK SPD (velocidade de ataque em ms)
- RELOAD (tempo de recarga em segundos)
- DASH CD (cooldown do dash)
- SIZE (raio atual do jogador)
- SPEED (velocidade de movimento)

### Canto Superior Direito — Scoreboard
- Lista de todos os jogadores na sala, ordenados por pontuação
- Jogadores mortos marcados com ☠
- O teu nome aparece em azul

### Canto Superior Direito — Pontuação
- "SCORE: X" com efeito de brilho

### Canto Inferior Esquerdo — Estado do Jogador
- DASH: estado (READY ou countdown)
- AMMO: indicador visual de balas (quadrados cheios/vazios) ou barra de recarregamento
- HEALTH: barra de vida (azul acima de 30%, vermelho abaixo)

---

## Multiplayer
- O jogo suporta **multiplayer em tempo real** na mesma sala
- O **primeiro jogador a entrar** torna-se o **Host**, responsável por:
  - IA dos inimigos
  - Spawn de colecionáveis, inimigos e health pickups
  - Deteção de colisões (projéteis, pickups, contacto com inimigos)
  - Atribuição de pontos
- Outros jogadores são **Clients** que recebem o estado do jogo do Host
- A posição e mira de jogadores remotos são **interpoladas suavemente**
- Se o Host sair, a gestão é transferida

---

## Áudio
Todos os efeitos sonoros são **sintetizados proceduralmente** usando a Web Audio API (sem ficheiros de áudio):
- **Disparo**: som laser descendente (sawtooth + filtro lowpass)
- **Morte de inimigo**: explosão com ruído filtrado + sub-grave
- **Colecionável apanhado**: chime ascendente (4 notas seno)
- **Dano recebido**: impacto grave distorcido (square wave + waveshaper)
- **Game Over**: warble descendente (3 notas)
- **Dash**: whoosh de ruído highpass
- **Health Pickup**: acorde ascendente quente (triangle waves)
- **Reload completo**: clique mecânico (square wave)
- **Pontos dropped apanhados**: bling metálico (triangle waves, tom mais grave)
- **Ambiente**: drone espacial contínuo e subtil (2 osciladores sine ligeiramente detuned + LFO)

---

## Mundo
- Área de jogo: **3000 × 2000 unidades**
- Grelha visual de fundo com quadrados de **80 unidades**
- A câmara segue o jogador local, centrando-o no ecrã
- Os limites do mundo são visíveis como uma borda fina
