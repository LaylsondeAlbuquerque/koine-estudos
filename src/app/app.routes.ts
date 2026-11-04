import {Routes} from '@angular/router';
export const routes:Routes=[
 {path:'',pathMatch:'full',redirectTo:'home'},
 {path:'home',loadComponent:()=>import('./pages/home.component').then(m=>m.HomeComponent)},
 {path:'progress',loadComponent:()=>import('./pages/progress.component').then(m=>m.ProgressComponent)},
 {path:'about',loadComponent:()=>import('./pages/about.component').then(m=>m.AboutComponent)},
 {path:':area/lesson/:id',data:{kind:'lesson'},loadComponent:()=>import('./pages/reading.component').then(m=>m.ReadingComponent)},
 {path:':area/article/:id',data:{kind:'article'},loadComponent:()=>import('./pages/reading.component').then(m=>m.ReadingComponent)},
 {path:':area/:tab',loadComponent:()=>import('./pages/area.component').then(m=>m.AreaComponent)},
 {path:':area',redirectTo:({params})=>`/${params['area']}/path`,pathMatch:'full'},
 {path:'**',redirectTo:'home'}
];
