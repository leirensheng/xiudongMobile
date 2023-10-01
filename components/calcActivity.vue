<template>
    <uni-popup ref="popup" type="bottom" @change="changePopup">
        <div class="dialog">
            <div class="top">
                <div>启动中: {{ allRunningLength }}</div>
                <button type="primary" size="mini" v-if="data.length" @click="autoOpen">启动</button>
                <div>
                    最小:
                    <switch :checked="isMin" @change="changeIsMin" />
                </div>
                <div>
                    单张:
                    <switch :checked="isSingle" @change="changeIsSingle" />
                </div>

            </div>
            <div v-if="data.length" class="item-wrap" v-for="(item, index) in data" :key="index">
                <div class="item" :style="getStyle(item.percent)">
                    <div class="text">{{ item.type }}__({{ item.runningLength }}/{{ item.allLength }}) </div>
                </div>
            </div>
            <div v-else class="loading">加载中...</div>
        </div>
    </uni-popup>
</template>

<script>
import { request } from '@/utils.js'

export default {
    data() {
        return {
            data: [],
            isMin: true,
            allRunningLength: 0,
            isSingle: true
        };
    },
    created() {

    },
    props: {
        userConfig: {
            type: Array,
            default: () => []
        },
        modelValue: {
            type: Boolean,
            default: false
        },
        activityId: {
            type: [String,Number],
            default: ''
        },
        host: {
            type: String,
            default: ''
        }
    },
    mounted() {

    },
    watch: {
        async modelValue(val) {
            if (val) {
                this.$refs.popup.open('bottom')
                this.getCalc()
            } else {
                this.$refs.popup.close()
            }
        }
    },
    methods: {
        async getCalc() {
            let data = await request({ url: this.host + "/activityInfo/" + this.activityId + '?isSingle=' + (this.isSingle ? 1 : 0) });

            let allRunning = Object.keys(data).map(type => (data[type].running)).flat()
            this.allRunningLength = new Set(allRunning).size

            this.data = Object.keys(data).map(type => ({ ...data[type], type, allLength: data[type].allLength, runningLength: data[type].runningLength }))
            let max = Math.max(... this.data.map(one => one.allLength))
            this.data.forEach(one => {
                one.percent = Math.floor(one.allLength / max * 100)
            })
            // console.log(this.data, data)
        },
        changeIsMin(e) {
            this.isMin = e.detail.value
        },
        changeIsSingle(e) {
            this.isSingle = e.detail.value
            this.getCalc()
        },
        getScore(name, allConfig) {
            let config = allConfig.find((one) => one.username === name);
            if (config.hasSuccess || config.remark.match(/(频繁)|(密码不正确)/)) return 0;
            let score = 500;
            if(config.price==='undefined'){
                config.price = ''
            }
            score = score - config.orders.length * 50;
            score = score - config.targetTypes.length * 15;
            let advPrice = Math.max((config.price || 100) / config.orders.length, 100)
            console.log(Math.max((config.price || 100) / config.orders.length, 100), config.price,config.orders.length)
            console.log(name, "平均价格", advPrice)
            score = score + advPrice / 100 * 25
            if (config.remark.match(/低|夏|魔|缘/)) {
                score = score - 20;
            } else if (config.remark.match(/高/)) {
                score = score + 20;
            } else if (config.remark) {
                score = score - 10;
            }
            if (!config.uid) {
                score = score - 30;
            }
            return score;
        },
        autoOpen() {
            // let runningUsers = [...new Set(this.data.map(one => one.running).flat().filter(Boolean))]
            let runningTypes = this.data.filter(one => one.running.length).map(one => one.type)

            let toStart = []
            console.log(this.data)
            console.log(this.userConfig)
            for (let one of this.data) {
                let { type, all } = one
                if (all.length && !runningTypes.includes(type)) {
                    // console.group()

                    let scores = all.map(name => this.getScore(name, this.userConfig))
                    console.log(type, all, scores)
                    let max = Math.max(...scores)

                    if (max !== 0) {
                        let index = scores.indexOf(max)
                        let maxUser = all[index]
                        console.log("最大的是", maxUser)
                        toStart.push(maxUser)
                        if (this.isMin) {
                            if (max < 400) {
                                runningTypes.push(type)
                                console.log(type + "没有单个人的")
                            } else {
                                let maxOneConfig = this.userConfig.find(one => one.username === maxUser)
                                runningTypes.push(...maxOneConfig.targetTypes)
                            }
                        } else {
                            runningTypes.push(type)
                        }
                    }
                    // console.groupEnd()

                }
            }
            console.log("结果", toStart)
            if (toStart.length) {
                this.$emit('autoStartUsers', toStart)
            }
        },
        getStyle(percent) {
            return {
                'background-size': percent + '%'
            }
        },
        changePopup(e) {
            this.data = []
            this.$emit('update:modelValue', e.show)
        },
    }
};
</script>

<style scoped lang="scss">
.dialog {
    min-height: 30vh;
    padding-bottom: 60px;
    background-color: white;
    max-height: 80vh;
    overflow: auto;

    .loading {
        margin: 20px auto;
    }

    .top {
        padding: 5px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .item-wrap {
        line-height: 2.5;
        position: relative;

        .item {
            z-index: 3;
            background: transparent;
            background-image: linear-gradient(rgb(155, 243, 177), rgb(178, 249, 177));
            background-repeat: no-repeat;

            .text {
                margin-left: 15px;
            }
        }


    }
}
</style>
