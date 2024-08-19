<template>
  <view class="content">
    <!-- <div class="status">
			<div>连接状态: </div>
			<div class="dot" :style="{ background: connected ? '#49e749' : 'red' }"> </div>
		</div> -->
    <div class="actions">
      <button @click="restartSlide" size="small" class="btn restart">
        重启
      </button>
      <image
        class="sync"
        style="width: 30px; height: 30px; flex-shrink: 0"
        :class="syncIng ? 'syncing' : ''"
        src="/static/sync.svg"
        @click="syncActivityInfo"
      />

      <button @click="toAudience" size="small" class="btn audience">
        观演人
      </button>
    </div>
    <div class="status">
      <div style="margin-right: 10px">勿扰:</div>
      <switch :checked="isNoSound" @change="handleNOSoundChange" />
      <!-- 
			<div style="margin-right: 10px;">勿扰: </div>
			<switch :checked="isNoSound" @change="handleNOSoundChange" />

 -->
      <div style="margin-right: 10px">仅成功:</div>
      <switch :checked="isOnlySuccess" @change="handleOnlySuccessChange" />
      <my-input
        class="keyword"
        type="text"
        v-model="keyword"
        placeholder="筛选"
      />
    </div>

    <div class="all-message">
      <div class="sum" v-if="msgArr.length">
        共有{{ msgArr.length }}条消息， 当前条件{{ showArr.length }}条<span
          v-if="successLength"
          >，{{ successLength }}条成功</span
        >
      </div>

      <uni-swipe-action>
        <template v-for="(item, index) in showArr" :key="index + item.msg">
          <uni-swipe-action-item
            :right-options="activityRightOptions"
            @click="activityClick($event, item)"
          >
            <div
              class="message-wrap"
              :class="item.type"
              @click="clickMsg(item, index)"
            >
              <!-- <div class="index">{{index+1}}.</div> -->
              <div class="message" v-html="item.msg"></div>
              <!-- <div>{{ index + 1 }}: {{ item.msg }}</div> -->
            </div>
          </uni-swipe-action-item>
        </template>
      </uni-swipe-action>
    </div>

    <div class="bottom">
      <button @click="clear" class="clear" type="primary" v-if="msgArr.length">
        清除
      </button>
      <button
        @click="clearCurrent"
        class="clear clear-current"
        type="primary"
        v-if="showArr.length"
      >
        清除当前
      </button>
      <button
        @click="stop"
        class="stop"
        v-if="innerAudioContext"
        type="success"
      >
        停止
      </button>
    </div>
    <uni-popup ref="popup" type="bottom" @touchmove.stop>
      <div class="audience-dialog">
        <scroll-view scroll-y style="max-height: 70vh">
          <div class="origin-message" v-html="originMsg"></div>
          <div
            class="origin-message"
            v-html="firstMsg"
            style="color: red; margin-top: 15px"
          ></div>
          <div class="list">
            <checkbox-group @change="changeAudience">
              <checkbox
                :value="JSON.stringify(item)"
                v-for="(item, index) in audienceList"
                :key="index"
                class="item"
                :checked="checkedAudience.includes(JSON.stringify(item))"
              >
                <input type="text" v-model="item.audience" class="first" />
                <span>{{ item.number }}</span>
              </checkbox>
            </checkbox-group>

            <search-input
              class="search"
              placeholder="查询演出"
              :platform="'activity'"
              v-model:value="searchActivityName"
              @itemChange="activityChange"
            ></search-input>

            <checkbox-group
              @change="(e) => changeTarget(e)"
              class="checkbox-group"
            >
              <checkbox
                :value="item"
                v-for="(item, index) in Object.values(skuIdToTypeMap)"
                :key="index"
                >{{ item }}
              </checkbox>
            </checkbox-group>

            <radio-group
              :key="searchActivityName"
              v-if="searchActivityName"
              @change="(e) => changeMyUser(e)"
            >
              <radio
                :style="
                  'width:50%;marginBottom:10px;color:' + user.split('__')[1]
                "
                v-for="(user, index) in userInfo"
                :value="user.split('__')[0]"
                :key="index"
              >
                <!-- {{ user }} -->
                {{ user.split("__")[0] }}__{{ user.split("__")[3] }}__{{
                  user.split("__")[4]
                }}
              </radio>
            </radio-group>

            <my-input
              type="text"
              placeholder="备注"
              v-model="form.remark"
              v-show="searchActivityName"
            />
            <!-- <div class="select-phone">
              {{ form.phone }}
            </div> -->
            <button
              class="btn"
              type="primary"
              @click="addAudience"
              :disabled="loading || !isBtnOk"
            >
              提交 {{ form.phone }}
            </button>
          </div>
        </scroll-view>
      </div>
    </uni-popup>

    <uni-popup ref="pay" type="top">
      <div class="popup-content">
        <my-input type="text" v-model="phoneCode" placeholder="验证码" />
        <div>
          <button @click="closePay">取消</button>
          <button @click="payWithMessage">确定</button>
        </div>
      </div>
    </uni-popup>
  </view>
