<template>
  <div class="h-full w-full bg-dragon bg-contain bg-top bg-no-repeat">
    <div class="flex justify-center bg-black/20">
      <div class="flex w-[75rem] flex-col justify-between p-6 md:flex-row">
        <img src="/images/logo-horizontal.svg " class="h-[60px]" />
        <div class="mt-4 flex justify-end self-center md:mt-0">
          <img src="/icons/facebook.svg" class="mr-2 h-[24px] w-[24px]" />
          <img src="/icons/instagram.svg" class="mr-2 h-[24px] w-[24px]" />
          <img src="/icons/twitter.svg" class="mr-2 h-[24px] w-[24px]" />
          <img src="/icons/youtube.svg" class="mr-2 h-[24px] w-[24px]" />
          <img src="/icons/github.svg" class="mr-2 h-[24px] w-[24px]" />
          <img src="/icons/tiktok.png" class="h-[24px] w-[24px]" />
        </div>
      </div>
    </div>
    <div class="mt-[8rem] flex justify-center">
      <div class="flex w-full flex-col justify-center md:w-[75rem]">
        <div
          class="p-0 text-center font-akira text-[2rem] font-black md:text-[5rem]"
        >
          MYTHWEAVER
        </div>
        <div class="p-0 text-center font-quicksand text-[1.5rem] md:-mt-8">
          AI Dungeon Master Assistant
        </div>
        <div class="mt-12 flex justify-center md:mt-24 md:justify-start">
          <div class="flex w-96">
            <div class="mr-4">
              <div
                class="h-10 w-10 animate-bounce rounded-full border border-red-500 bg-transparent p-[0.2rem]"
              >
                <div class="h-8 w-8 rounded-full bg-red-500"></div>
              </div>
            </div>
            <div class="font-quicksand text-xl">
              <b>MythWeaver</b> is an app for Dungeon Masters that acts as an AI
              assistant helping you prep faster, quickly respond to unforeseen
              scenarios, and build a compelling, engaging world for your party
              to explore and enjoy.
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center bg-tiger bg-contain bg-top bg-no-repeat">
      <div
        class="mt-[10rem] flex w-full flex-col justify-between p-12 md:w-[75rem] md:flex-row md:p-0"
      >
        <div class="mb-8 flex w-full justify-center shadow-2xl">
          <img
            src="/images/cat-character.png"
            class="h-[20rem] w-[20rem] md:mb-0 md:mr-24 md:h-[30rem] md:w-[80rem]"
          />
        </div>
        <div class="self-center">
          <div class="font-akira text-[2rem] md:text-[4rem]">
            BRING CHARACTERS TO LIFE
          </div>

          <div class="font-quicksand text-[18px] leading-[30px]">
            MythWeaver is the artist in your back pocket. Sketch the heroes and
            villains of your tale with an astonishingly simple character image
            generator. Create enthralling character art that catches eyes and
            captures hearts. With MythWeaver, you’re not just generating stats -
            you’re breathing life into your characters.
          </div>
        </div>
      </div>
    </div>

    <div
      class="flex justify-center bg-hart bg-contain bg-top bg-no-repeat p-12"
    >
      <div
        class="mt-[1rem] flex w-full flex-col-reverse justify-between md:w-[75rem] md:flex-row"
      >
        <div class="self-center">
          <div class="font-akira text-[2rem] md:text-[4rem]">
            Seamlessly Craft Your Story
          </div>

          <div class="font-quicksand text-[18px] leading-[30px]">
            So your party decided to adopt the goblin instead of fighting it.
            Classic. MythWeaver’s got your back. Generate captivating quests,
            create intriguing NPCs, and dish out the loot – all in real-time.
            With MythWeaver, you can play it cool when your plot gets thrown for
            a loop.
          </div>
        </div>
        <div class="mb-8 flex w-full justify-center shadow-2xl">
          <img
            src="/images/unicorn.png"
            class="h-[20rem] w-[20rem] md:mb-0 md:ml-24 md:h-[30rem] md:w-[80rem]"
          />
        </div>
      </div>
    </div>

    <div
      class="mt-[5rem] flex h-[40rem] w-full justify-center bg-gods bg-cover bg-top bg-no-repeat"
    >
      <div class="w-full self-center p-12 md:w-[65rem] md:p-0">
        <div class="text-center font-akira text-[36px] md:text-[52px]">
          Keep Players Hooked with Evolving Worlds
        </div>

        <div class="text-center font-quicksand text-[18px] leading-[30px]">
          So your party decided to adopt the goblin instead of fighting it.
          Classic. MythWeaver’s got your back. Generate captivating quests,
          create intriguing NPCs, and dish out the loot – all in real-time. With
          MythWeaver, you can play it cool when your plot gets thrown for a
          loop.
        </div>
      </div>
    </div>

    <div
      class="flex h-[30rem] w-full justify-center bg-hydra bg-cover bg-top bg-no-repeat p-12 md:p-0"
    >
      <div class="w-full self-center md:w-[75rem]">
        <div class="w-full font-akira text-[36px] md:w-[40rem] md:text-[52px]">
          Focus on What You Love
        </div>

        <div class="font-quicksand text-[18px] leading-[30px]">
          MythWeaver is the sidekick you didn’t know you needed. Say goodbye to
          burnout and hello to streamlined campaign creation. Characters? Easy.
          Quests? A breeze. Loot and locations? Got you covered. MythWeaver even
          remembers past sessions to keep the story flowing.
        </div>
      </div>
    </div>

    <div
      class="flex justify-center bg-hart bg-contain bg-top bg-no-repeat p-12"
    >
      <div
        class="mt-[1rem] flex w-full flex-col-reverse justify-between md:w-[75rem] md:flex-row"
      >
        <div class="self-center">
          <div class="font-akira text-[2rem] md:text-[4rem]">
            Back us on indiegogo
          </div>

          <div class="font-quicksand text-[18px] leading-[30px]">
            Excited to see where the journey takes us? Grab your gear and let’s
            hit the road. Support MythWeaver on Kickstarter and be a part of
            something legendary
          </div>

          <button class="mt-8 rounded-xl bg-red-500 p-4 font-akira text-lg">
            Support on Indiegogo
          </button>
        </div>
        <div class="mb-8 flex w-full justify-center shadow-2xl">
          <img
            src="/images/phoenix.png"
            class="h-[20rem] w-[20rem] md:mb-0 md:ml-24 md:h-[30rem] md:w-[80rem]"
          />
        </div>
      </div>
    </div>

    <div
      class="-mt-[8rem] flex h-[50rem] justify-center bg-hart bg-contain bg-top bg-no-repeat p-4"
    >
      <div class="mt-[1rem] flex w-full justify-between md:w-[75rem]">
        <div class="self-center">
          <div class="text-center font-akira text-[2rem] md:text-[3.5rem]">
            Dive in and start weaving!
          </div>

          <div class="flex justify-center">
            <div
              class="w-full text-center font-quicksand text-[18px] leading-[30px] md:w-[50rem]"
            >
              Ready to kick your campaigns up a notch? MythWeaver is ready for
              you. Sign up and start crafting the adventure of a lifetime.
            </div>
          </div>

          <div class="mt-12 flex flex-col justify-center md:flex-row">
            <input
              class="mr-2 h-[4rem] w-full self-center rounded-xl border border-gray-700 bg-gray-800 px-6 text-xl md:w-[40rem]"
              placeholder="Email address"
              type="email"
            />
            <button
              class="mt-4 h-[4rem] w-full self-center rounded-xl bg-red-500 p-4 px-6 font-akira text-lg md:mt-0 md:w-[20rem]"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex h-[4rem] justify-center border-t border-gray-700">
      <div class="self-center font-quicksand text-[14px]">
        © 2023 MythWeaver. All rights reserved.
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
