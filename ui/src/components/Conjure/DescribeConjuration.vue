<script setup lang="ts">
import { showError, showInfo } from '@/lib/notifications.ts';
import { Conjurer, postConjure } from '@/api/generators.ts';
import { AxiosError } from 'axios';
import {
  useCurrentUserPlan,
  useSelectedCampaignId,
  useWebsocketChannel,
} from '@/lib/hooks.ts';
import { computed, onUnmounted, ref } from 'vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { BillingPlan } from '@/api/users.ts';
import { Conjuration } from '@/api/conjurations.ts';
import Loader from '@/components/Core/Loader.vue';
import { ArrowLeftIcon } from '@heroicons/vue/24/solid';

const emit = defineEmits(['update:modelValue', 'next', 'back']);
const props = defineProps<{
  modelValue: Conjuration | undefined;
  generator: Conjurer;
}>();

const value = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value);
  },
});

const channel = useWebsocketChannel();
const currentUserPlan = useCurrentUserPlan();
const selectedCampaignId = useSelectedCampaignId();
// const quickConjure = useQuickConjure();

const generating = ref(false);
const conjurationRequestId = ref<number | undefined>(undefined);
const prompt = ref<string>('');

async function generate() {
  if (!props.generator) {
    return;
  }

  if (!selectedCampaignId.value) {
    showInfo({ message: 'Please select a campaign first.' });
    return;
  }

  let generateResponse;
  try {
    generateResponse = await postConjure(props.generator.code, {
      count: 1,
      campaignId: selectedCampaignId.value || 0,
      prompt: prompt.value,
      type: 'text',
    });
  } catch (e: any) {
    const err = e as AxiosError;
    if (err.response?.status === 400) {
      showError({
        message: (err.response?.data as any)?.message,
      });
      return;
    }

    showError({
      message: `We encountered an error conjuring this ${props.generator.name}. Please try again.`,
    });
    return;
  }

  handleBeginConjuring(generateResponse.data);
}

function handleBeginConjuring(data: { conjurationRequestId: number }) {
  generating.value = true;
  conjurationRequestId.value = data.conjurationRequestId;

  channel.bind(ServerEvent.ConjurationCreated, function (data: any) {
    console.log('conjuration created');
    value.value = data;
    emit('next');
    generating.value = false;
  });

  channel.bind(ServerEvent.ConjurationError, function () {
    generating.value = false;
    showError({
      message: `There was a server error creating your ${props.generator.name}. Please try again, or reach out to support if the problem persists.`,
    });
  });
}

onUnmounted(() => {
  channel.unbind_all();
});

const selectedIsProOnly = computed(() => {
  return props.generator ? proOnly(props.generator) : false;
});

const proOnly = (gen: Conjurer) => {
  return (
    gen.proOnly &&
    currentUserPlan.value !== BillingPlan.Trial &&
    currentUserPlan.value !== BillingPlan.Pro
  );
};

const characterDescription = computed(() => {
  const descriptions = [
    'A hulking male frost giant, quiet demeanor, wields a massive battle axe.',
    'A female elf wizard, ancient and wise, carries a staff embedded with a powerful crystal.',
    'A male human paladin, scarred and battle-hardened, wears full plate armor.',
    'A gnome tinkerer, extremely curious and inventive, always surrounded by mechanical devices.',
    'A dragonborn sorcerer, exiled royalty, adorned with intricate arcane tattoos.',
    'A female halfling bard, jolly and charming, plays a magical lute.',
    'A male half-orc ranger, grim and silent, accompanied by a loyal wolf.',
    'A tiefling cleric of the god of war, fierce and imposing, carries a flaming sword.',
    'A male dwarf rogue, former pirate captain, expert in traps and explosives.',
    'An undead vampire countess, sinister and elegant, manipulates shadows.',
    'A female gnome druid, protector of ancient forests, can transform into woodland creatures.',
    'A celestial warlock, male human, bound to a pact with an angelic being.',
    'A female orc barbarian, towering and muscular, wields a double-headed axe.',
    'An elven archer, male, former royal guard, unmatched in skill.',
    'A tiefling assassin, female, secretive and deadly, uses poison-tipped daggers.',
    'A male gnome artificer, eccentric and brilliant, constructs clockwork soldiers.',
    'A dragonborn monk, female, seeks enlightenment, fights with fluid grace.',
    'A human necromancer, male, cloaked in dark robes, controls undead minions.',
    'A female dwarf alchemist, fiery and loud, brews explosive potions.',
    'A lich wizard, male, seeks knowledge and power, has a phylactery hidden away.',
    'An orc war chief, male, inspiring and brutal, plans to conquer the lands.',
    'A female elf ranger, solitary and mysterious, guardian of a sacred grove.',
    'A merfolk sorceress, female, controls water elements, seeks revenge against surface dwellers.',
    'A minotaur gladiator, male, legendary fighter, seeks freedom from his past.',
    'A female human witch, lives in the deep woods, known for her prophetic visions.',
  ];
  const shuffled = descriptions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
});

