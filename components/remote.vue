<template>
    <div class="remote" ref="remote">

        <page-meta :page-style="'overflow:' + (show ? 'hidden' : 'visible')"></page-meta>
        <div class="pcs">
            <div class="pc" v-for="(item, index) in pcs" :key="index" @click="choose(item)" :class="selected
                === item.hostname ? 'selected' : ''">{{ item.name }}</div>
        </div>
        <div class="search">
            <input v-for="(item, index) in queryItems.filter(one => one.column !== 'activityId')" :key="index" type="text"
                :placeholder="item.column" v-model="item.value" />
            <switch @change="changeUnique" />


            <picker v-show="activities.length" @change="bindPickerChange" :value="selectedActivityIndex"
                :range="activities">
                <image style="width: 16px;height:16px" src="/static/filter.svg" />
            </picker>
        </div>


        <uni-swipe-action>
            <template v-for="(one, index) in groupData" :key="one.group">
                <div class="activity" @click="showCalc(one.data[0].activityId)">{{ (one.group || '').slice(0,
                    24).replace(/(\s+)|」|「/g, '') }}({{ one.data.length }})
                </div>
                <uni-swipe-action-item v-for="(item) in one.data" :right-options="rightOptions"
                    :key="item.username + item.phone" @click="swipeClick($event, item)" :disabled="!!item.status">

                    <!-- <div class="activity" v-if="index===0|| (item.activityName!== data[index-1].activityName )">{{item.activityName}}</div> -->

                    <div class="item" :style="getStyle(item)" :key="item.username + item.phone"
                        :id="item.username + item.phone">
                        <div class="phone">
                            <div>{{ item.phone }}</div>
                            <div>{{ item.username }}</div>
                            <div v-if="isXiudong">{{ item.nameIndex }}</div>
                            <div v-if="isDamai">{{ item.showOrders }}</div>
                        </div>

                        <div class="targetTypes">
                            <div class="target-type" v-for="(item, index) in item.targetTypes" :key="index">{{ item }}</div>
                        </div>


                        <div class="remark">
                            {{ item.remark }}
                        </div>

                        <div class="btns">
                            <image class="copy" src="/static/edit.svg" @click="openEditDialog(item)" />
                            <button class="btn" size="mini" type="warn" v-if="item.status" @click="stop(item)">停止</button>
                            <button class="btn" size="mini" type="primary" v-else @click="start(item)">启动</button>
                            <image class="copy" src="/static/copy.svg" @click="openCopyDialog(item)" />
                        </div>
                    </div>
                </uni-swipe-action-item>
            </template>
        </uni-swipe-action>
    </div>
    <!-- <page-meta :page-style="'overflow:' + (show ? 'hidden' : 'visible')"></page-meta> -->


    <uni-popup ref="popup" type="bottom" @touchmove.stop @change="changePopup">
        <div class="dialog" @touchmove.stop>
            <div class="form" v-if="isEdit">
                <div v-for="(field, index) in inputFields" :key="index" class="input-wrap">
                    <span>{{ field }}</span>
                    <my-input type="text" v-model="editForm[field]" :placeholder="field"
                        @change="(val) => changeEditForm(val, field)" />

                </div>

                <div class="switches">
                    <div class="is-success">
                        <span>是否成功: </span>
                        <switch :checked="editForm.hasSuccess" @change="handleSwitchChange" />
                    </div>
                    <div class="is-success">
                        <span>重新获取: </span>
                        <switch :checked="editForm.isRefresh" @change="handleRefreshChange" />
                    </div>

                </div>

                <scroll-view class="checkbox-wrap" scroll-y>
                    <checkbox-group v-if="platform === 'xiudong' && editForm.typeMap" @change="changeTarget"
                        class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.keys(editForm.typeMap)" :key="index"
                            :checked="editForm.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>

                    <checkbox-group v-else @change="changeTarget" class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.values(editForm.skuIdToTypeMap)" :key="index"
                            :checked="editForm.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>
                </scroll-view>

                <button class="btn" type="primary" @click="confirmEdit">确定修改</button>
            </div>
            <div class="form" v-else>
                <div v-for="(item, index) in addItems" :key="index" class="add-form-item">
                    <span :style="{ color: item.isSpecial ? 'red' : 'black' }">{{ item.name }}:</span>
                    <my-input type="text" v-model="form[item.id]" :placeholder="item.id" @blur="handleBlur(item.id)" />
                </div>
                <button class="btn" type="primary" @click="add">新增</button>
            </div>
        </div>
    </uni-popup>
    <calc-activity v-model="isShowCalc" :host="host" :activityId="calcActivityId"></calc-activity>
</template>

