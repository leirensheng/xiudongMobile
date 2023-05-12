<template>
    <remote-config platform="damai"></remote-config>
</template>

<script>
import RemoteConfig from '../../components/remote.vue'
export default {
    components:{
        RemoteConfig
    },
    data() {
        return {

        };
    },
    created() {

    },
    async onPullDownRefresh() {
        await this.$refs.remote.getConfig()
        uni.stopPullDownRefresh();
    },
    mounted() {

    },
    methods: {

    }
};
</script>

<style scoped lang="scss">

</style>
