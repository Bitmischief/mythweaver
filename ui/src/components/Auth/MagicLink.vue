<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/store';

const route = useRoute();
const authStore = useAuthStore();

onMounted(async () => {
  const token = route.query.t as string;
  await authStore.login('MAGIC_LINK', token);
});
</script>
