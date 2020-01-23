<template>
  <el-row class="query-bar">
    <div class="input-bar">
      <el-input
        placeholder="Search... (e.g. status:200 AND platform:NYX)"
        class="query-input"
        size="mini"
        v-model="query"
        @change="refresh()"
      >
        <i slot="prefix" class="prefix-icon el-input__icon el-icon-arrow-right"></i>
        <el-popover
          slot="suffix"
          placement="bottom-start"
          width="150"
          trigger="hover"
          v-if="config && config.downloadChecked"
        >
          <el-col>
            <el-row class="popover-title">
              <span>Download the selection</span>
            </el-row>
            <el-row class="button-dl">
              <el-button
                v-for="format in exportFormats"
                :type="format.type"
                :key="format.value"
                round
                size="mini"
                @click="downloadSelection(format.value)"
              >{{format.label}}</el-button>
            </el-row>
          </el-col>
          <el-button
            class="search-dl-bt"
            type="text"
            icon="el-icon-download"
            slot="reference"
            size="medium"
          ></el-button>
        </el-popover>
      </el-input>
    </div>
    <div class="refresh-button">
      <el-button @click="refresh()" style="width:90%;" size="mini" type="primary">refresh</el-button>
    </div>
  </el-row>
</template>
  
<script>
export default {
  name: "QueryBar",
  data: () => ({
    query: "",
    oldQuery: "",
    blurDebounce: 1000,
    blockEvent: false,
    exportFormats: [
      {
        label: ".xlsx",
        value: "xlsx",
        type: "success"
      },
      {
        label: ".csv",
        value: "csv",
        type: "success"
      }
    ]
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
    refresh: function() {

      this.blockEvent = true;
      setTimeout(() => {this.blockEvent = false;}, 1500)
      
      console.log("refresh");
      this.$emit("querychanged", this.query);
    
    },
    modifyEvent: _.debounce(function() {
      console.log("modify event");

      if(this.blockEvent) {
        console.log('event blocked')
        return
      }

      if (this.query != this.oldQuery) {
        console.log("emit");
        this.$emit("querychanged", this.query);
        this.oldQuery = this.query;
      }
    }, 1500),
    downloadSelection: function(format) {
      this.$emit("downloadasked", format);
    },
  },
  computed: {
    configin: function() {
      return this.config;
    },
    containerHeight: function() {
      return this.$store.getters.containerSize.height + "px";
    }
  },
  watch: {
    configin: function() {},
    query: function() {
      this.modifyEvent();
    }
  },
  created: function() {}
};
</script>

<style>
.query-bar .input-bar {
  width: -webkit-calc(100% - 135px);
  width: -moz-calc(100% - 135px);
  width: calc(100% - 135px);
  float: left;
}
.query-bar .refresh-button {
  width: 130px;
  float: right;
}

.search-dl-bt {
  height: 100%;
  margin-right: 1px;
  padding: 0px !important;
}

.search-dl-bt i {
  font-size: 18px;
}

.query-input input::placeholder {
  color: grey !important;
}

.query-input .prefix-icon {
  color: grey !important;
}

.query-input input {
  color: black !important;
}

.button-dl {
  text-align: center;
  margin: 5px;
}

.el-popover {
  font-family: "Helvetica Neue";
}

.popover-title {
  border-bottom: 1px solid #c3c3c3;
  width: 100%;
  padding-bottom: 5px;
  margin-bottom: 10px;
  text-align: center;
}
</style>