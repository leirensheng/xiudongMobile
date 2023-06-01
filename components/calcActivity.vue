<template>
    <uni-popup ref="popup" type="bottom" @change="changePopup">
        <div class="dialog">
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
            data: []
        };
    },
    created() {

    },
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        activityId: {
            type: String,
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
                let data = await request({ url: this.host + "/activityInfo/" + this.activityId });

                this.data = Object.keys(data).map(type => ({ type, allLength: data[type].allLength, runningLength: data[type].runningLength }))
                let max = Math.max(... this.data.map(one => one.allLength))
                this.data.forEach(one => {
                    one.percent = Math.floor(one.allLength / max * 100)
                })

            }
        }
    },
    methods: {
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