<script>
import calcActivity from './calcActivity.vue'
let platformMap = {
    xiudong: '4000',
    damai: '5000'
}
import { request } from '@/utils.js'
export default {
    components: {
        calcActivity
    },
    props: {
        scrollTop: {
            type: Number,
            default: 0
        },
        platform: {
            type: String,
            default: 'xiudong',
        },
        pcHost: {
            type: String,
            default: ''
        }
    },

    data() {
        return {
            scrollTopId: '',
            old: {
                scrollTop: 0
            },
            calcActivityId: '',
            isShowCalc: false,
            show: false,
            windowHeight: 0,
            groupData: [],
            groupDataCopy: [],
            targetTypeIndexes: [],
            editForm: {},
            isEdit: false,
            selectedActivityIndex: -1,
            data: [],
            isUnique: false,
            loading: false,
            form: {},
            queryItems: [
                {
                    column: 'username',
                    value: ''
                },
                {
                    column: 'phone',
                    value: ''
                },
                {
                    column: "activityId",
                    value: ''
                }
            ],
            selected: this.pcHost,


        };
    },

    watch: {
        isUnique() {
            this.filterData()
        },
        selectedActivityId(val) {
            this.queryItems.find(one => one.column === 'activityId').value = val
            this.filterData()
        },
        selected: {
            immediate: true,
            handler() {
                this.getConfig()
            }
        },
        queryItems: {
            deep: true,
            handler() {
                this.filterData()
            }
        },
        loading(val) {
            if (val) {
                uni.showLoading({
                    title: '加载中'
                });
            } else {
                uni.hideLoading();
            }

        },
    },
    created() {

        let res = uni.getSystemInfoSync()
        console.log(res)
        this.windowHeight = res.windowHeight

    },
    mounted() {

    },
    computed: {

        pcs() {
            return [
                {
                    hostname: this.pcHost,
                    name: '华硕',
                },
                {
                    name: '惠普',
                    hostname: '100.115.170.87',
                },
                {
                    name: '3',
                    hostname: '100.95.67.33'
                },
                {
                    name: '4',
                    hostname: '100.116.129.127',
                },

            ]
        },
        isDamai() {
            return this.platform === 'damai'
        },
        isXiudong() {
            return this.platform === 'xiudong'
        },
        addItems() {
            let fields = this.isDamai ? ['activityId', 'port', 'showOrders', 'phone', 'password', 'username', 'uid', 'remark'] : ['activityId', 'port', 'nameIndex', 'phone', 'username', 'uid', 'remark']
            return fields.map(one => ({ name: one, id: one, isSpecial: one === 'showOrders' }))
        },
        selectedActivityId() {
            return this.selectedActivityIndex !== -1 ? this.activityInfo[this.selectedActivityIndex].activityId : ''
        },
        activityInfo() {
            return this.groupDataCopy.map(one => ({ activityId: one.data[0].activityId, activityName: one.group }))
        },
        activities() {
            return this.activityInfo.map(one => one.activityName)
        },
        rightOptions() {
            let options = [
                {
                    text: '删除',
                    style: {
                        backgroundColor: '#dd524d'
                    }
                }, {
                    text: 'toCheck',
                    style: {
                        backgroundColor: 'orange'
                    }
                }
            ]
            if (this.isDamai) {
                options.pop()
            }
            return options
        },
        host() {
            return `http://${this.selected}:${platformMap[this.platform]}`
        },
        inputFields() {
            return this.editFields.filter(one => !['targetTypes', 'hasSuccess'].includes(one))
        },
        editFields() {
            let map = {
                xiudong: ['activityId', 'port', 'nameIndex', 'remark', 'uid', 'targetTypes', "hasSuccess"],
                damai: ['activityId', 'port', 'password', 'showOrders', 'remark', 'uid', 'targetTypes', "hasSuccess"],
            }
            return map[this.platform]
        }
    },

    methods: {

        showCalc(id) {
            this.calcActivityId = id
            this.isShowCalc = true
        },
        handleBlur(id) {
            let map = {
                password: this.handlePass,
                phone: this.handlePhone
            }
            if (map[id]) {
                map[id]()
            }
        },
        changePopup(e) {
            this.show = e.show
        },
        bindPickerChange(e) {
            this.selectedActivityIndex = e.detail.value
        },

        reset() {
            this.queryItems.forEach(one => {
                one.value = ''
            })
            this.selectedActivityIndex = -1
        },
        handlePhone() {
            if (this.form.phone) {
                let [, ...left] = this.form.phone.split(/\s+/)
                let res = this.form.phone.match(/\d{11}/)
                if (res) {
                    this.form.phone = res[0]
                }
                if (left.length) {
                    this.form.password = left.join("")
                    this.handlePass()
                }
            }
        },
        handlePass() {
            if (this.form.password) {
                let res = this.form.password.split(/\s+/)
                res = res.slice(-1)[0]
                res = res.replace(/(密码是)|(密码:)|(密码是:)|(密码：)|(密码是：)|(密码)/g, '')
                this.form.password = res
            }
        },
        changeTarget(e) {
            this.editForm.targetTypes = e.detail.value
        },
        handleSwitchChange(e) {
            this.editForm.hasSuccess = e.detail.value
        },
        handleRefreshChange(e) {
            this.editForm.isRefresh = e.detail.value
        },

        changeEditForm(val, id) {
            if (id === 'activityId') {
                this.editForm.isRefresh = true
            }
        },
        checkForm(form, arr) {
            for (let one of arr) {
                if (form[one] === '' || form[one] === undefined) {
                    uni.showToast({
                        title: one + '不能为空',
                        icon: "error",
                        duration: 3500,
                    });
                    return false
                }
            }
            return true
        },
        async confirmEdit() {
            let keys = this.editFields
            let form = keys.reduce((prev, cur) => {
                prev[cur] = this.editForm[cur]
                return prev
            }, {})
            let data = {
                username: this.editForm.username,
                config: form,
                isRefresh: this.editForm.isRefresh
            }

            let arr = ['activityId', 'port',]

            if (this.checkForm(form, arr)) {
                this.loading = true
                await request({ method: 'post', url: this.host + "/editConfig/", data });
                this.$refs.popup.close()
                await this.getConfig()
                this.loading = false
                this.recoverScroll()
            }
        },


        async openEditDialog(item) {
            this.editForm = { ...item }
            this.isEdit = true
            this.$refs.popup.open('bottom')
            this.readDataFromClip()
        },
        async swipeClick({ index }, { username }) {
            if (index === 0) {
                this.loading = true
                await request({ method: 'post', url: this.host + "/removeConfig/", data: { username } });
                await this.getConfig()
                this.loading = false
            } else {
                this.loading = true
                await request({ method: 'post', url: this.host + "/toCheck/", data: { username } });
                await this.getConfig()
                this.loading = false
            }
            this.recoverScroll()
        },
        async add() {
            let data = { ...this.form, isCopy: this.copyActivityId === this.form.activityId, showOrders: this.form.showOrders.replace(/,$/, '') }

            let arr = this.isDamai ? ['phone', 'username', 'password', 'activityId', 'port'] : ['phone', 'username', 'activityId', 'port', 'nameIndex']
            if (this.checkForm(data, arr)) {
                this.loading = true

                if (data.uid) {
                    data.uid = data.uid.replace('尊敬的用户，你的UID是：', '')
                }
                await request({ method: 'post', url: this.host + "/addInfo/", data, timeout: 120000 });
                this.$refs.popup.close()
                this.isUnique = false
                await this.getConfig()
                this.loading = false
                this.recoverScroll()
                let target = this.data.find(one => one.username === data.username)
                this.start(target)


            }
        },
        async recoverScroll() {
            await this.$nextTick()
            uni.pageScrollTo({
                duration: 0,
                scrollTop: this.scrollTop,
                direction: 0
            })
        },
        openCopyDialog({ activityId, port }) {
            this.isEdit = false
            this.copyActivityId = activityId
            this.form = {
                activityId,
                port,
                showOrders: '0,',
                nameIndex: 0
            }
            this.$refs.popup.open('bottom')
            this.readDataFromClip()
        },
        readDataFromClip() {
            uni.getClipboardData({
                success: (clip) => {
                    let clipData = clip.data.replace(/(账号)|(手机)|(账号:)|(手机:)|(账号：)|(手机：)/g, '').trim()
                    clipData = clipData.replace(/密码/g, ' 密码').trim()

                    let handled = false

                    let reg = this.isDamai ? /itemId=(\d{12})/ : /activityId=(\d{6})/
                    let activityRes = clipData.match(reg)
                    if (this.isEdit) {
                        if (!this.editForm.uid && clipData.includes('UID')) {
                            this.editForm.uid = clipData
                            handled = true
                        }

                        if (activityRes) {
                            this.editForm.activityId = activityRes[1]
                            this.editForm.port = ''
                            this.editForm.isRefresh = true
                            setTimeout(() => {
                                uni.showToast({
                                    title: 'activity改变',
                                    icon: "none",
                                    duration: 3500,
                                });
                            }, 50);
                            handled = true
                        }
                    } else {
                        if (!clipData.length) return
                        let [first] = clipData.split(/\s+/)
                        let res = first.match(/1(3\d|4[5-9]|5[0-35-9]|6[567]|7[0-8]|8\d|9[0-35-9])\d{8}/)
                        if (activityRes) {
                            this.form.activityId = activityRes[1]
                            this.form.port = ''
                            setTimeout(() => {
                                uni.showToast({
                                    title: 'activity改变',
                                    icon: "none",
                                    duration: 3500,
                                });
                            }, 50);
                            handled = true
                        } else if (res) {
                            this.form.phone = clipData
                            this.handlePhone()
                            handled = true

                        } else if (clipData.includes('UID')) {
                            handled = true
                            this.form.uid = clipData.trim()
                        } else if (this.isDamai) {
                            this.form.password = first
                            this.handlePass()
                            handled = true
                        }


                    }
                    if (handled) {
                        uni.setClipboardData({
                            data: '',
                        });
                        uni.hideToast()
                    }
                }
            });
        },
        changeUnique(e) {
            this.isUnique = e.detail.value
        },
        getStyle(item) {
            let arr = [
                {
                    condition: item.hasSuccess,
                    background: '#aaffaa'
                },
                {
                    condition: item.remark?.includes('频繁'),
                    background: 'rgb(225, 223, 223)'
                },
                {
                    condition: !item.uid,
                    background: 'rgb(254, 214, 91)'
                },
                {
                    condition: item.remark?.includes('优先'),
                    background: '#21a1ab',
                    color: 'white'
                },

            ]
            let target = arr.find(one => one.condition)
            return {
                background: target ? target.background : 'white',
                color: target ? target.color || 'black' : 'black'
            }
        },

        async start(item) {
            this.loading = true
            try {
                await request({ method: 'post', url: this.host + "/startUserFromRemote/", data: { cmd: item.cmd } });
            } catch (e) {
                console.log(e)
            }

            await this.getConfig()
            this.recoverScroll()
            this.loading = false
        },
        async stop(item) {
            await request({ url: this.host + "/close/" + item.pid + '?isFromRemote=1' });
            await this.getConfig()
            this.recoverScroll()
        },
        filterData(isFirstGet) {
            let cmds = Object.values(this.pidToCmd);

            let cmdToPid = {};
            Object.entries(this.pidToCmd).forEach(([key, value]) => {
                cmdToPid[value.replace(' show', '')] = key;
            });
            let data = Object.entries(this.config).map(([username, one]) => ({
                username,
                ...one,
                config: one,
            }));

            let items = this.queryItems.filter(item => item.value);
            data = data.filter(one => {
                return items.every(({ value, column }) => String(one[column]).indexOf(value) !== -1);
            });
            data.sort((a, b) => Number(b.port) - Number(a.port));


            data.forEach(one => {
                let cmd = `npm run start ${one.username}`;
                one.cmd = cmd;
                one.loading = false;
                one.hasSuccess = Boolean(one.hasSuccess);
                one.status = cmds.some(cmd => cmd.replace(/\s+show/, '') === one.cmd) ? 1 : 0;
                one.pid = cmdToPid[cmd];
                if (this.isDamai) {
                    one.showOrders = one.orders.join(',')
                }
            });

            if (this.isUnique) {
                let activityIds = [...new Set(data.map(one => Number(one.activityId)))];
                data = activityIds.map(activityId =>
                    data.find(one => Number(one.activityId) === activityId),
                );
            } else {
                data = data;
            }
            this.getGroup(data, isFirstGet)
        },
        getGroup(data, isFirstGet) {
            this.data = data
            let res = []
            if (!data.length) {
                this.getGroupData = []
            }
            let cur = null
            data.forEach((one) => {
                if (!cur || cur.group !== one.activityName) {
                    cur = {
                        group: one.activityName,
                        data: [one]
                    }
                    res.push(cur)
                } else if (cur.group === one.activityName) {
                    cur.data.push(one)
                }
            })
            console.log(res)
            this.groupData = res
            if (isFirstGet) {
                this.groupDataCopy = JSON.parse(JSON.stringify(this.groupData))
            }
        },
        async getConfig() {
            this.loading = true
            try {
                this.groupData = []
                this.data = []
                let {
                    config, pidToCmd
                } = await request({ url: this.host + "/getAllUserConfig", cancelPre: true });
                this.config = config
                this.pidToCmd = pidToCmd
                this.filterData(true)
            } catch (e) {
                console.log('出错', e)
                if (e.errMsg.includes('abort')) {
                    setTimeout(() => {
                        this.loading = true
                    }, 0);
                }
            }
            this.loading = false
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
            this.selected = item.hostname
        }
    }
};
</script>

<style scoped lang="scss">
.remote {
    // height: 100vh;
    // overflow: auto;
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
}

.item {
    padding: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    border-bottom: 1px solid rgb(223, 223, 223);

    >:not(:first-child) {
        margin-left: 10px;
        flex-shrink: 0;
        word-break: break-all;

    }

    .phone {
        width: 110px;
        text-align: center;

        >* {
            line-height: 2;
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
            text-align: center;
            line-height: 2;
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

.dialog {
    background-color: white;
    padding: 10px 20px;

    .form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        >* {
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
        }

        .is-success {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 1px solid rgb(221, 221, 222);
        }

        .checkbox-wrap {
            max-height: 25vh;
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
