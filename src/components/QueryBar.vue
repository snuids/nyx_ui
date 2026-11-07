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
        <!-- Le bouton de telechargement est dans le champ, colle a son bord droit comme en
             production (20 x 28 px, a 5 px du bord), et non pose a cote : a cote, il flottait entre
             le champ et le bouton « Refresh ». -->
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
    modifyEvent: _.debounce(function() {
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
  created: function() {
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
/* Element UI 2 rendait `el-row` en `display: block`, et ce bandeau repose sur des `float`
   (`input-bar` a gauche, `refresh-button` a droite). Element Plus rend `el-row` en flex : les deux
   blocs devenaient des elements flex et la barre de recherche tombait a 145 px au lieu de 890. */
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

/* Le bouton de telechargement est revenu dans le champ (slot suffix) : le champ reprend toute la
   largeur du bandeau, comme la production (913 px pour une barre de 1048). */
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

/* Bouton de telechargement : 20 x 28 px, colle a 5 px du bord droit du champ, icone bleue de
   14 px — les mesures de la production (bouton [1101,118,20,28] dans un champ finissant a 1126). */
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

/* `.el-button.is-link` (deux classes) impose `height: auto` : il faut trois classes pour donner au
   bouton la hauteur du champ et garder l'icone centree. */
.el-button.search-dl-bt.is-link {
  height: 28px;
  min-height: 28px;
  padding: 0;
}

.search-dl-bt .el-icon {
  font-size: 14px;
}

/* Le suffixe d'Element Plus se pose dans le rembourrage du champ : la production laisse 15 px a
   gauche pour le texte mais 5 px a droite pour l'icone, et le champ reste haut de 28 px (avec 15 px
   des deux cotes il mesurait 30 px et l'icone tombait a 15 px du bord). */
/* Trois classes : la regle globale `.el-input--small .el-input__wrapper` (deux classes) est
   ecrite plus loin dans la feuille compilee et l'emporterait a specificite egale. */
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