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
          <button
            v-for="(gens, i) in generators"
            :key="`generator_${i}`"
            class="w-[8em] md:w-[12em] text-center py-2 px-4"
            :class="{
              'text-white rounded-[10px] bg-surface-3':
                generator?.code === gens.code,
            }"
            @click="generatorChanged(gens)"
          >
            {{ gens.name }}
          </button>
        </div>
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
                validation="length:0,1000"
                auto-height
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
              <div class="absolute text-neutral-500 text-xs right-2 bottom-0">
                {{ request.prompt.length }} / 1000
              </div>
            </div>

            <div
              v-if="showConjurationLimit && conjurationLimitReached"
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
        class="grid grid-cols-1 xl:grid-cols-3 text-neutral-500 mx-auto gap-4 mt-4"
      >
        <div :key="`sample_prompt_1`" class="rounded-[20px] bg-surface-2 p-4">
          {{ characterDescription }}
        </div>
        <div :key="`sample_prompt_2`" class="rounded-[20px] bg-surface-2 p-4">
          {{ locationDescription }}
        </div>
        <div :key="`sample_prompt_3`" class="rounded-[20px] bg-surface-2 p-4">
          {{ monsterDescription }}
        </div>
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
import { useLDFlag } from 'launchdarkly-vue-client-sdk';

const route = useRoute();
const router = useRouter();
const quickConjure = useQuickConjure();
const generators = ref<Conjurer[]>([]);
const promptOptions = ref(['Image Style', 'Image Prompt', 'Negative Prompt']);
const promptOptionsTab = ref(promptOptions.value[0]);
const generator = ref<Conjurer>();
const channel = useWebsocketChannel();
const authStore = useAuthStore();
const showConjurationLimit = useLDFlag('free-tier-conjuration-limit', false);

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

  channel.bind(ServerEvent.ConjurationCreated, function (data: any) {
    generating.value = false;
    createdConjuration.value = data;
    router.push(`/conjurations/view/${createdConjuration.value.id}`);
  });

  channel.bind(ServerEvent.ConjurationError, function () {
    generating.value = false;
    showError({
      message:
        'There was a server error creating your conjuration. Reach out to support for help resolving this issue.',
    });
  });

  channel.bind(ServerEvent.ImageCreated, function (data: any) {
    createdConjuration.value.imageUri = data.uri;
  });

  channel.bind(ServerEvent.ImageFiltered, function () {
    const message =
      'The generated image was filtered out by our content moderation system. Please try again.';
    showError({
      message,
    });
    imageGenerationFailed.value = true;
    imageGenerationFailureReason.value = message;
  });

  channel.bind(ServerEvent.ImageError, function (data: any) {
    showError({
      message: data.message,
    });
    imageGenerationFailed.value = true;
    imageGenerationFailureReason.value = data.message;
  });
}

onUnmounted(() => {
  channel.unbind(ServerEvent.ConjurationCreated);
  channel.unbind(ServerEvent.ConjurationError);
  channel.unbind(ServerEvent.ImageCreated);
  channel.unbind(ServerEvent.ImageFiltered);
  channel.unbind(ServerEvent.ImageError);
});

const conjurationLimitReached = computed(() => {
  return !!(
    authStore.user &&
    authStore.user.plan === BillingPlan.Free &&
    authStore.user.conjurationCount >= FreeTierConjurationLimit
  );
});

