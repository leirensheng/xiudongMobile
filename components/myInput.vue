<template>
    <input type="text" v-bind="$attrs" cursor-spacing="80" @input="valueChange">
</template>

<script>
export default {
    methods: {
        valueChange(e) {
            this.$emit('update:modelValue', e.detail.value)
        }
    }
};
</script>

<style scoped lang="scss">
input {
    border: 1px solid gainsboro;
    padding: 10px;
    border-radius: 10px;
}
</style>
