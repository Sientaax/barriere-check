import { createRouter, createWebHashHistory } from 'vue-router'
import TrailList from './views/TrailList.vue'

export const STEPS = [
  { name: 'bewertung', label: 'Bewertung' },
  { name: 'auswertung', label: 'Auswertung' },
  { name: 'probleme', label: 'Probleme' },
  { name: 'bericht', label: 'Bericht' },
] as const

export const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'home', component: TrailList, meta: { title: 'Streckenabschnitte / Wanderrouten' } },
    { path: '/cms', name: 'cms', component: () => import('./views/cms/CmsView.vue'), meta: { title: 'Redaktion (CMS)' } },
    { path: '/methodik', name: 'methodik', component: () => import('./views/MethodView.vue'), meta: { title: 'Methodik' } },
    {
      path: '/abschnitt/:sectionId',
      component: () => import('./views/TrailShell.vue'),
      props: true,
      children: [
        { path: '', redirect: (to) => `/abschnitt/${to.params.sectionId}/bewertung` },
        { path: 'bewertung', name: 'bewertung', component: () => import('./views/QuestionnaireView.vue'), meta: { title: 'Bewertung' } },
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