</template>

<script>
import { request, sleep } from "@/utils.js";
import SearchInput from "@/components/search-input/search-input.vue";
import userMap from "@/components/userMap.js";
export default {
  data() {
    return {
      syncIng: false,
      phoneCode: "",
      allConfig: [],
      form: {
        targetTypes: [],
        phone: "",
        remark: "",
        activityId: "",
      },
      successInfo: {},
      searchActivityName: "",
      skuIdToTypeMap: {},
      originMsg: "",
      firstMsg: "",
      audienceList: [],
      checkedAudience: [],
      isNoSound: !!uni.getStorageSync("isNoSound"),
      isOnlySuccess: !!uni.getStorageSync("isOnlySuccess"),

      activityRightOptions: [
        {
          text: "删除",
          style: {
            backgroundColor: "#dd524d",
          },
        },
      ],
      loading: false,
      connected: false,
      keyword: "",
      innerAudioContext: null,
      title: "Hello",
      msgArr: [],
      selectedAudienceList: [],
    };
  },
  components: {
    SearchInput,
  },
  computed: {
    userInfo() {
      let arr = Object.keys(this.userMap).map((name) => {
        let phone = this.userMap[name] && this.userMap[name].phone;
        let runningLength = 0;
        let audienceLength =
          this.audienceInfo && this.audienceInfo[phone]
            ? this.audienceInfo[phone].length
            : 0;

        if (this.form.activityId && this.allConfig.length && phone) {
          runningLength = this.getPhoneRunningLength(
            phone,
            this.form.activityId,
            this.allConfig
          );
        }
        let successLength = this.successInfo[phone] || 0;
        return { name, successLength, runningLength, audienceLength };
      });
      arr = arr.filter((one) => one.successLength < 4);
      arr.sort((a, b) => a.successLength - b.successLength);
      arr.sort((a, b) => a.runningLength - b.runningLength);
      arr.sort((a, b) => a.audienceLength - b.audienceLength);
      return arr.map(
        ({ successLength, runningLength, audienceLength, name }) =>
          `${name}__${this.getColor(
            successLength
          )}__${successLength}__${runningLength}__${audienceLength}`
      );
    },
    isBtnOk() {
      return (
        this.form.phone &&
        this.selectedAudienceList.length &&
        this.form.targetTypes.length
      );
    },
    userMap() {
      let obj = userMap;
      return obj;
    },
    successLength() {
      return this.msgArr.filter((one) => one.type === "success").length;
    },
    showArr() {
      let arr = this.isOnlySuccess
        ? this.msgArr.filter((one) => one.type === "success")
        : this.msgArr;
      if (this.keyword) {
        return arr.filter((one) =>
          one.msg.replace(/\s{2}/, " ").includes(this.keyword)
        );
      } else {
        if (arr.length > 900) {
          return arr.slice(0, 400);
        } else {
          return arr;
        }
      }
    },
  },
  onLoad() {
    this.loadAllMsg();
    // #ifdef WEB
    setInterval(async () => {
      let host = `http://mticket.ddns.net:4000/getAllAppMsg`;
      let arr = await request({
        method: "get",
        url: host,
      });
      if (arr.length && this.msgArr.length && arr[0].id !== this.msgArr[0].id) {
        console.log("更新消息");
        if (this.isWeb) {
          arr.forEach((one) => {
            one.msg = one.msg.replace("orange", "#420bfe");
          });
        }
        let addLength = arr.length - this.msgArr.length;
        arr.slice(0, addLength).forEach(one=>{
          console.log(one)
          this.handleReceiveOneMsg(one)
        })
        this.msgArr = arr;
      }
    }, 5000);
    // #endif
    // #ifdef APP-PLUS
    // 监听在线消息事件
    plus.push.addEventListener(
      "receive",
      ({ title, content, payload }) => {
        let routes = getCurrentPages();
        let curRoute = routes[routes.length - 1].route;
        if (curRoute !== "pages/index/index") {
          uni.showToast({
            icon: "none",
            title: JSON.stringify(payload),
            duration: 2000,
          });
        }
        let hasAdd = this.msgArr.find((one) => one.id === payload.id);
        if (hasAdd) return;
        this.msgArr.unshift(payload);

        this.handleReceiveOneMsg(payload);
      },
      false
    );
    // #endif
  },
  watch: {
    loading(val) {
      if (val) {
        uni.showLoading({
          title: "加载中",
        });
      } else {
        uni.hideLoading();
      }
    },
    msgArr: {
      deep: true,
      handler(val) {
        if (!val.length) {
          this.stop();
        }
      },
    },
  },

  created() {
    this.isWeb = !!document;
  },
  methods: {
    handleReceiveOneMsg(payload) {
      if(!payload){
        console.log("没有palyload")
        return
      }
      if (payload.type === "success") {
        this.playSong();
      } else if (payload.msg.includes("未支付")) {
        this.playSong();
      } else if (!this.isNoSound) {
        this.sound(payload.type, payload.msg);
      }
    },
    closePay() {
      this.$refs.pay.close();
    },
    async payWithMessage() {
      this.loading = true;
      await request({
        url: "http://mticket.ddns.net:5000/payWithMessage",
        data: {
          endPoint: this.endPoint,
          phoneCode: this.phoneCode,
        },
        method: "post",
      });
      this.loading = false;
      this.closePay();
    },
    async restartSlide() {
      this.loading = false;
      await request({
        url: "http://mticket.ddns.net:5000/restartSlideServer",
        method: "get",
      });
      await request({
        url: "http://mticket.ddns.net:5010/restartSlideServer",
        method: "get",
      });
      await sleep(3000);
      this.loading = false;
    },
    async syncActivityInfo() {
      this.loading = false;
      this.syncIng = true;
      await request({
        url: "http://mticket.ddns.net:5002/syncActivityInfo",
        method: "get",
      });
      this.syncIng = false;
      this.loading = false;
    },
    async startOne(name) {
      await request({
        method: "post",
        url: "http://mticket.ddns.net:5000/startUserFromRemote/",
        data: {
          cmd: `npm run start ${name}`,
        },
      });
    },
    changeTarget(e) {
      this.form.targetTypes = e.detail.value.map((name) => {
        let ids = Object.keys(this.skuIdToTypeMap);
        return ids.find((id) => this.skuIdToTypeMap[id] === name);
      });
    },
    changeMyUser(e) {
      let { phone, password } = this.userMap[e.detail.value];
      this.form.phone = phone;
      this.form.password = password;
    },
    async getSuccessInfo(activityName) {
      this.successInfo = {};
      let records = await request({
        method: "post",
        url: "http://mticket.ddns.net:5000/searchSeat/",
        data: {
          keyword: activityName.replace(/【.*?】/, ""),
        },
      });
      this.successInfo = records.reduce((prev, cur) => {
        if (!prev[cur.phone]) {
          prev[cur.phone] = 0;
        }
        prev[cur.phone] += cur.realNames.length;
        return prev;
      }, {});
    },
    getColor(num) {
      let map = {
        0: "black",
        1: "green",
        2: "blue",
        3: "orange",
        4: "red",
      };
      return map[num] || "red";
    },
    activityChange(id, list) {
      let { skuIdToTypeMap } = list.find((one) => one.activityId === id);
      this.skuIdToTypeMap = skuIdToTypeMap;
      this.form.activityId = id;
      this.getSuccessInfo(this.searchActivityName);
      this.getValidUser(this.form.activityId);
    },
    async addAudience() {
      let url = "http://mticket.ddns.net:5000/addAudience";
      this.loading = true;
      try {
        for (let { audience, number } of this.selectedAudienceList) {
          let data = {
            audience,
            isAdd: true,
            number,
            ...this.form,
          };

          await request({
            url,
            method: "post",
            data,
          });
          await sleep(1200);
        }
        uni.showToast({
          icon: "none",
          title: "观演人新增成功",
          duration: 1000,
        });
        this.addOneRecord();
      } catch (e) {
        this.loading = false;
      }
    },
    reset() {
      this.selectedAudienceList = [];
      this.searchActivityName = "";
      this.skuIdToTypeMap = {};
      this.loading = false;
      this.form = {
        targetTypes: [],
        phone: "",
        password: "",
        activityId: "",
      };
    },
    async getPort(activityId) {
      let url = "http://mticket.ddns.net:5010/getCheckConfig/" + activityId;
      console.log(url);
      let { port } = await request({
        url,
      });
      return port;
    },
    async getValidUser() {
      let { config } = await request({
        url: "http://mticket.ddns.net:5000/getAllUserConfig/",
      });
      let numbers = Object.keys(config)
        .filter((one) => one.includes("me"))
        .map((one) => Number(one.replace("me", "")));

      let num = Math.ceil(Math.random() * 1000);
      while (numbers.includes(num)) {
        num = Math.ceil(Math.random() * 1000);
      }

      let allConfig = Object.values(config);
      this.allConfig = allConfig;
      this.validUsername = "me" + num;
    },
    getPhoneRunningLength(phone, activityId, allConfig) {
      let data = allConfig.filter(
        (one) =>
          String(one.activityId) === String(activityId) &&
          Number(one.phone) === Number(phone) &&
          one.orders.length
      );

      return data.length;
    },

    async addOneRecord() {
      let port = await this.getPort(this.form.activityId);
      let showOrders = this.selectedAudienceList.map((_, i) => i).join(",");
      let data = {
        ...this.form,
        isCopy: true,
        port,
        username: this.validUsername,
        showOrders,
      };

      this.loading = true;

      await request({
        method: "post",
        url: "http://mticket.ddns.net:5000/addInfo/",
        data,
        timeout: 120000,
      });
      this.$refs.popup.close();
      this.reset();
      this.loading = false;
      uni.showToast({
        icon: "none",
        title: "新增记录成功",
        duration: 1000,
      });
      this.startOne(data.username);
    },
    async changeAudience(e) {
      this.selectedAudienceList = e.detail.value.map((one) => JSON.parse(one));

      if (this.selectedAudienceList.length) {
        let all = Object.values(this.audienceInfo).flat();
        if (all.includes(this.selectedAudienceList[0].audience)) {
          uni.showToast({
            icon: "none",
            title: "已经有该观演人了",
            duration: 600,
          });
        }
      }
    },
    clearCurrent() {
      this.showArr.map((one) => this.removeOneMsg(one.id));
    },
    toAudience() {
      uni.navigateTo({
        url: "/pages/audience/index",
      });
    },
    handleNOSoundChange(e) {
      this.isNoSound = e.detail.value;
      if (this.isNoSound) {
        uni.setStorageSync("isNoSound", "1");
      } else {
        uni.removeStorageSync("isNoSound");
      }
    },
    handleOnlySuccessChange(e) {
      this.isOnlySuccess = e.detail.value;
      if (this.isOnlySuccess) {
        uni.setStorageSync("isOnlySuccess", "1");
      } else {
        uni.removeStorageSync("isOnlySuccess");
      }
    },
    sound(type, msg) {
      let src = "";
      if (type === "error") {
        src = "/static/wrong.wav";
      } else if (msg.includes("有票")) {
        src = "/static/hasTicket.mp3";
      } else if (type === "addAudience") {
        src = "/static/info.wav";
      }

      let innerAudioContext = uni.createInnerAudioContext();
      innerAudioContext.autoplay = true;
      innerAudioContext.loop = false;
      innerAudioContext.src = src;
    },
    async removeOneMsg(id) {
      this.loading = true;
      let host = `http://mticket.ddns.net:4000/removeAppMsg`;
      await request({
        method: "post",
        url: host,
        data: {
          id,
        },
      });
      let i = this.msgArr.findIndex((one) => one.id === id);
      this.msgArr.splice(i, 1);
      this.loading = false;
    },
    async activityClick({ index }, { id }) {
      if (index === 0) {
        await this.removeOneMsg(id);
      }
    },

    async loadAllMsg() {
      let host = `http://mticket.ddns.net:4000/getAllAppMsg`;
      let arr = await request({
        method: "get",
        url: host,
      });
      if (this.isWeb) {
        arr.forEach((one) => {
          one.msg = one.msg.replace("orange", "#420bfe");
        });
      }
      this.msgArr = arr;
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

    async clickMsg(item, index) {
      if (item.type === "cheDan") {
        await this.confirmAction(
          `确定删除【${item.username}】, 观演人【${item.audienceList.join(
            "_"
          )}】？`
        );
        for (let audience of item.audienceList) {
          await this.removeOneAudience(audience, item.phone, item.platform);
          await sleep(2000);
        }
        uni.showToast({
          icon: "none",
          title: "删除了" + item.username,
          duration: 1000,
        });

        let arr = this.msgArr.filter((one) => one.msg.includes(item.username));
        for (let one of arr) {
          await this.removeOneMsg(one.id);
        }
      } else if (item.isPay) {
        this.endPoint = item.endPoint;
        this.$refs.pay.open();
      } else if (item.msg.includes("截图")) {
        // console.log("有截图")
        // this.getSelect(document.querySelector("#screenshot"));
        // document.execCommand("copy");
        // window.getSelection().removeAllRanges();
      } else if (item.phone) {
        this.call(item.phone, item);
      } else if (item.canStart) {
        uni.showLoading({
          title: "启动中",
        });
        try {
          await request({
            method: "post",
            url: "http://mticket.ddns.net:5000/startUserFromRemote/",
            data: { cmd: `npm run start ${item.canStart} 1` },
          });
        } catch (e) {
          console.log(e);
        }

        uni.hideLoading();
        this.removeOneMsg(item.id);
      } else if (item.msg.includes("微信") && !item.msg.includes("真撤")) {
        let res = this.getAudienceFromWxMsg(item.msg);

        if (res.length) {
          let firstOne = this.msgArr.find((one) =>
            one.msg.includes(res[0].audience)
          );
          this.firstMsg = firstOne.msg.includes("真撤") ? firstOne.msg : "";
          this.originMsg = item.msg;
          this.audienceList = res;
          this.reset();
          this.$refs.popup.open();
          this.audienceInfo = await request({
            method: "get",
            url: "http://mticket.ddns.net:5001/getAllAudienceInfo",
          });
        }
      }
    },
    getAudienceFromWxMsg(msg, res = []) {
      let obj = this.getOneAudience(msg);
      if (obj) {
        res.push(obj);
        let { audience, number } = obj;
        msg = msg.replace(audience, "");
        msg = msg.replace(number, "");
        return this.getAudienceFromWxMsg(msg, res);
      }
      return res;
    },
    async removeOneAudience(audience, phone, platform) {
      let hostMap = {
        大麦: "http://mticket.ddns.net:5000",
        星球: "http://mticket.ddns.net:6100",
      };
      let data = {
        audience,
        phone,
      };
      // await this.confirmAction(`确定删除【${audience}】？`);
      this.loading = true;
      await request({
        url: hostMap[platform] + "/removeAudience",
        data,
        method: "post",
      });
      uni.showToast({
        icon: "none",
        title: "删除成功",
        duration: 2000,
      });
      this.loading = false;
    },
    startVibrate() {
      this.timer = setInterval(() => {
        uni.vibrateLong();
      }, 2000);
    },
    playSong(isTips) {
      //#ifdef APP-PLUS
      this.startVibrate();
      //#endif

      this.innerAudioContext = uni.createInnerAudioContext();
      this.innerAudioContext.autoplay = true;
      this.innerAudioContext.loop = true;
      this.innerAudioContext.src = isTips
        ? "/static/tips.mp3"
        : "/static/1.mp3"; //铃声文件的路径
      this.innerAudioContext.onPlay(() => {
        console.log("开始播放");
      });
      this.innerAudioContext.onError((res) => {
        console.log(res.errMsg);
        console.log(res.errCode);
        this.innerAudioContext = null;
      });
    },
    async clear() {
      this.loading = true;
      this.msgArr = [];
      let host = `http://mticket.ddns.net:4000/removeAllAppMsg`;
      await request({
        method: "get",
        url: host,
      });
      this.loading = false;
    },
    getOneAudience(val) {
      let arr = [
        {
          reg: /([\u4e00-\u9fa5]{2,3})([^\S\r\n]*|:|：)(\d{18})/,
          nameOrder: 1,
          numberOrder: 3,
        },
        {
          reg: /([\u4e00-\u9fa5]{2,3})([^\S\r\n]*|:|：)(\d{17}X)/,
          nameOrder: 1,
          numberOrder: 3,
        },
        {
          reg: /(\d{18})([^\S\r\n]*)([\u4e00-\u9fa5]{2,3})/,
          nameOrder: 3,
          numberOrder: 1,
        },
        {
          reg: /(\d{17}X)([^\S\r\n]*)([\u4e00-\u9fa5]{2,3})/,
          nameOrder: 3,
          numberOrder: 1,
        },
      ];
      let res;
      for (let one of arr) {
        val = val.replace("x", "X");
        res = val.replace(/身份证号|身份证|,|，|\-/g, " ").match(one.reg);
        if (res) {
          return {
            audience: res[one.nameOrder],
            number: res[one.numberOrder],
          };
        }
      }
      return null;
    },
    call(phoneNumber, item) {
      let itemList = [phoneNumber, "呼叫", "复制", "已读"];
      if (item.payCode) {
        itemList.push("复制口令");
      } else {
        itemList.push("复制一个观演人");
      }
      uni.showActionSheet({
        itemList,
        success: (res) => {
          if ([0, 1].includes(res.tapIndex)) {
            item.type = "success-call";
            uni.makePhoneCall({
              phoneNumber,
            });
          } else if (res.tapIndex === 2) {
            uni.setClipboardData({
              data: phoneNumber,
            });
          } else if (res.tapIndex === 3) {
            item.type = "success-call";
          } else if (res.tapIndex === 4) {
            uni.setClipboardData({
              data: itemList.includes("复制口令")
                ? item.payCode
                : item.realNames.split("_")[0],
            });
          }
        },
      });
    },

    stop() {
      this.innerAudioContext.destroy();
      this.innerAudioContext = null;
      clearInterval(this.timer);
    },
  },
};
</script>

<style lang="scss" scoped>
.content {
  padding-top: 10px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  // padding: 15px;
}

.actions {
  // display: flex;
  // justify-content: center;
  // align-items: center;
  width: 100%;
  position: relative;
  .restart {
    float: left;
    background: rgb(233, 174, 45) !important;
  }
  .sync {
    cursor: pointer;
    &.syncing {
      animation: alternate 1s infinite linear;
      @keyframes alternate {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(-360deg);
        }
      }
      // ani: rotate(360deg);
    }
    // float: left;
    // background: rgb(81, 198, 38) !important;
  }

  .audience {
    text-align: center;
    display: inline-block;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    // margin: 0 auto;
  }
  .btn {
    margin: 0 10px;
    line-height: 1.8 !important;
    background: rgb(0, 122, 255);
    color: white !important;
  }
}

