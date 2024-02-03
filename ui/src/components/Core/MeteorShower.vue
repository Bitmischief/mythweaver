<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
    <div class="star"></div>
    <div class="meteor-1"></div>
    <div class="meteor-2"></div>
    <div class="meteor-3"></div>
    <div class="meteor-4"></div>
    <div class="meteor-5"></div>
    <div class="meteor-6"></div>
    <div class="meteor-7"></div>
    <div class="meteor-8"></div>
    <div class="meteor-9"></div>
    <div class="meteor-10"></div>
    <div class="meteor-11"></div>
    <div class="meteor-12"></div>
    <div class="meteor-13"></div>
    <div class="meteor-14"></div>
    <div class="meteor-15"></div>
  </div>
</template>
<style scoped lang="scss">
$num_meteors: 10; // # of meteors
$num_stars: 500; // # of stars

html,
body {
  height: 100%;
  overflow: hidden;
}

$shadow: ();

@for $i from 1 through $num_stars {
  $x: random(3840);
  $y: random(2160);
  $o: calc(random(100) / 100);
  $shadow: $shadow, ($x + px $y + px 1px rgba(255, 255, 255, $o)) !global;
}

.star {
  width: 1px;
  height: 1px;
  background: transparent;
  box-shadow: $shadow;
  opacity: random(100) + 50;
}

@for $i from 1 through $num_meteors {
  $v: random(90) + 9; // left
  $h: random(250) + 200; // top
  $d: calc(random(150) / 10) + 3; // speed

  .meteor-#{$i} {
    position: absolute;
    top: $h + px;
    left: $v * 1%;
    width: 200px;
    height: 4px;
    transform: rotate(-45deg);
    background-image: linear-gradient(
      to right,
      rgba(204, 82, 192, 0.7),
      rgba(92, 82, 204, 0.5),
      rgba(255, 255, 255, 0)
    );
    animation: meteor $d + s linear infinite;
    &:before {
      content: '';
      position: absolute;
      width: 4px;
      height: 5px;
      border-radius: 50%;
      margin-top: -2px;
      background: rgba(#fff, 0.7);
      box-shadow: 0 0 14px 4px #fff;
    }
  }
}

@keyframes meteor {
  0% {
    opacity: 1;
    margin-top: -300px;
    margin-right: -300px;
  }
  12% {
    opacity: 0;
  }
  15% {
    margin-top: 300px;
    margin-left: -600px;
    opacity: 0;
  }
  100% {
    opacity: 0;
  }
}
</style>
