import {TestBed} from '@angular/core/testing';
import {provideRouter} from '@angular/router';
import {signal} from '@angular/core';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {ContentService} from '../content.service';
import {ProgressService} from '../progress.service';
import {NtReadingService} from '../nt-reading.service';
import {NtReadingComponent} from './nt-reading.component';

describe('Filtros da leitura',()=>{
  const state=signal(0);let known:Set<string>;
  const book={id:'MAT',name:'Mateus',verses:Array.from({length:35},(_,i)=>({chapter:1,verse:i+1,tokens:1,requires:['v-a'],external:[],aligned:true}))};
  beforeEach(()=>{
    known=new Set();state.set(0);localStorage.clear();
    TestBed.configureTestingModule({providers:[provideRouter([]),
      {provide:ContentService,useValue:{vocabulary:{entries:[{id:'v-a'}]}}},
      {provide:ProgressService,useValue:{state,wordLearned:(id:string)=>{state();return known.has(id);}}},
      {provide:NtReadingService,useValue:{load:vi.fn().mockResolvedValue({version:1,books:[book]}),book:vi.fn().mockResolvedValue(book.verses.map(v=>({...v,text:'λόγος'})))}}
    ]});
  });
  it('atualiza o filtro com o progresso e limita a página a 30 versículos',async()=>{
    const fixture=TestBed.createComponent(NtReadingComponent);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ainda não há versículos');
    known.add('v-a');state.update(v=>v+1);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    await vi.waitFor(()=>{fixture.detectChanges();expect(fixture.nativeElement.querySelectorAll('.nt-verse')).toHaveLength(30);});
    fixture.componentInstance.turn(1);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    await vi.waitFor(()=>{fixture.detectChanges();expect(fixture.nativeElement.querySelectorAll('.nt-verse')).toHaveLength(5);});
    known.clear();state.update(v=>v+1);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    expect(fixture.componentInstance.page()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.nt-verse')).toHaveLength(0);
  });
  it('mostra falha de carregamento e permite nova tentativa',async()=>{
    const source=TestBed.inject(NtReadingService);vi.mocked(source.load).mockRejectedValueOnce(Error('offline'));
    const fixture=TestBed.createComponent(NtReadingComponent);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')).not.toBeNull();
    await fixture.componentInstance.load();fixture.detectChanges();await fixture.whenStable();
    expect(fixture.componentInstance.error()).toBe('');
  });
});
