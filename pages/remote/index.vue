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
                <uni-swipe-action-item v-for="(item, index) in data" :right-options="rightOptions" :key="item.phone"
                    @click="swipeClick($event, item)">
                    <div class="item" :style="getStyle(item)">
                        <div class="phone">{{ item.phone }}</div>
                        <div class="name">{{ item.username }}</div>
                        <div class="activityName">{{ item.activityName }}
                            <img class="copy" src="/static/copy.svg" @click="openCopyDialog(item.activityId)" />
                        </div>

                        <button class="btn" size="mini" type="warn" v-if="item.status" @click="stop(item.pid)">停止</button>
                        <button class="btn" size="mini" type="primary" v-else @click="start(item)">启动</button>
                    </div>
                    <!-- <view class="content-box">
					<text class="content-text">{{ item.content }}</text>
				</view> -->
                </uni-swipe-action-item>
            </uni-swipe-action>


        </div>

        <uni-popup ref="popup" type="bottom">
            <div class="dialog">
                <div class="form">
                    <input type="text" v-model="form.username" placeholder="username">
                    <input type="text" v-model="form.phone" placeholder="phone">
                    <button class="btn" size="mini" type="primary" @click="add">新增</button>

                </div>

            </div>
        </uni-popup>

    </div>
</template>

<script>
import { request } from '@/utils.js'
export default {
    data() {
        return {
            rightOptions: [
                {
                    text: '删除',
                    style: {
                        backgroundColor: '#007aff'
                    }
                }, {
                    text: 'toCheck',
                    style: {
                        backgroundColor: '#dd524d'
                    }
                }
            ],
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
                    name: '华硕',
                    hostname: '7l235k7324.yicp.fun',
                },
                {
                    name: '公司',
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
        host() {
            return `http://${this.selected}:4000`
        },
    },

    methods: {

        async swipeClick({ index }, { username }) {
            if (index === 0) {
                let res = await request({ method: 'post', url: this.host + "/removeConfig/", data: { username } });
                this.getConfig()
            } else {

            }
        },
        async add() {
            this.loading = true
            let data = { ...this.form, activityId: this.addActivityId }
            let res = await request({ method: 'post', url: this.host + "/addInfo/", data });
            console.log(res)
            this.$refs.popup.close()
            this.loading = false
            this.getConfig()
        },
        openCopyDialog(activityId) {
            this.addActivityId = activityId
            this.$refs.popup.open('bottom')
        },
        changeUnique(e) {
            this.isUnique = e.detail.value
        },
        getStyle(item) {
            return {
                background: item.hasSuccess ? '#aaffaa' : item.remark?.includes('频繁') ? 'rgb(225, 223, 223)' : 'white'

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
                targetTypes: Object.keys(one.typeMap || []),
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
                } = await request({ url: this.host + "/getAllUserConfig" });
                this.config = config
                this.pidToCmd = pidToCmd
                this.filterData()
            } catch (e) {
                console.log(e)
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
    padding: 5px;

    .item {
        padding: 10px 0;
        display: flex;
        justify-content: center;
        align-items: center;

        >:not(:last-child) {
            padding-left: 10px;
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
                width: 22px;
                height: 22px;
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
    padding: 20px;
    padding-bottom: 60px;

    .form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        >* {
            width: 100%;
            margin: 10px;
        }
    }
}
</style>
