<template>
  <div class="input-search">
    <div class="placeholder text" v-if="!value" @click="showDialog">
      {{ placeholder }}
    </div>
    <div class="text" v-else @click="showDialog">{{ value }}</div>

    <my-dialog v-model:value="isShowDialog">
      <div class="content safe-bottom">
        <div class="top">
          <div class="left">
            <image class="pre" src="../../static/search.png" alt="" />
            <input :placeholder="placeholder" v-model.trim="showValue" />
            <div class="after-wrap" @click="clear">
              <image
                class="after"
                v-if="showValue"
                src="../../static/clear.png"
                alt=""
              />
            </div>
          </div>
          <div class="right" @click="cancel">取消</div>
        </div>

        <scroll-view class="real-content" scroll-y @scrolltolower="getMore">
          <div class="list" v-if="list.length">
            <div
              class="item"
              v-for="(item, index) in list"
              :key="index"
              @click="setValue(item)"
              v-html="item.showName"
            ></div>
          </div>

          <div v-else class="no-data">暂无数据</div>
        </scroll-view>
      </div>
    </my-dialog>
  </div>
  <!-- </div> -->
</template>

<script>
import { request } from "@/utils.js";
import MyDialog from "@/components/my-dialog/my-dialog.vue";
const debounce = (fn, time = 500) => {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.call(this, ...args);
    }, time);
  };
};
export default {
  data() {
    return {
      total: "",
      current: 1,
      showValue: "",
      list: [],
      isShowDialog: false,
    };
  },
  props: {
    platform: {
      type: String,
      default: "xingqiu",
    },
    placeholder: {
      type: String,
      default: "",
    },

    disabled: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      default: "",
    },
  },
  components: { MyDialog },
  created() {
    this.debounceSearch = debounce(() => this.search(true));
  },
  mounted() {},
  computed: {
    hasMore() {
      return this.total > this.list.length;
    },
    idField() {
      let map = {
        xingqiu: "showId",
        damai: "projectid",
        maoyan: "id",
        xiecheng: "id",
        activity: "activityId",
      };
      return map[this.platform];
    },
    showField() {
      let map = {
        maoyan: "name",
        xingqiu: "activityName",
        xiecheng: "activityName",
        damai: "nameNoHtml",
        activity: "activityName",
      };
      return map[this.platform];
    },
  },
  watch: {
    showValue() {
      this.total = 0;
      this.current = 1;
      this.debounceSearch();
    },
  },
  methods: {
    clear() {
      this.showValue = "";
    },
    showDialog() {
      if (this.disabled) return;
      this.showValue = "";
      this.list = [];
      this.total = 0;
      this.current = 1;
      this.isShowDialog = true;
    },
    highlightOne(str, keyword) {
      const newText = keyword.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const reg = new RegExp(newText, "g");
      return str.replace(reg, (res) => {
        return `<span style="color:#42A64E">${res}</span>`;
      });
    },
    setValue(item) {
      this.showValue = item[this.showField];
      this.$emit("update:value", this.showValue);
      // console.log(this.showValue);
      this.$emit("update:id", item[this.idField]);
      this.$emit("itemChange", item[this.idField], this.list);
      this.isShowDialog = false;
    },
    getMore() {
      if (this.hasMore) {
        this.current++;
        this.search();
      }
    },
    async search(isClear) {
      if (isClear) {
        this.list = [];
      }
      if (!this.showValue) return;
      let data = {
        current: this.current,
        size: 20,
        keyword: this.showValue,
      };
      let res;

      if (this.platform === "xingqiu") {
        let {
          data: { searchData },
        } = await request({
          noHandleCode: true,
          url:
            "https://m.piaoxingqiu.com/cyy_gatewayapi/home/pub/v3/show_list/search?src=WEB&channelId=&terminalSrc=WEB&offset=0&length=10&keyword=" +
            encodeURIComponent(this.showValue),
        });
        searchData.forEach((one) => {
          one.activityName = one.showName;
        });
        res = {
          records: searchData,
          total: searchData.length,
        };
      }
      if (this.platform === "maoyan") {
        let {
          data: { performanceVOList },
        } = await request({
          noHandleCode: true,
          url:
            "https://show.maoyan.com/maoyansh/myshow/ajax/search/0;st=0;p=1;s=20;tft=0?k=" +
            encodeURIComponent(this.showValue),
        });

        performanceVOList.forEach((one) => {
          one.activityName = one.name;
          one.id = one.shareLink.match(/detail\/(\d{6})/)[1];
        });

        res = {
          records: performanceVOList,
          total: performanceVOList.length,
        };
      } else if (this.platform === "xiecheng") {
        let { suggestInfoList } = await request({
          noHandleCode: true,
          method: "post",
          data: {
            pageIndex: 1,
            pageSize: 20,
            keyword: this.showValue,
            channelId: "1",
            extensionMap: {
              sdkVer: "1.0.0",
              deviceType: "PHONE",
              deviceOsv: "9",
              deviceOs: "ANDROID",
            },
            head: {
              cid: "09031046216373346295",
              ctok: "",
              cver: "1.0",
              lang: "01",
              sid: "8888",
              syscode: "09",
              auth: "",
              xsid: "",
              extension: [
                { name: "gs_page_code", value: "10650102722" },
                {
                  name: "gs_activitybiz_source",
                  value: "gs_activitybiz_search",
                },
              ],
            },
          },

          url: "https://m.ctrip.com/restapi/soa2/28485/json/suggestRemind",
        });
        let performanceVOList = suggestInfoList.filter(
          (one) => one.wordType === "poi"
        );
        performanceVOList.forEach((one) => {
          one.activityName = one.poiInfo.name;
          one.id = one.poiInfo.bizId;
        });
        res = {
          records: performanceVOList,
          total: performanceVOList.length,
        };
      } else if (this.platform === "damai") {
        let test = await request({
          url:
            "http://mticket.ddns.net:5001/searchActivity?keyword=" +
            encodeURIComponent(this.showValue),
        });
       
        // console.log(123, test);
        let {
          pageData: { resultData },
        } = test;
        res = {
          records: resultData,
          total: resultData.length,
        };
      } else if (this.platform === "activity") {
        let { data } = await request({
          noHandleCode: true,
          url: "http://mticket.ddns.net:5001/getAllActivityInfo",
        });
        let arr = Object.keys(data).map((id) => ({
          activityId: id,
          ...data[id],
        }));
        let records = arr.filter((one) =>
          one.activityName?.includes(this.showValue)
        );
        // console.log(records)
        res = {
          records,
          total: records.length,
        };
        // console.log(123, test);
        // let {
        //   pageData: { resultData },
        // } = test;
        // res = {
        //   records: resultData,
        //   total: resultData.length,
        // };
      }

      let { records: list, total } = res;
      this.total = total;

      list.forEach((one) => {
        one.showName = this.highlightOne(one[this.showField], this.showValue);
      });

      this.list = [...this.list, ...list];
    },
    toWeb() {},
    handleInput(val) {
      this.$emit("update:value", val);
    },
    cancel() {
      this.isShowDialog = false;
      this.showValue = "";
    },

    confirm() {
      this.handleInput(false);
    },
  },
};
</script>

