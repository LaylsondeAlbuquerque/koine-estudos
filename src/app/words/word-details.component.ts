import {afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, input, output, signal, viewChild} from '@angular/core';
import {Word} from '../models';
import {IconComponent} from '../shared/icon.component';
import {WordForms, WordFormsService, morphologyLabel} from './word-forms.service';

@Component({
  selector:'koine-word-details', imports:[IconComponent], changeDetection:ChangeDetectionStrategy.OnPush,
  styleUrl:'./word-details.component.css',
  template:`<dialog #dialog aria-labelledby="word-detail-title" (close)="closed.emit()" (click)="backdrop($event)">
    <header><div><span class="eyebrow">CONSULTA DO VOCÁBULO</span><h2 id="word-detail-title" lang="grc">{{word().lemma}}</h2></div><button class="icon-button" aria-label="Fechar ficha" (click)="close()" autofocus><koine-icon name="close"/></button></header>
    <p class="lexical-meaning"><strong>Significado lexical básico</strong><br>{{word().meaning}}</p>
    <button class="button button-outline button-small" (click)="practice.emit()">Praticar palavra<koine-icon name="cards"/></button>
    <h3>Formas encontradas no NT</h3>
    <p class="guide">As análises abaixo estão registradas no MACULA para cada forma. Alternativas decorrentes da coincidência de formas neutras também são indicadas. A lista não é um paradigma completo nem esgota todas as análises possíveis fora do corpus. Grafias que diferem apenas em maiúsculas ou acentuação ficam juntas.</p>
    @if(loading()){<p role="status">Carregando as flexões…</p>}
    @else if(error()){<p role="alert">{{error()}}</p><button class="button button-small" (click)="load()">Tentar novamente</button>}
    @else if(data();as entry){
      <p class="guide">{{entry.forms.length}} formas · {{word().frequency.toLocaleString('pt-BR')}} ocorrências no corpus</p>
      @if(!entry.forms.length){<p>Este lema foi preservado no repertório, mas não tem ocorrências sob esta identificação no corpus revisado.</p>}
      @for(form of entry.forms;track $index){<section class="form-row">
        <div class="form-heading"><strong lang="grc">{{form.spellings.join(' / ')}}</strong><span>{{form.count}} {{form.count===1?'ocorrência':'ocorrências'}}</span></div>
        <ul>@for(analysis of form.analyses;track $index){<li>{{label(analysis.features)}} @if(!analysis.count){<small>Possibilidade pela forma neutra; não registrada com esta análise no corpus.</small>}</li>}</ul>
      </section>}
    }
    <footer>Fonte morfológica: MACULA Greek Linguistic Datasets / SBLGNT, © 2022–2024 Biblica, Inc., CC BY 4.0. Agrupamento e rótulos em português adaptados pelo Koiné. Significado básico: repertório do Koiné; não é uma tradução de cada flexão. As glossas verbais da fonte estão em inglês e não são traduções portuguesas prontas por flexão.</footer>
  </dialog>`
})
export class WordDetailsComponent {
  readonly word=input.required<Word>();
  readonly closed=output<void>();
  readonly practice=output<void>();
  readonly data=signal<WordForms|null>(null);
  readonly loading=signal(true);
  readonly error=signal('');
  readonly label=morphologyLabel;
  private readonly service=inject(WordFormsService);
  private readonly dialog=viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  constructor(){afterNextRender(()=>{this.dialog().nativeElement.showModal();void this.load();});}
  async load(){
    this.loading.set(true);this.error.set('');
    try{this.data.set(await this.service.load(this.word()));}
    catch{this.error.set('Não foi possível carregar as flexões. Confira sua conexão e tente novamente.');}
    finally{this.loading.set(false);}
  }
  close(){this.dialog().nativeElement.close();}
  backdrop(event:MouseEvent){if(event.target===this.dialog().nativeElement){const r=this.dialog().nativeElement.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)this.close();}}
}
