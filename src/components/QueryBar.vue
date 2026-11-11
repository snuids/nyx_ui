<template>
  <el-row class="query-bar">    
    <div :class="config.type =='kibana'? 'input-bar-with-kibana' : 'input-bar'">   
      
      <el-input
        :placeholder="this.$t('querybar.default')"
        class="query-input"
        size="small"
        v-model="query"
        @change="refresh()"
      >
        <template #prefix><el-icon class="prefix-icon"><component :is="$icons.ArrowRight" /></el-icon></template>
        <!-- The download button is inside the field, against its right edge as in production
             (20 x 28 px, 5 px from the edge), and not placed beside it: beside it, it floated
             between the field and the "Refresh" button. -->
        <template #suffix>
          <el-popover
            placement="bottom-start"
            width="150"
            trigger="hover"
            v-if="config && config.downloadChecked"
            :open-delay="1000"
          >
            <el-col>
              <el-row class="popover-title">
                <span>{{this.$t('querybar.download')}}</span>
              </el-row>
              <el-row class="button-dl">
                <el-button
                  v-for="format in exportFormats"
                  :type="format.type"
                  :key="format.value"
                  round
                  size="small"
                  @click="downloadSelection(format.value)"
                >{{format.label}}</el-button>
              </el-row>
            </el-col>
            <template #reference>
              <el-button
                class="search-dl-bt"
                link
                :icon="$icons.Download"
                size="small"
              ></el-button>
            </template>
          </el-popover>
        </template>
      </el-input>
    </div>
    <div class="refresh-button" v-if="config.type !='kibana' ">
      <el-button @click="refresh()" style="width:90%;" size="small" type="primary">{{this.$t('generic.refresh')}}</el-button>
    </div>
  </el-row>
</template>
  
<script>
import _ from "lodash";

export default {
  name: "QueryBar",
  data: () => ({
    query: '',
    oldQuery: '',
    storageKey: null,
    blurDebounce: 1000,
    blockEvent: true,
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
      
      this.$store.getters.searchCache[this.config.rec_id] = this.query;
    
    },
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
  created: function() {
    // `_.debounce` creates only ONE function for the whole module: two QueryBars (one tab per
    // application in GenericComponent) shared the same timer, and a search typed in one tab
    // cancelled the one pending in the other. The debounce is therefore built per instance.
    this.modifyEvent = _.debounce(() => {
      console.log("modify event ");

      if(this.blockEvent) {
        console.log('event blocked')
        return
      }

      if (this.query !== this.oldQuery) {
        console.log("emit");
        this.$emit("querychanged", this.query);
        this.$store.getters.searchCache[this.config.rec_id] = this.query;
        this.oldQuery = this.query;
      }
    }, 1500)

    console.log('created event')
    this.blockEvent = true
    
    if(this.$store.getters.searchCache[this.config.rec_id] != null)
      this.query = this.$store.getters.searchCache[this.config.rec_id];
    
    console.log('emit')
    this.$emit("querychanged", this.query);
    setTimeout(() => {this.blockEvent = false;}, 1700)
  }
};
</script>

<style>
/* Element UI 2 rendered `el-row` as `display: block`, and this bar relies on `float`s
   (`input-bar` on the left, `refresh-button` on the right). Element Plus renders `el-row`
   as flex: both blocks became flex items and the search bar fell to 145 px instead of 890. */
.query-bar {
  display: block;
}

.query-bar::after {
  content: '';
  display: table;
  clear: both;
}

.query-bar .input-bar {
  width: -webkit-calc(100% - 135px);
  width: -moz-calc(100% - 135px);
  width: calc(100% - 135px);
  float: left;
}

/* The download button is back inside the field (suffix slot): the field takes the whole
   width of the bar again, as in production (913 px for a bar of 1048). */
.query-bar .input-bar .query-input {
  width: 100%;
}


.query-bar .input-bar-with-kibana {
  width: -webkit-calc(100% - 5px);
  width: -moz-calc(100% - 5px);
  width: calc(100% - 5px);
  float: left;
}

.query-bar .input-bar-with-kibana .query-input {
  width: 100%;
}

.query-bar .refresh-button {
  width: 130px;
  float: right;
}

/* Download button: 20 x 28 px, 5 px from the right edge of the field, 14 px blue icon —
   the production measurements (button [1101,118,20,28] in a field ending at 1126). */
.search-dl-bt {
  --el-button-text-color: var(--el-color-primary);
  --el-button-hover-text-color: var(--el-color-primary);
  --el-button-hover-link-text-color: var(--el-color-primary);
  color: var(--el-color-primary);
  width: 20px;
  height: 28px;
  min-height: 28px;
  padding: 0;
  margin: 0;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* `.el-button.is-link` (two classes) imposes `height: auto`: three classes are needed to
   give the button the height of the field and keep the icon centred. */
.el-button.search-dl-bt.is-link {
  height: 28px;
  min-height: 28px;
  padding: 0;
}

.search-dl-bt .el-icon {
  font-size: 14px;
}

/* The Element Plus suffix sits in the padding of the field: production leaves 15 px on the
   left for the text but 5 px on the right for the icon, and the field stays 28 px high (with
   15 px on both sides it measured 30 px and the icon fell 15 px from the edge). */
/* Three classes: the global rule `.el-input--small .el-input__wrapper` (two classes) is
   written further down the compiled sheet and would win at equal specificity. */
.query-bar .query-input .el-input__wrapper {
  padding: 0 5px 0 15px;
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