<template>
  <div class="catalog-dialog" catchtouchmove @touchmove.stop>
    <div v-show="value" class="mask" @click="toggle" />
    <div class="content-wrap" :class="{ show: value }">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {
    value: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {};
  },
  methods: {
    toggle() {
      this.$emit("update:value", !this.value);
    },
  },
};
</script>

<style scoped lang="scss">
.catalog-dialog {
  .mask {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 1000;
  }
  //  position: fixed;
  .content-wrap {
    position: fixed;
    border-radius: 8rpx 8rpx 0 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 3000;
    max-height: 80vh;
    transition: all 0.3s cubic-bezier(0.7, 0.51, 0.02, 1.1);

    // transition: all 0.3s;
    transform: translateY(100%);
    overflow: auto;
    height: 0;
    &.show {
      height: auto;
      transform: translateY(0);
    }
  }
}
</style>