.status {
  display: flex;
  align-items: center;
  padding-top: 20px;

  .dot {
    margin-left: 15px;
    width: 15px;
    height: 15px;
    border-radius: 50%;
  }

  .keyword {
    width: 20vw;
  }
}

.all-message {
  margin: 20px;
  flex: 1;
  overflow: auto;
  width: 100%;
  user-select: text;

  .sum {
    text-align: center;
  }

  .message-wrap {
    padding: 10px;
    margin: 10px;
    display: flex;
    justify-content: center;
    align-items: center;

    &.success {
      color: green;
    }

    &.success-call {
      color: rgb(164, 207, 164);
    }

    &.pay {
      color: rgb(218, 126, 39);
    }

    &.error {
      color: red;
    }

    &.info {
      color: black;
    }

    .message {
      width: 100%;
      word-break: break-all;
      // border-bottom: 2px solid rgb(233, 239, 233);
      // padding-bottom: 15px;
    }
  }
}
.popup-content {
  background: white;
  padding: 15px;
  padding-top: 40vh;
  input {
    margin-bottom: 15px;
  }
}
.bottom {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding-bottom: 20px;

  .clear-current {
    background: rgb(179, 102, 179);
  }
}
.audience-dialog {
  background: white;
  padding: 10px;
  padding-bottom: 50px;
  .list {
    margin-top: 10px;
    .item {
      margin: 5px 0;
      color: rgb(0, 122, 255);
      display: flex;
      // justify-content: center;
      align-items: center;
      .first {
        margin-left: 10px;
        width: 100px;
        flex-grow: 0;
      }
    }
  }
  .search {
    color: rgb(157, 0, 255);
    margin: 10px 0;
    border: 1px solid rgb(228, 221, 221);
    border-radius: 4px;
    padding: 2px;
  }
  .select-phone {
    text-align: center;
    color: rgb(0, 122, 255);
    margin: 10px 0;
  }
  .btn {
    margin-top: 10px;
    margin-bottom: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .checkbox-group {
    padding: 10px 0;
    gap: 10px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    flex-wrap: wrap;
  }
}
</style>

<style lang="scss">
pre {
  // font-weight: bold !important;
  font-family: "微软雅黑";
}
</style>