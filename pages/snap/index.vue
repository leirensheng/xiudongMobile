<template>
  <div class="snap">
    <div class="top">
      <div class="success-wrap">
        <div
          v-for="(item, index) in topList"
          :key="item.id"
          class="message"
          :style="{
            background: item.num > 1 ? '#f74444' : 'rgb(58 190 58)',
            color: item.isJie ? 'blue' : 'white',
          }"
        >
          <div class="text">
            <div>{{ item.endTime.split(/\s+/)[1] }}__{{ item.nickname }}</div>
            <div>{{ item.ticketType }}</div>
            <div>{{ item.activityName }}</div>
            <div v-if="item.remark">{{ item.remark }}</div>
          </div>

          <image
            class="icon"
            style="width: 25px; height: 25px; flex-shrink: 0"
            src="/static/add2.svg"
            @click="add(index, item)"
          />
        </div>
      </div>

      <div class="user-list">
        <div
          class="user"
          v-for="(item, index) in showUserList"
          :key="item.username"
        >
          <div
            :style="{
              color: item.isJie ? 'blue' : 'white',
              background: item.isMulti ? '#f74444' : 'rgb(58 190 58)',
            }"
            class="name"
          >
            <div>
              【{{ item.isUseSlave ? "从" : "主" }}】{{ item.username }}
            </div>
            <div v-for="one in item.targetTypes" :key="one">{{ one }}</div>
            <div v-if="item.remark">{{ item.remark }}</div>
          </div>
          <image
            class="icon"
            style="width: 25px; height: 25px; flex-shrink: 0"
            src="/static/add2.svg"
            @click="addUser(index, item)"
          />
        </div>
      </div>
    </div>

    <div class="middle">
      <div class="expire-time" v-if="firstExpireTime">
        <span>到期时间: {{ firstExpireTime.split(" ")[1] }} </span>
        <span style="margin-left: 15px">{{ leftTime }}分钟</span>
      </div>
      <div class="expire-time">
        <span>当前时间: {{ currentTime }} </span>
      </div>
      <div class="input-wrap">
        <input
          class="input"
          type="text"
          placeholder="设置取消时间(分钟)"
          v-model="setCancelMin"
        />
        <button @click="setLastTime" size="mini">设置最晚</button>
      </div>
      <div>
        准备好就取消:
        <switch
          :checked="isCancelWhenIsReady"
          @change="changeIsCancelWhenIsReady"
        />
      </div>
      <div class="status">
        <div class="one-status" v-for="(item, index) in status" :key="index">
          {{ item }}
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="to-cancel">
        <div
          v-for="(item, index) in bottomList"
          :key="item.id"
          class="message"
          :style="{
            background: item.num > 1 ? '#f74444' : 'rgb(58 190 58)',
            color: item.isJie ? 'blue' : 'white',
            border: readySuccessUsers.includes(item.nickname)
              ? '5px solid rgb(206 53 172)'
              : '',
          }"
        >
          <div class="text">
            <div>{{ item.endTime.split(/\s+/)[1] }}__{{ item.nickname }}</div>
            <div>{{ item.ticketType }}</div>
            <div>{{ item.activityName }}</div>
            <div v-if="item.remark">{{ item.remark }}</div>
          </div>

          <image
            class="icon"
            style="width: 25px; height: 25px; flex-shrink: 0"
            src="/static/close2.svg"
            @click="remove(index, item)"
          />
        </div>
      </div>

      <div class="user-list">
        <div
          class="user"
          v-for="(item, index) in selectedUserList"
          :key="item.username"
        >
          <div
            :style="{
              color: item.isJie ? 'blue' : 'white',
              background: item.isMulti ? '#f74444' : 'rgb(58 190 58)',
              border: readyUsers.includes(item.username)
                ? '5px solid rgb(206 53 172)'
                : '',
            }"
            :class="item.username === successUser ? 'success' : ''"
            class="name"
          >
            <button
              size="mini"
              @click="restartUser(item)"
              v-if="
                successUser !== item.username &&
                !readyUsers.includes(item.username)
              "
            >
              重启
            </button>
            <div>
              【{{ item.isUseSlave ? "从" : "主" }}】{{ item.username }}
            </div>
            <div v-for="one in item.targetTypes" :key="one">{{ one }}</div>
            <div v-if="item.remark">{{ item.remark }}</div>
          </div>
          <image
            class="icon"
            style="width: 25px; height: 25px; flex-shrink: 0"
            src="/static/close2.svg"
            @click="removeUser(index, item)"
          />
        </div>
      </div>
    </div>

    <div>
      <button
        class="confirm"
        @click="confirm"
        :disabled="disabled"
        v-if="!loading"
      >
        确定
      </button>
      <button v-else class="confirm" @click="cancelCancel">取消</button>
    </div>
  </div>
