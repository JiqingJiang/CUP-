<!-- LocationsList.vue -->
<template>
  <div>
    <div>位置：</div>
    <div v-for="location in locations" :key="location.id">
      {{ location.name }}
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'LocationsList',
  data() {
    return {
      locations: [],
    };
  },
  mounted() {
    axios.get('http://localhost:3000/locations')
        .then(response => {
          this.locations = response.data;
        })
        .catch(error => {
          console.error("There was an error fetching the locations:", error);
        });
  },
};
</script>
