<template>
  <div class="remote" ref="remote">
    <progress
      :percent="percent"
      show-info
      stroke-width="3"
      class="progress"
      v-if="![0, 100].includes(percent)"
    />

    <page-meta
      :page-style="'overflow:' + (show || isShowCalc ? 'hidden' : 'visible')"
    ></page-meta>

    <div class="fail">
      <div class="fail-item" v-for="(item, index) in failCmds" :key="index">
        {{ item }}
      </div>
    </div>

    {{ clientid }}
    <!-- <div class="pcs">
            <div class="pc" v-for="(item, index) in pcs" :key="index" @click="choose(item)" :class="selected
                === item.hostname ? 'selected' : ''">{{ item.name }}</div>
        </div> -->
    <div class="search">
      <image
        class="audience"
        style="width: 35px; height: 35px"
        src="/static/running.svg"
        @click="toggleRunning"
      />
      <image
        v-if="isHideBorrow"
        class="audience"
        style="width: 35px; height: 35px"
        src="/static/hide.svg"
        @click="isHideBorrow = false"
      />
      <image
        v-else
        class="audience"
        style="width: 35px; height: 35px"
        src="/static/show.svg"
        @click="isHideBorrow = true"
      />

      <image
        v-if="!isHideSlave"
        class="audience"
        style="width: 35px; height: 35px"
        src="/static/showSlaveHost.svg"
        @click="isHideSlave = true"
      />
      <image
        v-else
        class="audience"
        style="width: 35px; height: 35px"
        src="/static/hideSlaveHost.svg"
        @click="isHideSlave = false"
      />
    </div>
    <div class="search">
      <input
        v-for="(item, index) in queryItems.filter(
          (one) => one.column !== 'activityId'
        )"
        :key="index"
        type="text"
        :placeholder="item.column"
        v-model="item.value"
      />
      <image
        style="width: 20px; height: 20px; flex-shrink: 0"
        src="/static/recover.svg"
        @click="recover"
        v-if="isShowRecover"
      />
      <image
        style="width: 20px; height: 20px; flex-shrink: 0"
        src="/static/recoverSlave.svg"
        @click="recoverSlave"
        v-if="isShowSlaveRecover"
      />

      <image
        style="width: 20px; height: 20px; flex-shrink: 0"
        src="/static/add2.svg"
        @click="addActivity"
      />
      <!-- 
      <picker
        v-show="activities.length"
        @change="bindPickerChange"
        :value="selectedActivityIndex"
        :range="activities"
      >
        <image
          style="width: 16px; height: 16px"
          src="/static/filter.svg"
          v-if="selectedActivityIndex === -1"
        />
        <image
          v-else
          style="width: 16px; height: 16px"
          src="/static/filterSelected.svg"
        />
      </picker> -->
    </div>

    <uni-swipe-action>
      <template v-for="(one, index) in groupData" :key="one.group + index">
        <div class="activity" :style="getTitleStyle(one)">
          <image
            mode="widthFix"
            src="../static/down.svg"
            @click="one.isShow = !one.isShow"
            :class="one.isShow ? 'toggle-collapse' : 'toggle-collapse rotate'"
          />
          <uni-swipe-action-item
            :right-options="activityRightOptions(one)"
            @click="activityClick($event, one.group, one.data[0].activityId)"
          >
            <div
              @click="
                showCalc(one.data[0].activityId, one.group, one.data[0].port)
              "
            >
              <span
                >{{ getShowActivityName(one.group) }}({{
                  one.data.length
                }})</span
              >
            </div>
          </uni-swipe-action-item>
        </div>

        <template v-if="one.isShow">
          <uni-swipe-action-item
            v-for="item in one.data"
            :right-options="rightOptions"
            :key="item.username + item.phone"
            @click="swipeClick($event, item, one)"
            :disabled="!!item.runningCmd"
          >
            <!-- <div class="activity" v-if="index===0|| (item.activityName!== data[index-1].activityName )">{{item.activityName}}</div> -->

            <one-item
              :platform="platform"
              :item="item"
              :host="host"
              :pidToCmd="pidToCmd"
              :stoppingUsers="stoppingUsers"
              v-model:loading="loading"
              @addStoppingUsers="(name) => stoppingUsers.add(name)"
              @stopDone="(name) => stoppingUsers.delete(name)"
              @openCopyDialog="() => openCopyDialog(item)"
              @openEditDialog="openEditDialog(item)"
              @getConfig="(val) => getConfig(val)"
              @showCmd="(val) => (showPid = val)"
              @snapOrCancel="snapOrCancel(item)"
            ></one-item>
          </uni-swipe-action-item>
        </template>
      </template>
    </uni-swipe-action>
  </div>
  <!-- <page-meta :page-style="'overflow:' + (show ? 'hidden' : 'visible')"></page-meta> -->

  <my-dialog v-model:value="msgDialogShow">
    <div class="dialog msg-dialog" @touchmove.stop>
      <div class="msg-template">
        <button @click="setTestMsg">测试</button>
        <button @click="setXingqiuMsg">星球</button>
        <button @click="setDamaiMsg">大麦</button>
      </div>
      <textarea type="textarea" v-model="msgToUser" />
      <div class="btn-wrap">
        <button size="medium" @click="msgToUser = ''">清空</button>
        <button size="medium" class="btn" type="primary" @click="sendMsgToUser">
          发送
        </button>
      </div>
    </div>
  </my-dialog>
  <calc-activity
    ref="calc"
    v-model="isShowCalc"
    :host="host"
    :port="calcPort"
    :platform="platform"
    :activityName="calcActivityName"
    :activityId="calcActivityId"
    :userConfig="dataWithoutFilter"
    :pidToCmd="pidToCmd"
    :stoppingUsers="stoppingUsers"
    @startOne="startOne"
    @startCheck="afterStartCheck"
    @stopCheck="afterStopCheck"
    @stopOne="stopOne"
    @openEditDialog="openEditDialog"
    @autoStartUsers="autoStartUsers"
    @getConfig="getConfig"
  ></calc-activity>

  <uni-popup
    ref="popup"
    type="bottom"
    @touchmove.stop
    @change="changePopup"
    :z-index="9999"
  >
    <div class="dialog" :class="isWeb ? 'is-web' : ''" @touchmove.stop>
      <image
        mode="widthFix"
        src="../static/open.svg"
        @click="toggleForm"
        :class="isShowAll ? 'toggle' : 'toggle rotate'"
      >
      </image>
      <scroll-view scroll-y :style="scrollViewHeight">
        <div class="form" v-if="isEdit">
          <template class="basic-form" v-if="isShowAll">
            <search-input
              placeholder="查询演出"
              :platform="platform"
              v-model:value="searchActivityName"
              @itemChange="activityChange"
            ></search-input>

            <div
              v-for="(field, index) in inputFields"
              :key="index"
              class="input-wrap"
            >
              <span>{{ field }}</span>
              <my-input
                type="text"
                v-model="editForm[field]"
                :placeholder="field"
                @change="(val) => changeEditForm(val, field)"
              />
            </div>

            <div class="switches">
              <div class="is-success">
                <span>是否成功：</span>
                <switch
                  :checked="editForm.hasSuccess"
                  @change="handleSwitchChange"
                />
              </div>
              <image class="jie" src="/static/borrow.svg" @click="jieyong" />
              <!-- <div class="jie" @click="jieyong">借用</div> -->
              <div class="is-success">
                <span>重新获取：</span>
                <switch
                  :checked="editForm.isRefresh"
                  @change="handleRefreshChange"
                />
              </div>
            </div>
          </template>

          <scroll-view class="checkbox-wrap" scroll-y :style="scrollStyle">
            <checkbox-group
              @change="(e) => changeTarget(editForm, e)"
              class="checkbox-group"
            >
              <checkbox
                :value="item"
                v-for="(item, index) in currentTypes"
                :key="item"
                :checked="editForm.targetTypes.includes(item)"
                ><span
                  :style="{
                    color: 'white',
                    backgroundColor: getTypesColor(currentTypes, index),
                  }"
                  >{{ item }}</span
                >
              </checkbox>
            </checkbox-group>
          </scroll-view>

          <button class="btn" type="primary" @click="confirmEdit">
            确定修改
          </button>
        </div>
        <div class="form" v-else>
          <template class="basic-form" v-if="isShowAll">
            <search-input
              ref="searchInput"
              placeholder="查询演出"
              :platform="platform"
              v-model:value="searchActivityName"
              @itemChange="activityChange"
            ></search-input>
            <div
              v-for="(item, index) in addItems"
              :key="index"
              class="add-form-item"
            >
              <span :style="{ color: item.isSpecial ? 'red' : 'black' }"
                >{{ item.name }}:</span
              >
              <radio-group
                v-if="item.name === 'myUsers'"
                @change="(e) => changeMyUser(e)"
              >
                <radio
                  :style="'color:' + user.split('__')[1]"
                  v-for="(user, index) in item.radioOptions"
                  :value="user.split('__')[0]"
                  :key="index"
                >
                  {{ user.split("__")[0] }}
                </radio>
              </radio-group>

              <my-input
                v-else
                type="text"
                v-model="form[item.id]"
                :placeholder="item.id"
                @blur="handleBlur(item.id)"
              />
            </div>

            <scroll-view
              class="checkbox-wrap"
              scroll-y
              :style="scrollStyle"
              v-if="Object.values(form.skuIdToTypeMap).length"
            >
              <checkbox-group
                @change="(e) => changeTarget(form, e)"
                class="checkbox-group"
              >
                <checkbox
                  :value="item"
                  v-for="(item, index) in Object.values(form.skuIdToTypeMap)"
                  :key="index"
                  :checked="form.targetTypes.includes(item)"
                  >{{ item }}
                </checkbox>
              </checkbox-group>
            </scroll-view>
          </template>

          <div style="display: flex">
            <button
              class="btn"
              @click="checkIsCanBuy"
              :loading="isTesting"
              :disabled="isTesting"
            >
              {{ testBtnText }}
            </button>
            <button class="btn" type="primary" @click="add">新增</button>
          </div>
        </div>
      </scroll-view>
    </div>
  </uni-popup>

  <set-time
    v-model:isShow="isSetTimeShow"
    ref="setTime"
    :isCanCancel="isCanCancel"
    v-model:setTimeStr="setTimeStr"
  ></set-time>
  <my-terminal v-if="showPid" v-model:pid="showPid" />
