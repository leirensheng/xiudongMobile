<template>
  <uni-popup ref="popup" type="bottom" @change="changePopup">
    <div class="dialog" :class="isWeb ? 'is-web' : ''">
      <div class="activityName" @click="openCheck">{{ activityName }}</div>
      <div class="top">
        <div>启动中: {{ allRunningLength }}</div>
        <button type="primary" size="mini" v-if="data.length" @click="autoOpen">
          启动
        </button>
        <div>
          最小:
          <switch :checked="isMin" @change="changeIsMin" />
        </div>
      </div>
      <div class="switches">
        <div class="machines">
          <span @click="machine = 'all'" :class="machine === 'all' && 'active'"
            >所有</span
          >
          <span
            @click="machine = 'main'"
            :class="machine === 'main' && 'active'"
            >主机</span
          >
          <span
            @click="machine = 'slave'"
            :class="machine === 'slave' && 'active'"
            >从机</span
          >
        </div>
        <div class="machines">
          <span
            @click="ticketType = 'all'"
            :class="ticketType === 'all' && 'active'"
            >所有</span
          >
          <span
            @click="ticketType = 'onlyOne'"
            :class="ticketType === 'onlyOne' && 'active'"
            >单张</span
          >
          <span
            @click="ticketType = 'multiple'"
            :class="ticketType === 'multiple' && 'active'"
            >连坐</span
          >
        </div>
      </div>
      <div class="content">
        <div
          v-if="data.length"
          class="item-wrap"
          v-for="(item, index) in data"
          :key="index"
          :style="getStyle(item.percent)"
        >
          <div
            class="item"
            :style="getStyle(item.runningPercent, data, index)"
            @click="showInfo(item)"
          >
            <div class="text">
              {{ item.type }}__({{ item.runningLength }}/{{ item.allLength }})
            </div>
          </div>
        </div>
        <div v-else class="loading">加载中...</div>
      </div>
    </div>
  </uni-popup>

  <uni-popup ref="oneType" type="top" @change="changeOneTypePopup">
    <div class="one-type">
      <div class="cur-type" @click="restartAll">{{ curType }}</div>

      <div class="user-list">
        <uni-swipe-action-item
          v-for="(item, index) in curTypeUsers"
          :right-options="rightOptions"
          :key="item.username + item.phone"
          @click="swipeClick($event, item, one)"
          :disabled="!!item.runningCmd"
        >
          <one-item
            class="user"
            :class="
              nextStartUser === item.username
                ? 'will-restart'
                : curTypeRunningUsers.includes(item.username)
                ? 'running'
                : ''
            "
            :platform="platform"
            :item="item"
            :host="host"
            :pidToCmd="pidToCmd"
            :isCalc="true"
            :stoppingUsers="stoppingUsers"
            v-model:loading="loading"
            @stopDone="stopDone"
            @openEditDialog="$emit('openEditDialog', item)"
            @startDone="startDone"
            @showCmd="(val) => (showPid = val)"
            @snapOrCancel="snapOrCancel(item)"
          ></one-item>
        </uni-swipe-action-item>
      </div>
    </div>
  </uni-popup>

  <uni-popup ref="check" type="top">
    <div class="check">
      <div class="top-btns">
        <div class="output" v-if="isRunning" @click="showTerminal">输出</div>
      </div>
      <div class="target-types">
        <checkbox-group
          v-if="checkConfig && checkConfig.skuIdToTypeMap"
          @change="(e) => changeTarget(checkConfig, e)"
          class="checkbox-group"
        >
          <checkbox
            :value="item"
            v-for="(item, index) in Object.values(checkConfig.skuIdToTypeMap)"
            :key="index"
            :checked="checkConfig.onlyMonitorType.includes(item)"
            >{{ item }}
          </checkbox>
        </checkbox-group>
      </div>

      <div class="time-wrap">
        <my-input
          class="start-time"
          type="text"
          v-if="checkConfig"
          v-model="checkConfig.waitForTime"
          placeholder="开抢时间"
        />

        <button class="btn start" @click="setTime" type="success">
          当前时间
        </button>
      </div>
      <div class="actions">
        <div class="not-pc" v-if="checkConfig.isPc">
          <image
            style="width: 28px"
            mode="widthFix"
            src="/static/phone.svg"
          ></image>
          <switch :checked="checkConfig.notUsePc" @change="changeIsNotUsePc" />
        </div>
        <div class="not-pc" v-else>
          <image
            style="width: 28px"
            mode="widthFix"
            src="/static/limit.svg"
          ></image>
          <switch
            :checked="checkConfig.isLimitFrequency"
            @change="changeIsLimitFrequency"
          />
        </div>
        <button class="btn refresh" @click="refreshActivity">更新票价</button>
        <button class="btn update" @click="updateConfig">修改</button>
        <button
          v-if="!isRunning"
          class="btn start"
          @click="start"
          type="success"
        >
          启动
        </button>
        <button v-else class="btn stop" @click="stop" type="danger">
          停止
        </button>
      </div>
    </div>
  </uni-popup>
  <my-terminal v-if="showPid" v-model:pid="showPid" />