const locationDescription = computed(() => {
  const descriptions = [
    'A bustling pub in the central district of a huge city with a steampunk theme, frequented by smugglers and thieves.',
    'A floating city in the sky, accessible only by airships, known for its advanced technology and arcane libraries.',
    'An ancient, cursed forest where time flows differently, and mythical creatures guard a powerful artifact.',
    'A labyrinthine network of catacombs beneath a desolate monastery, rumored to be haunted by the spirits of monks.',
    'A secluded island ruled by dragons, with a village of dragon-tamers and rare, magical resources.',
    'An underwater city shrouded in mystery and protected by sea creatures, holding secrets of a long-lost civilization.',
    'A towering mountain fortress, blanketed by snow and guarded by frost giants, holding ancient runes and weapons.',
    'A sprawling desert oasis with a hidden genie palace, where wishes are granted with potentially twisted outcomes.',
    'A colossal tree in a mystical forest, home to elves who master illusions and arboreal magic.',
    'A war-torn land where two factions of werewolves vie for control over a powerful ancient relic.',
    'A vibrant market on the back of a gigantic, wandering beast, selling rare goods and magical items.',
    'An abandoned alchemical laboratory in an overgrown ruin, still containing hazardous potions and undecipherable scrolls.',
    'A dimly lit tavern in the underbelly of a corrupt city, where assassins and outlaws negotiate in hushed tones.',
    'A celestial observatory on a remote mountain peak, where astronomers decipher the patterns of the stars and their prophecies.',
    'An opulent palace in a realm of eternal twilight, ruled by a vampiric countess who hosts decadent, deadly feasts.',
    'A perilous gorge echoing with the calls of monstrous creatures, with pathways lined with rare and deadly flora.',
    'An ancient temple submerged beneath a tranquil lake, protected by mythical naiads and containing divine relics.',
    'A forbidden library in a haunted castle, filled with magical books that can trap or free the minds of readers.',
    'A mystical carnival that appears only during a full moon, offering magical attractions with real enchantments and curses.',
    'A fortress on a volcanic island, where fire elementals and blacksmiths forge weapons imbued with elemental fury.',
    'A frozen cavern beneath an icy wasteland, where ancient beasts sleep and prehistoric secrets are hidden.',
    'A secret guildhall for illusionists, tucked away in a shifting, magical maze that rearranges its pathways.',
    'A sacrificial altar atop a stormy cliff, used by cultists to summon dark, thunderous entities from another realm.',
    'A tranquil monastery in a blooming valley, where monks meditate on celestial alignments to gain enlightenment.',
    'A cursed graveyard where the dead whisper secrets at night, and necromancers seek knowledge of dark magics.',
  ];
  const shuffled = descriptions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
});

const monsterDescription = computed(() => {
  const descriptions = [
    'A shadowy figure that steals dreams from sleeping villagers',
    'A colossal serpent made entirely of water, lurking in river deltas',
    'A phantom wolf that appears only during full moons to guard ancient ruins',
    'A sentient vine that strangles other plants and animals to expand its reach',
    'An ice golem that protects a sacred glacier, crafted from the glacier itself',
    'A fire spirit that dances in the heart of volcanoes, causing eruptions when angered',
    'A sand assassin that merges with deserts and camouflages perfectly within them',
    'A spectral librarian bound to an ancient, cursed library, knowing all forbidden knowledge',
    'A crystal dragon that hoards light instead of treasure, living deep underground',
    'A necromancer’s shadow that has gained autonomy and seeks to create its own undead army',
    'A beast made of intertwined branches and leaves, waking only to defend its forest',
    'A tiny fairy that rides on the wind, sowing chaos with mischievous spells',
    'A creature made of mirrors reflecting tormented souls, haunting abandoned mansions',
    'A living storm cloud that houses a thunderous heart, roaming the high seas',
    'A clay soldier animated by magic to guard forgotten tombs',
    'A ghastly chef who traps the souls of diners in his otherworldly banquet',
    'A flower siren with petals that emit hypnotic fragrances to lure in prey',
    'A rock giant that shapes mountains and valleys as it pleases, caring little for the creatures below',
    'A silver wraith that slithers through walls in the moonlight, draining life with its touch',
    'An acidic slime mold that devours metal, weakening infrastructure',
    'A wind spirit that weaves tales and secrets, causing strife with whispered words',
    'A monster made of discarded bones, seeking to reconstruct its body from graveyards',
    'A galactic squid that traverses through space, absorbing energy from stars',
    'A puppeteer insect that takes control of other creatures through parasitic infestation',
    'A witch’s familiar that gains power through devouring magical artifacts',
  ];
  const shuffled = descriptions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
});

