<template>
  <MeteorShower />
  <div
    v-if="generators.length && !generating"
    class="flex justify-center my-auto"
  >
    <div class="w-full md:w-[80%] xl:w-[70%] 2xl:w-[60%] 3xl:w-[50%]">
      <img
        src="@/assets/icons/gradient-wand.svg"
        alt="wand"
        class="w-8 md:w-12 mx-auto"
      />
      <div class="text-[24px] md:text-[48px] font-bold text-center">
        MythWeaver AI
      </div>
      <div class="text-neutral-600 mb-4 md:mb-12 text-center">
        Generate captivating visuals & conjurations
      </div>
      <div class="flex mb-6 justify-center">
        <div
          class="flex gap-1 text-neutral-500 rounded-[10px] bg-surface-2 p-1 border border-surface-3 text-sm"
        >
          <div
            v-for="(gens, i) in generators"
            :key="`generator_${i}`"
            :class="{
              'relative group/proOnly': proOnly(gens),
              'relative group/experimental':
                !proOnly(gens) && gens.experimental,
            }"
          >
            <button
              class="w-[8em] md:w-[12em] py-2 px-4 rounded-[10px] flex gap-1 justify-center whitespace-nowrap disabled:bg-surface/25"
              :class="{
                'text-white bg-surface-3': generator?.code === gens.code,
              }"
              :disabled="proOnly(gens)"
              @click="generatorChanged(gens)"
            >
              <span class="self-center">{{ gens.name }}</span>
              <LockClosedIcon
                v-if="proOnly(gens)"
                class="h-5 w-5 self-center"
              />
              <BeakerIcon
                v-else-if="gens.experimental"
                class="h-5 w-5 text-fuchsia-500/75"
              />
            </button>
            <div class="tooltip-top group-hover/proOnly:block">
              This conjuration type is only available to Pro users
              <div class="tooltip-arrow" />
            </div>
            <div class="tooltip-top group-hover/experimental:block py-2 px-4">
              This is an experimental new conjuration type, please be aware that
              <br />
              the results might not be as polished as other conjuration types.
              <div class="tooltip-arrow" />
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="selectedIsProOnly"
        class="text-center text-sm text-amber-500/75 mb-2"
      >
        This conjuration type is only available to Pro users
      </div>
      <div
        class="bg-gradient-to-r from-fuchsia-500 to-violet-500 p-px rounded-[20px] purple-shadow"
      >
        <FormKit
          v-slot="{ disabled }"
          :actions="false"
          type="form"
          @submit="generate"
        >
          <div class="p-3 rounded-[20px] bg-surface-2 min-h-[12em]">
            <div class="relative pb-1 grow">
              <FormKit
                v-model="request.prompt"
                :placeholder="`Enter ${generator?.name} Description`"
                inner-class="border-none"
                input-class="$reset input-secondary border-none focus:ring-fuchsia-500 resize-none md:pr-[8em]"
                help-class="px-1"
                name="prompt"
                type="textarea"
                validation="length:0,2500"
                auto-height
                :disabled="selectedIsProOnly"
              />
              <div class="hidden md:block absolute top-1 right-1">
                <button
                  v-if="!request.prompt"
                  class="button-gradient py-2 px-3 flex"
                  :disabled="!generator"
                  @click.prevent="quickConjure(generator?.code || 'characters')"
                >
                  <img
                    src="@/assets/icons/wand.svg"
                    alt="wand"
                    class="h-4 mr-1"
                  />
                  Surprise Me
                </button>
                <!-- prettier-ignore -->
                <button
                  v-else
                  class="button-gradient py-2 px-3 flex"
                  :disabled="(disabled as boolean) || selectedIsProOnly"
                  type="submit"
                >
                  <img
                    src="@/assets/icons/wand.svg"
                    alt="wand"
                    class="h-4 mr-1"
                  />
                  Conjure
                </button>
              </div>
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ request.prompt.length }} / 1000
              </div>
            </div>

            <div
              v-if="conjurationLimitReached"
              class="text-xs text-amber-300 px-2"
            >
              You have reached your conjuration limit for the FREE plan. You
              must upgrade your plan or delete conjurations to add more.
            </div>

            <div class="flex mt-4 mb-2 justify-center">
              <div
                class="flex gap-1 text-neutral-500 rounded-[10px] bg-surface-2 p-1 border border-surface-3 text-sm grow"
              >
                <button
                  v-for="(opt, i) in promptOptions"
                  :key="`prompt_option_${i}`"
                  class="grow text-center py-2 px-4"
                  :class="{
                    'text-white rounded-[10px] bg-surface-3':
                      promptOptionsTab === opt,
                  }"
                  @click.prevent="promptOptionsTab = opt"
                >
                  {{ opt }}
                </button>
              </div>
            </div>

            <div v-if="promptOptionsTab === 'Image Style'">
              <Select
                v-model="request.imageStylePreset"
                :options="imagePresetStyles"
                value-prop="code"
                display-prop="name"
                secondary
              />
            </div>
            <div
              v-if="promptOptionsTab === 'Image Prompt'"
              class="relative pb-1"
            >
              <FormKit
                v-model="request.imagePrompt"
                placeholder="Image prompt (optional)"
                inner-class="border-none"
                input-class="$reset input-secondary border-none rounded-[8px] focus:ring-fuchsia-500"
                help-class="px-1"
                type="textarea"
                name="image_prompt"
                validation="length:0,1000"
                auto-height
              />
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ request.imagePrompt.length }} / 1000
              </div>
            </div>
            <div
              v-if="promptOptionsTab === 'Negative Prompt'"
              class="relative pb-1"
            >
              <FormKit
                v-model="request.imageNegativePrompt"
                placeholder="Negative image prompt (optional)"
                inner-class="border-none"
                input-class="$reset input-secondary border-none rounded-[8px] focus:ring-fuchsia-500"
                help-class="px-1"
                type="textarea"
                name="negative_prompt"
                validation="length:0,1000"
                auto-height
                help="The negative prompt is used to tell the AI what you DON'T want in your image. This is not a magic bullet, and can't guarantee anything, but does help to guide your output in the direction you want."
              />
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ request.imageNegativePrompt.length }} / 1000
              </div>
            </div>
          </div>

          <div class="md:hidden">
            <button
              v-if="!request.prompt"
              class="button-gradient py-4 px-3 flex w-full justify-center rounded-[20px]"
              :disabled="!generator"
              @click.prevent="quickConjure(generator?.code || 'characters')"
            >
              <img src="@/assets/icons/wand.svg" alt="wand" class="h-4 mr-1" />
              Surprise Me
            </button>
            <!-- prettier-ignore -->
            <button
              v-else
              class="button-gradient py-2 px-3 flex w-full justify-center rounded-[20px]"
              :disabled="(disabled as boolean)"
              type="submit"
            >
              <img
                src="@/assets/icons/wand.svg"
                alt="wand"
                class="h-4 mr-1"
              />
              Conjure
            </button>
          </div>
        </FormKit>
      </div>
      <div class="text-lg mt-12 text-center">Sample Prompts</div>
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
              @click.prevent="request.prompt = des"
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
              @click.prevent="request.prompt = des"
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
              @click.prevent="request.prompt = des"
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
              @click.prevent="request.prompt = des"
            >
              Copy example
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div v-if="generating" class="flex justify-center items-center h-full">
    <div class="text-center">
      <Loader />
      <div class="text-2xl my-4">Conjuring</div>
      <div class="text-neutral-500">
        This can take a minute or two to fully load
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Conjurer, getConjurers, postConjure } from '@/api/generators.ts';
import { useRoute, useRouter } from 'vue-router';
import {
  useCurrentUserPlan,
  useQuickConjure,
  useSelectedCampaignId,
  useWebsocketChannel,
} from '@/lib/hooks.ts';
import Select from '../Core/Forms/Select.vue';
import { ServerEvent } from '@/lib/serverEvents.ts';
import { showError, showInfo } from '@/lib/notifications.ts';
import Loader from '../Core/Loader.vue';
import MeteorShower from '../Core/MeteorShower.vue';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store';
import { BillingPlan } from '@/api/users.ts';
import { FreeTierConjurationLimit } from '@/lib/consts.ts';
import { BeakerIcon, LockClosedIcon } from '@heroicons/vue/24/outline';

