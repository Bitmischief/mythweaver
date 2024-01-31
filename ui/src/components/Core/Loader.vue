<template>
  <div class="text-left">
    <div class="loader mx-auto"></div>
  </div>
</template>

<style scoped lang="scss">
.loader {
  width: 100px;
  height: 100px;
  background: linear-gradient(#cc52c0, #5c52cc);
  border-radius: 50%;
  position: relative;
  box-shadow:
    0 0 30px 4px rgba(0, 0, 0, 0.5) inset,
    0 5px 12px rgba(0, 0, 0, 0.15),
    0px 4px 20px #5c52cc;
  overflow: hidden;
}
.loader:before,
.loader:after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 38%;
  top: -32%;
  background-color: rgba(#050712, 0.4);
  animation: wave 5s linear infinite;
}
.loader:before {
  width: 100%;
  height: 100%;
  border-radius: 40%;
  top: -40%;
  background: rgba(#050712, 0.9);
  animation: wave 5s linear infinite 1.5s;
}

@keyframes wave {
  0% {
    transform: rotate(0);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
