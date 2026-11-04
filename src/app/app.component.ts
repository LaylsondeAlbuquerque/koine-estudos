import {ChangeDetectionStrategy,Component,HostListener,computed,effect,inject,signal} from '@angular/core';
import {NavigationEnd,NavigationStart,Router,RouterLink,RouterOutlet} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ContentService} from './content.service';
import {ProgressService} from './progress.service';
import {StudySessionService} from './study/study-session.service';
import {StudySessionComponent} from './study/study-session.component';
import {IconComponent} from './shared/icon.component';
import {Area,AREA_KEYS,AREAS,LEVELS,Word} from './models';
import {getTheme,toggleTheme} from '../../appearance.js';
import {normalize} from '../../core.js';

@Component({selector:'koine-app',standalone:true,imports:[RouterOutlet,RouterLink,IconComponent,StudySessionComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./app.component.html',styles:[':host{display:block}']})
export class AppComponent {
 readonly content=inject(ContentService);
 readonly progress=inject(ProgressService);
 readonly study=inject(StudySessionService);
 private readonly router=inject(Router);
 readonly areas=AREAS;readonly areaKeys=AREA_KEYS;readonly levels=LEVELS;
 readonly active=signal<string>('home');readonly crumb=signal('Meus estudos');
 readonly displayActive=computed(()=>this.study.session()?.area||this.active());
 readonly pageTitle=signal('Seu espaço de estudo');
 readonly menuOpen=signal(false);readonly searchOpen=signal(false);readonly query=signal('');
 readonly theme=signal(getTheme());
 readonly searchTerm=computed(()=>normalize(this.query().trim()));
 readonly readings=computed(()=>this.searchTerm().length>=2?this.content.catalog.searchReadings(this.searchTerm()):[]);
 readonly words=computed(()=>this.searchTerm().length>=2?this.content.catalog.searchWords(this.searchTerm()):[]);
 readonly themeLabel=computed(()=>this.theme()==='dark'?'Ativar modo claro':'Ativar modo noturno');
 constructor(){
  void this.content.load();
  effect(()=>{document.title=`${this.study.session()?'Estudando':this.pageTitle()} · Koiné`;});
  this.router.events.pipe(takeUntilDestroyed()).subscribe(event=>{
   if(event instanceof NavigationStart){this.study.clear();this.menuOpen.set(false);this.searchOpen.set(false);}
   if(event instanceof NavigationEnd){
    const parts=event.urlAfterRedirects.split('?')[0].split('/').filter(Boolean),key=parts[0];
    const area=AREA_KEYS.includes(key as Area)?key as Area:null;
    this.active.set(area||(['about','progress'].includes(key)?key:'home'));
    this.crumb.set(area?`${AREAS[area].name}${parts[1]==='lesson'?' / Aula':parts[1]==='article'?' / Artigo':''}`:key==='progress'?'Meu progresso':key==='about'?'Sobre o projeto':'Meus estudos');
    this.pageTitle.set(area?AREAS[area].name:key==='progress'?'Meu progresso':key==='about'?'Sobre o projeto':'Seu espaço de estudo');
   }
  });
 }
 toggleTheme(){this.theme.set(toggleTheme());}
 toggleMenu(){this.menuOpen.update(value=>!value);}
 closeMenu(){this.menuOpen.set(false);setTimeout(()=>document.querySelector<HTMLButtonElement>('.menu-toggle')?.focus());}
 openSearch(){this.query.set('');this.searchOpen.set(true);setTimeout(()=>document.getElementById('global-search')?.focus());}
 closeSearch(){this.searchOpen.set(false);setTimeout(()=>document.querySelector<HTMLButtonElement>('.search-toggle')?.focus());}
 overlayClick(event:MouseEvent){if(event.target===event.currentTarget)this.closeSearch();}
 searchWord(word:Word){this.searchOpen.set(false);this.study.start({area:'vocabulary',mode:'flashcards',wordId:word.id});}
 skip(event:Event){event.preventDefault();const main=document.getElementById('main');main?.focus({preventScroll:true});main?.scrollIntoView({block:'start'});}
 reload(){location.reload();}
 @HostListener('document:keydown',['$event'])
 keydown(event:KeyboardEvent){
  const target=document.activeElement as HTMLElement|null;
  if(event.key==='Escape'){if(this.searchOpen())this.closeSearch();else if(this.menuOpen())this.closeMenu();}
  if(event.key==='/'&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!target?.isContentEditable&&!['INPUT','TEXTAREA','SELECT'].includes(target?.tagName||'')){event.preventDefault();if(this.content.ready())this.openSearch();}
  if(event.key==='Tab'&&this.searchOpen()){
   const controls=Array.from(document.querySelectorAll<HTMLElement>('.search-dialog button,.search-dialog a,.search-dialog input'));
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&target===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&target===last){event.preventDefault();first?.focus();}
  }
 }
}
