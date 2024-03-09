<style>
#main-page {
  display: flex;
  height: 100vh;
}
.sidebar {
  width: 150px; /* 或者根据你的设计需求设置其他宽度 */
  background: #EEE; /* 侧边栏背景颜色 */
  margin: 0; /* 移除外边距 */
  padding: 0; /* 移除内边距 */
  //opacity: 0.4; /* 设置背景图片的透明度 */
}
.main-part {
  flex: 1; /* 占据剩余的空间 */
  display: flex;
  flex-direction: column; /* 子元素垂直排列 */
  margin: 0; /* 移除外边距 */
}
.mapContainer {
  flex: 1;
}
.navbar {
  background: #DDD; /* 导航栏背景颜色 */
  //opacity: 0.4; /* 设置背景图片的透明度 */
}
.mapContainer {
  /* 如果需要，可以添加其他样式 */
}
</style>

<template>
  <div id="main-page">
    <!-- 侧边栏 -->
    <div class="sidebar">
      <el-menu default-active="2" class="el-menu-vertical-demo" @select="handleSelect">
        <el-menu-item index="mapbox2d">二维地图</el-menu-item>
        <el-menu-item index="mapbox3d">三维地图</el-menu-item>
      </el-menu>
    </div>
    <div class="main-part">
      <!-- 地图容器 -->
      <div class="mapContainer">
        <component :is="currentView"></component>
      </div>
    </div>
  </div>
</template>

<script>
import mapbox2d from './mapbox2d.vue';
import mapbox3d from './mapbox3d.vue';
export default {
  name: 'MainPage',
  components: {
    mapbox2d,
    mapbox3d,
  },
  data() {
    return {
      currentView: 'mapbox2d', // 默认显示二维地图
    };
  },
  methods: {
    handleSelect(index) {
      this.currentView = index;
    },
  }
};
</script>


