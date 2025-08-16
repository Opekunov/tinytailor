<template>
  <div class="vue-component">
    <h1>Vue компонент</h1>
    <p>Текст с&nbsp;висячими предлогами: это дом в&nbsp;котором живет семья из</p>
    <p>пяти человек на&nbsp;площади м<sup>2</sup> большого дома.</p>
    
    <img :src="'/images/vue-image.jpg'" alt="Vue image" class="responsive-img">
    
    <div class="background-section" style="background-image: url('/images/component-bg.jpg');">
      <h2>Background section</h2>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TestComponent'
}
</script>

<style scoped>
.background-section {
  background-size: cover;
  background-position: center;
  height: 300px;
}

.responsive-img {
  max-width: 100%;
  height: auto;
}
</style>