</template>

<script>
import { request, sleep, getTime, randomColorWithoutGreen } from "@/utils.js";
import MyTerminal from "./myTerminal.vue";
import OneItem from "./oneItem.vue";

export default {
  components: { MyTerminal, OneItem },
  data() {
    return {
      rightOptions: [
        {
          text: "删除",
          style: {
            backgroundColor: "#dd524d",
          },
        },
      ],
      showPid: "",
      machine: "all",
      indexToColor: {},
      isWeb: false,
      curType: "",
      curTypeUsers: [],
      curTypeRunningUsers: [],
      data: [],
      isMin: true,
      allRunningLength: 0,
      ticketType: "all",
      isRunning: false,
      loading: false,
      checkConfig: {},
      nextStartUser: "",
      isShowOneTypePopup: false,
    };
  },
  created() {
    this.isWeb = uni.getSystemInfoSync().uniPlatform === "web";
  },

  emits: [
    "startOne",
    "stopOne",
    "autoStartUsers",
    "update:modelValue",
    "stopCheck",
    "startCheck",
    "openEditDialog",
    "getConfig",
  ],
  props: {
    stoppingUsers: {},
    platform: {
      type: String,
    },
    pidToCmd: {
      type: Object,
      default: () => {},
    },
    userConfig: {
      type: Array,
      default: () => [],
    },
    modelValue: {
      type: Boolean,
      default: false,
    },
    port: {
      type: [String, Number],
      default: "",
    },
    activityName: {
      type: String,
      default: "",
    },
    activityId: {
      type: [String, Number],
      default: "",
    },
    host: {
      type: String,
      default: "",
    },
  },
  mounted() {},
  watch: {
    machine() {
      this.getCalc();
    },
    ticketType() {
      this.getCalc();
    },
    loading(val) {
      if (val) {
        uni.showLoading({
          title: "加载中",
        });
      } else {
        uni.hideLoading();
      }
    },
    async modelValue(val) {
      if (val) {
        this.$refs.popup.open("bottom");
        this.getCalc();
      } else {
        this.$refs.popup.close();
      }
    },
  },
  computed: {
    checkHost() {
      if (this.host.includes("mticket")) {
        return this.host.replace("5000", "5010");
      }
      return this.host;
    },
    activityHost() {
      return this.host.includes("5000")
        ? this.host.replace("5000", "5001")
        : this.host;
    },
  },
  methods: {
    async swipeClick({ index }, item, group) {
      let { username } = item;
      if (index === 0) {
        this.loading = true;
        await request({
          method: "post",
          url: this.host + "/removeConfig/",
          data: { username },
        });
        let i = this.curTypeUsers.findIndex((one) => one.username === username);
        this.curTypeUsers.splice(i, 1);
        this.refreshDialog();
        this.$emit("getConfig");
        this.loading = false;
      }
    },
    stopDone() {
      this.refreshDialog();
    },
    startDone() {
      this.refreshDialog();
    },
    showTerminal() {
      this.showPid = Object.keys(this.pidToCmd).find((pid) =>
        this.pidToCmd[pid].includes("npm run check " + this.port)
      );
    },
    async restartAll() {
      await this.confirmAction("确定重启所有？");
      this.loading = true;
      let items = this.curTypeUsers.map((one) => ({
        username: one.username,
        isRunning: this.curTypeRunningUsers.includes(one.username),
      }));

      let gap = (2.5 * 60000) / items.length;
      uni.showToast({
        icon: "none",
        title: "间隔" + gap + "ms",
        duration: 2000,
      });
      let i = 0;
      for (let one of items) {
        let start = Date.now();
        if (one.isRunning) {
          await new Promise((resolve) => {
            uni.$once("stop" + one.username + "done", (data) => {
              setTimeout(() => {
                resolve();
              }, 3000);
            });
            this.$emit("stopOne", one.username);
          });
        }
        let used = Date.now() - start;
        console.log("启动", one.username + "结束耗时" + used);
        this.$emit("startOne", one.username, false);
        let title = "启动了" + Math.floor(((i + 1) / items.length) * 100) + "%";
        console.log(title);
        uni.showToast({
          icon: "none",
          title,
          duration: 2000,
        });
        if (i !== items.length - 1) {
          this.nextStartUser = items[i].username;
          await sleep(gap - used);
        } else {
          this.nextStartUser = "";
        }
        i++;
      }
      this.loading = false;
    },

    confirmAction(title) {
      return new Promise((resolve, reject) => {
        uni.showModal({
          title,
          cancelText: "否",
          success: (res) => {
            if (res.confirm) {
              resolve();
            } else if (res.cancel) {
              reject();
            }
          },
        });
      });
    },
    async removeUser(item, index) {
      await this.confirmAction(`确定删除用户【${item.username}】`);
      this.loading = true;
      await request({
        method: "post",
        url: this.host + "/removeConfig/",
        data: { username: item.username },
      });
      this.curTypeUsers.splice(index, 1);
      this.getCalc();
      this.loading = false;
    },
    async changeIsNotUsePc(e) {
      this.checkConfig.notUsePc = e.detail.value;
      await this.updateConfig();
    },
    async changeIsLimitFrequency(e) {
      this.checkConfig.isLimitFrequency = e.detail.value;
      await this.updateConfig();
    },
    async refreshActivity() {
      this.loading = true;
      await request({
        timeout: 60000,
        url: this.activityHost + "/refreshActivity/" + this.activityId,
      });
      await this.getCheckConfig();
      this.loading = false;
    },
    async stop() {
      this.loading = true;
      this.isRunning = false;
      await request({ url: this.checkHost + "/stopCheck/" + this.port });
      await this.checkIsRunning();
      this.loading = false;
      this.$emit("stopCheck", Number(this.port));
    },
    async start() {
      this.loading = true;
      this.isRunning = true;
      await request({
        url: this.checkHost + "/startCheck/" + this.port,
        timeout: 60000,
      });
      await this.checkIsRunning();
      this.loading = false;
      this.$emit("startCheck", Number(this.port));
    },
    async updateConfig() {
      let data = { ...this.checkConfig };
      delete data.skuIdToTypeMap;
      delete data.activityName;
      this.loading = true;
      await request({
        url: this.checkHost + "/updateCheckConfig/",
        method: "post",
        data,
      });
      this.loading = false;
      uni.showToast({
        icon: "success",
        title: "修改成功",
        duration: 1000,
      });
    },

    getTypesColor(all, i) {
      if (i === 0) {
        this.indexToColor[i] = randomColorWithoutGreen();
      } else {
        let preDate = all[i - 1].split("_")[0];
        let curDate = all[i].split("_")[0];
        if (preDate === curDate) {
          this.indexToColor[i] = this.indexToColor[i - 1];
        } else {
          this.indexToColor[i] = randomColorWithoutGreen();
        }
      }
      return this.indexToColor[i];
    },
    changeTarget(form, e) {
      form.onlyMonitorType = e.detail.value;
    },
    openCheck() {
      this.$refs.check.open("top");
      this.getCheckConfig();
      this.checkIsRunning();
    },
    async checkIsRunning() {
      this.isRunning = await request({
        url: this.checkHost + "/checkIsRunningCheck/" + this.port,
      });
    },
    async getCheckConfig() {
      let p1 = request({
        url: this.checkHost + "/getCheckConfig/" + this.activityId,
      });
      let p2 = request({
        url: this.activityHost + "/getActivityInfo/" + this.activityId,
      });
      let [obj, info] = await Promise.all([p1, p2]);
      this.checkConfig = { ...obj, ...info };
    },
    async refreshDialog() {
      await this.getCalc();
      let item = this.data.find((one) => one.type === this.curType);
      this.curTypeRunningUsers = item.running;
      if (this.isShowOneTypePopup) {
        this.showInfo(item);
      }
    },
    showInfo(item) {
      this.curType = item.type;
      this.curTypeUsers = item.all
        .map((one) => ({
          name: one,
          score: this.getScore(one, this.userConfig),
        }))
        .sort((a, b) => b.score - a.score);
      this.curTypeRunningUsers = item.running;

      this.curTypeUsers = this.curTypeUsers.map((one) => {
        let target = this.userConfig.find((item) => item.username === one.name);
        return target;
      });
      this.$refs.oneType.open("top");
    },

    async getCalc() {
      let data = await request({
        url:
          this.host +
          "/activityInfo/" +
          this.activityId +
          "?ticketType=" +
          this.ticketType +
          "&machine=" +
          this.machine,
      });

      let allRunning = Object.keys(data)
        .map((type) => data[type].running)
        .flat();
      this.allRunningLength = new Set(allRunning).size;

      this.data = Object.keys(data).map((type) => ({ ...data[type], type }));
      let max = Math.max(...this.data.map((one) => one.allLength));
      this.data.forEach((one) => {
        one.percent = max ? Math.floor((one.allLength / max) * 100) : 0;
        one.runningPercent = one.allLength
          ? (one.runningLength / one.allLength) * one.percent
          : 0;
      });
      console.log(this.data);
    },
    changeIsMin(e) {
      this.isMin = e.detail.value;
    },
    getScore(name, allConfig) {
      let config = allConfig.find((one) => one.username === name);
      if (config.hasSuccess || config.remark.match(/(频繁)|(密码不正确)/))
        return 0;
      let score = 500;
      // if (config.price === "undefined") {
      //   config.price = "";
      // }
      score = score - config.orders.length * 50;
      score = score - config.targetTypes.length * 15;
      // let advPrice = Math.max(
      //   (config.price || 100) / config.orders.length,
      //   100
      // );
      // console.log(
      //   Math.max((config.price || 100) / config.orders.length, 100),
      //   config.price,
      //   config.orders.length
      // );
      // console.log(name, "平均价格", advPrice);
      // score = score + (advPrice / 100) * 25;
      if (config.remark.match(/假/)) {
        score = score - 100;
      } else if (config.remark.match(/低|夏|魔|缘|火|坤|椰/)) {
        score = score - 20;
      } else if (config.remark.match(/高/)) {
        //高雅优先级低
        score = score - 50;
      } else if (config.remark.match(/优先/)) {
        score = score + 20;
      } else if (config.remark.includes("空")) {
        score = 0;
      } else if (config.remark.match(/胜|姐/)) {
        let nameNum = name.match(/(胜|姐)(\d+)/);
        if (nameNum) {
          if (nameNum) {
            nameNum = nameNum[2];
          }
          score = score + Number(nameNum) * 2;
        }
        // score = score - 10;
      }
      // 没有uid暂时不做处理
      // if (!config.uid) {
      //     score = score - 30;
      // }
      return score;
    },
    autoOpen() {
      // let runningUsers = [...new Set(this.data.map(one => one.running).flat().filter(Boolean))]
      let runningTypes = this.data
        .filter((one) => one.running.length)
        .map((one) => one.type);

      let toStart = [];
      // console.log(this.data)
      // console.log(this.userConfig)
      for (let one of this.data) {
        let { type, all } = one;
        if (all.length && !runningTypes.includes(type)) {
          // console.group()

          let scores = all.map((name) => this.getScore(name, this.userConfig));
          console.log(type, all, scores);
          let max = Math.max(...scores);

          if (max !== 0) {
            let index = scores.indexOf(max);
            let maxUser = all[index];
            console.log("最大的是", maxUser);
            if (!toStart.includes(maxUser)) {
              toStart.push(maxUser);
            }
            if (this.isMin) {
              if (max < 400) {
                runningTypes.push(type);
                console.log(type + "没有单个人的");
              } else {
                let maxOneConfig = this.userConfig.find(
                  (one) => one.username === maxUser
                );
                runningTypes.push(...maxOneConfig.targetTypes);
              }
            } else {
              runningTypes.push(type);
            }
          }
          // console.groupEnd()
        }
      }
      console.log("结果", toStart);
      if (toStart.length) {
        uni.showToast({
          icon: "none",
          title: toStart.join(","),
          duration: 2000,
        });
        setTimeout(() => {
          this.$emit("autoStartUsers", toStart);
        }, 2000);
      }
    },
    getStyle(percent, data, index) {
      if (!data || !data.length) return {};
      let all = data.map((one) => one.type);
      return {
        "background-size": percent + "%",
        color: "white",
        "background-color": this.getTypesColor(all, index),
      };
    },
    setTime() {
      this.checkConfig.waitForTime = getTime();
    },
    changeOneTypePopup(e) {
      this.isShowOneTypePopup = e.show;
    },
    changePopup(e) {
      this.data = [];
      this.$emit("update:modelValue", e.show);
      if (!e.show) {
        this.machine = "all";
        this.ticketType = "onlyOne";
      }
    },
    getOneUserAllTypes(name) {
      let arr = this.data.filter((one) => one.all.includes(name));
      return arr.map((one) => one.type);
    },
  },
};
</script>

