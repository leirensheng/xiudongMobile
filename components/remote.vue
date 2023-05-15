<template>
    <div class="remote">
        <div class="pcs">
            <div class="pc" v-for="(item, index) in pcs" :key="index" @click="choose(item)" :class="selected
                === item.hostname ? 'selected' : ''">{{ item.name }}</div>
        </div>
        <div class="search">
            <input v-for="(item, index) in queryItems" :key="index" type="text" :placeholder="item.column"
                v-model="item.value" />
            <span style="width:40px;flex-shrink: 0;">去重</span>
            <switch @change="changeUnique" />

        </div>

        <div class="data">
            <uni-swipe-action ref="swipeAction">
                <uni-swipe-action-item v-for="(item, index) in data" :right-options="rightOptions" :key="item.username"
                    @click="swipeClick($event, item)" :disabled="!!item.status">
                    <div class="item" :style="getStyle(item)">
                        <div class="phone">{{ item.phone }}</div>
                        <div class="name">{{ item.username }}</div>
                        <div class="activityName">
                            <image class="copy" src="/static/edit.svg" @click="openEditDialog(item)" />

                            {{ item.activityName }}
                            <image class="copy" src="/static/copy.svg" @click="openCopyDialog(item.activityId)" />
                        </div>

                        <button class="btn" size="mini" type="warn" v-if="item.status" @click="stop(item.pid)">停止</button>
                        <button class="btn" size="mini" type="primary" v-else @click="start(item)">启动</button>
                    </div>

                    <div v-if="(index !== data.length - 1) && (Number(item.port) !== Number(data[index + 1].port))"
                        class="divide"> </div>
                    <!-- <view class="content-box">
					<text class="content-text">{{ item.content }}</text>
				</view> -->
                </uni-swipe-action-item>
            </uni-swipe-action>


        </div>

        <uni-popup ref="popup" type="bottom">
            <div class="dialog">
                <div class="form" v-if="isEdit">
                    <div v-for="(field, index) in inputFields" :key="index" class="input-wrap">
                        <span>{{ field }}</span>
                        <my-input type="text" v-model="editForm[field]" :placeholder="field" />

                    </div>

                    <div class="is-success">
                        <span>是否成功: </span>
                        <switch :checked="editForm.hasSuccess" @change="handleSwitchChange" />
                    </div>

                    <checkbox-group v-if="platform === 'xiudong'" @change="changeTarget" class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.keys(editForm.typeMap)" :key="index"
                            :checked="editForm.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>

                    <checkbox-group v-else @change="changeTarget" class="checkbox-group">
                        <checkbox :value="item" v-for="(item, index) in Object.values(editForm.skuIdToTypeMap)" :key="index"
                            :checked="editForm.targetTypes.includes(item)">{{ item }}
                        </checkbox>
                    </checkbox-group>
                    <button class="btn" type="primary" @click="confirmEdit">确定修改</button>
                </div>
                <div class="form" v-else>
                    <my-input type="text" v-model="form.phone" placeholder="phone" @blur="handlePhone" />
                    <my-input type="text" v-if="platform === 'damai'" v-model="form.password" placeholder="password"
                        @blur="handlePass" />
                    <my-input type="text" v-model="form.username" placeholder="username" />

                    <my-input type="text" v-model="form.uid" placeholder="uid" />

                    <button class="btn" type="primary" @click="add">新增</button>
                </div>
            </div>
        </uni-popup>

    </div>
</template>

