<template>
  <div>
    <div v-if="noPermission" class="wrap">
      <my-input v-model="password" class="input"></my-input>
      <button @click="confirm" :disabled="loading">确定</button>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script>
import { request, sleep } from "@/utils.js";

export default {
  data() {
    return {
      localPass: "",
      loading: false,
      noPermission: true,
      password: "",
      isWeb: false,
    };
  },
  created() {
    this.localPass = uni.getStorageSync("localPass");
    this.isWeb = uni.getSystemInfoSync().uniPlatform === "web";
    if (this.localPass) {
      this.verifyPass();
    }
    if (!this.isWeb|| location.href.indexOf("localhost")!== -1) {
      this.noPermission = false;
    }
  },
  mounted() {},
  computed: {
    // noPermission() {
    //   return this.isWeb && this.localPass !== "07505461203";
    // },
  },
  watch: {
    // password(val) {
    //   if (val === "07505461203") {
    //     uni.setStorageSync("localPass", val);
    //     this.localPass = val;
    //   }
    // },
  },
  methods: {
    async confirm() {
      this.loading = true;
      uni.setStorageSync("localPass", this.password);
      this.localPass = this.password;
      await this.verifyPass();
      this.loading = false;
    },
    async verifyPass() {
      let host = `http://mticket.ddns.net:5001/verifyPass`;
      let isOk = await request({
        method: "post",
        url: host,
        data: {
          password: this.localPass,
        },
      });
      this.noPermission = !isOk;
    },
  },
};
</script>

<style scoped lang="scss">
.wrap {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  .input {
    flex: 1;
    margin: 20px;
    // width: 50vw;
  }
    button{
      flex-grow: 0;
      width: 100px;
    }
}
</style>
