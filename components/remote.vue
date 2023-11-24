<template>
    <div class="remote" ref="remote">
        <progress :percent="percent" show-info stroke-width="3" class="progress" v-if="![0, 100].includes(percent)" />

        <page-meta :page-style="'overflow:' + (show || isShowCalc ? 'hidden' : 'visible')"></page-meta>

        <div class="fail">
            <div class="fail-item" v-for="(item, index) in failCmds" :key="index">{{ item }}</div>
        </div>

        <!-- {{ clientid }} -->
        <!-- <div class="pcs">
            <div class="pc" v-for="(item, index) in pcs" :key="index" @click="choose(item)" :class="selected
                === item.hostname ? 'selected' : ''">{{ item.name }}</div>
        </div> -->
        <div class="search">
            <input v-for="(item, index) in queryItems.filter(one => one.column !== 'activityId')" :key="index" type="text"
                :placeholder="item.column" v-model="item.value" />
            <!-- <switch @change="changeUnique" /> -->
            <image style="width: 20px; height: 20px; flex-shrink: 0;" src="/static/recover.svg" @click="recover"
                v-if="isShowRecover" />

            <image style="width: 20px; height: 20px; flex-shrink: 0;" src="/static/add2.svg" @click="addActivity" />


            <picker v-show="activities.length" @change="bindPickerChange" :value="selectedActivityIndex"
                :range="activities">
                <image style="width: 16px;height:16px" src="/static/filter.svg" v-if="selectedActivityIndex === -1" />
                <image v-else style="width: 16px;height:16px" src="/static/filterSelected.svg" />

            </picker>
        </div>


        <uni-swipe-action>
            <template v-for="(one, index) in groupData" :key="one.group">
                <div class="activity" :style="getTitleStyle(one)">
                    <uni-swipe-action-item :right-options="activityRightOptions(one)"
                        @click="activityClick($event, one.group)">
                        <div @click="showCalc(one.data[0].activityId)">
                            <span>{{ (one.group || '').slice(0,
                                20).replace(/(\s+)|」|「/g, '') }}({{ one.data.length }})</span>
                        </div>
                    </uni-swipe-action-item>
                </div>
                <uni-swipe-action-item v-for="(item) in one.data" :right-options="rightOptions"
                    :key="item.username + item.phone" @click="swipeClick($event, item)" :disabled="!!item.status">

                    <!-- <div class="activity" v-if="index===0|| (item.activityName!== data[index-1].activityName )">{{item.activityName}}</div> -->

                    <div class="item" :style="getStyle(item)" :key="item.username + item.phone"
                        :id="item.username + item.phone">
                        <div class="first">
                            <div v-if="item.uid">
                                <image class="msg-icon" src="/static/msg.svg" @click="openMsg(item.uid)" />
                            </div>

                            <div @click="callOrCopyPhone(item.phone)">{{ item.phone }}</div>
                            <div class="name" @click="copyUsername(item.username)">
                                {{ item.username }}
                            </div>

                            <div class="order">
                                <checkbox-group @change="item.isShow = !item.isShow">
                                    <checkbox :checked="item.isShow">
                                        <div v-if="isXiudong">{{ item.nameIndex }}</div>
                                        <div v-else>{{ item.showOrders }}</div>
                                    </checkbox>
                                </checkbox-group>
                            </div>
                        </div>

                        <div class="targetTypes">
                            <div class="target-type" v-for="(targetType, index) in item.targetTypes" :key="index"
                                :style="{ background: getTagColor(targetType) }">{{ targetType }}</div>
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
            <image mode="widthFix" src="../static/open.svg" @click="toggleForm"
                :class="isShowAll ? 'toggle' : 'toggle rotate'">
            </image>
            <div class="form" v-if="isEdit">
                <template class="basic-form" v-if="isShowAll">
                    <search-input v-if="!isXiudong" placeholder="查询演出" :platform="platform"
                        v-model:value="searchActivityName" @itemChange="activityChange"></search-input>

                    <div v-for="(field, index) in inputFields" :key="index" class="input-wrap">
                        <span>{{ field }}</span>
                        <my-input type="text" v-model="editForm[field]" :placeholder="field"
                            @change="(val) => changeEditForm(val, field)" />

                    </div>

                    <div class="switches">
                        <div class="is-success">
                            <span>是否成功：</span>
                            <switch :checked="editForm.hasSuccess" @change="handleSwitchChange" />
                        </div>
                        <div class="is-success">
                            <span>重新获取：</span>
                            <switch :checked="editForm.isRefresh" @change="handleRefreshChange" />
                        </div>
                    </div>
                </template>


                <scroll-view class="checkbox-wrap" scroll-y :style="scrollStyle">
                    <checkbox-group v-if="platform === 'xiudong' && editForm.typeMap"
                        @change="(e) => changeTarget(editForm, e)" class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.keys(editForm.typeMap)" :key="index"
                            :checked="editForm.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>

                    <checkbox-group v-else @change="(e) => changeTarget(editForm, e)" class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.values(editForm.skuIdToTypeMap)" :key="index"
                            :checked="editForm.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>
                </scroll-view>

                <button class="btn" type="primary" @click="confirmEdit">确定修改</button>
            </div>
            <div class="form" v-else>
                <template class="basic-form" v-if="isShowAll">
                    <search-input ref="searchInput" placeholder="查询演出" :platform="platform" v-if="!isXiudong"
                        v-model:value="searchActivityName" @itemChange="activityChange"></search-input>
                    <div v-for="(item, index) in addItems" :key="index" class="add-form-item">
                        <span :style="{ color: item.isSpecial ? 'red' : 'black' }">{{ item.name }}:</span>
                        <my-input type="text" v-model="form[item.id]" :placeholder="item.id" @blur="handleBlur(item.id)" />
                    </div>
                </template>


                <scroll-view class="checkbox-wrap" scroll-y :style="scrollStyle">
                    <checkbox-group v-if="platform === 'xiudong' && form.typeMap" @change="(e) => changeTarget(form, e)"
                        class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.keys(form.typeMap)" :key="index"
                            :checked="form.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>

                    <checkbox-group v-else @change="(e) => changeTarget(form, e)" class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.values(form.skuIdToTypeMap)" :key="index"
                            :checked="form.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>
                </scroll-view>

                <div style="display: flex;">
                    <button class="btn" @click="checkIsCanBuy">测试</button>
                    <button class="btn" type="primary" @click="add">新增</button>
                </div>

            </div>
        </div>
    </uni-popup>

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
                <button size="medium" class="btn" type="primary" @click="sendMsgToUser">发送</button>
            </div>
        </div>
    </my-dialog>
    <calc-activity ref="calc" v-model="isShowCalc" :host="host" :activityId="calcActivityId" :userConfig="data"
        @startOne="startOne" @stopOne="stopOne" @autoStartUsers="autoStartUsers"></calc-activity>