<style scoped lang="scss">
.dialog {
  min-height: 30vh;
  background-color: white;
  position: relative;
  &.is-web {
    padding-bottom: 50px;
  }

  .activityName {
    text-align: center;
    line-height: 2;
    background: rgb(31, 56, 164);
    color: white;
  }

  .loading {
    margin: 20px auto;
  }

  .top {
    padding: 5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .switches {
    position: sticky;
    top: 0;

    padding: 0 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .machines {
    display: flex;
    justify-content: center;
    align-items: center;
    > * {
      display: inline-block;
      margin: 5px;
      padding: 5px;
      background: rgb(196, 194, 194);
      color: white;
      border-radius: 5px;
    }
    > .active {
      background: #20be1d;
    }
  }
  .content {
    max-height: calc(80vh - 120px);
    overflow: auto;
    .item-wrap {
      line-height: 2.5;
      position: relative;
      background-image: linear-gradient(rgb(155, 243, 177), rgb(178, 249, 177));
      background-repeat: no-repeat;

      .item {
        z-index: 3;
        background: transparent;
        background-image: linear-gradient(rgb(114, 231, 143), rgb(38, 228, 35));
        background-repeat: no-repeat;

        .text {
          margin-left: 15px;
        }
      }
    }
  }
}

.check {
  background: white;
  padding: 15px;
  overflow: auto;
  max-height: 75vh;
  .top-btns {
    display: flex;
    justify-content: center;
    align-items: center;
    .output {
      padding: 5px 10px;
      margin: 0 auto;
      display: inline-block;
      background: purple;
      color: white;
      border-radius: 10px;
    }
  }

  .checkbox-group {
    > * {
      display: block;
      line-height: 2;
    }
  }

  .time-wrap {
    display: flex;
    align-items: center;
  }

  .start-time {
    margin: 20px 0;
    flex: 1;
    margin-right: 10px;
  }

  .btn {
    font-size: 14px;
    line-height: 2.3;
    color: white;
    &.refresh {
      background: rgb(112, 192, 46);
    }
    &.update {
      background: rgb(46, 80, 192);
    }

    &.start {
      background: rgb(32, 167, 122);
    }

    &.stop {
      background: rgb(195, 84, 20);
    }
  }
  .actions {
    .not-pc {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    display: flex;
    justify-content: space-around;
    align-items: center;
  }
}

.one-type {
  background: white;
  padding: 15px 0;
  padding-bottom: 0;
  overflow: auto;
  max-height: 80vh;
  .cur-type {
    text-align: center;
    font-weight: bold;
    font-weight: 18px;
    margin-bottom: 20px;
    cursor: pointer;
  }

  .user-list {
    // display: flex;
    // gap: 20px;
    // flex-wrap: wrap;

    .user {
      // display: inline-block;
      position: relative;

      &.running {
        background: rgb(52, 228, 55);
      }

      &.will-restart {
        background: rgb(181, 206, 40);
        animation: 2s linear infinite move_eye;
        @keyframes move_eye {
          0% {
            transform: scale(1);
          }
          33% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      }
      .name {
        &.is-fake {
          color: blue;
        }
      }
      .score {
        padding: 5px;
        border-radius: 50%;
        position: absolute;
        top: 0;
        right: 0;
        background-color: green;
        transform: translate(50%, -50%);
      }
      .close {
        width: 20px;
        height: 2px;
        position: absolute;
        top: 0;
        left: 0;
        background: white;
        border-radius: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }

  // justify-content: space-between;
}
</style>
