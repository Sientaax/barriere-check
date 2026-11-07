import { createRouter, createWebHashHistory } from 'vue-router'
import TrailList from './views/TrailList.vue'

export const STEPS = [
  { name: 'stammdaten', label: 'Lehrpfad' },
  { name: 'abschnitte', label: 'Abschnitte' },
  { name: 'fragebogen', label: 'Fragebogen' },
  { name: 'auswertung', label: 'Auswertung' },
  { name: 'probleme', label: 'Probleme' },
  { name: 'bericht', label: 'Bericht' },
] as const

export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: TrailList, meta: { title: 'Übersicht' } },
    { path: '/methodik', name: 'methodik', component: () => import('./views/MethodView.vue'), meta: { title: 'Methodik' } },
    {
      path: '/pfad/:id',
      component: () => import('./views/TrailShell.vue'),
      props: true,
      children: [
        { path: '', redirect: (to) => `/pfad/${to.params.id}/stammdaten` },
        { path: 'stammdaten', name: 'stammdaten', component: () => import('./views/TrailEdit.vue'), meta: { title: 'Lehrpfad anlegen' } },
        { path: 'abschnitte', name: 'abschnitte', component: () => import('./views/SectionsView.vue'), meta: { title: 'Wegabschnitte' } },
        { path: 'fragebogen/:sectionId?', name: 'fragebogen', component: () => import('./views/QuestionnaireView.vue'), meta: { title: 'Fragebogen' } },
        { path: 'auswertung', name: 'auswertung', component: () => import('./views/ResultsView.vue'), meta: { title: 'Auswertung' } },
        { path: 'probleme', name: 'probleme', component: () => import('./views/IssuesView.vue'), meta: { title: 'Probleme' } },
        { path: 'bericht', name: 'bericht', component: () => import('./views/ReportView.vue'), meta: { title: 'Ergebnisbericht' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.afterEach((to) => {
  const t = to.meta.title as string | undefined
  document.title = t ? `${t} – Barriere-Check Lehrpfade` : 'Barriere-Check Lehrpfade'
})
