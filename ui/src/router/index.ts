import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import ImageGalleryView from '@/components/ImageGallery/ImageGalleryView.vue';

const routes: Array<RouteRecordRaw> = [
  // ... existing routes ...
  {
    path: '/image-gallery',
    name: 'ImageGallery',
    component: ImageGalleryView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;