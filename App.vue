<script>
import globalData from "./globalData.js";
import { removeTitle } from "@/utils.js";
export default {
  onLaunch: function () {
    this.getHost();
    removeTitle();
  },
  data() {
    return {};
  },
  watch: {},
  methods: {
    checkIsInLocal() {
      return new Promise((resolve) => {
        uni.request({
          url: "http://192.168.2.9:4000/ping",
          timeout: 200,
          success: () => {
            resolve(true);
          },
          fail: () => {
            resolve(false);
          },
        });
      });
    },
    async getHost() {
      let isLocal = false;
      let host = isLocal ? "192.168.2.15" : "mticket.ddns.net";

      console.log("host", host);
      globalData.pcHost = host;
      uni.$emit("hostDone", host);
    },
  },

  onShow: function () {
    console.log("App Show");
    // #ifdef APP-PLUS
    plus.device.setWakelock(true); 
    // #endif
  },
  onHide: function () {
    console.log("App Hide");
  },
};
</script>

<style>
/*每个页面公共css */
text,
view,
div,
span,
textarea,
button {
  box-sizing: border-box;
}
@uni-page {
  display: none;
}
</style>
