<style scoped>
.mapContainer {
  flex: 60;
}
/*顶部导航按钮*/
.buttonContainer {
  display: flex;
  flex-wrap: wrap; /*允许换行*/
  gap: 10px;
  flex-direction: row; /*column;*/
  justify-content: flex-start;
  align-items: center;
}
/* 样式部分，只作用于当前组件 */
#mapCon {
  /* 地图容器的高度*/
  //height: 120%;
  height: calc(100vh - 120px);
  /* 地图容器的宽度为 100%，即占满父容器 */
  width: 100%;
}
</style>




<template>
    <!-- 顶部按钮区域 -->
    <div>
      <div class="buttonContainer">
        导航栏：
        <el-button @click="changeMapPerspective">切换视角</el-button>
        <el-button @click="toggleCoordinates">坐标显示</el-button>
        <el-button @click="toggleLighting">光照模拟</el-button>

        <el-button @click="drawPoint">绘制点</el-button>
        <el-button @click="drawLine">绘制线</el-button>
        <el-button @click="drawPolygon">绘制面</el-button>
        <el-button @click="moveCameraToPosition(-74.5, 40, 9)">移动相机</el-button>
        <el-button @click="showTextPopup(-74.5, 40, '这里是纽约')">显示文本弹窗</el-button>
      </div>

      <div>
        <!-- 修改此处来显示坐标 -->
        <p v-if="showCoordinates">{{ coordinates }}</p>
        <p v-if="measurementResult">测量结果: {{ measurementResult }}</p>
      </div>
    </div>


    <!-- 左侧地图区域 -->
    <div class="mapContainer">
      地图显示栏：
      <div id="mapCon"></div>
    </div>

    <!-- 显示所有位置-->
    <div>
      地址显示栏：
      <el-table :data="locations" style="width: 100%">
        <el-table-column prop="name" label="名称"></el-table-column>
        <el-table-column prop="description" label="描述"></el-table-column>
        <el-table-column prop="latitude" label="纬度"></el-table-column>
        <el-table-column prop="longitude" label="经度"></el-table-column>
        <el-table-column label="图片">
          <template v-slot="scope">
            <img :src="scope.row.imageUrl" alt="图片" style="max-width: 100px; max-height: 100px;">
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="formContainer">
      DEBUG栏：
      <div>
        <div v-for="(location, index) in locations" :key="index">
          {{ location }}
        </div>
      </div>
    </div>

  <div>
    地址添加+地址修改+地址删除：
    <el-form :model="location" ref="locationForm" label-width="80px">
      <el-form-item label="选择地址">
        <el-select v-model="selectedLocation" placeholder="请选择要编辑的地址">
          <el-option
              v-for="loc in locations"
              :key="loc.id"
              :label="loc.name"
              :value="loc.id"
          ></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="ID">
        <el-input v-model="location.id" :disabled="isEditing"></el-input>
      </el-form-item>
      <el-form-item label="名称">
        <el-input v-model="location.name"></el-input>
      </el-form-item>
      <el-form-item label="描述">
        <el-input v-model="location.description"></el-input>
      </el-form-item>
      <el-form-item label="纬度">
        <el-input v-model="location.latitude"></el-input>
      </el-form-item>
      <el-form-item label="经度">
        <el-input v-model="location.longitude"></el-input>
      </el-form-item>
      <el-form-item label="图片URL">
        <el-input v-model="location.imageUrl"></el-input>
      </el-form-item>
    </el-form>

    <el-button @click="addLocation">添加位置信息</el-button>
    <el-button type="danger" @click="editLocation">编辑地址</el-button>
    <el-button @click="saveLocation">保存编辑</el-button>
    <el-button type="danger" @click="deleteLocation">删除地址</el-button>
  </div>



</template>

<script>
import mapboxgl from '../mapbox'
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios   from "axios";
import 'element-plus/theme-chalk/index.css';