const route = useRoute();
const router = useRouter();
const quickConjure = useQuickConjure();
const generators = ref<Conjurer[]>([]);
const promptOptions = ref(['Image Style', 'Image Prompt', 'Negative Prompt']);
const promptOptionsTab = ref(promptOptions.value[0]);
const generator = ref<Conjurer>();
const channel = useWebsocketChannel();
const authStore = useAuthStore();
const currentUserPlan = useCurrentUserPlan();

onMounted(async () => {
  let { prompt, code, imagePrompt, imageNegativePrompt, stylePreset } =
    route.query;

  if (prompt) {
    request.value.prompt = prompt as string;
  }

  await loadGenerators();

  if (code) {
    const generator = generators.value.find((g) => g.code === code);
    if (generator) {
      generatorChanged(generator);
    }
  }
  if (imagePrompt) {
    request.value.imagePrompt = imagePrompt as string;
  }
  if (imageNegativePrompt) {
    request.value.imageNegativePrompt = imageNegativePrompt as string;
  }
  if (stylePreset) {
    request.value.imageStylePreset = stylePreset as
      | 'fantasy-art'
      | 'digital-art'
      | 'comic-book';
  }
});

async function loadGenerators() {
  const generatorsReponse = await getConjurers();
  generators.value = generatorsReponse.data.data;
  generator.value = generatorsReponse.data.data[0];
  imagePresetStyles.value =
    generator.value?.supportedImageStylePresets?.map((style) => ({
      code: style,
      name: toTitleCase(style),
    })) || [];
}

