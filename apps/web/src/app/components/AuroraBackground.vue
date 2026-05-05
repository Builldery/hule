<template>
  <div class="aurora-bg" aria-hidden="true">
    <div class="orb orb-1" />
    <div class="orb orb-2" />
    <div class="orb orb-3" />
    <div class="orb orb-4" />
    <div class="orb orb-5" />
  </div>
</template>

<style scoped>
.aurora-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.aurora-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
  background-size: 28px 28px;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}

.orb-1 {
  width: 640px;
  height: 640px;
  background: rgb(70, 129, 244);
  opacity: 0.35;
  top: -180px;
  left: -140px;
  animation: drift1 22s ease-in-out infinite;
}

.orb-2 {
  width: 520px;
  height: 520px;
  background: rgb(137, 87, 229);
  opacity: 0.28;
  bottom: -120px;
  right: -100px;
  animation: drift2 28s ease-in-out infinite;
}

.orb-3 {
  width: 380px;
  height: 380px;
  background: rgb(56, 189, 248);
  opacity: 0.2;
  top: 38%;
  right: 8%;
  animation: drift3 19s ease-in-out infinite;
}

.orb-4 {
  width: 280px;
  height: 280px;
  background: rgb(168, 85, 247);
  opacity: 0.2;
  bottom: 18%;
  left: 8%;
  animation: drift4 24s ease-in-out infinite;
}

.orb-5 {
  width: 420px;
  height: 420px;
  background: rgb(99, 102, 241);
  opacity: 0.15;
  top: 28%;
  left: 28%;
  animation: drift5 34s ease-in-out infinite;
}

@keyframes drift1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(70px, 55px) scale(1.08); }
  66%       { transform: translate(25px, -45px) scale(0.96); }
}

@keyframes drift2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%       { transform: translate(-55px, -75px) scale(1.06); }
  66%       { transform: translate(-18px, 48px) scale(1.1); }
}

@keyframes drift3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(-45px, 65px) scale(0.92); }
}

@keyframes drift4 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%       { transform: translate(55px, -35px) scale(1.12); }
}

@keyframes drift5 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25%       { transform: translate(45px, -65px) scale(1.06); }
  75%       { transform: translate(-55px, 42px) scale(0.94); }
}
</style>