export default {
  name: 'Map2D', // 组件的名称
  data() {
    return {
      map: null,
      draw: null,
      showCoordinates: false,  //经纬度显示的开关
      lightingEnabled: false,  //光照模拟的开关
      coordinates: '',         //存储坐标信息的属性
      lightPosition: [1.5, 90, 80], // 初始光照位置，你可以根据需要调整这些值
      measurementResult: '', // 用于存储测量结果的属性
      styles : [
        'mapbox://styles/mapbox/streets-v11',
        'mapbox://styles/mapbox/light-v10',
        'mapbox://styles/mapbox/dark-v10'
      ],
      Index : 0,               // 当前样式索引
      pointTitle: '',          // 点的标题
      pointDescription: '',    // 点的描述
      lastDrawnPoint: null,    // 最后绘制的点
      locations: [], //用于存储从数据库中获取的位置信息数组
      location: {},  // 用于存储当前正在编辑的位置信息
      addDialogVisible: false,
      editedLocation: {},  // 编辑时的数据结构
      isEditing: false,    // 编辑状态
      selectedLocation: null, // 选择要编辑的地址信息的ID
    };
  },
  mounted() {
    //
    var map = new mapboxgl.Map({
      container: 'mapCon',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [114.41703647375107, 23.10750961303711],
      zoom: 12
    });
    // 加载数据库已有的信息
    this.fetchLocations();
    //


    const self = this; // 保存 Vue 实例的引用，以便在 callback 中使用
    //
    map.on('load', function () {
      map.on('mousemove', function (e) {
        var lngLat = e.lngLat; // 使用 e.lngLat 直接获取经纬度
        self.coordinates = '经度：' + lngLat.lng.toFixed(6) + '，纬度：' + lngLat.lat.toFixed(6); // 更新 Vue 组件的数据
      });
    });
    this.map = map;
    // 绘制
    this.draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
      },
    });
    this.map.addControl(this.draw);
    // 监听 draw.create 和 draw.update 事件来计算距离和面积
    this.map.on('draw.create', this.updateArea);
    this.map.on('draw.update', this.updateArea);
    this.map.on('draw.create', (event) => {
      if (event.features.length > 0 && event.features[0].geometry.type === 'Point') {
        this.lastDrawnPoint = event.features[0];
      }
    });

    this.map.on('load', () => {
      // 监听点击事件
      this.map.on('click', (e) => {
        // 调用显示文本弹窗的方法，传入点击位置的经纬度
        this.showTextPopup(e.lngLat.lng, e.lngLat.lat);
      });
    });


  },
  methods: {

    fetchLocations() {
      axios.get('http://localhost:3000/locations')
          .then(response => {
            this.locations = response.data;
          })
          .catch(error => {
            console.error('获取数据库内容出错', error);
          });
    },
    changeMapPerspective() {
      let currentPitch = this.map.getPitch();
      let newPitch = currentPitch + 15;
      if (newPitch > 90) {
        newPitch = 0; // 当角度超过90度时，重置为0度
      }
      this.map.easeTo({ pitch: newPitch });
    },
    // 1.坐标显示
    toggleCoordinates() {
      this.showCoordinates = !this.showCoordinates;
    },
    // 2.光照模拟
    toggleLighting() {
        // 获取下一个样式的索引
        this.Index = (this.Index + 1) % 3;
        // 设置地图的样式为下一个样式
        this.map.setStyle(this.styles[this.Index]);
    },
    // 3.绘点线面
    drawPoint() {
      this.draw.changeMode('draw_point');
    },
    drawLine() {
      this.draw.changeMode('draw_line_string');
    },
    drawPolygon() {
      this.draw.changeMode('draw_polygon');
    },
    // 4.测距离，测面积
    updateArea() {
      const data = this.draw.getAll();
      if (data.features.length > 0) {
        data.features.forEach((feature) => {
          let area;
          let measurement = '';
          if (feature.geometry.type === 'Polygon') {
            // 使用 turf 计算面积
            area = turf.area(feature);
            // 将面积从平方米转换为平方千米
            measurement = (area / 1000000).toFixed(2) + ' km²';
          } else if (feature.geometry.type === 'LineString') {
            // 使用 turf 计算距离
            const length = turf.length(feature, { units: 'kilometers' });
            measurement = length.toFixed(2) + ' km';
          }
          // 更新存储测量结果的属性
          this.measurementResult = measurement;
        });
      } else {
        // 如果没有绘制的图形，清空测量结果
        this.measurementResult = '';
      }
    },
    // 5.相机移动
    moveCameraToPosition(lng, lat, zoom) {
      // 假设你的地图实例存储在 this.map
      this.map.flyTo({
        center: [lng, lat],
        zoom: zoom
      });
    },
    // 6.文本信息弹窗
    showTextPopup(lng, lat) {
      // 创建文本内容，包括经纬度信息
      const text = `经度: ${lng.toFixed(6)}, 纬度: ${lat.toFixed(6)}`;
      // 创建一个 Popup 实例并设置内容和位置
      new mapboxgl.Popup()
          .setLngLat([lng, lat])
          .setHTML(text)
          .addTo(this.map);
    },
    // 7.保存点
    savePoint() {
      if (this.lastDrawnPoint && this.pointTitle) {
        const pointData = {
          title: this.pointTitle,
          description: this.pointDescription,
          coordinates: this.lastDrawnPoint.geometry.coordinates
        };

        // 使用axios或者其他HTTP库发送POST请求到你的后端API
        axios.post('你的后端API的URL', pointData)
            .then(response => {
              console.log('点信息已保存', response.data);
              // 清空表单
              this.pointTitle = '';
              this.pointDescription = '';
            })
            .catch(error => {
              console.error('保存点信息出错', error);
            });
      } else {
        alert('请先在地图上绘制一个点，并为其添加标题');
      }
    },
    openAddDialog() {
      this.addDialogVisible = true;
    },


    addLocation() {
      this.isEditing = false;
      this.resetForm();
      axios.post('http://localhost:3000/locations', this.location)
          .then(() => {
            this.fetchLocations();
            this.addDialogVisible = false;
          })
          .catch(error => {
            console.error('添加新位置失败', error);
          });
      this.clearForm();
    },
    saveLocation() {
      axios.put(`http://localhost:3000/locations/${this.location.id}`, this.location)
          .then(response => {
            console.log('位置信息已更新', response.data);
            this.fetchLocations();
            this.clearForm();
            this.isEditing = false;
          })
          .catch(error => {
            console.error('更新位置信息出错', error);
          });
    },
    editLocation() {
      if (this.locations.length === 0) {
        this.fetchLocations(); // 通过调用fetchLocations来获取locations
        return;
      }
      if (this.selectedLocation) {
        const selectedLoc = this.locations.find(loc => loc.id === this.selectedLocation);
        if (selectedLoc) {
          this.location = { ...selectedLoc };
          this.isEditing = true;
        }
      } else {
        alert('请先选择要编辑的地址');
      }
    },
    deleteLocation() {
      if (this.selectedLocation) {
        const url = `http://localhost:3000/locations/${this.selectedLocation}`;
        axios.delete(url)
            .then(() => {
              this.fetchLocations();
              this.selectedLocation = null;
            })
            .catch(error => {
              console.error('删除地址信息失败', error);
            });
      } else {
        alert('请点击编辑地址，选择要删除的地址');
      }
    },
    clearForm() {
      this.location = {
        id: null,
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        imageUrl: '',
      };
      this.isEditing = false;
      this.selectedLocation = null;
      this.$refs.locationForm.resetFields(); // 重置Element UI表单
    },
    // 重置表单和编辑状态
    resetForm() {
      this.formModel = {
        id: '',
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        imageUrl: '',
      };
      this.isEditing = false;
      this.selectedLocation = null;
    },
  },

}

</script>