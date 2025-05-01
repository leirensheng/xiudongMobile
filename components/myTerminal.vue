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
    host: {
      type: String,
      default: "",
    },
    platform: {
      type: String,
      default: "damai",
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
  computed: {
    port() {
      let map = {
        damai: 5000,
        f1: 5006,
      };
      let val = map[this.platform];
      if (this.pid.includes("slave")) {
        if (this.host.includes("mticket")) {
          val = 5003;
        }
      }
      return val;
    },
    url() {
      let ip = this.host.replace("http://", "");
      ip = ip.replace(/:\d+$/, "");

      if (this.pid.includes("slave") && !this.host.includes("mticket")) {
        ip = ip.replace("75", "76");
      }
      let pid = this.pid.replace("slave", "");

      return `ws://${ip}:${this.port}/socket/` + pid;
    },
  },

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
      const url = this.url;

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
