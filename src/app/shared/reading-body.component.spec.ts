import {TestBed} from '@angular/core/testing';
import {describe, expect, it} from 'vitest';
import {Section} from '../models';
import {ReadingBodyComponent} from './reading-body.component';

function render(sections: Section[]): HTMLElement {
  const fixture = TestBed.createComponent(ReadingBodyComponent);
  fixture.componentRef.setInput('sections', sections);
  fixture.detectChanges();
  return fixture.nativeElement;
}

describe('Exemplos analisados nas leituras', () => {
  it('apresenta texto, tradução, análise das palavras e leitura sintática na ordem de estudo', () => {
    const page = render([{
      heading: 'Predicativo', body: 'Observe a relação entre os dois nomes.',
      example: {greek: 'ὁ λόγος σὰρξ ἐγένετο', translation: 'O Verbo se fez carne.', reference: 'João 1.14 — trecho'},
      table: {headers: ['Forma', 'Morfologia'], rows: [['λόγος', 'Nominativo singular masculino']]},
      analysis: 'O artigo ajuda a reconhecer o sujeito.\n\nO outro nome caracteriza o sujeito.'
    }]);
    const section = page.querySelector('section')!;
    expect(Array.from(section.children).map(element => element.tagName)).toEqual(['H2', 'P', 'FIGURE', 'DIV', 'DIV']);
    expect(section.querySelector('figure [lang="grc"]')?.textContent).toBe('ὁ λόγος σὰρξ ἐγένετο');
    expect(section.querySelector('figcaption')?.textContent).toContain('O Verbo se fez carne.');
    expect(section.querySelector('.reading-example-reference')?.textContent).toBe('João 1.14 — trecho');
    expect(section.querySelector('td[lang="grc"]')?.textContent).toBe('λόγος');
    expect(section.querySelector('th')?.getAttribute('scope')).toBe('col');
    expect(section.querySelector('.reading-analysis h3')?.textContent).toBe('Leitura sintática');
    expect(section.querySelectorAll('.reading-analysis p').length).toBe(2);
  });

  it('continua exibindo aulas antigas sem criar espaços para exemplos e análises ausentes', () => {
    const page = render([{heading: 'Primeiro contato', body: 'Primeiro parágrafo.\n\nSegundo parágrafo.'}]);
    expect(page.querySelectorAll('section > p').length).toBe(2);
    expect(page.querySelector('figure')).toBeNull();
    expect(page.querySelector('.table-wrap')).toBeNull();
    expect(page.querySelector('.reading-analysis')).toBeNull();
  });

  it('aceita exemplos didáticos sem atribuição e mantém sua tradução como texto comum', () => {
    const page = render([{
      heading: 'Exemplo didático', body: 'Leia o exemplo.',
      example: {greek: 'ὁ μαθητὴς γράφει', translation: 'O aluno escreve.'},
      analysis: 'O aluno é o sujeito.'
    }]);
    expect(page.querySelector('.reading-example-reference')).toBeNull();
    expect(page.querySelector('.reading-example-translation')?.getAttribute('lang')).toBeNull();
    expect(page.querySelector('.reading-analysis')?.textContent).toContain('O aluno é o sujeito.');
  });
});
