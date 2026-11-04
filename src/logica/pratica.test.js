import { describe, it, expect } from 'vitest';
import { gerarDesafios, gerarOpcoes } from './pratica.js';
import { dadosDoAngulo } from './angulos.js';

describe('mini-jogo do tutorial', () => {
  it('gera desafios com ângulos diferentes e resposta coerente', () => {
    for (let k = 0; k < 30; k++) {
      const d = gerarDesafios(5);
      expect(d).toHaveLength(5);
      expect(new Set(d.map((x) => x.graus)).size).toBe(5);
      for (const x of d) {
        expect(dadosDoAngulo(x.graus)[x.funcao]).toBe(x.correta);
        expect(x.opcoes).toContain(x.correta);
        expect(new Set(x.opcoes).size).toBe(4);
      }
    }
  });
  it('opções nunca repetem', () => {
    for (let k = 0; k < 50; k++) expect(new Set(gerarOpcoes('1/2', 'sen')).size).toBe(4);
  });
});