</template>

<script>
import { request, getTime, sleep, getTimeWithoutDate } from "@/utils.js";

export default {
  data() {
    return {
      isCancelWhenIsReady: true,
      successUser: "",
      timer: "",
      leftTime: 0,
      setCancelMin: "",
      cancelTime: "",
      userList: [],
      showUserList: [],
      selectedUserList: [],
      ticketType: "",
      successList: [],
      topList: [],
      bottomList: [],
      showUserList: [],
      status: [],
      readyUsers: [],
      readySuccessUsers: [],
      loading: false,
      hasCancel: false,
      currentTime: "",
    };
  },
  async onPullDownRefresh() {
    this.currentTime = "";
    this.status = [];
    this.timer = null;
    clearInterval(this.timer);
    this.leftTime = 0;
    this.ticketType = "";
    this.successUser = "";
    this.topList = [];
    this.readyUsers = [];
    this.setCancelMin = "";
    this.cancelTime = "";
    this.loading = false;
    this.hasCancel = false;
    this.bottomList = [];
    this.selectedUserList = [];
    this.userList = [];
    this.showUserList = [];
    this.readySuccessUsers = [];
    this.isCancelWhenIsReady = true;
    await this.init();
    uni.stopPullDownRefresh();
  },
  computed: {
    readyUsersLength() {
      return this.readyUsers.length;
    },
    toCancelAllNum() {
      return this.bottomList.reduce((prev, cur) => prev + cur.num, 0);
    },
    toSnapMaxNum() {
      return Math.max(
        ...this.selectedUserList.map((one) =>
          one.orders ? one.orders.length : 0
        )
      );
    },
    disabled() {
      return (
        this.selectedUserList.length === 0 ||
        this.loading ||
        this.toSnapMaxNum > this.toCancelAllNum
      );
    },
    firstExpireTime() {
      return this.bottomList.map((one) => one.endTime).sort((a, b) => a - b)[0];
    },
  },
  watch: {
    firstExpireTime(val) {
      if (val) {
        clearInterval(this.timer);
        this.timer = setInterval(() => {
          this.leftTime = (
            (new Date(val).getTime() - Date.now()) /
            1000 /
            60
          ).toFixed(2);
          if (this.leftTime <= 0) {
            clearInterval(this.timer);
          }
          this.currentTime = getTimeWithoutDate(new Date());
        }, 1000);
      } else {
        this.leftTime = 0;
        clearInterval(this.timer);
      }
    },
    readyUsersLength(val) {
      if (val) {
        if (val === this.selectedUserList.length) {
          this.status.push(`所有用户都准备好了`);
          this.checkIsEveryIsReady();
          if (!this.hasCancel) {
            this.hasCancel = true;
            this.cancel();
          }
        } else if (val / this.selectedUserList.length >= 0.5) {
          this.addStatus("一半用户都准备好了");
          if (!this.hasCancel) {
            this.hasCancel = true;
            this.cancel();
          }
        }
      }
    },
  },
  methods: {
    addStatus(str) {
      this.status.push(`【${getTimeWithoutDate()}】${str}`);
    },
    changeIsCancelWhenIsReady(e) {
      this.isCancelWhenIsReady = e.detail.value;
    },
    setLastTime() {
      this.isCancelWhenIsReady = false;
      this.setCancelMin = (
        (new Date(this.firstExpireTime).getTime() - Date.now() - 7000) /
        1000 /
        60
      ).toFixed(2);
    },
    async restartUser(item) {
      await request({
        timeout: 60000,
        url: "http://mticket.ddns.net:5000/stopUser/" + item.username,
        data: {
          isUseSlave: item.isUseSlave,
        },
      });
      await sleep(4000);
      await request({
        method: "post",
        timeout: 40000,
        url: "http://mticket.ddns.net:5000/startUserFromRemote/",
        data: {
          isUseSlave: item.isUseSlave,
          cmd: `npm run start ${item.username} 1 loop`,
        },
      });
    },
    async cancelCancel() {
      request({
        url: "http://mticket.ddns.net:5000/cancelCancel/",
      });
    },
    async checkIsEveryIsReady() {
      if (
        this.isCancelWhenIsReady &&
        this.readySuccessUsers.length === this.bottomList.length &&
        this.readyUsersLength === this.selectedUserList.length
      ) {
        let hasTime = new Date(this.cancelTime).getTime() - Date.now() > 20000;
        if (hasTime) {
          await request({
            url:
              "http://mticket.ddns.net:5000/setIsCancelImmediately?isCancelImmediately=" +
              1,
            cancelPre: true,
          });
          this.addStatus("发送立即取消的请求");
          this.waitResult(0);
          return true;
        }
      }
      return false;
    },
    async cancel() {
      this.addStatus("开始打开取消页面");
      let isImmediateOk;
      for (let one of this.bottomList) {
        await request({
          method: "post",
          url: "http://mticket.ddns.net:5000/closeAndCancelOrder/",
          data: {
            cancelTime: this.cancelTime,
            nickname: one.nickname,
            isUseSlave: one.isUseSlave,
          },
        });
        this.addStatus("发送了closeAndCancelOrder");
        try {
          let { isCanCancel, msg } = await request({
            timeout: 60000,
            url:
              "http://mticket.ddns.net:4000/waitUntilCancelIsOk/" +
              encodeURIComponent(one.nickname),
          });
          this.addStatus(msg);

          if (isCanCancel) {
            this.readySuccessUsers.push(one.nickname);
            iFsImmediateOk = this.checkIsEveryIsReady();
          } else {
            this.addStatus("取消中断！！");
            throw new Error("取消失败");
          }
        } catch (e) {
          this.addStatus("打开取消页面超时");
        }
      }

      if (!isImmediateOk) {
        let gap = new Date(this.cancelTime).getTime() - Date.now() - 20000;
        if (gap < 0) {
          gap = 0;
        }
        this.waitResult(gap);
      }
    },
    waitResult(gap) {
      setTimeout(async () => {
        this.bottomList.forEach(async (one) => {
          await request({
            timeout: 14 * 60000,
            url:
              "http://mticket.ddns.net:4000/waitUntilCancelDone/" +
              encodeURIComponent(one.nickname),
          });
          this.addStatus(`【${one.nickname}】取消完成！`);
          let host = `http://mticket.ddns.net:4000/removeAppMsg`;
          await request({
            method: "post",
            url: host,
            data: {
              id: one.id,
            },
          });
        });
        this.checkHasSuccess();
      }, gap);
    },
    async checkHasSuccess() {
      this.successUser = await request({
        timeout: 60000,
        url: "http://mticket.ddns.net:4000/waitUntilNewSuccess",
      });
      this.addStatus(`有用户成功了: ` + this.successUser);
      this.readyUsers = [];
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
    async confirm() {
      if (
        this.bottomList.some((one) => !one.remark || !one.remark.includes("借"))
      ) {
        await this.confirmAction("待取消的有非借用的, 确认取消？");
      }

      this.loading = true;

      this.readyUsers = [];
      let num = this.bottomList.length;
      await request({
        url:
          "http://mticket.ddns.net:5000/setIsCancelImmediately?isCancelImmediately=" +
          0,
        cancelPre: true,
      });
      await request({
        url: "http://mticket.ddns.net:5000/setSnapNum?num=" + num,
        cancelPre: true,
      });
      this.status = ["设置取消的个数为" + num];
      let gap = 280;
      let timeArr = [2, 2.5, 3];
      let baseTime =
        new Date().getTime() +
        (this.setCancelMin || timeArr[this.selectedUserList.length - 1]) *
          60 *
          1000;
      baseTime = getTime(new Date(baseTime));
      this.cancelTime = baseTime;
      this.addStatus(`取消时间:` + baseTime);
      // if (new Date(this.firstExpireTime).getTime() - Date.now() < 30000) {
      //   this.status.push("时间不够了30秒了, 取消执行");
      //   this.loading = false;
      //   return;
      // }
      if (
        new Date(baseTime).getTime() > new Date(this.firstExpireTime).getTime()
      ) {
        this.addStatus(`接盘时间超过了到期时间, 取消执行！`);
        this.loading = false;
        return;
      }

      console.log("开始", this.selectedUserList);

      this.selectedUserList.forEach(async (one, index) => {
        await sleep(index * 100);
        await request({
          method: "post",
          timeout: 60000,
          url: "http://mticket.ddns.net:5000/closeAndSetSnappedTime/",
          data: {
            snappedTime: baseTime + "." + (index + 1) * gap,
            nickname: one.username,
            isUseSlave: one.isUseSlave,
          },
        });

        await request({
          timeout: 120000,
          url:
            "http://mticket.ddns.net:4000/waitUntilOneSnapIsOk/" +
            encodeURIComponent(one.username),
        });
        this.addStatus(`【${one.username}】准备好了`);
        this.readyUsers.push(one.username);
      });
      // this.status += "\r\n" + "设置取消时间为" + this.firstExpireTime;

      // this.status = "首个用户准备好了";
    },
    async getShowUserList() {
      let arr = this.userList.filter((one) => {
        return one.targetTypes.includes(this.ticketType) && !one.hasSuccess;
      });

      arr.forEach((one) => {
        one.isJie = one.remark?.includes("借");
        one.isMulti = one.orders.length > 1;
        one.remark = one.remark?.replace(/代(姐|胜|椰|坤)_自_/, "");
      });
      console.log(arr);
      this.showUserList = arr;
    },
    async addUser(index, item) {
      this.selectedUserList.push(item);
      this.showUserList.splice(index, 1);
    },
    async add(index, item) {
      if (!this.ticketType) {
        this.ticketType = item.ticketType;
      } else {
        if (this.ticketType !== item.ticketType) {
          uni.showToast({
            icon: "none",
            title: "请选择同类型的消息",
            duration: 2000,
          });
          return;
        }
      }
      this.topList.splice(index, 1);
      this.bottomList.push(item);
      this.getShowUserList();
    },
    async remove(index, item) {
      this.topList.push(item);
      this.bottomList.splice(index, 1);
      if (this.bottomList.length === 0) {
        this.ticketType = "";
        this.showUserList = [];
        this.selectedUserList = [];
      }
    },
    async removeUser(index, item) {
      this.selectedUserList.splice(index, 1);
      this.showUserList.push(item);
    },
    async getUserList() {
      let { config } = await request({
        url: "http://mticket.ddns.net:5000/getAllUserConfig",
        cancelPre: true,
      });
      let userList = Object.keys(config).map((key) => {
        let item = config[key];
        item.username = key;
        return item;
      });
      this.userList = userList;
      this.selectedUserList = [];
    },
    async init() {
      let host = `http://mticket.ddns.net:4000/getAllAppMsg`;
      let arr = await request({
        method: "get",
        url: host,
      });
      this.successList = arr.filter((one) => one.type === "success");
      let today = getTime().split(/\s+/)[0];
      this.successList.forEach((one) => {
        let endTime = one.msg.match(/color: orange">【(.*?)】/)[1];
        one.num = Number(one.msg.match(/【(\d+)个】/)[1]);
        endTime = today + " " + endTime;
        one.endTime = endTime;
        one.remark = one.msg.match(/ms, 【(.*?)】/)?.[1];
        one.activityName = one.msg.match(/<\/a>】-(.*?),/)[1];
        one.isJie = one.msg.includes("借");
      });
      this.successList = this.successList.filter(
        (one) => new Date(one.endTime).getTime() > Date.now()
      );
      console.log(this.successList);
      this.topList = [...this.successList];

      await this.getUserList();
    },
  },
  created() {
    // this.test();
    this.init();
  },
};
</script>

<style lang="scss" scoped>
.snap {
  width: 100%;
  height: 100%;
  background-color: #fff;
  padding: 10px;
  padding-bottom: 30px;
  .success-wrap,
  .user-list {
    width: 50%;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .user-list {
    .user {
      // border-radius: 10px;
      margin: 10px;
      position: relative;

      // align-items: center;
      .name {
        padding: 5px;
        flex: 1;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        > div {
          margin: 5px 0;
        }
        &.success {
          background-size: 200% 200% !important; /* 背景图大小 */
          background-image: linear-gradient(
            135deg,
            #ff7c7c,
            #ffeb3b,
            #26c6da,
            #7e57c2
          ) !important;
          animation: flow 3s ease infinite !important;
        }

        @keyframes flow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        // background: purple;
      }
      .borrow {
        position: absolute;
        left: 0;
        top: 0;
        transform: translate(-50%, -50%);
      }
      .icon {
        position: absolute;
        right: 0;
        top: 0;
        transform: translate(50%, -50%);
      }
    }
  }
  .to-cancel,
  .to-snap {
    width: 50%;
    border: 1px solid #42c646;
    border-radius: 4px;
  }
  .middle {
    margin: 15px 0;
  }
  .message {
    margin: 15px;
    // display: flex;
    position: relative;
    .icon {
      position: absolute;
      right: 0;
      top: 0;
      transform: translate(50%, -50%);
    }
    .text {
      padding: 5px;
      text-align: justify;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      > div {
        margin: 5px 0;
      }
    }
    button {
      margin-left: 10px;
      background: rgb(49, 49, 234);
      color: white;
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .expire-time {
    line-height: 2;
    font-weight: bold;
    // margin-top: 20px;
    color: red;
  }
  .bottom,
  .top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .top {
    align-items: flex-end;
  }
  .status {
    .one-status {
      margin: 5px;
      color: orange;
      font-weight: bold;
      &:last-child {
        color: red;
      }
    }
  }
  .input-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 5px;
    margin-bottom: 15px;
    button {
      background: #26c6da;
      color: white;
      margin-left: 10px;
    }
  }
  .input {
    flex: 1;
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 5px;
    display: block;
  }
  .confirm {
    margin: 10px 0;
    background: rgb(1, 120, 251);
    color: white;
    &[disabled] {
      background: gray;
    }
  }
}
</style>