const selectedCampaignId = useSelectedCampaignId();

const request = ref<{
  prompt: string;
  imageStylePreset: 'fantasy-art' | 'digital-art' | 'comic-book';
  imagePrompt: string;
  imageNegativePrompt: string;
  imageReferenceImage: string;
}>({
  prompt: '',
  imageStylePreset: 'fantasy-art',
  imagePrompt: '',
  imageNegativePrompt: '',
  imageReferenceImage: '',
});

const existingConjuration = ref(false);
const showExistinConjurationWarning = ref(false);
const existinConjurationOverride = ref(false);
const imagePresetStyles = ref<any[]>([]);

function generatorChanged(gen: Conjurer) {
  generator.value = gen;
  imagePresetStyles.value =
    generator.value.supportedImageStylePresets?.map((style) => ({
      code: style,
      name: toTitleCase(style),
    })) || [];
}

function toTitleCase(str: string) {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(' ');
}

async function generate() {
  if (!generator.value) {
    return;
  }

  if (!selectedCampaignId.value) {
    showInfo({ message: 'Please select a campaign first.' });
    return;
  }

  if (existingConjuration.value && !existinConjurationOverride.value) {
    showExistinConjurationWarning.value = true;
    return;
  }

  if (existinConjurationOverride.value) {
    existinConjurationOverride.value = false;
  }

  let generateResponse;
  try {
    generateResponse = await postConjure(generator.value.code, {
      count: 1,
      campaignId: selectedCampaignId.value || 0,
      ...request.value,
    });
  } catch (e: any) {
    const err = e as AxiosError;
    if (e.response?.data?.name === 'CONJURATION_LIMIT_REACHED') {
      showError({
        message:
          'You have reached the maximum number of conjurations for the FREE plan.',
        context:
          'You must upgrade your plan or delete conjurations to add more.',
      });
      return;
    }

    if (err.response?.status === 400) {
      showError({
        message: (err.response?.data as any)?.message,
      });
      return;
    }

    showError({ message: 'We encountered an error conjuring this image.' });
    return;
  }

  handleBeginConjuring(generateResponse.data);

  existingConjuration.value = true;
}

const animationDone = ref(false);
const generating = ref(false);
const imageGenerationFailed = ref(false);
const imageGenerationFailureReason = ref('');
const conjurationRequestId = ref<number | undefined>(undefined);
const createdConjuration = ref<any>(undefined);

function handleBeginConjuring(data: { conjurationRequestId: number }) {
  animationDone.value = false;
  generating.value = true;

  conjurationRequestId.value = data.conjurationRequestId;

  channel.bind(ServerEvent.ConjurationCreated, conjurationCreatedHandler);
  channel.bind(ServerEvent.ConjurationError, conjurationErrorHandler);
  channel.bind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.bind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.bind(ServerEvent.ImageError, imageErrorHandler);
}

function conjurationCreatedHandler(data: any) {
  generating.value = false;
  createdConjuration.value = data;
  router.push(`/conjurations/view/${createdConjuration.value.id}`);
}

function conjurationErrorHandler() {
  generating.value = false;
  showError({
    message:
      'There was a server error creating your conjuration. Reach out to support for help resolving this issue.',
  });
}

function imageCreatedHandler(data: any) {
  createdConjuration.value.imageUri = data.uri;
}

function imageFilteredHandler() {
  const message =
    'The generated image was filtered out by our content moderation system. Please try again.';
  showError({
    message,
  });
  imageGenerationFailed.value = true;
  imageGenerationFailureReason.value = message;
}

function imageErrorHandler(data: any) {
  showError({
    message: data.message,
  });
  imageGenerationFailed.value = true;
  imageGenerationFailureReason.value = data.message;
}

onUnmounted(() => {
  channel.unbind(ServerEvent.ConjurationCreated, conjurationCreatedHandler);
  channel.unbind(ServerEvent.ConjurationError, conjurationErrorHandler);
  channel.unbind(ServerEvent.ImageCreated, imageCreatedHandler);
  channel.unbind(ServerEvent.ImageFiltered, imageFilteredHandler);
  channel.unbind(ServerEvent.ImageError, imageErrorHandler);
});

const conjurationLimitReached = computed(() => {
  return !!(
    authStore.user &&
    authStore.user.plan === BillingPlan.Free &&
    authStore.user.conjurationCount >= FreeTierConjurationLimit
  );
});

const selectedIsProOnly = computed(() => {
  return generator.value ? proOnly(generator.value) : false;
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

<style lang="scss">
.purple-shadow {
  box-shadow:
    0px 0px 35px -5px rgba(#c952e9, 0.2),
    0px 0px 20px -6px rgba(#c952e9, 0.2);
}
</style>