</template>

<script>
import calcActivity from "./calcActivity.vue";
import SearchInput from "./search-input/search-input.vue";
import MyDialog from "./my-dialog/my-dialog.vue";
import SetTime from "./setTime.vue";
import userMap from "./userMap";
import MyTerminal from "./myTerminal.vue";
import OneItem from "./oneItem.vue";
let platformToPortMap = {
  xiudong: "4010",
  damai: "5000",
  xiecheng: "6200",
  xingqiu: "6100",
  maoyan: "7000",
};
import { request, randomColor, debounce } from "@/utils.js";
export default {
  components: {
    SetTime,
    OneItem,
    calcActivity,
    MyDialog,
    SearchInput,
    MyTerminal,
  },
  props: {
    scrollTop: {
      type: Number,
      default: 0,
    },
    platform: {
      type: String,
      default: "xiudong",
    },
    pcHost: {
      type: String,
      default: "",
    },
  },

  data() {
    return {
      onlyShowRunning: false,
      showPid: "",
      pidToCmd: {},
      stoppingUsers: new Set(),
      indexToColor: {},
      isHideBorrow: false,
      isHideSlave: false,
      isSetTimeShow: false,
      setTimeStr: "",
      isCanCancel: false,
      isTesting: false,
      testBtnText: "测试",
      isWeb: false,
      dataWithoutFilter: [],
      clientid: "",
      failCmds: [],
      fixedTopActivity: uni.getStorageSync(this.platform + "FixedTopActivity"),
      msgDialogShow: false,
      searchActivityName: "",
      msgToUser: "",
      percent: 0,
      isShowAll: true,
      isShowRecover: false,
      isShowSlaveRecover: false,
      scrollTopId: "",
      old: {
        scrollTop: 0,
      },
      calcActivityId: "",
      calcActivityName: "",
      calcPort: "",
      isShowCalc: false,
      show: false,
      windowHeight: 0,
      groupData: [],
      targetTypeIndexes: [],
      editForm: {},
      isEdit: false,
      selectedActivityIndex: -1,
      data: [],
      loading: false,
      form: {},
      successInfo: {},
      queryItems: [
        {
          column: "username",
          value: "",
        },
        {
          column: "phone",
          value: "",
        },
        {
          column: "remark",
          value: "",
        },
        {
          column: "activityId",
          value: "",
        },
        {
          column: "activityName",
          value: "",
        },
      ],
      selected: this.pcHost,
    };
  },

  watch: {
    onlyShowRunning(val) {
      this.filterData();
    },
    // selectedActivityId(val) {
    //   this.queryItems.find((one) => one.column === "activityId").value = val;
    //   this.filterData();
    // },
    selected: {
      immediate: true,
      handler() {
        this.selectedActivityIndex = -1;
        this.getConfig(true);
      },
    },
    isHideBorrow() {
      this.filterData();
    },
    isHideSlave() {
      this.filterData();
    },
    queryItems: {
      deep: true,
      handler() {
        this.filterDataWithDebounce();
      },
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
  },
  created() {
    this.filterDataWithDebounce = debounce(this.filterData, 500);

    this.isWeb = uni.getSystemInfoSync().uniPlatform === "web";
    //#ifdef APP-PLUS

    plus.push.getClientInfoAsync((info) => {
      this.clientid = info["clientid"];
    });
    //#endif

    let res = uni.getSystemInfoSync();
    console.log(res);
    this.windowHeight = res.windowHeight;
  },
  mounted() {},
  computed: {
    currentTypes() {
      return Object.values(this.editForm.skuIdToTypeMap);
    },
    scrollViewHeight() {
      return {
        maxHeight: this.isWeb ? "80vh" : "92vh",
      };
    },
    checkHost() {
      if (this.host.includes("mticket")) {
        return this.host.replace("5000", "5010");
      }
      return this.host;
    },
    slaveHost() {
      if (this.host.includes("5000")) {
        return this.host.replace("5000", "5003");
      }
    },
    userMap() {
      let obj = userMap;
      if (!this.isDamai) {
        delete obj["姐司"];
      }
      return obj;
    },
    isAddMine() {
      return Object.values(this.userMap).some(
        (obj) => Number(obj.phone) === Number(this.form.phone)
      );
    },
    selectedAddMineAudienceLength() {
      if (this.isAddMine && this.isXingqiu) {
        let target = this.dataWithoutFilter.find(
          (one) => Number(one.phone) === Number(this.form.phone)
        );
        if (target) {
          return target.audienceList.length;
        }
      }
      return 0;
    },
    scrollStyle() {
      return {
        maxHeight: this.isShowAll ? "80vh" : "auto",
      };
    },
    pcs() {
      return [
        {
          hostname: this.pcHost,
          name: "华硕",
        },
        {
          name: "联想",
          hostname: "e4097n6449.51vip.biz",
        },

        {
          name: "3",
          hostname: "100.95.67.33",
        },
        {
          name: "4",
          hostname: "100.116.129.127",
        },
      ];
    },
    isDamai() {
      return this.platform === "damai";
    },
    isMaoyan() {
      return this.platform === "maoyan";
    },
    isXiudong() {
      return this.platform === "xiudong";
    },
    isXingqiu() {
      return this.platform === "xingqiu";
    },
    isXiecheng() {
      return this.platform === "xiecheng";
    },
    addItems() {
      let fields = this.isDamai
        ? [
            "activityId",
            "port",
            "showOrders",
            "myUsers",
            "phone",
            "password",
            "username",
            "uid",
            "remark",
          ]
        : [
            "activityId",
            "port",
            "showOrders",
            "myUsers",
            "phone",
            "username",
            "uid",
            "remark",
          ];

      return fields.map((one) => ({
        name: one,
        id: one,
        isSpecial: one === "showOrders",
        radioOptions:
          one === "myUsers"
            ? Object.keys(this.userMap).map((name) => {
                if (this.isDamai) {
                  let phone = this.userMap[name] && this.userMap[name].phone;
                  return this.successInfo[phone]
                    ? `${name}__${this.getColor(this.successInfo[phone])}__${
                        this.successInfo[phone]
                      }`
                    : name;
                } else {
                  return name;
                }
              })
            : [],
      }));
    },
    rightOptions() {
      let options = [
        {
          text: "删除",
          style: {
            backgroundColor: "#dd524d",
          },
        },
        {
          text: "toCheck",
          style: {
            backgroundColor: "orange",
          },
        },
      ];
      if (!this.isXiudong) {
        options.pop();
      }
      return options;
    },
    host() {
      return `http://${this.selected}:${platformToPortMap[this.platform]}`;
    },
    slideHost() {
      return this.isDamai ? this.host.replace("5000", "5001") : this.host;
    },
    inputFields() {
      return this.editFields.filter(
        (one) => !["targetTypes", "hasSuccess"].includes(one)
      );
    },
    editFields() {
      let map = {
        xiudong: [
          "activityId",
          "port",
          "showOrders",
          "remark",
          "uid",
          "targetTypes",
          "hasSuccess",
        ],
        damai: [
          "activityId",
          "port",
          "password",
          "showOrders",
          "remark",
          "uid",
          "createTime",
          "targetTypes",
          "hasSuccess",
        ],
        xingqiu: [
          "activityId",
          "port",
          "showOrders",
          "remark",
          "uid",
          "targetTypes",
          "hasSuccess",
        ],
        xiecheng: [
          "activityId",
          "port",
          "showOrders",
          "remark",
          "uid",
          "targetTypes",
          "hasSuccess",
        ],
        maoyan: [
          "activityId",
          "port",
          "showOrders",
          "remark",
          "uid",
          "targetTypes",
          "hasSuccess",
        ],
      };
      return map[this.platform];
    },
  },

  methods: {
    async openEditDialog(item) {
      this.editForm = { targetTypes: [], ...item };
      this.isEdit = true;
      this.$refs.popup.open("bottom");
      this.readDataFromClip();
    },
    async snapOrCancel(item) {
      let { username: nickname, hasSuccess, isUseSlave } = item;
      if (hasSuccess) {
        let time = await this.$refs.setTime.paste();
        this.checkShouldCancel(time);
        this.$refs.setTime.mode = "取消订单";
        let cancelTime = await this.$refs.setTime.setTimeForParent();
        this.loading = true;
        item.cancelTime = cancelTime;
        await request({
          method: "post",
          url: this.host + "/closeAndCancelOrder/",
          data: {
            cancelTime,
            nickname,
            isUseSlave,
          },
        });
        this.loading = false;
      } else {
        this.setTimeStr =
          item.snappedTime && new Date(item.snappedTime) > new Date()
            ? item.cancelTime
            : "";
        this.$refs.setTime.mode = "接盘";
        let snappedTime = await this.$refs.setTime.setTimeForParent();
        this.loading = true;
        item.snappedTime = snappedTime;
        item.isLoop = true;
        await request({
          method: "post",
          url: this.host + "/closeAndSetSnappedTime/",
          data: {
            snappedTime,
            nickname,
            isUseSlave,
          },
        });
        this.loading = false;
      }
    },
    toggleRunning() {
      this.onlyShowRunning = !this.onlyShowRunning;
    },
    jieyong() {
      if (!this.editForm.remark.includes("借用")) {
        this.editForm.remark += "借用";
      }
      this.editForm.isRefresh = this.editForm.activityId !== "827391921261";
      this.editForm.activityId = "827391921261";
      this.editForm.port = "6547";
      this.editForm.remark = this.editForm.remark.replace(
        /代(魔|胜|姐|椰|坤)_(自|客)_/,
        ""
      );
      this.editForm.hasSuccess = false;
    },
    getTypesColor(all, i) {
      if (i === 0) {
        this.indexToColor[i] = randomColor();
      } else {
        let preDate = all[i - 1].split("_")[0];
        let curDate = all[i].split("_")[0];
        if (preDate === curDate) {
          this.indexToColor[i] = this.indexToColor[i - 1];
        } else {
          this.indexToColor[i] = randomColor();
        }
      }
      return this.indexToColor[i];
    },

    afterStartCheck(port) {
      let target = this.groupData.find((one) => one.port === port);
      target.isCheckRunning = true;
      this.getConfig();
    },
    afterStopCheck(port) {
      let target = this.groupData.find((one) => one.port === port);
      target.isCheckRunning = false;
    },
    getColor(num) {
      let map = {
        1: "green",
        2: "blue",
        3: "orange",
        4: "red",
      };
      return map[num] || "red";
    },
    getShowActivityName(name) {
      let str = (name || "").replace(
        /（Galaxy Express）|(\s+)|」|「|(巡回)|(A-LINK with PASSENGERS)|(演唱会)|(Ugly)|(Beauty)|(FINALE)|(世界)|(Infinity Arena)|(WORLDTOUR)|MACAU|巡演|YELLOW/g,
        ""
      );
      // console.log(name, str);

      let result = [];
      let length = 0;
      for (let one of str) {
        if (length >= 20) break;
        if (one.match(/[a-zA-Z]/)) {
          length += 0.5;
        } else {
          length += 1;
        }
        result.push(one);
      }
      return result.join("");
    },
    changeMyUser(e) {
      let { phone, password } = this.userMap[e.detail.value];
      this.form.phone = phone;
      if (this.isDamai) {
        this.form.password = password;
      } else if (this.isXingqiu) {
        this.form.showOrders = String(this.selectedAddMineAudienceLength);
      }
      this.form.username = "me" + Math.ceil(Math.random() * 10000);
      this.getPhoneRunningLength(phone, this.form.activityId);
    },
    getPhoneRunningLength(phone, activityId) {
      let data = this.dataWithoutFilter.filter(
        (one) =>
          String(one.activityId) === String(activityId) &&
          Number(one.phone) === Number(phone) &&
          one.orders.length
      );
      if (data.length) {
        let arr = data.map((one) => one.orders.length);
        let length = arr.reduce((a, b) => a + b, 0);
        uni.showToast({
          icon: "none",
          title: `记录【${data.length}】_观演人【${length}】`,
          duration: 2000,
        });
      }
    },

    async checkIsCanBuy() {
      this.isTesting = true;
      let res = await request({
        url: this.host + "/checkIsCanBuy?activityId=" + this.form.activityId,
      });
      uni.showToast({
        icon: "none",
        title: res || "不支持",
        duration: 2000,
      });
      this.testBtnText = res || "不支持";
      this.isTesting = false;
    },
    async recover() {
      this.loading = true;
      let failCmds = await request({
        timeout: 2 * 60000,
        url: this.host + "/recover",
      });
      this.failCmds = failCmds || [];
      this.getConfig(true);
      this.loading = false;
    },
    async recoverSlave() {
      this.loading = true;
      await request({
        timeout: 2 * 60000,
        url: this.slaveHost + "/recover",
      });
      this.getConfig(true);
      this.loading = false;
    },
    activityRightOptions(one) {
      let arr = [
        {
          text: "刷新",
          style: {
            backgroundColor: "rgb(0, 122, 255)",
          },
        },
        {
          text: "置顶",
          style: {
            backgroundColor: "rgb(0,200,0)",
          },
        },
        {
          text: "查",
          style: {
            backgroundColor: "#007aff",
          },
        },
        {
          text: "删除",
          style: {
            backgroundColor: "black",
          },
        },
      ];
      if (!one.isExpired) {
        arr.pop();
      }
      return arr;
    },
    addActivity() {
      this.isEdit = false;
      this.copyActivityId = "";
      this.form = {
        activityId: "",
        port: "",
        targetTypes: [],
        showOrders: "0,",
        phone: "15521373109",
        // password:"hik12345",
        nameIndex: 0,
        username: "me" + Math.ceil(Math.random() * 1000),
      };

      this.form.skuIdToTypeMap = {};
      if (this.platform === "damai") {
        this.form.password = "hik12345";
      }
      this.$refs.popup.open("bottom");
      setTimeout(() => {
        this.$refs.searchInput && this.$refs.searchInput.showDialog();
      }, 200);
    },
    getTitleStyle(one) {
      return {
        background: one.isExpired
          ? "red"
          : one.isCheckRunning
          ? "rgb(59 168 59)"
          : "rgb(94, 128, 177)",
      };
    },
    setXingqiuMsg() {
      this.msgToUser =
        "麻烦你直接在这里填写，填完就登录好了，闲鱼不给发链接，谢谢！ 票星球填写这个http://mticket.ddns.net:7777/#/xingqiu";
    },
    setDamaiMsg() {
      this.msgToUser =
        "麻烦你直接在这里填写，填完就登录好了，闲鱼不给发链接，谢谢！ 大麦填写这个http://mticket.ddns.net:7777";
    },
    setTestMsg() {
      this.msgToUser = "测试";
    },
    getValidPort() {
      let allPorts = this.groupData
        .map((one) => Number(one.data[0].port))
        .sort((a, b) => a - b);
      console.log(allPorts);
      return Number(allPorts.pop()) + 1;
    },
    activityChange(id) {
      this.testBtnText = "测试";
      this.editForm.activityId = id;
      this.form.activityId = id;

      let existActivity = this.dataWithoutFilter.find(
        (one) => String(one.activityId) === String(id)
      );

      let port = existActivity.port || this.getValidPort();
      this.editForm.port = port;
      this.form.port = port;

      this.editForm.isRefresh = true;
    },
    async sendMsgToUser() {
      let host = `http://${this.selected}:4000`;
      await request({
        method: "post",
        url: host + "/sendMsgToUser/",
        data: {
          uid: this.curUid,
          msg: this.msgToUser,
        },
      });
      this.msgDialogShow = false;
    },
    openMsg(uid) {
      this.curUid = uid;
      this.msgToUser =
        "你好, 目前需要验证码登录哦, 麻烦收到后退出账号再把验证码发给闲鱼卖家, 谢谢";
      this.msgDialogShow = true;
    },

    checkShouldCancel(time) {
      let target = this.dataWithoutFilter.find(
        (one) => one.snappedTime && one.snappedTime.includes(time)
      );
      this.isCanCancel =
        target && new Date(time).getTime() - Date.now() > 15000;
    },

    toggleForm() {
      this.isShowAll = !this.isShowAll;
    },
    async startOne(user, isShow) {
      let item = this.dataWithoutFilter.find((one) => one.username === user);
      item.isShow = isShow;
      try {
        await this.start(item);
        this.$refs.calc.refreshDialog();
        this.getConfig();
      } catch (e) {
        console.log(e);
      }
    },
    async stopOne(user) {
      let item = this.dataWithoutFilter.find((one) => one.username === user);
      await this.stop(item);
      this.$refs.calc.refreshDialog();
      uni.$emit("stop" + user + "done");
    },
    async autoStartUsers(users) {
      this.isShowCalc = false;
      let total = users.length;
      let done = 0;
      for (let user of users) {
        let item = this.dataWithoutFilter.find((one) => one.username === user);

        try {
          await this.start(item, true);
        } catch (e) {
          console.log(e);
        }
        done++;
        this.percent = Math.ceil((done / total) * 100);
      }
      await this.getConfig();
    },
    showCalc(id, activityName, port) {
      this.calcActivityId = id;
      this.calcActivityName = activityName;
      this.calcPort = port;
      this.isShowCalc = true;
    },
    handleBlur(id) {
      let map = {
        password: this.handlePass,
        phone: this.handlePhone,
      };
      if (map[id]) {
        map[id]();
      }
    },
    changePopup(e) {
      this.show = e.show;
      if (!this.show) {
        this.isShowAll = true;
        this.searchActivityName = "";
      }
    },
    bindPickerChange(e) {
      this.selectedActivityIndex = e.detail.value;
    },

    reset() {
      this.queryItems.forEach((one) => {
        one.value = "";
      });
      this.selectedActivityIndex = -1;
    },
    handlePhone() {
      if (this.form.phone) {
        let [, ...left] = this.form.phone.split(/\s+/);
        let res = this.form.phone.match(/\d{11}/);
        if (res) {
          this.form.phone = res[0];
        }
        if (left.length) {
          this.form.password = left.join("");
          this.handlePass();
        }
      }
    },
    handlePass() {
      if (this.form.password) {
        let res = this.form.password.split(/\s+/);
        res = res.slice(-1)[0];
        res = res.replace(
          /(密码是)|(密码:)|(密码是:)|(密码：)|(密码是：)|(密码)/g,
          ""
        );
        this.form.password = res;
      }
    },
    changeTarget(form, e) {
      form.targetTypes = e.detail.value;
    },
    handleSwitchChange(e) {
      this.editForm.hasSuccess = e.detail.value;
    },
    handleRefreshChange(e) {
      this.editForm.isRefresh = e.detail.value;
    },

    changeEditForm(val, id) {
      if (id === "activityId") {
        this.editForm.isRefresh = true;
      }
    },
    checkForm(form, arr) {
      for (let one of arr) {
        if (form[one] === "" || form[one] === undefined) {
          uni.showToast({
            title: one + "不能为空",
            icon: "error",
            duration: 3500,
          });
          return false;
        }
      }
      return true;
    },
    async confirmEdit() {
      let keys = this.editFields;
      let form = keys.reduce((prev, cur) => {
        prev[cur] = this.editForm[cur];
        return prev;
      }, {});
      let data = {
        username: this.editForm.username,
        config: form,
        isRefresh: this.editForm.isRefresh,
      };

      let arr = ["activityId", "port"];

      if (this.checkForm(form, arr)) {
        this.loading = true;
        await request({
          method: "post",
          url: this.host + "/editConfig/",
          data,
        });
        this.$refs.popup.close();
        await this.getConfig();
        if (this.isShowCalc) {
          this.$refs.calc.refreshDialog();
        }
        this.loading = false;
      }
    },

    async activityClick({ index }, groupName, activityId) {
      if (index === 0) {
        this.getConfig(true);
      } else if (index === 1) {
        this.fixedTopActivity = groupName;
        uni.setStorageSync(
          this.platform + "FixedTopActivity",
          this.fixedTopActivity
        );
        this.filterData();
      } else if (index === 2) {
        this.queryItems.find((one) => one.column === "activityName").value =
          groupName.slice(0, 6);
      } else if (index === 3) {
        console.log("删除全部1");
        this.loading = true;
        await request({
          method: "post",
          url: this.host + "/removeOneActivity/",
          data: {
            activityId,
          },
        });
        await this.getConfig();
        this.loading = false;
      }
    },

    handleRemoveOneInPage(item, group) {
      delete this.config[item.username];
      let i = group.data.indexOf(item);
      if (i !== -1) {
        group.data.splice(i, 1);
        if (group.data.length === 0) {
          this.groupData.splice(this.groupData.indexOf(group), 1);
        }
      }

      i = this.dataWithoutFilter.indexOf(item);
      if (i !== -1) {
        this.dataWithoutFilter.splice(i, 1);
      }

      i = this.data.indexOf(item);
      if (i !== -1) {
        this.data.splice(i, 1);
      }
    },
    async swipeClick({ index }, item, group) {
      let { username } = item;
      if (index === 0) {
        this.loading = true;
        await request({
          method: "post",
          url: this.host + "/removeConfig/",
          data: { username },
        });
        this.handleRemoveOneInPage(item, group);
        this.loading = false;
      } else {
        this.loading = true;
        await request({
          method: "post",
          url: this.host + "/toCheck/",
          data: { username },
        });
        await this.getConfig();
        this.loading = false;
      }
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
    async add() {
      let isTwo = false;
      try {
        await this.confirmAction(`是否连坐？`);
        isTwo = true;
      } catch (e) {
        isTwo = false;
      }
      if (isTwo) {
        this.form.showOrders = this.selectedAddMineAudienceLength
          ? [
              this.selectedAddMineAudienceLength - 1,
              this.selectedAddMineAudienceLength,
            ].join(",")
          : "0,1";
      }
      let data = {
        ...this.form,
        isCopy: this.copyActivityId === this.form.activityId,
        showOrders: this.form.showOrders.replace(/,$/, ""),
      };
      // todo
      data.targetTypes = data.targetTypes.map((name) => {
        let ids = Object.keys(data.skuIdToTypeMap);
        return ids.find((id) => data.skuIdToTypeMap[id] === name);
      });

      let arr = this.isDamai
        ? ["phone", "username", "password", "activityId", "port"]
        : ["phone", "username", "activityId", "port"];

      if (this.checkForm(data, arr)) {
        this.loading = true;

        if (data.uid) {
          data.uid = data.uid.replace("尊敬的用户，你的UID是：", "");
        }
        delete data.skuIdToTypeMap;
        let { username } = await request({
          method: "post",
          url: this.host + "/addInfo/",
          data,
          timeout: 120000,
        });
        this.$refs.popup.close();
        this.reset();
        await this.getConfig(true);
        this.loading = false;
        let target = this.dataWithoutFilter.find(
          (one) => one.username === username
        );
        this.start(target);
      }
    },
    async recoverScroll(scrollTop) {
      await this.$nextTick();
      uni.pageScrollTo({
        duration: 0,
        scrollTop: scrollTop,
        direction: 0,
      });
    },
    async getSuccessInfo(activityName) {
      this.successInfo = {};
      let records = await request({
        method: "post",
        url: this.host + "/searchSeat/",
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
    async openCopyDialog({
      activityId,
      port,
      typeMap,
      skuIdToTypeMap,
      activityName,
    }) {
      if (this.isDamai) {
        await this.getSuccessInfo(activityName);
      }

      this.isEdit = false;
      this.copyActivityId = activityId;
      this.form = {
        activityId,
        port,
        targetTypes: [],
        showOrders: "0,",
        nameIndex: 0,
      };

      this.form.skuIdToTypeMap = skuIdToTypeMap;

      this.$refs.popup.open("bottom");
      this.readDataFromClip();
    },
    readDataFromClip() {
      uni.getClipboardData({
        success: (clip) => {
          let clipData = clip.data
            .replace(
              /(大麦账号(:)?)|(账号:)|(手机:)|(账号：)|(手机：)|(手机号码)|(手机号)|(账号)|(手机)|/g,
              ""
            )
            .trim();
          clipData = clipData.replace(/密码(:)?(\s)*/g, " 密码").trim();

          let handled = false;

          let regMap = {
            damai: /itemId=(\d{12})/,
            xingqiu: /activityId=(\d{6})/,
            xiudong: /detail\/(\d{6})/,
          };
          let reg = regMap[this.platform];
          let activityRes = reg && clipData.match(reg);
          if (this.isEdit) {
            if (!this.editForm.uid && clipData.includes("UID")) {
              this.editForm.uid = clipData;
              handled = true;
            }

            if (activityRes) {
              this.editForm.activityId = activityRes[1];
              this.editForm.port = "";
              this.editForm.isRefresh = true;
              setTimeout(() => {
                uni.showToast({
                  title: "activity改变",
                  icon: "none",
                  duration: 3500,
                });
              }, 50);
              handled = true;
            }
          } else {
            if (!clipData.length) return;
            let [first] = clipData.split(/\s+/);
            let res = first.match(
              /1(3\d|4[5-9]|5[0-35-9]|6[567]|7[0-8]|8\d|9[0-35-9])\d{8}/
            );
            if (activityRes) {
              this.form.activityId = activityRes[1];
              this.form.port = "";
              this.form.typeMap = {};
              this.form.skuIdToTypeMap = {};
              setTimeout(() => {
                uni.showToast({
                  title: "activity改变",
                  icon: "none",
                  duration: 3500,
                });
              }, 50);
              handled = true;
            } else if (res) {
              this.form.phone = clipData;
              this.handlePhone();
              handled = true;
            } else if (clipData.includes("UID")) {
              handled = true;
              this.form.uid = clipData.trim();
            } else if (this.isDamai) {
              this.form.password = first;
              this.handlePass();
              handled = true;
            }
          }
          if (handled) {
            uni.setClipboardData({
              data: "",
            });
            uni.hideToast();
          }
        },
      });
    },

    async start(item, isNoRefresh) {
      this.loading = true;
      let cmd =
        item.cmd + (item.isShow ? (this.isDamai ? ` 1 loop` : " show") : "");
      item.runningCmd = cmd;

      try {
        await request({
          method: "post",
          timeout: 40000,
          url: this.host + "/startUserFromRemote/",
          data: {
            isUseSlave: item.isUseSlave,
            cmd,
            isStopWhenLogin: isNoRefresh,
          },
        });
      } catch (e) {
        console.log(e);
      }
      if (!isNoRefresh) {
        await this.getConfig();
      }
      this.loading = false;
    },
    async stop(item) {
      this.loading = true;
      this.stoppingUsers.add(item.username);
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
      this.loading = false;
      this.stoppingUsers.delete(item.username);
    },
    filterData() {
      let items = this.queryItems.filter((item) => item.value);
      let filteredData = this.dataWithoutFilter.filter((one) => {
        return items.every(({ value, column }) => {
          if (column !== "username") {
            return (
              String(one[column])
                .toLowerCase()
                .indexOf(String(value).toLowerCase()) !== -1
            );
          } else {
            let usernameMatch =
              String(one["username"])
                .toLowerCase()
                .indexOf(String(value).toLowerCase()) !== -1;
            let targetAudience = one.orders
              .map((index) => one.audienceList && one.audienceList[index])
              .filter(Boolean);
            let audienceMatch = targetAudience.some((audience) =>
              audience.includes(value)
            );
            return usernameMatch || audienceMatch;
          }
        });
      });
      if (this.isHideBorrow) {
        filteredData = filteredData.filter(
          (one) => one.remark && !one.remark.includes("借")
        );
      }
      if (this.isHideSlave) {
        filteredData = filteredData.filter((one) => !one.isUseSlave);
      }
      if (this.onlyShowRunning) {
        filteredData = filteredData.filter((one) => one.runningCmd);
      }
      let isHasFilter = filteredData.length !== this.dataWithoutFilter.length;
      console.log(filteredData.length);
      this.getGroup(filteredData, isHasFilter);
    },
    checkIsExpired(one) {
      if (["damai", "xingqiu", "maoyan", "xiecheng"].includes(this.platform)) {
        let dates = [
          ...new Set(
            Object.values(one.skuIdToTypeMap || {}).map((one) => {
              let date = one.split("_")[0];
              let arr = date.split(/(\s+)/);
              return arr[0] + " " + arr.slice(-1)[0];
            })
          ),
        ];

        let isExpired = dates.every((date) => new Date(date) < new Date());
        return isExpired;
      }
      console.log(one);
      return false;
      // let types = one.skuIdToTypeMap
    },
    getGroup(data, isHasFilter) {
      this.data = data;
      let res = [];
      if (!data.length) {
        this.getGroupData = [];
      }
      let cur = null;
      data.forEach((one, index) => {
        if (!cur || cur.group !== one.activityName) {
          cur = {
            isCheckRunning: this.runningCheckPorts.includes(Number(one.port)),
            port: Number(one.port),
            group: one.activityName,
            isShow: isHasFilter,
            data: [one],
            isExpired: this.checkIsExpired(one),
          };
          if (cur.isCheckRunning && cur.isExpired) {
            request({ url: this.checkHost + "/stopCheck/" + one.port });
          }
          res.push(cur);
        } else if (cur.group === one.activityName) {
          cur.data.push(one);
        }
      });

      res.sort(
        (a, b) =>
          (a.group ? a.group[1] : "").charCodeAt() -
          (b.group ? b.group[1] : "").charCodeAt()
      );

      if (this.fixedTopActivity) {
        let i = res.findIndex((one) => one.group === this.fixedTopActivity);
        let target = res.splice(i, 1);
        this.groupData = [...target, ...res];
      } else {
        this.groupData = res;
      }

      console.log("组合数据", this.groupData);
      this.groupData.length && (this.groupData[0].isShow = true);

      // console.log(res);
    },
    async getConfig(isFirst) {
      let scrollTop = this.scrollTop;
      this.loading = true;
      try {
        // this.groupData = [];
        // this.data = [];
        let p1 = request({
          url: this.host + "/getAllUserConfig",
          cancelPre: true,
        });

        let p2 = request({
          url:
            (this.isDamai ? this.host.replace("5000", "5001") : this.host) +
            "/getAllActivityInfo",
          cancelPre: true,
        });
        let p3 = request({
          url:
            (this.isDamai ? this.host.replace("5000", "5001") : this.host) +
            "/getAllAudienceInfo",
          cancelPre: true,
        });

        let p4 = request({
          url: this.checkHost + "/getRunningCheckPorts",
          cancelPre: true,
        });

        let p5 = this.isDamai
          ? request({
              timeout: 1000,
              url: this.slaveHost + "/getAllUserConfig",
            })
              .then((e) => true)
              .catch((e) => false)
          : Promise.resolve(false);

        this.runningCheckPorts = [];
        let [
          { config, pidToCmd },
          activityInfo,
          audienceInfo,
          runningCheckPorts = [],
          isSlaveOnline,
        ] = await Promise.all([p1, p2, p3, p4, p5]);

        this.runningCheckPorts = runningCheckPorts;
        Object.values(config).forEach((obj) => {
          let info = activityInfo[obj.activityId];
          obj.activityName = info?.activityName;
          obj.audienceList = audienceInfo ? audienceInfo[obj.phone] : [];
          obj.skuIdToTypeMap = info ? info.skuIdToTypeMap : {};
        });

        this.config = config;

        this.pidToCmd = pidToCmd;
        this.isShowRecover = Object.keys(this.pidToCmd).length === 0;

        let cmds = Object.values(this.pidToCmd);

        let cmdToPid = {};
        Object.entries(this.pidToCmd).forEach(([key, value]) => {
          cmdToPid[value.split(/\s+/).slice(0, 4).join(" ")] = key;
        });
        let data = Object.entries(this.config).map(([username, one]) => ({
          username,
          ...one,
        }));

        data.sort((a, b) => Number(b.port) - Number(a.port));

        let notOkData = data
          .filter((one) => one.port === "null")
          .map((one) => one);
        if (notOkData.length) {
          uni.showToast({
            icon: "none",
            title:
              notOkData.map((one) => one.username).join(",") + "端口为null",
            duration: 2000,
          });
        }

        data.forEach((one) => {
          let cmd = `npm run start ${one.username}`;
          one.cmd = cmd;
          one.loading = false;
          one.hasSuccess = Boolean(one.hasSuccess);
          one.runningCmd = cmds.find(
            (cmd) => cmd.split(/\s+/)[3] === one.username
          );
          one.isLoop = one.runningCmd?.includes("loop");
          one.pid = cmdToPid[cmd];
          one.orders = one.orders.map((one) => Number(one));
          one.showOrders = one.orders.join(",");
        });
        this.dataWithoutFilter = data;

        let slaveData = isSlaveOnline && data.filter((one) => one.isUseSlave);
        this.isShowSlaveRecover =
          slaveData.length && slaveData.every((one) => !one.runningCmd);
        this.filterData();
      } catch (e) {
        console.log("出错", e);
        if (e.errMsg.includes("abort")) {
          setTimeout(() => {
            this.loading = true;
          }, 0);
        }
      }
      this.loading = false;
      // this.recoverScroll(scrollTop);
      // let options = Object.values(config).map(({ activityId, activityName }) => ({
      //     activityId,
      //     activityName,
      // }));
      // let uniqueIds = [...new Set(options.map((one) => one.activityId))];
      // options = uniqueIds.map((activityId) => ({
      //     activityId,
      //     activityName: options.find((one) => one.activityId === activityId)
      //         .activityName,
      // }));
      // console.log(options);
    },
    choose(item) {
      this.selected = item.hostname;
    },
  },
};
</script>

<style scoped lang="scss">
.remote {
  // position: relative;
  // height: 100vh;
  // overflow: auto;
}

.progress {
  position: fixed;
  top: 36vh;
  z-index: 56666665;
  left: 32%;
  right: 32%;
}

.fail-item {
  color: red;
}

.pcs {
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid rgb(225, 223, 223);
  border-radius: 12px;

  .pc {
    flex: 1;
    padding: 10px;
    text-align: center;
    cursor: pointer;

    &:not(:last-child) {
      border-right: 1px solid rgb(225, 223, 223);
    }

    &.selected {
      background: rgb(0, 122, 255);
      color: white;
    }
  }
}

.search {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 15px;
}

.activity {
  position: sticky;
  top: 0;
  z-index: 88;
  background: rgb(94, 128, 177);
  color: white;
  text-align: center;
  padding: 5px;
  .toggle-collapse {
    float: right;
    margin-right: 5px;
    width: 20px;
    height: 20px;
    transition: all 0.3s;
    &.rotate {
      transform: rotate(180deg);
    }
  }
}

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

input {
  border: 1px solid gainsboro;
  padding: 10px;
  border-radius: 10px;
}

.msg-dialog {
  .msg-template {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  > * {
    line-height: 2;
  }

  textarea {
    border-radius: 12px;
    margin: 5px;
    padding: 5px;
    width: 100%;
    height: 100px;
    border: 1px solid #ede8e8;
    margin-bottom: 15px;
  }

  .btn-wrap {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 10px;

    button {
      flex: 1;
    }
  }
}

.dialog {
  background-color: white;
  padding: 0 5px;
  padding-bottom: 10px;
  position: relative;
  &.is-web {
    padding-bottom: 50px;
  }

  .toggle {
    width: 20px;
    height: 20px;
    position: absolute;
    top: 5px;
    right: 5px;
    transition: 0.3s;
    z-index: 999;

    &.rotate {
      transform: rotate(180deg);
    }
  }

  .form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    > * {
      width: 100%;
      margin: 5px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .input-wrap {
      display: flex;
      // justify-content:center;
      align-items: center;

      span {
        margin-right: 5px;
        width: 80px;
        text-align: center;
      }
    }

    .switches {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      .jie {
        width: 25px;
        height: 25px;
        color: orange;
        padding-bottom: 10px;
      }
    }

    .is-success {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid rgb(221, 221, 222);
    }

    .checkbox-wrap {
      max-height: 90vh;
    }

    .checkbox-group {
      padding: 10px 0;
      gap: 10px;
      display: flex;
      justify-content: space-around;
      align-items: center;
      flex-wrap: wrap;
    }

    .add-form-item {
      display: flex;
      align-items: center;

      span {
        margin-right: 10px;
        text-align: right;
        width: 95px;
      }
    }
  }
}
</style>
