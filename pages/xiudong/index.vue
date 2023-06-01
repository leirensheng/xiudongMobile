<template>
    <remote-config v-if="isReady" platform="xiudong" ref="remote" :pcHost="pcHost" :scrollTop="scrollTop"></remote-config>
</template>

<script>
import globalData from '../../globalData.js'
import RemoteConfig from '../../components/remote.vue'
export default {
    components: {
        RemoteConfig
    },
    data() {
        return {
            isReady: false,
            pcHost: '',
            scrollTop: 0
        };
    },
    onPageScroll(e){
        this.scrollTop = e.scrollTop
    },
    created() {
        if (globalData.pcHost) {
            this.isReady = true
            this.pcHost = globalData.pcHost

        } else {
            uni.$on('hostDone', val => {
                this.pcHost = val
                this.isReady = true
            })
        }
    },
    onShow() {
        if (this.$refs.remote && this.$refs.remote.show) {
            this.$refs.remote.readDataFromClip()
        }
    },
    async onPullDownRefresh() {
        this.$refs.remote.reset()
        await this.$refs.remote.getConfig()
        uni.stopPullDownRefresh();
    },
    mounted() {

    },
    methods: {

    }
};
</script>

<style scoped lang="scss"></style>