</template>

<script>
import calcActivity from './calcActivity.vue'
import SearchInput from './search-input/search-input.vue'
import MyDialog from './my-dialog/my-dialog.vue'

let platformToPortMap = {
    xiudong: '4000',
    damai: '5000',
    xingqiu: "6100",
}
import { request, getTagColor } from '@/utils.js'
export default {
    components: {
        calcActivity,
        MyDialog,
        SearchInput
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
            clientid: '',
            failCmds: [],
            fixedTopActivity: uni.getStorageSync(this.platform + 'FixedTopActivity'),
            msgDialogShow: false,
            searchActivityName: '',
            msgToUser: '',
            percent: 0,
            isShowAll: true,
            isShowRecover: false,
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
                    column: 'remark',
                    value: ''
                },
                {
                    column: "activityId",
                    value: ''
                },
                {
                    column: "activityName",
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
                this.selectedActivityIndex = -1
                this.getConfig(true)
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
        //#ifdef APP-PLUS

        plus.push.getClientInfoAsync((info) => {
            this.clientid = info["clientid"];
        });
        //#endif 

        let res = uni.getSystemInfoSync()
        console.log(res)
        this.windowHeight = res.windowHeight

    },
    mounted() {

    },
    computed: {
        scrollStyle() {
            return {
                height: this.isShowAll ? this.isEdit ? '25vh' : '15vh' : 'auto'
            }
        },
        pcs() {
            return [
                {
                    hostname: this.pcHost,
                    name: '华硕',
                },
                {
                    name: '联想',
                    hostname: 'e4097n6449.51vip.biz',
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
        isXingqiu() {
            return this.platform === 'xingqiu'
        },
        addItems() {
            let fields = this.isDamai ? ['activityId', 'port', 'showOrders', 'phone', 'password', 'username', 'uid', 'remark'] : this.isXingqiu ? ['activityId', 'port', 'showOrders', 'phone', 'username', 'uid', 'remark'] : ['activityId', 'port', 'nameIndex', 'phone', 'username', 'uid', 'remark']
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
            if (!this.isXiudong) {
                options.pop()
            }
            return options
        },
        host() {
            return `http://${this.selected}:${platformToPortMap[this.platform]}`
        },
        inputFields() {
            return this.editFields.filter(one => !['targetTypes', 'hasSuccess'].includes(one))
        },
        editFields() {
            let map = {
                xiudong: ['activityId', 'port', 'nameIndex', 'remark', 'uid', 'targetTypes', "hasSuccess"],
                damai: ['activityId', 'port', 'password', 'showOrders', 'remark', 'uid', 'targetTypes', "hasSuccess"],
                xingqiu: ['activityId', 'port', 'showOrders', 'remark', 'uid', 'targetTypes', "hasSuccess"],
            }
            return map[this.platform]
        }
    },

    methods: {
        async checkIsCanBuy() {
            let res = await request({
                url: this.host + "/checkIsCanBuy?activityId=" + this.form.activityId
            });
            uni.showToast({
                icon: "none",
                title: res || '不支持',
                duration: 2000,
            })
        },
        async recover() {
            this.loading = true
            let failCmds = await request({
                timeout: 2 * 60000,
                url: this.host + "/recover"
            });
            this.failCmds = failCmds || []
            this.getConfig(true)
            this.loading = false
        },
        activityRightOptions(one) {
            let arr = [
                {
                    text: '置顶',
                    style: {
                        backgroundColor: 'rgb(0,200,0)'
                    }

                },
                {
                    text: '删除',
                    style: {
                        backgroundColor: 'black'
                    }

                }
            ]
            if (!one.isExpired) {
                arr.pop()
            }
            return arr
        },
        addActivity() {
            this.isEdit = false
            this.copyActivityId = ''
            this.form = {
                activityId: '',
                port: '',
                targetTypes: [],
                showOrders: '0,',
                phone: '15521373109',
                // password:"hik12345",
                nameIndex: 0,
                username: 'me' + Math.ceil(Math.random() * 1000),
            }

            if (this.platform === 'xiudong') {
                this.form.typeMap = {}
            } else {
                this.form.skuIdToTypeMap = {}
            }
            if (this.platform === 'damai') {
                this.form.password = 'hik12345'
            }
            this.$refs.popup.open('bottom')
            setTimeout(() => {
                this.$refs.searchInput && this.$refs.searchInput.showDialog()
            }, 200);
        },
        getTitleStyle(one) {
            return {
                background: one.isExpired ? 'red' : 'rgb(94, 128, 177)'
            }
        },
        setXingqiuMsg() {
            this.msgToUser = '麻烦你直接在这里填写，填完就登录好了，闲鱼不给发链接，谢谢！ 票星球填写这个http://mticket.ddns.net:7777/#/xingqiu'
        },
        setDamaiMsg() {
            this.msgToUser = '麻烦你直接在这里填写，填完就登录好了，闲鱼不给发链接，谢谢！ 大麦填写这个http://mticket.ddns.net:7777'
        },
        setTestMsg() {
            this.msgToUser = '测试'
        },
        getValidPort() {
            let allPorts = this.groupData.map(one => Number(one.data[0].port)).sort((a, b) => a - b)
            console.log(allPorts)
            return Number(allPorts.pop()) + 1
        },
        activityChange(id) {
            this.editForm.activityId = id
            this.form.activityId = id

            let port = this.getValidPort()
            this.editForm.port = port
            this.form.port = port

            this.editForm.isRefresh = true
        },
        async sendMsgToUser() {
            let host = `http://${this.selected}:4000`
            await request({
                method: 'post', url: host + "/sendMsgToUser/", data: {
                    uid: this.curUid,
                    msg: this.msgToUser
                }
            });
            this.msgDialogShow = false
        },
        openMsg(uid) {
            this.curUid = uid
            this.msgToUser = '你好, 目前需要验证码登录哦, 麻烦收到后退出账号再把验证码发给闲鱼卖家, 谢谢'
            this.msgDialogShow = true
        },
        getTagColor,
        callOrCopyPhone(phone) {
            uni.showActionSheet({
                itemList: [phone, '呼叫', '复制'],
                success: (res) => {
                    if ([0, 1].includes(res.tapIndex)) {
                        uni.makePhoneCall({
                            phoneNumber: phone,
                        })
                    } else {
                        uni.setClipboardData({
                            data: phone,
                        });
                    }
                }
            })

        },
        copyUsername(username) {
            uni.setClipboardData({
                data: username,
            });
        },
        toggleForm() {
            this.isShowAll = !this.isShowAll
        },
        async startOne(user, isShow) {
            let item = this.data.find(one => one.username === user)
            item.isShow = isShow
            try {
                await this.start(item)
                this.$refs.calc.refreshDialog()
            } catch (e) {
                console.log(e)
            }
        },
        async stopOne(user) {
            let item = this.data.find(one => one.username === user)
            await this.stop(item)
            this.$refs.calc.refreshDialog()
        },
        async autoStartUsers(users) {
            this.isShowCalc = false
            let total = users.length
            let done = 0
            for (let user of users) {
                let item = this.data.find(one => one.username === user)

                try {
                    await this.start(item, true)
                } catch (e) {
                    console.log(e)
                }
                done++
                this.percent = Math.ceil((done / total) * 100)
            }
            await this.getConfig()
        },
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
            if (!this.show) {
                this.isShowAll = true
                this.searchActivityName = ''
            }
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
        changeTarget(form, e) {
            form.targetTypes = e.detail.value
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
            }
        },


        async openEditDialog(item) {
            this.editForm = { targetTypes: [], ...item }
            this.isEdit = true
            this.$refs.popup.open('bottom')
            this.readDataFromClip()
        },
        async activityClick({ index }, groupName) {
            if (index === 0) {
                this.fixedTopActivity = groupName
                uni.setStorageSync(this.platform + 'FixedTopActivity', this.fixedTopActivity)
                this.filterData()
            } else if (index === 1) {
                console.log("删除全部1")
                this.loading = true
                await request({
                    method: 'post', url: this.host + "/removeOneActivity/", data: {
                        activityName: groupName,
                    }
                });
                await this.getConfig()
                this.loading = false

            }
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
        },
        async add() {
            let data = { ...this.form, isCopy: this.copyActivityId === this.form.activityId, showOrders: this.form.showOrders.replace(/,$/, '') }
            // todo
            if (this.isDamai || this.isXingqiu) {
                data.targetTypes = data.targetTypes.map(name => {
                    let map = this.platform === 'xiudong' ? data.typeMap : data.skuIdToTypeMap
                    let ids = Object.keys(map)
                    return ids.find(id => map[id] === name)
                })
            }


            let arr = this.isDamai ? ['phone', 'username', 'password', 'activityId', 'port'] : this.isXingqiu ? ['phone', 'username', 'activityId', 'port'] : ['phone', 'username', 'activityId', 'port', 'nameIndex']
            if (this.checkForm(data, arr)) {
                this.loading = true

                if (data.uid) {
                    data.uid = data.uid.replace('尊敬的用户，你的UID是：', '')
                }
                await request({ method: 'post', url: this.host + "/addInfo/", data, timeout: 120000 });
                this.$refs.popup.close()
                this.isUnique = false
                this.reset()
                await this.getConfig(true)
                this.loading = false
                let target = this.data.find(one => one.username === data.username)
                this.start(target)


            }
        },
        async recoverScroll(scrollTop) {
            await this.$nextTick()
            uni.pageScrollTo({
                duration: 0,
                scrollTop: scrollTop,
                direction: 0
            })
        },
        openCopyDialog({ activityId, port, typeMap, skuIdToTypeMap }) {

            this.isEdit = false
            this.copyActivityId = activityId
            this.form = {
                activityId,
                port,
                targetTypes: [],
                showOrders: '0,',
                nameIndex: 0
            }
            if (this.platform === 'xiudong') {
                this.form.typeMap = typeMap
            } else {
                this.form.skuIdToTypeMap = skuIdToTypeMap
            }

            this.$refs.popup.open('bottom')
            this.readDataFromClip()
        },
        readDataFromClip() {
            uni.getClipboardData({
                success: (clip) => {
                    let clipData = clip.data.replace(/(大麦账号(:)?)|(账号:)|(手机:)|(账号：)|(手机：)|(手机号码)|(手机号)|(账号)|(手机)|/g, '').trim()
                    clipData = clipData.replace(/密码(:)?(\s)*/g, ' 密码').trim()

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
                            this.form.typeMap = {}
                            this.form.skuIdToTypeMap = {}
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

        async start(item, isNoRefresh) {
            this.loading = true
            try {
                await request({ method: 'post', url: this.host + "/startUserFromRemote/", data: { cmd: item.cmd + (item.isShow ? (this.isDamai ? ` 1 true` : ' show') : ''), isStopWhenLogin: isNoRefresh } });
            } catch (e) {
                console.log(e)
            }
            if (!isNoRefresh) {
                await this.getConfig()
            }
            this.loading = false
        },
        async stop(item) {
            await request({ url: this.host + "/close/" + item.pid + '?isFromRemote=1' });
            await this.getConfig()
        },
        filterData(isFirstGet) {
            let cmds = Object.values(this.pidToCmd);

            let cmdToPid = {};
            Object.entries(this.pidToCmd).forEach(([key, value]) => {
                cmdToPid[value.split(/\s+/).slice(0, 4).join(' ')] = key;
            });
            let data = Object.entries(this.config).map(([username, one]) => ({
                username,
                ...one,
                config: one,
            }));

            let items = this.queryItems.filter(item => item.value);
            data = data.filter(one => {
                return items.every(({ value, column }) => String(one[column]).toLowerCase().indexOf(String(value).toLowerCase()) !== -1);
            });
            data.sort((a, b) => Number(b.port) - Number(a.port));



            data.forEach(one => {
                let cmd = `npm run start ${one.username}`;
                one.cmd = cmd;
                one.loading = false;
                one.hasSuccess = Boolean(one.hasSuccess);
                one.status = cmds.some(cmd => cmd.split(/\s+/)[3] === one.username) ? 1 : 0;
                one.pid = cmdToPid[cmd];
                if (this.isDamai || this.isXingqiu) {
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
        checkIsExpired(one) {
            if (['damai', 'xingqiu'].includes(this.platform)) {
                let dates = [... new Set(Object.values(one.skuIdToTypeMap || {}).map(one => {
                    let date = one.split('_')[0];
                    let arr = date.split(/(\s+)/);
                    return arr[0] + ' ' + arr.slice(-1)[0];
                }))];

                let isExpired = dates.every(date => new Date(date) < new Date());
                return isExpired
            }
            console.log(one)
            return false
            // let types = one.skuIdToTypeMap
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
                        data: [one],
                        isExpired: this.checkIsExpired(one)
                    }
                    res.push(cur)
                } else if (cur.group === one.activityName) {
                    cur.data.push(one)
                }
            })

            res.sort((a, b) => (a.group ? a.group[1] : '').charCodeAt() - (b.group ? b.group[1] : '').charCodeAt())

            if (this.fixedTopActivity) {
                let i = res.findIndex(one => one.group === this.fixedTopActivity)
                let target = res.splice(i, 1)
                this.groupData = [...target, ...res]
            } else {
                this.groupData = res
            }
            if (isFirstGet) {
                this.groupDataCopy = JSON.parse(JSON.stringify(this.groupData))
            }
            console.log(res)
        },
        async getConfig(isFirst) {
            let scrollTop = this.scrollTop
            this.loading = true
            try {
                this.groupData = []
                this.data = []
                let {
                    config, pidToCmd
                } = await request({ url: this.host + "/getAllUserConfig", cancelPre: true });
                this.config = config
                this.pidToCmd = pidToCmd
                this.isShowRecover = Object.keys(this.pidToCmd).length === 0
                this.filterData(isFirst)
            } catch (e) {
                console.log('出错', e)
                if (e.errMsg.includes('abort')) {
                    setTimeout(() => {
                        this.loading = true
                    }, 0);
                }
            }
            this.loading = false
            this.recoverScroll(scrollTop)
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

    .first {
        width: 110px;
        text-align: center;

        >:not(:first-child) {
            line-height: 2;
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

    >* {
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
            flex: 1
        }
    }
}

.dialog {
    background-color: white;
    padding: 10px 20px;

    .toggle {
        width: 20px;
        height: 20px;
        float: right;
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
