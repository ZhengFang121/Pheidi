import { createRouter, createWebHistory } from 'vue-router'

import MainLayout from '@/layouts/MainLayout.vue'

import HomePage from '@/views/HomePage.vue'
import PlayerPage from '@/views/PlayerPage.vue'
import QuestPage from '@/views/QuestPage.vue'
import CommunityPage from '@/views/CommunityPage.vue'

const router = createRouter({
	history: createWebHistory(),

	routes: [
		{
			path: '/',
			component: MainLayout,

			children: [
				{
					path: '',
					name: 'home',
					component: HomePage,
				},

				{
					path: 'player',
					name: 'player',
					component: PlayerPage,
				},

				{
					path: 'quest',
					name: 'quest',
					component: QuestPage,
				},

				{
					path: 'community',
					name: 'community',
					component: CommunityPage,
				},

			],
		},
	],
})

export default router
