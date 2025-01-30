<template>
  <div
    class="item"
    :style="getStyle(item)"
    :key="item.username + item.phone"
    :id="item.username + item.phone"
  >
    <div class="first">
      <div @click="callOrCopyPhone(item)">
        {{ item.phone }}
      </div>
      <div class="name" @click="copyUsername(item)">
        {{ item.username }}
      </div>

      <div class="order">
        <checkbox-group @change="item.isShow = !item.isShow">
          <checkbox :checked="item.isShow"> </checkbox>
        </checkbox-group>
      </div>
      <div class="price" v-if="item.price && item.price.length">
        票价:{{ item.price.join("_") }}
      </div>
      <div class="only" v-if="item.only">
        {{ item.only.join("_") }}
      </div>

      <div class="number" v-if="item.must">必须 {{ item.must }} 个同时</div>
      <div class="number" v-if="item.max">最多 {{ item.max }} 个</div>
    </div>

    <div class="targetTypes">
      <div
        class="target-type"
        v-for="(targetType, index) in item.targetTypes"
        :key="index"
        :style="{ background: getTagColor(targetType) }"
      >
        {{ removeYear(targetType) }}
      </div>
    </div>

    <div class="remark">
      {{ item.remark }}
    </div>

    <div class="btns">
      <image
        class="copy"
        src="/static/edit.svg"
        @click="$emit('openEditDialog')"
      />
      <button
        class="btn"
        size="mini"
        type="warn"
        :disabled="loading && stoppingUsers.has(item.username)"
        v-if="isRunning"
        @click="stop(item)"
      >
        <span class="stop-wrap">
          <span>停止</span>
        </span>
      </button>
      <button
        class="btn"
        size="mini"
        type="primary"
        v-else
        @click="start(item)"
      >
        启动
      </button>
    </div>
  </div>
</template>

<script>
import { request, getTagColor } from "@/utils.js";

