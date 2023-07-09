<script setup lang="ts">
import { ref } from "vue";

const types = ref([
  {
    name: "Townfolk",
    description:
      "These are the ordinary people living in the towns and cities where your players might stop. They can provide important quest information or serve as contacts for your party.",
    children: [
      {
        name: "Barkeep",
        description:
          "Owners or operators of local taverns or pubs. They serve drinks, often brew their own ale or spirits, provide a gathering place for locals, and sometimes offer food or rooms to let. A barkeep often hears the latest news and rumors circulating in the town.",
      },
      {
        name: "Artisan",
        description:
          "Skilled workers who produce goods and crafts, such as blacksmiths, carpenters, bakers, tailors, and potters.",
      },
      {
        name: "Farmer",
        description:
          "Individuals who cultivate land and raise crops or livestock. They are crucial for the town’s food supply.",
      },
      {
        name: "Merchant",
        description:
          "Business people who trade in goods, buying them wholesale from producers (often farmers) and selling them to consumers.",
      },
      {
        name: "Noble",
        description:
          "Members of the upper class, who may own land, have familial ties to the rulers, or hold significant influence in town affairs.",
      },
      {
        name: "Guard",
        description:
          "Local law enforcement responsible for maintaining order, enforcing laws, and protecting the town and its citizens.",
      },
      {
        name: "Innkeeper",
        description:
          "Owners or managers of inns, who provide food, drink, and a place to sleep for travelers and sometimes locals too.",
      },
      {
        name: "Healer",
        description:
          "Skilled in the art of medicine, they might be herbalists, apothecaries, or magical healers, and they help maintain the health of the townfolk.",
      },
      {
        name: "Scholar",
        description:
          "Learned individuals focused on the pursuit of knowledge, often specializing in a particular field such as history, magic, nature, or the arts.",
      },
      {
        name: "Fisherman",
        description:
          "Individuals who catch fish and other sea creatures as a food source, either for direct consumption or to sell at market.",
      },
      {
        name: "Miner",
        description:
          "Hard-working individuals who extract valuable minerals, metals, and gems from the earth, often facing hazardous conditions.",
      },
    ],
  },
]);
</script>

<template>
  <div
    v-for="(action, i) of types"
    :key="i"
    class="grid grid-cols-1 gap-8 md:grid-cols-4"
  >
    <div class="flex rounded-xl bg-purple-900 p-2">
      <div class="w-full">
        <div class="text-lg">
          {{ action.name }}
        </div>

        <div class="h-[3rem] overflow-hidden text-xs text-purple-300">
          {{ action.description }}
        </div>
      </div>
    </div>
  </div>
</template>