<script>
let platformMap = {
    xiudong: '4000',
    damai: '5000'
}
import { request } from '@/utils.js'
export default {
    props: {
        platform: {
            type: String,
            default: 'xiudong',
        }
    },
    data() {
        return {
            targetTypeIndexes: [],
            editForm: {},
            isEdit: false,

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
                }
            ],
            selected: '',
            pcs: [
                {
                    // hostname: '192.168.2.9',
                    name: '华硕',
                    hostname: '7l235k7324.yicp.fun',
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

            ],

        };
    },

    watch: {
        isUnique() {
            this.filterData()
        },
        selected() {
            this.getConfig()
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



    },
    mounted() {

    },
    computed: {
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
            if (this.platform === 'damai') {
                options.pop()
            }
            return options
        },
        host() {
            return `http://${this.selected}:${platformMap[this.platform]}`
        },
        inputFields() {
            return this.fields.filter(one => !['targetTypes', 'hasSuccess'].includes(one))
        },
        fields() {
            let map = {
                xiudong: ['activityId', 'port', 'nameIndex', 'remark', 'uid', 'targetTypes', "hasSuccess"],
                damai: ['activityId', 'port', 'password', 'showOrders', 'remark', 'uid', 'targetTypes', "hasSuccess"],
            }
            return map[this.platform]
        }
    },

    methods: {
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
        async confirmEdit() {

            let keys = this.fields
            let form = keys.reduce((prev, cur) => {
                prev[cur] = this.editForm[cur]
                return prev
            }, {})
            let data = {
                username: this.editForm.username,
                config: form
            }
            this.loading = true
            await request({ method: 'post', url: this.host + "/editConfig/", data });
            this.$refs.popup.close()
            this.loading = false
            this.getConfig()

        },
        async openEditDialog(item) {
            this.editForm = { ...item }
            this.isEdit = true
            this.$refs.popup.open('bottom')
        },
        async swipeClick({ index }, { username }) {
            if (index === 0) {
                this.loading = true
                await request({ method: 'post', url: this.host + "/removeConfig/", data: { username } });
                this.getConfig()
                this.loading = false
            } else {
                this.loading = true
                await request({ method: 'post', url: this.host + "/toCheck/", data: { username } });
                this.getConfig()
                this.loading = false
            }
        },
        async add() {
            this.loading = true
            let data = { ...this.form, activityId: this.addActivityId }

            if (data.uid) {
                data.uid = data.uid.replace('尊敬的用户，你的UID是：', '')
            }
            await request({ method: 'post', url: this.host + "/addInfo/", data, timeout: 120000 });
            this.$refs.popup.close()
            this.loading = false
            this.isUnique = false
            await this.getConfig()
            let target = this.data.find(one => one.username === data.username)
            this.start(target)
        },
        openCopyDialog(activityId) {
            this.addActivityId = activityId
            this.isEdit = false
            this.form = {}
            this.$refs.popup.open('bottom')
        },
        changeUnique(e) {
            this.isUnique = e.detail.value
        },
        getStyle(item) {
            return {
                background: item.hasSuccess ? '#aaffaa' : item.remark?.includes('频繁') ? 'rgb(225, 223, 223)' : !item.uid ? 'rgb(254, 214, 91)' : 'white'

            }
        },

        async start(item) {
            this.loading = true
            try {
                await request({ method: 'post', url: this.host + "/startUserFromRemote/", data: { cmd: item.cmd } });
            } catch (e) {
                console.log(e)
            }

            this.getConfig()
            this.loading = false
        },
        async stop(pid) {
            await request({ url: this.host + "/close/" + pid + '?isFromRemote=1' });
            this.getConfig()
        },
        filterData() {

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
                if (this.platform === 'damai') {
                    one.showOrders = one.orders.join(',')
                }
            });

            if (this.isUnique) {
                let activityIds = [...new Set(data.map(one => Number(one.activityId)))];
                this.data = activityIds.map(activityId =>
                    data.find(one => Number(one.activityId) === activityId),
                );
            } else {
                this.data = data;
            }
        },
        async getConfig() {
            this.loading = true
            try {
                this.data = []
                let {
                    config, pidToCmd
                } = await request({ url: this.host + "/getAllUserConfig", cancelPre: true });
                this.config = config
                this.pidToCmd = pidToCmd
                this.filterData()
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

.data {

    // padding: 15px;
    .divide {
        border: 2px dotted rgb(83, 240, 25);
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


        .name {
            width: 60px;
        }

        .activityName {
            flex: 1;
            flex-shrink: 1;

            .copy {
                position: relative;
                top: 4px;
                width: 25px;
                height: 18px;
            }
        }

        .btn {}

        // flex: 1;
    }
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

        .is-success {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            border-bottom: 1px solid rgb(221, 221, 222);
        }

        .checkbox-group {
            padding: 10px 0;
            max-height: 20vh;
            gap: 10px;
            overflow: auto;
            display: flex;
            justify-content: space-around;
            align-items: center;
            flex-wrap: wrap;
        }
    }
}
</style>