const characterDescription = computed(() => {
  const descriptions = [
    'A gnomish illusionist with a clockwork companion that projects holographic images, creating lifelike illusions to confound enemies and entertain allies.',
    'A tiefling warlock with a pair of magical gloves that manipulate time, allowing them to briefly rewind or accelerate moments with a snap of their fingers.',
    'A tabaxi monk with a crystalline staff that channels the power of the moon, creating beams of silvery light to strike enemies and heal allies.',
    'An elven rogue with a sentient, shape-shifting cloak that transforms into various disguises, helping them infiltrate high-security locations.',
    'A dwarven cleric with a singing warhammer that harmonizes with their prayers, unleashing sonic waves to both heal allies and damage foes.',
    'A lizardfolk druid with a symbiotic plant companion, a walking vine that provides cover, entangles enemies, and blooms with vibrant flowers when pleased.',
    'A halfling sorcerer with a magical, floating quill that writes prophecies predicting the outcomes of battles and revealing hidden truths.',
    'A human bard with a set of enchanted dance shoes, allowing them to move with extraordinary grace and even manipulate the battlefield with rhythmic steps.',
    'A dragonborn paladin with a sentient shield forged from celestial scales, projecting protective barriers and unleashing radiant bursts against evil foes.',
    'A kenku artificer with a backpack full of clockwork insects, serving as spies, scouts, and tiny saboteurs in intricate mechanisms.',
    'An aasimar wizard with a celestial tattoo that animates into a protective aura, shielding allies and reflecting harmful spells back to their casters.',
    'A goliath ranger with a pair of spectral wolves that aid them in hunting, tracking, and attacking enemies with ethereal fangs.',
    'A tiefling warlock with a chaotic, ever-shifting mask that grants them new abilities and appearances with each transformation.',
    'A gnome alchemist with a pocket-sized laboratory, concocting potions mid-battle to unleash various effects from explosive bursts to invigorating elixirs.',
    'A halfling rogue with a sentient, acrobatic dagger that twists and turns mid-air, always finding the perfect angle to strike vital spots.',
    'An elven cleric with a sacred hourglass that controls the flow of time, either aging enemies rapidly or reversing injuries with each turn.',
    'A human druid with a set of enchanted vines that create protective barriers, tangle enemies, and even form into a bridge to cross obstacles.',
    'A tabaxi sorcerer with fur that changes color based on their mood, each hue granting a different magical affinity, from fire to frost.',
    'A dwarf monk with a keg of endless ale that grants temporary buffs and heals, becoming a source of both wisdom and inebriated inspiration.',
    'A lizardfolk bard with a hypnotic gaze, captivating enemies and allies alike with tales told through primal hisses and rhythmic tail movements.',
    'A tiefling warlock with a sentient, shadowy mirror that reveals glimpses of alternate realities, predicting potential futures and unseen threats.',
    'An aasimar paladin with a pair of radiant wings that manifest during moments of divine fervor, inspiring allies and striking fear into the hearts of enemies.',
    'A kenku rogue with a set of enchanted boots that allow them to traverse any surface, including walls and ceilings, with feline agility.',
    'A halfling wizard with a floating, sentient spellbook that offers advice, insights, and occasionally casts spells on its own accord.',
    'A gnome ranger with a mechanical, clockwork owl companion that not only scouts but can unleash blinding flashes of light to blind enemies.',
    'A tabaxi druid with the ability to transform into mythological creatures from ancient stories, each form granting unique abilities and strengths.',
    'A dwarf sorcerer with a set of enchanted gauntlets that conjure elemental gloves, empowering their spells with the fury of fire, ice, or lightning.',
    'A goliath barbarian with a sentient totem that grants them the strength and abilities of various animals, unleashing primal ferocity in battle.',
    'An elven cleric with a sacred chalice that purifies water, heals wounds, and can even unleash tidal waves when filled with ocean water.',
    'A tiefling rogue with a cloak of shifting shadows, melding seamlessly with darkness and creating illusions to distract or confound enemies.',
    'A human warlock with a cursed coin that feeds on luck, influencing fate in unpredictable ways when flipped in crucial moments.',
    'A dragonborn bard with a musical instrument that summons ethereal echoes of legendary bards, each note resonating with a different magical effect.',
    'A kenku sorcerer with the ability to mimic the voices of powerful beings, calling forth the magic of ancient wizards and dragons in their incantations.',
    'An aasimar monk with celestial tattoos that flare with radiant energy during martial arts maneuvers, creating a dazzling spectacle in battle.',
    "A tabaxi paladin with a blade forged from a fallen star, channeling the cosmos' power to smite enemies and inspire awe in those who witness its brilliance.",
    'A dwarf druid with a talking stone that grants knowledge of hidden passages and speaks the secrets of the earth, aiding in both exploration and diplomacy.',
    'A halfling artificer with a collection of clockwork critters, from tiny mechanical spiders to buzzing mechanical bees, each serving a unique purpose.',
    'An elven rogue with a set of enchanted gloves that phase through solid objects, allowing them to pick locks or steal without leaving a trace.',
    'A gnome cleric with a vial of blessed honey that heals wounds and neutralizes poisons, harvested from sacred bees that follow them.',
    'A lizardfolk wizard with a sentient, arcane tattoo that shifts across their scales, granting new spells and abilities with each transformation.',
    'A tiefling ranger with a pet phoenix that rises from its ashes, providing both fiery support in battle and rebirth in dire situations.',
    'An aasimar rogue with a set of ethereal wings that grant them flight, allowing them to soar gracefully above enemies and obstacles.',
    'A goliath sorcerer with crystalline spikes that erupt from their skin during moments of intense spellcasting, creating a formidable magical defense.',
    'A kenku paladin with a warhammer that echoes with the voices of angelic choirs, imbuing each strike with divine power and righteous fury.',
    'A halfling bard with an instrument that manipulates emotions, shifting the mood of the battlefield and inspiring courage or despair as needed.',
    'A tabaxi warlock with a sentient feather that absorbs the knowledge of those it touches, providing insights and arcane secrets to its master.',
    'A dwarf monk with a set of enchanted brews that grant temporary enhancements, from increased agility to heightened senses and even brief levitation.',
    'A tiefling cleric with a staff of radiant flames, channeling divine fire to heal allies, repel undead, and scorch foes with holy retribution.',
    'An elven druid with a pair of enchanted bracers that summon protective spirits of nature, forming a spectral barrier against attacks.',
    'A human wizard with a crystal ball that reveals glimpses of alternate timelines, allowing them to glimpse into parallel worlds for strategic insights.',
    'A dragonborn rogue with a cloak made from the scales of a shadow dragon, blending seamlessly into darkness and avoiding detection.',
    'A kenku ranger with a bow that fires ethereal arrows, phasing through obstacles to hit targets behind cover or bypassing magical defenses.',
    'A gnome sorcerer with a pocket-sized portal to the elemental plane of candy, unleashing sugary storms and creating delicious distractions.',
    'A tiefling paladin with a sentient, flaming sword that speaks prophecies, guiding the character to their destiny and burning foes with righteous fury.',
    'An aasimar barbarian with a war drum that channels divine rage, inspiring allies and striking fear into enemies with thunderous beats.',
    'A lizardfolk rogue with a set of enchanted climbing claws, allowing them to traverse vertical surfaces and ambush enemies from unexpected angles.',
    'A halfling warlock with a cursed book that writes its own dark prophecies, providing both forbidden knowledge and a path to unavoidable fate.',
    'A tabaxi cleric with a holy relic in the form of a feline statuette, imbued with the powers of the divine and able to summon celestial feline companions.',
  ];
  const randIndex = Math.floor(Math.random() * descriptions.length);
  return descriptions[randIndex];
});

