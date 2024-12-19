<template>
  <my-dialog v-model:value="isShow">
    <div
      class="content-wrap"
      :class="{
        zoom: isZoom,
      }"
    >
      <image
        class="icon"
        style="width: 20px; height: 20px"
        src="/static/zoom.svg"
        @click="toggle"
      />
      <h3>进程:{{ pid }}</h3>
      <pre>
    {{ showData }}
  </pre
      >
    </div>
  </my-dialog>
</template>

<script>
import MyDialog from "./my-dialog/my-dialog.vue";
export default {
  props: {
    pid: {
      type: String,
      default: "",
    },
  },
  emits: [],
  setup() {},
  data() {
    return {
      isShow: true,
      showData: "",
      isZoom: false,
    };
  },
  watch: {
    isShow(val) {
      console.log("val", val);
      if (!val) {
        this.$emit("update:pid", "");
      }
    },
  },
  components: {
    MyDialog,
  },
  computed: {},

  mounted() {
    this.init();
  },
  beforeUnmount() {
    uni.closeSocket();
  },
  methods: {
    toggle() {
      this.isZoom = !this.isZoom;
    },
    async init() {
      console.log(this.pid);
      const url = "ws:/mticket.ddns.net:5000/socket/" + this.pid;

      console.log("连接进程:", this.pid);

      uni.connectSocket({
        url,
      });

      uni.onSocketMessage((val) => {
        this.showData = this.showData + val.data;
      });
    },
  },
};
</script>

<style scoped lang="scss">
.content-wrap {
  height: 80vh;
  background: black;
  color: white;
  padding: 10px;
  overflow: auto;
  position: relative;
  // &.zoom {
  //   transform: rotate(90deg);
  // }
  h1 {
    text-align: center;
  }
  .icon {
    position: absolute;
    top: 5px;
    right: 5px;
  }
}
</style>