const itemDescription = computed(() => {
  const descriptions = [
    'A ring that allows the wearer to understand any spoken language.',
    'A cloak that renders the user invisible when standing still.',
    'Boots that increase the user’s speed by double.',
    'A quill that never runs out of ink and can write by itself if given a command.',
    'A small mirror that shows a glimpse of the future when looked into at midnight.',
    'A compass that points towards the nearest magical creature.',
    'A key that can unlock any door, but breaks after three uses.',
    'A book that contains spells, but each spell can only be used once.',
    'Gloves that allow the user to climb any surface without slipping.',
    'A necklace that allows the user to breathe underwater.',
    'A hat that changes its appearance at the will of the wearer.',
    'An amulet that protects the wearer from being lied to.',
    'A flute that can charm animals when played.',
    'A lantern that burns without fuel and can change color at will.',
    'A belt that increases the strength of the wearer.',
    'A set of dice that always roll the desired number.',
    'A locket that holds a small creature that can scout ahead.',
    'A staff that can turn into a snake on command.',
    'Bracelets that emit a force field to protect the wearer.',
    'A robe that keeps the wearer at a comfortable temperature in any climate.',
    'A teacup that refills with any drink the user states.',
    'A paintbrush that paints by itself guided by the user’s thoughts.',
    'Scissors that can cut through any material.',
    'A map that updates its topography in real time.',
    'A stone that can store sunlight and emit it during the night.',
  ];
  const shuffled = descriptions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
});
</script>

<template>
  <div v-if="generating" class="p-12">
    <div class="text-center my-12">
      <Loader />
      <div class="text-3xl mt-4">Conjuring</div>
      <div class="text-lg text-neutral-500">
        This can take a minute or two to fully load
      </div>
    </div>
  </div>
  <div v-else>
    <FormKit :actions="false" type="form" @submit="generate">
      <div class="mb-4 flex gap-2 justify-between">
        <button class="button-primary flex gap-2" @click="emit('back')">
          <ArrowLeftIcon class="h-5 w-5 self-center" />
          <span class="self-center">Back</span>
        </button>

        <button class="button-gradient flex gap-2">
          <img
            src="@/assets/icons/wand.svg"
            alt="wand"
            class="h-5 self-center"
          />
          <span class="self-center">Conjure</span>
        </button>
      </div>
      <div class="text-xl">
        Give us a description of the
        <span class="gradient-text">{{ generator.name }}</span>
        you want to conjure
      </div>
      <div class="text-sm text-neutral-500 mb-2">
        {{ generator.customizationHelpPrompt }}
      </div>
      <div
        class="w-full bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px] purple-shadow"
      >
        <div class="flex flex-col p-3 rounded-[20px] bg-surface-2 min-h-[12em]">
          <div class="relative pb-1 grow">
            <FormKit
              v-model="prompt"
              :placeholder="`Enter ${generator?.name} Description`"
              inner-class="border-none"
              input-class="$reset input-secondary border-none focus:ring-fuchsia-500 resize-none md:pr-[8em]"
              help-class="px-1"
              name="prompt"
              type="textarea"
              validation="length:0,1000"
              rows="10"
              :disabled="selectedIsProOnly"
            />
            <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
              {{ prompt.length }} / 1000
            </div>
          </div>
        </div>
      </div>
      <div class="text-lg mt-12 text-center">Examples</div>
      <div
        class="grid grid-cols-1 xl:grid-cols-3 text-neutral-500 mx-auto gap-4 mt-4 justify-around"
      >
        <template v-if="generator?.code === 'characters'">
          <div
            v-for="(des, i) in characterDescription"
            :key="`sample_npc_${i}`"
            class="rounded-[20px] bg-surface-2 p-4 flex flex-col"
          >
            <div class="mb-2">{{ des }}</div>
            <button
              class="button-ghost-primary mt-auto"
              @click.prevent="prompt = des"
            >
              Copy example
            </button>
          </div>
        </template>
        <template v-else-if="generator?.code === 'locations'">
          <div
            v-for="(des, i) in locationDescription"
            :key="`sample_npc_${i}`"
            class="rounded-[20px] bg-surface-2 p-4 flex flex-col"
          >
            <div class="mb-2">{{ des }}</div>
            <button
              class="button-ghost-primary mt-auto"
              @click.prevent="prompt = des"
            >
              Copy example
            </button>
          </div>
        </template>
        <template v-else-if="generator?.code === 'monsters'">
          <div
            v-for="(des, i) in monsterDescription"
            :key="`sample_npc_${i}`"
            class="rounded-[20px] bg-surface-2 p-4 flex flex-col"
          >
            <div class="mb-2">{{ des }}</div>
            <button
              class="button-ghost-primary mt-auto"
              @click.prevent="prompt = des"
            >
              Copy example
            </button>
          </div>
        </template>
        <template v-else-if="generator?.code === 'items'">
          <div
            v-for="(des, i) in itemDescription"
            :key="`sample_npc_${i}`"
            class="rounded-[20px] bg-surface-2 p-4 flex flex-col"
          >
            <div class="mb-2">{{ des }}</div>
            <button
              class="button-ghost-primary mt-auto"
              @click.prevent="prompt = des"
            >
              Copy example
            </button>
          </div>
        </template>
      </div>
    </FormKit>
  </div>
</template>

<style scoped></style>