const locationDescription = computed(() => {
  const descriptions = [
    'The Crystal Caverns, a subterranean wonder filled with luminescent crystals that pulse with otherworldly energy, casting dancing rainbows on the cavern walls, and echoing with the melodic hum of ancient chants.',
    'The Clockwork Gardens, a surreal landscape of gears and mechanical blooms that blossom with steam, tended by metallic automatons, and governed by the rhythmic ticking of an enormous celestial timepiece.',
    'The Whispering Peaks, towering mountain ranges where the winds carry ethereal voices, telling tales of forgotten civilizations, and where mystical clouds part to reveal glimpses of distant celestial realms.',
    "The Enchanted Lagoon, a tranquil oasis surrounded by iridescent flora that blooms in harmony with the phases of the moon, and where the water's surface reflects the dreams of those who gaze upon it.",
    'The Nebula Nexus, a celestial junction where swirling nebulae converge, creating a breathtaking cosmic display in the night sky, and where portals to distant galaxies open and close with unpredictable rhythms.',
    'The Mirror Maze, an ever-shifting labyrinth of reflective surfaces that distort reality, inhabited by elusive shadow creatures and guarded by a sentient, mirrored guardian that mirrors the actions of intruders.',
    "The Siren's Sanctuary, a submerged city beneath the ocean's surface, illuminated by bioluminescent flora, and ruled by enigmatic merfolk who sing haunting melodies that lure sailors to their hidden realm.",
    'The Veiled Valley, a lush, sun-dappled valley cloaked in perpetual mist, where spectral creatures roam and time seems to flow differently, occasionally revealing glimpses of possible futures.',
    'The Ember Wastes, a desolate desert where the sands glow with residual magical energy, creating shifting patterns of vibrant colors, and where ancient fire spirits rise from the ground, dancing with flames.',
    'The Celestial Observatory, a mountaintop structure adorned with telescopes and astrological instruments, where scholars observe the movements of celestial bodies and divine prophecies in the patterns of the stars.',
    'The Floating Isles, a cluster of floating landmasses suspended in the sky by unseen forces, each isle with its own ecosystem and gravity, connected by ethereal bridges of shimmering light.',
    'The Eternal Storm, a perpetual tempest with lightning that dances across the sky, revealing floating islands inhabited by storm elementals and ruled by an enigmatic thunder deity.',
    'The Labyrinth of Echoes, a maze of translucent crystalline walls that amplify and reflect sounds, creating an ever-shifting symphony of echoes, and where whispers of forgotten memories linger in the air.',
    'The Mirage Oasis, a mirage that appears only to the worthy, revealing a hidden oasis surrounded by an illusionary desert, where magical waters grant visions and the guardian djinn tests the resolve of seekers.',
    'The Frozen Veil, a majestic waterfall frozen in time, creating a shimmering curtain of ice that conceals a hidden cave behind it, where ancient frost nymphs guard a trove of lost treasures.',
    'The Astral Nexus, a nexus point between planes, where ethereal bridges connect realms of existence, and celestial beings pass through on their journey between the mortal world and the beyond.',
    'The Arboreal Archipelago, a collection of floating islands adorned with colossal, ancient trees, each island a unique ecosystem with flora and fauna adapted to its specific magical properties.',
    'The Emberforge Citadel, a colossal fortress at the heart of a volcanic mountain, where skilled blacksmiths forge legendary weapons using the molten metal from the depths of the earth.',
    'The Verdant Cathedral, an ancient forest with towering trees forming a natural cathedral, where druids commune with primal spirits and the leaves whisper the secrets of the earth.',
    'The Eternal Library, a mystical library that exists beyond time, with shelves stretching into infinity and containing tomes of knowledge from all epochs and realms, guarded by sentient librarian constructs.',
    'The Ethereal Bazaar, a marketplace suspended in the space between dimensions, where vendors from various planes sell exotic goods, and portals to distant realms open and close like shop entrances.',
    'The Enchanted Observatory, a tower crowned with a massive telescope that pierces the veil of reality, allowing observers to witness celestial events and divine the future with unparalleled accuracy.',
    'The Crystal Spire, a towering crystalline structure that resonates with magical energy, creating a protective barrier around a city where wizards experiment with forbidden arcane arts.',
    'The Luminous Tundra, a vast icy landscape where the snow glows with a gentle radiance, and ancient ice spirits roam, leaving behind trails of frozen illusions in their wake.',
    'The Gloomwood Hollow, a dark and twisted forest where the trees block out the sunlight, and mysterious wisps guide those who dare to enter to secret clearings filled with ancient knowledge.',
    'The Mirage Mirage, a city that appears as a mirage in the desert, guarded by illusions and shifting constantly, only revealing itself to those who possess the key to the hidden reality.',
    'The Emberfall Crater, a massive crater where a comet struck the earth, creating a pool of liquid starlight and awakening dormant creatures of celestial origin.',
    'The Crystal Lotus Gardens, a sacred grove where gigantic crystal lotus flowers bloom, each petal containing a different magical essence, and where the air is filled with the soothing hum of harmonic energies.',
    'The Whimsy Woods, a forest where reality is in constant flux, with trees that change shapes, and playful fey creatures leading wanderers through enchanting, ever-shifting pathways.',
    'The Elemental Nexus, a convergence point of elemental energies, where vortexes of fire, water, air, and earth intersect, creating a swirling tapestry of primordial power.',
    'The Misty Moors, an expansive marshland perpetually shrouded in mist, concealing ancient ruins, ethereal beings, and whispers of long-forgotten tales that drift through the fog.',
    'The Ephemeral Palace, a grand palace that materializes only during a lunar eclipse, adorned with silver filigree and hosting ethereal masquerades for otherworldly guests.',
    'The Shattered Skyline, a floating city in the sky where islands of land hover independently, connected by magical bridges, and ruled by elemental councils representing air, earth, fire, and water.',
    'The Starlit Cathedral, a celestial sanctuary floating in the cosmos, where the stars themselves form intricate stained glass windows, and ethereal hymns echo through the vastness of space.',
    'The Eternal Lotus Pond, a serene pond surrounded by lush vegetation and floating lotus flowers, each petal containing a tiny, peaceful realm accessible through meditation.',
    'The Echoing Ravine, a massive ravine where sound reverberates endlessly, creating a natural amphitheater where the voices of ancient spirits resonate in haunting harmony.',
    'The Sapphire Sanctum, an underwater city with crystalline structures and luminescent flora, where merfolk scholars safeguard ancient knowledge and converse with mystical sea creatures.',
    'The Enigma Nexus, a mysterious structure where the laws of reality are warped and twisted, creating optical illusions, gravity-defying corridors, and doorways that lead to seemingly impossible spaces.',
    'The Astral Observatory, a tower that extends beyond the mortal plane, allowing seers to gaze into the astral realm and witness the ebb and flow of cosmic energies.',
    'The Eclipsed Grove, a grove that only manifests during solar eclipses, where the shadows cast by the celestial alignment unveil hidden paths and reveal the secrets of the ancient druids.',
    'The Nebula Nexus, a celestial junction where swirling nebulae converge, creating a breathtaking cosmic display in the night sky, and where portals to distant galaxies open and close with unpredictable rhythms.',
    'The Twilight Spire, a towering spire that rises from the depths of an enchanted forest, where the boundary between day and night is blurred, and creatures of twilight emerge to dance in the moonlight.',
    'The Enchanted Aerie, a series of floating islands where majestic griffins nest, and ancient druidic rituals have fused the islands with the essence of the sky, allowing visitors to soar with the winds.',
    'The Ethereal Colosseum, a colossal arena floating in the astral plane, where mythical beings engage in epic battles, and the cheers of spectral spectators echo through the endless expanse.',
    'The Harmonic Hollow, a secluded glade surrounded by resonant crystals that amplify music, creating a harmonious symphony that attracts fey creatures and celestial beings to revel in the melodies.',
    'The Whispering Sands, a desert where the wind carries the whispers of long-lost civilizations, and the dunes shift to reveal buried ruins and ancient tombs that hold the key to forgotten wisdom.',
    'The Elemental Spire, a towering structure at the convergence of elemental planes, where elemental lords gather to negotiate, and where portals to realms of fire, water, air, and earth open at the whim of arcane guardians.',
    'The Celestial Confluence, a nexus point where the planes of existence intersect, and celestial beings manifest to share prophecies and guide mortals on quests of cosmic importance.',
    'The Nebula Nexus, a celestial junction where swirling nebulae converge, creating a breathtaking cosmic display in the night sky, and where portals to distant galaxies open and close with unpredictable rhythms.',
    'The Twilight Monastery, a mountain retreat where monks attune their spirits to the balance of day and night, and where ancient rituals unlock the power of twilight for those deemed worthy.',
    'The Enchanted Lotus Pool, a hidden pool surrounded by luminescent lotus flowers, each with the power to reveal glimpses of the future to those who dare to meditate upon their radiant petals.',
  ];
  const randIndex = Math.floor(Math.random() * descriptions.length);
  return descriptions[randIndex];
});

