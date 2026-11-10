# Fabricação da roleta física (corte a laser)

Tudo aqui é **gerado por código** a partir de `parametros.js`. Os arquivos prontos ficam em
`public/fabricacao/` e também podem ser baixados pelo site, na página **/fabricacao**, que mostra o
modelo 3D montado e explodido.

## Peças (MDF cru de 3 mm)

| # | Peça | Tamanho | Função |
|---|---|---|---|
| 1 | Base | 240 × 240 mm | Fica embaixo; o círculo marcado no centro indica onde colar o eixo |
| 2 | Moldura | 240 × 240 mm | Colada na base; o disco gira dentro do furo; 2 recortes para o dedo; seta em 0° |
| 3 | Disco giratório | Ø 208 mm | Borda com os 16 ângulos (graus e radianos); por dentro, sen/cos/tg de cada ângulo |
| 4 | Máscara | Ø 164 mm + lingueta | Fixa por cima; tem a **janela**, os rótulos sen/cos/tg, o QR Code e a tabela de sinais |
| 5 | Eixo | Ø 20 mm | Colado na base; o disco gira em volta; a máscara é colada em cima (vem 1 de reserva) |

Altura montada: 9 mm (3 camadas). Sem parafusos: só cola branca (PVA).

## Arquivos

- `chapas/chapa-1.svg` e `chapa-2.svg`: peças organizadas para uma mesa de 600 × 400 mm.
  O retângulo **verde tracejado** é só o limite da mesa: apague antes de cortar.
- `pecas/*.svg`: cada peça separada (use se a sua mesa for menor que 600 × 400).
- `dxf/*.dxf`: as mesmas peças em DXF, com as camadas CORTE, MARCAR e GRAVAR.
- `3d/roleta-montada.stl` e `roleta-explodida.stl`: modelo 3D.

## Cores (camadas) no laser

| Cor | Operação | Ordem |
|---|---|---|
| Preto (preenchido) | **Gravar**: textos e QR Code | 1º |
| Azul | **Marcar**: linhas finas, potência baixa | 2º |
| Vermelho | **Cortar**: atravessa a chapa | 3º (por último) |

Faça um teste numa sobra antes: potência e velocidade variam de máquina para máquina.

## Montagem

1. Corte as chapas (gravar → marcar → cortar).
2. Lixe de leve o disco (lixa 220), nas faces e na borda. Ele gira entre a base e a máscara;
   um pouco de parafina ou cera de vela na face de baixo deixa o giro mais suave.
3. Cole a moldura na base (cantos alinhados), prenda por 20 min e limpe o excesso dentro do furo.
4. Cole o eixo no círculo marcado no centro da base.
5. Encaixe o disco (gravação para cima) em volta do eixo. Ele deve girar livre.
6. Passe cola só em cima do eixo e na lingueta da máscara. Encaixe a lingueta no retângulo marcado à
   esquerda da moldura, com a janela apontando para a seta (0°). Espere secar sem girar o disco.

## Mudar medidas

Edite `parametros.js` (espessura real da chapa, folgas, tamanho da mesa, URL do QR Code) e rode:

```bash
npm run fabricacao
```

- Se o disco **travar**, aumente `folgaDisco` (ex.: 0.8) e/ou `folgaEixo`.
- Se a sua chapa medir 2,8 mm ou 3,2 mm, ajuste `espessura` (muda só o modelo 3D; o corte é 2D).
- Para mesa menor (ex.: 400 × 300), mude `mesa` e as peças são redistribuídas em mais chapas.

## Fontes

Os textos são convertidos em contornos (a máquina não precisa ter as fontes). As fontes usadas estão em
`fontes/`: Inter (licença OFL 1.1) e DejaVu Sans (licença livre, ver `fontes/LICENCA-DejaVu.txt`).
