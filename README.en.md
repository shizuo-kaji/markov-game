# Markovian Town — A Markov Chain Game

[日本語](README.md) | **English**

A competitive game based on the stationary distribution of a Markov chain. Players change path weights to increase the share of people at their shop.

## Play

**[Open the game](https://markov-game-frontend.onrender.com/)**

<a href="https://markov-game-frontend.onrender.com/">
  <img src="images/QR.png" alt="Game QR code" width="150">
</a>

Choose Japanese or English at the top of the screen. On your first visit, allow time for the server to start.

Recommended settings: **2 players, 2 neutral places, 3 points per round and 5 rounds**.

- **Solo:** Choose **Play solo** to play against AI.
- **With a friend:** Choose **Play with a friend**, create a room and share its link. Join from separate devices and select different shops.
- **Experiments:** Open **Lab** to change weights and starting distributions freely.

Use **Custom room** to adjust the settings.

## Rules

The town consists of players’ shops and neutral public places. People follow directed paths. Among paths leaving the same place, higher weights make a path more likely to be chosen.

1. Select an arrow or use the **From** and **To** menus.
2. Each unit of increase or decrease costs one point. You can change several paths.
3. Once everyone submits, all changes take effect together. Scores are calculated from the new stationary distribution.
4. After the final round, the player with the largest share at their shop wins. Scores do not accumulate across rounds.

You can undo changes before submitting. You may leave points unused, but they do not carry over. Changes to the same path are added together; a resulting negative weight is set to zero.

After each round, review weight changes, score differences and the flow animation. The preview before submission includes only your own changes.

## Mathematical background

### Markov chains

Let $w_{ij}$ be the weight of the path from place $i$ to place $j$. The transition probability is

$$
P_{ij}=\frac{w_{ij}+\varepsilon}{\sum_k(w_{ik}+\varepsilon)},\qquad \varepsilon=0.01.
$$

We add $\varepsilon$ to every weight, including zero weights and self-loops. Each row of the transition matrix $P$ sums to 1.

The next destination depends only on the current location: this is a **Markov chain**. If the row vector $x_t$ gives the proportions at each place, one step gives

$$
x_{t+1}=x_tP.
$$

### Stationary distributions and fixed points

A **stationary distribution** $\pi$ satisfies

$$
\pi P=\pi,\qquad \sum_i\pi_i=1,\qquad \pi_i\geq0.
$$

It is a **fixed point** of $x\mapsto xP$ and a left eigenvector of $P$ with eigenvalue 1. Since every entry of $P$ is positive, the stationary distribution is unique and every starting distribution converges to it.

Your shop’s component $\pi_i$ is your score. Neutral places also have a share, so players’ scores alone do not sum to 100%. People keep moving even at stationarity. The 80 dots are a sample of random walkers; the bars show the calculated distribution.

### PageRank

Viewing places as web pages and paths as links connects the game to PageRank, which interprets stationary shares as page importance. In the Lab, a walker follows a path with probability $\alpha$ and otherwise jumps to a uniformly chosen place:

$$
P_\alpha=\alpha P+(1-\alpha)U,\qquad U_{ij}=\frac{1}{n},
$$

where $n$ is the number of places. At $\alpha=0.85$, the jump probability is 15%; at $\alpha=0$, the distribution becomes uniform in one step. Standard games use $\alpha=1$. Adding $\varepsilon$ to weights and introducing fixed-probability jumps are different operations.

Reference: [CS50 — PageRank](https://cs50.harvard.edu/ai/projects/2/pagerank/)

## Educational aims

Through prediction, intervention, observation and explanation, the game aims to connect the following ideas.

| Concept                                                        | Experiment                                                                    |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Weights, probabilities and the global effects of local changes | Increase one weight and compare the changes in probabilities and shop scores  |
| Individual randomness and the overall distribution             | Compare fluctuating walker counts with the distribution bars                  |
| Convergence to stationarity                                    | Keep the board fixed and change only the starting distribution                |
| Fixed points                                                   | Start from **Stationary distribution π** and take one step                    |
| PageRank                                                       | Vary the jump probability and compare how people gather at a strong self-loop |

A suggested 20-minute lesson: 3 minutes for rules and predictions, 7 for play, 5 for comparing starting distributions and 5 for PageRank and reflection. The in-game **Learn** page includes explanations and discussion questions.

Related resource: [Markov chain simulator](https://shizuo-kaji.github.io/markov-simple/)

## Preprint

```bibtex
@unpublished{kaji_graiff_zurita_markovian_town,
  author = {Kaji, Shizuo and Graiff Zurita, Sebasti{\'a}n El{\'i}as},
  title  = {{Markovian Town}: A Competitive {Markov-Chain} Game for the Classroom},
  note   = {Preprint}
}
```

## About

The game was originally created for Kyushu University’s [IMI “Math for the Future” outreach event for high-school students in Fukuoka](https://www.imi.kyushu-u.ac.jp/post-17364/) on July 30, 2025. It may be reused and modified for educational purposes.

Shizuo Kaji and Sebastián Elías Graiff Zurita

For development and installation, see the [development guide (Japanese)](DEVELOPMENT.md).
