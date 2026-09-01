import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'actions' },
  {
    path: 'actions',
    title: 'Actions',
    loadComponent: () => import('./pages/actions/actions.page').then(m => m.ActionsPage)
  },
  {
    path: 'inputs',
    title: 'Inputs',
    loadComponent: () => import('./pages/inputs/inputs.page').then(m => m.InputsPage)
  },
  {
    path: 'data',
    title: 'Data',
    loadComponent: () => import('./pages/data/data.page').then(m => m.DataPage)
  },
  {
    path: 'charts',
    title: 'Charts',
    loadComponent: () => import('./pages/charts/charts.page').then(m => m.ChartsPage)
  },
  {
    path: 'layout',
    title: 'Layout',
    loadComponent: () => import('./pages/layout/layout.page').then(m => m.LayoutPage)
  },
  {
    path: 'overlays',
    title: 'Overlays',
    loadComponent: () => import('./pages/overlays/overlays.page').then(m => m.OverlaysPage)
  }
];
