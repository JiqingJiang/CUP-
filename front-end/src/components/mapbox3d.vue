<style scoped>
.mapContainer {
  flex: 60;
}
/* 顶部按钮 */
.buttonContainer {
  flex-wrap: wrap; /*允许换行*/
  gap: 10px;
  flex-direction: row; /*column;*/
  justify-content: flex-start;
  align-items: center;
}
/* 地图大小 */
#mapCon {
  height: calc(100vh - 120px);
  width: 100%;
}
</style>


<template>
    <!-- 顶部按钮区域 -->
    <div class="buttonContainer">
      <el-button @click="changeMapPerspective">切换视角</el-button>
      <el-button @click="toggleCoordinates">{{ showCoordinates ? '隐藏坐标' : '显示坐标' }}</el-button>
      <el-button @click="toggleLighting">光照模拟</el-button>
      <!-- 显示坐标信息 -->
      <p v-if="showCoordinates">{{ coordinates }}</p>
    </div>
    <!-- 左侧地图区域 -->
    <div class="mapContainer">
      <div id="mapCon"></div>
    </div>

</template>

<script>
import mapboxgl from '../mapbox'
export default {
  name: '3DMap', // 组件的名称
  data() {
    return {
      map: null,
      showCoordinates: false,   // 坐标显示开关
      coordinates: '',          // 存储坐标信息的属性
      lightingEnabled: false,   // 光照模拟的开关
      lightingMode: 'morning',  // 添加光照模式变量
    };
  },
  mounted() {
    // 在组件被挂载到 DOM 后，创建一个新的 Mapbox 地图实例
    const map = new mapboxgl.Map({
      container: 'mapCon', // 指定地图容器的 ID
      style: 'mapbox://styles/mapbox/streets-v11', // 使用Mapbox 的轻量级样式
      center: [-74.0066, 40.7135], // 设置地图的初始中心点（经度，纬度）
      zoom: 15, // 设置地图的初始缩放级别
      pitch: 45, // 设置地图的倾斜角度
      bearing: -17.6, // 设置地图的旋转角度
      antialias: true // 设置抗锯齿，使地图渲染更平滑
    });
    const self = this; // 保存 Vue 实例的引用，以便在 callback 中使用
    map.on('load', function () {
      map.on('mousemove', function (e) {
        var lngLat = e.lngLat; // 使用 e.lngLat 直接获取经纬度
        self.coordinates = '经度：' + lngLat.lng.toFixed(6) + '，纬度：' + lngLat.lat.toFixed(6); // 更新 Vue 组件的数据
      });
    });
    this.map = map;
  },
  methods: {
    // 功能1：改变地图视角
    changeMapPerspective() {
      let currentPitch = this.map.getPitch();
      let newPitch = currentPitch + 15;
      if (newPitch > 90) {
        newPitch = 0; // 当角度超过90度时，重置为0度
      }
      this.map.easeTo({ pitch: newPitch });
    },
    // 功能2：坐标显示
    toggleCoordinates() {
      this.showCoordinates = !this.showCoordinates;
    },
    // 功能3：光照模拟
    toggleLighting() {
      switch (this.lightingMode) {
        case 'morning':
          // 设置早上的光照参数
          this.map.setLights({
            'anchor': 'viewport',
            'color': '#ffe5b4', // 早上的光照颜色
            'intensity': 0.8,
            'position': 'flat' // 指定光源类型为 'flat'
          });
          this.lightingMode = 'evening'; // 下一次点击将切换到傍晚模式
          break;
        case 'evening':
          // 设置傍晚的光照参数
          this.map.setLights({
            'anchor': 'viewport',
            'color': '#ffcc88', // 傍晚的光照颜色
            'intensity': 0.6,
            'position': 'flat' // 指定光源类型为 'flat'
          });
          this.lightingMode = 'night'; // 下一次点击将切换到深夜模式
          break;
        case 'night':
          // 设置深夜的光照参数
          this.map.setLights({
            'anchor': 'viewport',
            'color': '#112244', // 深夜的光照颜色
            'intensity': 0.3,
            'position': 'flat' // 指定光源类型为 'flat'
          });
          this.lightingMode = 'morning'; // 下一次点击重置为早上模式
          break;
        default:
          this.lightingMode = 'morning'; // 如果状态未知，重置为早上模式
      }
    },


  }
}
console.log(mapboxgl.version);

</script>
