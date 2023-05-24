<template>
    <remote-config platform="xiudong" ref="remote"></remote-config>
</template>

<script>
import RemoteConfig from '../../components/remote.vue'
export default {
    components: {
        RemoteConfig
    },
    data() {
        return {

        };
    },
    created() {

    },
    onShow(){
        if(this.$refs.remote&&this.$refs.remote.show){
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
