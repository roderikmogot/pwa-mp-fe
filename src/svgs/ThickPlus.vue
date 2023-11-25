<template>
    <svg-icon type="mdi" :path="path"></svg-icon>
</template>
  
<script>
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiPlusThick } from '@mdi/js';

export default {
    name: "thick-plus",
    components: {
        SvgIcon
    },
    data() {
        return {
            path: mdiPlusThick,
        }
    }
}
</script>