<style scoped lang="scss">
.input-search {
  // width: 100%;
  // border: 1px solid #ccc;
  // border-radius: 4px;
  // padding: 0 5px;
  .placeholder {
    color: #999;
  }

  .text {
    font-size: 28rpx;
    line-height: 2;
  }

  .content {
    background: white;
    padding: 48rpx 30rpx;
  }

  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .left {
      flex: 1;
      display: flex;
      align-items: center;
      height: 64rpx;
      line-height: 64rpx;
      background-color: rgb(241, 245, 240);
      border-radius: 12rpx;
      padding: 0 20rpx;

      input {
        flex: 1;
      }

      .pre,
      .after {
        margin: 0 5rpx;
        flex-shrink: 0;
        height: 36rpx;
        width: 36rpx;
      }

      .after-wrap {
        z-index: 5;
        height: 45rpx;
        width: 60rpx;
        display: flex;
        justify-content: center;
        align-items: center;

        img {
          margin-right: -10rpx;
        }
      }
    }

    .right {
      margin-left: 30rpx;
      color: #42a64e;
      font-size: 28rpx;
    }
  }

  .real-content {
    padding: 20rpx 0;
    max-height: 70vh;
    min-height: 50vh;
    overflow: auto;
  }

  .list {
    .item {
      margin: 60rpx 0;
      font-size: 28rpx;
    }
  }

  .no-data {
    margin-top: 120px;
    text-align: center;
    color: #999;
  }
}
</style>
