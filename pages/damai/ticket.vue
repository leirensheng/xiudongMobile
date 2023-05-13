<template>
    <iframe id="iframe_id" :src="src" frameborder="0" style="width:100%;" height="100%" ></iframe>

</template>

<script>
import RemoteConfig from '../../components/remote.vue'
export default {
    components:{
        RemoteConfig
    },
    data() {
        return {
            src:"https://m.damai.cn/damai/activity/broadlist/index.html?city=852"
        };
    },
    created() {

    },
    async onPullDownRefresh() {
        this.src = ''
        setTimeout(()=>{
            this.src="https://m.damai.cn/damai/activity/broadlist/index.html"
            uni.stopPullDownRefresh();
        },0)
        // await this.$refs.remote.getConfig()
    },
    mounted() {

    },
    methods: {

    }
};
</script>

<style scoped lang="scss">

</style>