const monsterDescription = computed(() => {
  const descriptions = [
    'The Shadowweaver, a creature composed of living shadows, capable of slipping through the smallest of cracks and emerging to engulf its prey in darkness, draining the light from their very souls.',
    'The Cinderserpent, a serpentine creature wreathed in ever-burning flames, leaving trails of embers in its wake as it slithers through the darkest corners, consuming all in its path with searing heat.',
    'The Crystal Behemoth, a colossal creature made entirely of prismatic crystals, refracting light in mesmerizing patterns and unleashing devastating beams of energy from its multifaceted form.',
    'The Frostshifter, an elusive creature that can manipulate the very essence of cold, freezing the air around it and creating shimmering illusions to confound and disorient its prey.',
    'The Voidstalker, a creature born from the cosmic abyss, with tendrils that reach through dimensions, pulling unsuspecting victims into the void, leaving behind only echoes of their existence.',
    'The Gloomgazer, a monstrous eye floating within a swirling vortex of shadows, capable of inducing paralyzing fear in those who meet its gaze and summoning creatures from the darkest nightmares.',
    'The Thundergeist, a spectral being that materializes during storms, wielding bolts of lightning as ethereal tendrils, and unleashing thunderous roars that disorient and terrify all who hear them.',
    'The Ironbane Warden, a golem-like creature forged from enchanted metal, impervious to conventional weapons and capable of unleashing devastating seismic waves with each step.',
    'The Bloodmoon Howler, a wolf-like creature with fur the color of blood, howling at the moon to summon its pack, and leaving a trail of cursed lunar energy that twists the minds of those who tread upon it.',
    'The Enigma Sphinx, a creature with a body of shifting riddles and puzzles, challenging those who encounter it to solve its mysteries or face the consequences of being trapped in an enigmatic labyrinth.',
    'The Vortex Serpent, a massive serpent with scales that create miniature whirlwinds, capable of tearing through the landscape and sucking in anything unfortunate enough to be caught in its vortex.',
    'The Lurking Tangle, a creature that resembles a sentient mass of thorny vines and creeping tendrils, capable of ensnaring and strangling its prey with its ever-growing, animated vegetation.',
    'The Astral Leech, a parasitic entity that feeds on the life force of its victims, leaving behind drained husks and gaining the ability to cast twisted illusions to lure in more prey.',
    'The Blightshaper, a creature that exudes a corrosive aura, with every step causing plant life to wither and decay, and with the power to unleash a wave of blighted energy that consumes all in its path.',
    'The Magma Goliath, a towering humanoid made of molten rock and magma, leaving rivers of lava in its wake as it erupts from the earth, spewing fiery projectiles at those who dare approach.',
    'The Celestial Herald, a winged being adorned with radiant feathers and carrying a staff that channels divine energy, able to heal allies and unleash holy wrath upon those who oppose its celestial mission.',
    'The Soulshifter Swarm, a horde of incorporeal entities that feed on the essence of the living, overwhelming their prey with sheer numbers and leaving behind only echoes of the souls they consume.',
    'The Phantom Marauder, a spectral pirate captain and its ghostly crew, haunting the ethereal seas, capable of summoning ghostly vessels and unleashing cannonfire from the beyond.',
    'The Dreadforge Colossus, a massive construct forged from the remnants of fallen warriors, wielding a colossal weapon and animated by the vengeful spirits of those whose essence it contains.',
    'The Luminous Doppelganger, a shape-shifting creature that mimics the appearance of those it encounters, capable of disorienting its prey by creating illusions of allies or loved ones before striking.',
    'The Mindwarp Weaver, a spider-like creature that weaves webs of psychic energy, capable of manipulating the thoughts and perceptions of those ensnared, leading them into a nightmarish mental realm.',
    'The Chaos Harbinger, a being born from the chaos between dimensions, with limbs that shift and morph unpredictably, spreading an aura of discord and unleashing reality-warping attacks on its foes.',
    'The Abyssal Gazer, a creature with an eyeless face and a portal to the abyss within its chest, capable of drawing in nearby objects and creatures and banishing them to a dark and unknown realm.',
    'The Timebender Serpent, a serpent that can manipulate time itself, slowing its prey to a crawl or accelerating its own movements, leaving confusion and temporal anomalies in its wake.',
    'The Stormbringer Sphinx, a creature that controls the very weather, summoning storms, tornadoes, and lightning strikes to strike down those who cross its path, and creating an aura of perpetual turbulence.',
    'The Emberthorn Ravager, a massive insectoid creature with glowing embers for eyes, capable of launching fiery projectiles from its tail and igniting the very air with its scorching breath.',
    'The Spectral Mirage, an illusionary entity that blurs the line between reality and fantasy, capable of creating lifelike illusions that can harm and manipulate the perceptions of those who witness them.',
    'The Hexed Harvester, a creature that drains the magic from its surroundings, leaving behind a desolate and mana-deprived landscape, and wielding stolen arcane energies to cast devastating spells.',
    'The Nightmare Weaver, a spider-like creature that spins webs of nightmares, trapping its prey in terrifying visions and feeding on the fear and despair that it induces.',
    'The Aberrant Siren, a seductive and enchanting creature with an otherworldly voice, capable of luring unsuspecting travelers to their doom with its haunting melodies and entrancing dance.',
    'The Glimmerwing Swarm, a swarm of ethereal butterflies with razor-sharp wings, capable of slicing through armor and flesh, and leaving behind a trail of enchanting, glowing dust.',
    'The Dreadmist Stalker, a creature that can meld with shadows and become nearly invisible, stalking its prey with silent footsteps and striking with venomous fangs before disappearing once more.',
    'The Warpfiend Hydra, a multi-headed serpent with each head existing in a different plane of reality, capable of unleashing attacks from multiple dimensions and disorienting its foes with its chaotic movements.',
    'The Celestial Revenant, a benevolent spirit bound to the mortal realm, capable of healing wounds and restoring life, but with the power to unleash divine wrath upon those who threaten the balance.',
    'The Arcane Scourge, a creature born of pure arcane energy, capable of manipulating reality and warping the very fabric of existence, leaving behind distorted landscapes and shattered illusions.',
    'The Soulrender Wraith, a vengeful spirit that feeds on the life force of the living, draining the vitality from its victims and growing stronger with each soul it consumes.',
    'The Venomshade Basilisk, a serpent with scales that exude a toxic venom, capable of petrifying its prey with a single glance and leaving behind statues of those unfortunate enough to cross its gaze.',
    'The Gilded Gorgon, a creature with a gaze that turns everything it sees to solid gold, leaving behind a trail of glittering statues and amassing a hoard of gilded treasures.',
    'The Whisperwind Seraph, a celestial being with wings of shimmering light, capable of creating soothing melodies that heal and protect allies, and unleashing divine wrath upon those who would harm the innocent.',
    'The Soulbound Puppeteer, a puppet-like entity controlled by unseen strings, capable of manipulating the movements and actions of other creatures, turning them into unwitting marionettes in its malevolent performance.',
    'The Plaguebringer Chimera, a hybrid creature with the heads of various beasts, each exhaling a different deadly contagion, leaving behind a trail of pestilence and despair.',
    'The Cursed Phantasm, a ghostly figure cursed to forever wander the mortal realm, capable of draining the life force from the living and leaving behind a chill that permeates the air.',
    'The Celestial Arbiter, a majestic being with the power to judge the souls of the departed, guiding them to their rightful afterlife, but capable of unleashing divine retribution upon those who defy the cosmic order.',
    'The Aetheric Leviathan, a colossal creature that swims through the ethereal plane, occasionally breaching into the mortal realm to unleash waves of otherworldly energy that distort reality.',
    'The Luminara Phoenix, a mythical bird with feathers that radiate blinding light, capable of resurrecting fallen allies and incinerating its foes with divine flames.',
    'The Umbral Shifter, a creature that can meld with shadows and teleport instantaneously, striking with surprise attacks and disappearing into the darkness before its prey can react.',
    'The Runebound Golem, a construct covered in ancient runes that grant it control over the elements, allowing it to manipulate earth, fire, water, and air to devastating effect.',
    'The Howling Banshee, a spectral entity with a haunting wail that induces terror in all who hear it, capable of passing through solid objects and unleashing waves of ghostly energy.',
    'The Astral Harvester, a creature that can extract the life force from distant stars, channeling cosmic energy to unleash devastating attacks and manipulate the very fabric of space.',
    'The Eternal Watcher, a statue-like creature that comes to life only when intruders approach, wielding a massive weapon and striking with unerring precision before returning to its dormant state.',
    'The Radiant Seraphim, a celestial being with wings of pure light, capable of banishing darkness and healing wounds with its divine presence, but with the power to smite those who embrace the shadows.',
    'The Eldritch Whirlwind, a swirling vortex of eldritch energy that devours everything in its path, leaving behind a desolate landscape of twisted reality.',
    'The Veilwalker Djinn, a magical being that can manipulate reality to create illusions, bend time and space, and transport itself and others between different planes of existence.',
    'The Arcane Nexus, a creature with a body composed of pure arcane energy, capable of absorbing and redirecting magical attacks, and unleashing devastating spells that warp reality itself.',
    'The Inferno Drake, a dragon-like creature wreathed in ever-burning flames, capable of unleashing torrents of fire and leaving behind scorched landscapes.',
    'The Stormforged Titan, a massive humanoid construct powered by the fury of storms, wielding lightning as a weapon and unleashing thunderous shockwaves with each step.',
    'The Shadowmeld Stalker, a creature that can blend seamlessly with its surroundings, becoming nearly invisible and striking with deadly precision from the shadows.',
    'The Crystalweaver Arachnid, a giant spider with crystalline silk that reflects and refracts light, capable of trapping prey in a dazzling array of illusions before delivering a venomous bite.',
    'The Abyssal Leviathan, a colossal sea serpent with eyes that glow with the malevolent light of the abyss, capable of dragging entire ships beneath the waves and summoning eldritch storms.',
    'The Frostfire Phoenix, a mythical bird with feathers of ice and flames, capable of freezing its foes with a mere glance and leaving behind a trail of frost and fire.',
    'The Voidforged Gargoyle, a stone statue animated by the void, capable of absorbing and redirecting magical attacks and turning its foes to shadow with a touch.',
    'The Dreambound Specter, a ghostly figure that enters the dreams of its victims, manipulating their subconscious fears and draining their life force as they sleep.',
    'The Infernal Djinn, a fire-infused genie that can command flames with a mere thought, capable of creating infernos and unleashing searing heat upon its foes.',
    'The Celestial Revenant, a benevolent spirit bound to the mortal realm, capable of healing wounds and restoring life, but with the power to unleash divine wrath upon those who threaten the balance.',
  ];
  const randIndex = Math.floor(Math.random() * descriptions.length);
  return descriptions[randIndex];
});
</script>

<style lang="scss">
.purple-shadow {
  box-shadow:
    0px 0px 35px -5px rgba(#c952e9, 0.2),
    0px 0px 20px -6px rgba(#c952e9, 0.2);
}
</style>
