<template>
  <my-dialog v-model:value="$attrs.isShow">
    <div class="dialog msg-dialog" :style="style" @touchmove.stop>
      <div class="title">{{ mode }}</div>
      <my-input type="text" v-model="showTime" placeholder="时间" />
      <div class="wrap">
        <button @click="setTime">1</button>
        <button @click="setTime2">1.7</button>
        <button @click="setTime3">2</button>
        <button @click="paste">粘贴</button>
        <button @click="add" v-if="mode === '接盘'">+ms</button>
      </div>
      <div class="btns">
        <button @click="cancel">取消</button>
        <button @click="confirm">确定</button>
      </div>
    </div>
  </my-dialog>
</template>

<script>
import SearchInput from "./search-input/search-input.vue";
import MyDialog from "./my-dialog/my-dialog.vue";
import { request, getTime } from "@/utils.js";

export default {
  data() {
    return {
      showTime: "",
      mode: "",
    };
  },
  computed: {
    style() {
      return {
        color: this.mode === "接盘" ? "rgba(0,240,0)" : "red",
      };
    },
  },
  components: {
    SearchInput,
    MyDialog,
  },
  watch: {
    setTimeStr(val) {
      this.showTime = val;
    },
  },
  props: {
    setTimeStr: {
      type: String,
    },
  },
  created() {},
  mounted() {},
  methods: {
    add() {
      let gap = 60;
      if (this.showTime) {
        let res = this.showTime.match(/\.(\d+$)/);
        if (res) {
          let val = Number(res[1]) + gap;
          this.showTime = this.showTime.replace(/\.(\d+$)/, `.${val}`);
        } else {
          this.showTime += ".100";
        }
      }
    },
    paste() {
      uni.getClipboardData({
        success: (clip) => {
          this.showTime = clip.data.replace(/(\.\d+)/, "");
        },
      });
    },
    async setTimeForParent() {
      this.$emit("update:isShow", true);
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    setTime() {
      let date = new Date();
      date.setMinutes(date.getMinutes() + 1);
      this.showTime = getTime(date);
    },
    setTime2() {
      let date = Date.now() + 1000 * 60 * 1.7;
      date = new Date(date);
      this.showTime = getTime(date);
    },
    setTime3() {
      let date = new Date();
      date.setMinutes(date.getMinutes() + 2);
      this.showTime = getTime(date);
    },
    cancel() {
      this.showTime = "";
      this.$emit("update:isShow", false);
      this.reject("");
    },
    confirm() {
      this.$emit("update:setTimeStr", this.showTime);
      this.resolve(this.showTime);
      uni.setClipboardData({
        data: this.showTime,
      });
      this.$emit("update:isShow", false);
      this.showTime = "";
    },
  },
};
</script>

<style scoped lang="scss">
.dialog {
  background: white;
  padding: 20px;
  .title {
    text-align: center;
    font-weight: bold;
    // font-size: 16px;
    color: #333;
    margin-bottom: 20px;
  }
  input {
    margin-bottom: 20px;
  }
  .wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 5px;
    button {
      flex-shrink: 0;
    }
  }
  .btns {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    button {
      width: 48%;
    }
  }
}
</style>
