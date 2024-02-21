<template>
    <iframe id="iframe_id" :src="src" frameborder="0" style="width:100%;" height="700" ></iframe>

</template>

<script>
import RemoteConfig from '../../components/remote.vue'
export default {
    components:{
        RemoteConfig
    },
    data() {
        return {
            src:"http://mticket.ddns.net:7777/#/audience?agent=me&platform=damai"
        };
    },
    created() {

    },
  
    mounted() {

    },
    methods: {

    }
};
</script>

<style scoped lang="scss">

</style>
