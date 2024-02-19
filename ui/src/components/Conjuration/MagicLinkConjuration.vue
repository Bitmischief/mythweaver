<script lang="ts" setup>
import { onMounted } from 'vue';
import { postMagicLinkGeneration } from '@/api/generators';
import { getConjurationRequest } from '@/api/conjurations';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

onMounted(async () => {
  const token = route.query.t as string;
  const response = await postMagicLinkGeneration(token);
  const conjuration = await getConjurationRequest(
    response.data.conjurationRequestId,
  );
  console.log('data', conjuration.data);

  if (conjuration.data) {
    console.log('existing conjuration', conjuration.data);
    router.push(`/conjurations/view/${conjuration.data.id}`);
  } else {
    // setup all the channel bindings
  }
});
</script>

<template>
  <div>Test</div>
</template>