export default {
  data() {
    return {};
  },
  props: {
    stoppingUsers: {},
    loading: {
      type: Boolean,
    },
    host: {
      type: String,
    },
    platform: {
      type: String,
    },
    item: {
      type: Object,
    },
    pidToCmd: {
      type: Object,
    },
    isCalc: {
      type: Boolean,
      default: false,
    },
  },
  watch: {},
  computed: {
    isRunning() {
      let cmds = Object.values(this.pidToCmd);
      let users = cmds
        .filter((one) => one.includes(`npm run start `))
        .map((one) => one.split(/\s/)[3]);
      return users.includes(this.item.username);
    },
  },
  created() {},
  mounted() {},
  methods: {
    removeYear(str) {
      let year = new Date().getFullYear();
      return str.replace(year + "-", "");
    },
    async start(item, isNoRefresh) {
      this.$emit("update:loading", true);
      let cmd =
        item.cmd +
        (item.isShow ? ' true': "");
      item.runningCmd = cmd;

      try {
        let { pid } = await request({
          method: "post",
          timeout: 40000,
          url: this.host + "/startUserFromRemote/",
          data: {
            isUseSlave: item.isUseSlave,
            cmd,
            isStopWhenLogin: isNoRefresh,
          },
        });
        this.pidToCmd[pid] = cmd;
      } catch (e) {
        if (e.pid) {
          this.pidToCmd[e.pid] = cmd;
        }
      }

      this.$emit("update:loading", false);
      this.$emit("startDone");
    },
    getTagColor,
    async stop(item) {
      this.$emit("update:loading", true);
      this.$emit("addStoppingUsers", item.username);
      await request({
        timeout: 60000,
        url: this.host + "/stopUser/" + item.username,
        data: {
          isUseSlave: item.isUseSlave,
        },
      });
      let pid = Object.keys(this.pidToCmd).find(
        (pid) => this.pidToCmd[pid] === item.cmd
      );
      delete this.pidToCmd[pid];
      item.isLoop = false;
      delete item.runningCmd;
      console.log(item);
      this.$emit("update:loading", false);
      this.$emit("stopDone", item.username);
    },

    async removeOneAudience(audience, item) {
      let data = {
        audience,
        phone: item.phone,
      };
      await this.confirmAction(`确定删除【${audience}】？`);
      this.$emit("update:loading", true);
      await request({
        url: this.host + "/removeAudience",
        data,
        timeout: 50000,
        method: "post",
      });
      uni.showToast({
        icon: "none",
        title: "删除成功",
        duration: 2000,
      });
      this.$emit("update:loading", false);
      this.$emit("getConfig");
    },

    clickAudience(item, audience, index, phone, group) {
      let itemList = ["删除", "复制", "切换", "检测"];
      uni.showActionSheet({
        itemList,
        success: async (res) => {
          if ([0].includes(res.tapIndex)) {
            this.removeOneAudience(audience, item);
          } else if (res.tapIndex === 1) {
            uni.setClipboardData({
              data: audience,
            });
          } else if (res.tapIndex === 2) {
            let isSelected = item.orders.some((one) => Number(one) === index);
            let orders = item.orders.map((one) => Number(one));
            if (isSelected) {
              let i = item.orders.indexOf(index);
              orders.splice(i, 1);
            } else {
              orders.push(index);
            }
            this.$emit("update:loading", true);
            await request({
              method: "post",
              url: this.host + "/editConfig/",
              data: {
                username: item.username,
                config: {
                  orders,
                },
              },
            });
            this.$emit("update:loading", false);
            this.$emit("getConfig");
          } else {
            let isNeedToDelete = await request({
              url:
                this.host +
                `/checkAudience?phone=${phone}&audienceIndex=${index}`,
            });
            let name = item.audienceList[index];
            uni.showToast({
              icon: "none",
              title: `【${name}】` + (isNeedToDelete ? `可以删除` : "不可删除"),
              duration: 2000,
            });
            if (isNeedToDelete) {
              await this.removeOneAudience(name, item);
            }
          }
        },
      });
    },
    async handleSlaveChange(e, item) {
      item.isUseSlave = e.detail.value;
      this.$emit("update:loading", true);
      await request({
        method: "post",
        url: this.host + "/editConfig/",
        data: {
          username: item.username,
          config: {
            isUseSlave: e.detail.value,
          },
        },
      });
      this.$emit("update:loading", false);
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
    copyUsername(item) {
      let { phone, username, isUseSlave } = item;
      let itemList = [username, "复制", "关闭并支付", "补录成功数据"];
      if (item.runningCmd) {
        itemList.push("查看输出");
      }
      uni.showActionSheet({
        itemList,
        success: async (res) => {
          if ([0, 1].includes(res.tapIndex)) {
            uni.setClipboardData({
              data: username,
            });
          } else if (res.tapIndex === 2) {
            await this.confirmAction("确认支付？");
            this.$emit("update:loading", true);
            await request({
              method: "post",
              url: this.host + "/closeAndPay/",
              data: {
                nickname: username,
                isUseSlave,
              },
            });
            this.$emit("update:loading", false);
          } else if (res.tapIndex === 3) {
            await this.confirmAction("确认补录？");
            this.$emit("update:loading", true);
            await request({
              method: "post",
              url: this.host + "/loadSuccess",
              data: {
                phone,
              },
            });
            this.$emit("update:loading", false);
          } else if (res.tapIndex === 4) {
            let showPid = Object.keys(this.pidToCmd).find(
              (one) => this.pidToCmd[one] === item.runningCmd
            );
            if (!showPid) {
              uni.showToast({
                icon: "none",
                title: "没有找到PID",
                duration: 2000,
              });
            }
            this.$emit("showCmd", showPid);
          }
        },
      });
    },
    callOrCopyPhone(item) {
      let { phone, username: nickname, hasSuccess, isUseSlave, orderId } = item;
      let itemList = [
        phone,
        "复制",
        "关闭并截图",
        hasSuccess ? "关闭并取消订单" : "关闭并接盘",
      ];
      uni.showActionSheet({
        itemList,
        success: async (res) => {
          if ([0].includes(res.tapIndex)) {
            uni.makePhoneCall({
              phoneNumber: phone,
            });
          } else if (res.tapIndex === 1) {
            uni.setClipboardData({
              data: phone,
            });
          } else if (res.tapIndex === 2) {
            if (this.platform === "xingqiu" && !orderId) {
              uni.showToast({
                icon: "none",
                title: "没有订单ID",
                duration: 2000,
              });
              return;
            }

            this.$emit("update:loading", true);
            await request({
              method: "post",
              url: this.host + "/closeAndScreenshot/",
              data: {
                isUseSlave,
                nickname,
                orderId,
              },
            });
            this.$emit("update:loading", false);
          } else if (res.tapIndex === 3) {
            this.$emit("snapOrCancel", item);
          }
        },
      });
    },
    getStyle(item) {
      let arr = [
        {
          condition: item.hasSuccess,
          background: "#aaffaa",
        },
        {
          condition: item.isLoop,
          background: "cyan",
        },
        {
          condition: item.remark?.includes("借用"),
          background: "rgb(225, 223, 223)",
        },
        // {
        //   condition: !item.uid,
        //   background: "rgb(254, 214, 91)",
        // },
        {
          condition: item.remark?.includes("优先"),
          background: "#21a1ab",
          color: "white",
        },
      ];
      let target = arr.find((one) => one.condition);
      return {
        background: target ? target.background : "white",
        color: target ? target.color || "black" : "black",
      };
    },
  },
};
</script>

<style scoped lang="scss">
.item {
  padding: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid rgb(223, 223, 223);

  > :not(:first-child) {
    margin-left: 10px;
    flex-shrink: 0;
    word-break: break-all;
  }

  .first {
    width: 110px;
    text-align: center;

    > :not(:first-child) {
      line-height: 2;
    }

    .not-match {
      color: red;
    }
    .price {
      color: rgb(25, 0, 255);
    }
    .only {
      color: rgb(255, 132, 0);
    }
    .number {
      color: rgb(195, 0, 255);
    }
    .audience-list {
      .audience {
        font-family: 楷体;
        // font-weight: bold;
        border-radius: 12px;
        margin: 2px 10px;

        &.active {
          background: rgb(154, 7, 190);
          color: white;
        }
      }
    }

    .msg-icon {
      width: 26px;
      height: 26px;
    }

    // .copy {
    //     position: relative;
    //     top: 4px;
    //     width: 25px;
    //     height: 18px;
    // }
  }

  .targetTypes {
    flex: 1;

    .target-type {
      margin: 5px 0;
      padding: 2px;
      // font-weight: bold;
      color: white;
      border-radius: 12px;
      text-align: center;
      line-height: 1.7;
    }
  }

  .remark {
    width: 30px;
  }

  .btns {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    button {
      margin: 12px;
    }
    .stop-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .copy {
      // margin: 10px;
      position: relative;
      // top: 4px;
      width: 25px;
      height: 18px;
    }
  }

  // flex: 1;
}
</style>
