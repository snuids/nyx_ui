<template>
  <div v-if="$store.getters.activeApp">
    <ChangePassword
      v-if="changePasswordVisible"
      v-on:changepassword_closed="changePasswordVisible=false"
    ></ChangePassword>
    <el-container v-bind:style="styleContainerComputed">
      <!--el-container-->
      <el-header style="text-align: right; font-size: 12px">
        <el-row :gutter="24">
          <el-col :span="1">
            <el-button circle type="primary" :icon="$icons.MoreFilled" @click="changeMenuState"></el-button>
          </el-col>
          <el-col :span="5" style="text-align: left; font-size: 22px;color:white;">
            <span>
              &nbsp;{{$store.getters.maintitle}}
            </span>
          </el-col>
          
          <el-col :span="18" style="text-align: right;" class="time-selector-row">           
            <div
              v-if="$store.getters.activeApp.timeSelectorChecked && ($store.getters.activeApp.timeSelectorType==undefined || $store.getters.activeApp.timeSelectorType=='classic')"
            >
              <!-- CLASSIC TIME SELECTED -->
              <div>
                <el-popover
                  v-if="$store.getters.activeApp.timeSelectorChecked && (timeType=='relative')"
                  placement="bottom"
                  width="500"
                  trigger="click"
                  
                  @hide="relativeTimeClosed"
                >
                  <el-form style="margin-top: 7px;">
                    <el-row>
                      <el-col :span="12">
                        <el-form-item :label="$t('time.last')">
                          <el-input-number
                            :min="1"
                            size="small"
                            v-model="relativeTimeValue"
                            autocomplete="off"
                            @change="relativeTimeClosed"
                          ></el-input-number>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item >
                        <el-select
                          style="width:97%"
                          size="small"
                          v-model="relativeTimeType"
                          :placeholder="$t('ui.select_value')"
                          @change="relativeTimeClosed"
                        >
                          <el-option :label="$t('time.minute')" value="m"></el-option>
                          <el-option :label="$t('time.hour')" value="h"></el-option>
                          <el-option :label="$t('time.day')" value="d"></el-option>
                          <el-option :label="$t('time.week')" value="w"></el-option>
                        </el-select>
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </el-form>
                  <template #reference><el-button
                    size="small"
                   
                    style="margin-right:5px;">{{$t('time.last')}} {{relativeTimeValue}} {{relativeTimeType}}</el-button></template>
                </el-popover>
              </div>
              <div 
                v-if="$store.getters.activeApp.timeSelectorChecked && (timeType=='absolute')"
              >

                <el-date-picker
                  :picker-options="rangePickerOptions"
                  v-model="timerange"
                  v-on:change="timeRangeChanged"
                  size="small"
                  type="datetimerange"
                  :range-separator="$t('time.to')"
                  :start-placeholder="$t('reportgenerator.start_date')"
                  :end-placeholder="$t('reportgenerator.end_date')"
                  align="center"
                  :clearable="false"
                  :default-time="['00:00:00', '23:59:59']"
                  :unlink-panels="true"
                ></el-date-picker>&nbsp;&nbsp;
              </div>
              <el-radio-group
                style="margin-bottom:3px;"
                @change="timeModeChanged"
                v-if="$store.getters.activeApp.timeSelectorChecked"
                size="small"
                v-model="timeType"
              >
                <el-radio-button value="absolute">{{$t('time.absolute')}}</el-radio-button>
                <el-radio-button value="relative">{{$t('time.relative')}}</el-radio-button>
              </el-radio-group>&nbsp;&nbsp;
            </div>

            <div
              v-if="$store.getters.activeApp.timeSelectorChecked && ($store.getters.activeApp.timeSelectorType=='day')"
            >
              <!-- day TIME SELECTED -->
              <el-date-picker
                v-model="dayPicker"
                v-on:change="dayChanged"
                :picker-options="{firstDayOfWeek:1}"
                type="date"
                size="small"
                :placeholder="$t('reportgenerator.pick_day')"
                :clearable="false"
              ></el-date-picker>&nbsp;&nbsp;
            </div>

            <div
              v-if="$store.getters.activeApp.timeSelectorChecked && ($store.getters.activeApp.timeSelectorType=='week')"
            >
              <!-- week TIME SELECTED -->
              <el-date-picker
                v-model="weekPicker"
                v-on:change="weekChanged"
                :picker-options="{firstDayOfWeek:1}"
                type="week"
                size="small"
                :placeholder="$t('ui.pick_week')"
                :clearable="false"
              ></el-date-picker>&nbsp;&nbsp;
            </div>
            <div
              v-if="$store.getters.activeApp.timeSelectorChecked && ($store.getters.activeApp.timeSelectorType=='month')"
            >
              <!-- month TIME SELECTED -->
              <el-date-picker
                v-model="monthPicker"
                v-on:change="monthChanged"
                type="month"
                size="small"
                :placeholder="$t('ui.pick_month')"
                :clearable="false"
              ></el-date-picker>&nbsp;&nbsp;
            </div>
            <div
              v-if="$store.getters.activeApp.timeSelectorChecked && ($store.getters.activeApp.timeSelectorType=='year')"
            >
              <!-- year TIME SELECTED -->
              <el-date-picker
                v-model="yearPicker"
                v-on:change="yearChanged"
                type="year"
                size="small"
                :placeholder="$t('ui.pick_year')"
                :clearable="false"
              ></el-date-picker>&nbsp;&nbsp;
            </div>
            <!-- </el-col>
            <el-col :span="3" style="text-align:right;">-->
            <Apps v-on:appclicked="appClicked"></Apps>&nbsp;&nbsp;            
            <Logout v-on:changepassword="changePassword"></Logout>
          </el-col>
        </el-row>
      </el-header>

      <el-container>
        <transition name="el-zoom-in-top">
          <el-aside width="201px" v-bind:style="styleAsideComputed" class="aside" v-show="menuOpen">
            <el-row class="tac">
              <el-col :span="24">
                <el-menu
                  :default-active="$store.getters.currentSubCategory.fulltitle"
                  :unique-opened="true"
                  class="el-menu-vertical"
                  style="--el-menu-text-color: var(--el-text-color-regular)"
                >
                  <!--            v-if="menu.category!='apps'"-->
                  <el-sub-menu
                    v-for="menu in filteredmenus"
                    :key="menu.category"
                    :index="menu.category"
                  >
                    <template #title>
                      <!--<el-icon><component :is="$icons.Location" /></el-icon>-->
                      <span>{{menu.loc_category}}</span>
                    </template>
                    <el-menu-item
                      v-for="subMenu in menu.submenus"
                      :index="subMenu.fulltitle"
                      :key="subMenu.fulltitle"
                      @click="appClicked(subMenu)"
                      class="submenu-item"
                    >
                      <!-- :key="menu.category+'/'+subMenu.title" -->
                      <!-- :index="menu.category+'/'+subMenu.title" -->
                      <v-icon
                        class="menuiconaside"
                        :name="subMenu.icon"
                        v-if="subMenu.icon"
                        scale="1"
                      />
                      &nbsp;{{subMenu.loc_title}}
                    </el-menu-item>
                  </el-sub-menu>
                </el-menu>
              </el-col>
            </el-row>
            <!--span style="color:white;font-size:8px;">{{$store.getters.containerSize}}</span-->
          </el-aside>
        </transition>

        <el-main class="nooverflowmain">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { registerComponent } from '@/utils/vue3shim'
import axios from "axios";
import logout from "@/components/Logout";
import apps from "@/components/Apps";
import changepassword from "@/components/ChangePassword";
import Vue from "vue";
import moment from "moment";
import _ from "lodash";

registerComponent("Logout", logout);
registerComponent("Apps", apps);
registerComponent("ChangePassword", changepassword);

// @ is an alias to /src
export default {
  name: "home",
  data: () => ({
    styleContainer: "B",
    maintitle: "NYX",
    timerange: "",
    yearPicker: moment(),
    monthPicker: moment(),
    weekPicker: moment(),
    dayPicker: moment(),
    menuOpen: true,
    resizeListener: null,
    changePasswordVisible: false,
    timeType: "absolute",

    relativeTimeType: "h",
    relativeTimeValue: 4,

    rangePickerOptions: {
    }
  }),
  computed: {
    styleContainerComputed: function() {
      return {
        overflow: "hidden",
        border: 0 + "px solid #eee",
        padding: 1 + "px",
        height: this.containerSize.height - 0 + "px"
      };
    },
    styleAsideComputed: function() {
      return {
        overflowX: "hidden",
        overflowY: "auto",
        height: this.containerSize.height - 60 + "px"
      };
    },
    apiurl() {
      return this.$store.getters.apiurl;
    },
    menus() {
      return this.$store.getters.menus;
    },
    apps() {
      return this.$store.getters.apps;
    },
    creds() {
      return this.$store.getters.creds;
    },
    filteredmenus() {
      return this.$store.getters.filteredmenus;
    },
    containerSize() {
      return this.$store.getters.containerSize;
    }
  },
  methods: {
    changeMenuState() {
      this.menuOpen = !this.menuOpen;
      this.$store.commit({
        type: "setMenuState",
        data: this.menuOpen
      });
    },
    timeModeChanged(e) {
      this.timeType = null
      this.timeType = e
      if (e == "relative") {
        this.relativeTimeClosed();
      } else if (e == "absolute") {
        this.timeRangeChanged(this.timerange);
      }
    },
    relativeTimeClosed: _.debounce(function() {
      this.$store.commit({
        type: "setTimeRange",
        data: {
          type: "relative",
          relativeType: this.relativeTimeType,
          relativeValue: this.relativeTimeValue
        }
      });
      this.$globalbus.$emit("timerangechanged", {
        type: "relative",
        subtype: "classic"
      });
    }, 500),    
    dayChanged(e) {
      var dstart = moment(e);
      var dend = moment(e);
      dend.endOf("day");

      var ran = [dstart.toDate(), dend.toDate()];
      this.timerange = ran;
      this.$store.commit({
        type: "setTimeRange",
        data: { range: ran, type: "absolute", subtype: "day" }
      });
      this.$globalbus.$emit("timerangechanged", {
        range: ran,
        type: "absolute",
        subtype: "day"
      });
    },
    weekChanged(e) {
      var dstart = moment(e);
      var dend = moment(e);
      dend.endOf("week");

      var ran = [dstart.toDate(), dend.toDate()];
      this.timerange = ran;
      this.$store.commit({
        type: "setTimeRange",
        data: { range: ran, type: "absolute", subtype: "week" }
      });
      this.$globalbus.$emit("timerangechanged", {
        range: ran,
        type: "absolute",
        subtype: "week"
      });
    },
    monthChanged(e) {
      var dstart = moment(e);
      var dend = moment(e);
      dend.endOf("month");

      var ran = [dstart.toDate(), dend.toDate()];
      this.timerange = ran;
      this.$store.commit({
        type: "setTimeRange",
        data: { range: ran, type: "absolute", subtype: "month" }
      });
      this.$globalbus.$emit("timerangechanged", {
        range: ran,
        type: "absolute",
        subtype: "month"
      });
    },
    yearChanged(e) {
      var dstart = moment(e);
      var dend = moment(e);
      dend.endOf("year");

      var ran = [dstart.toDate(), dend.toDate()];
      this.timerange = ran;
      this.$store.commit({
        type: "setTimeRange",
        data: { range: ran, type: "absolute", subtype: "year" }
      });
      this.$globalbus.$emit("timerangechanged", {
        range: ran,
        type: "absolute",
        subtype: "year"
      });
    },
    timeRangeChanged(e) {
      this.timerange = e;
      this.$store.commit({
        type: "setTimeRange",
        data: { range: e, type: "absolute", subtype: "classic" }
      });
      this.$globalbus.$emit("timerangechanged", {
        range: e,
        type: "absolute",
        subtype: "classic"
      });
    },
    changePassword() {
      this.changePasswordVisible = true;
    },
    appClicked(e) {
      if (e.type == "external") {
        let url = e.config.url;
        if (url.startsWith('.')) {
          // Build full URL from relative path
          const origin = window.location.origin;
          url = origin + '/' + url.replace(/^\.\//, '');
        }        
        window.open(url);
      } else {
        // A submenu may hold no application (empty menu entry, application removed from the
        // catalogue): without this guard the click raised a TypeError on `apps[0].rec_id`, the
        // error surfaced in the console and the menu looked broken.
        if (!e.apps || e.apps.length === 0) return;

        this.maintitle = e.loc_title;
    
        var path = "/main/" + e.apps[0].rec_id

        if(path != this.$route.path)
          this.$router.push(path);
      }
    },
    changeContainerSize: _.debounce(function(newSize) {
      this.$store.commit({
        type: "changeContainerSize",
        data: { height: newSize.innerHeight, width: newSize.innerWidth }
      });
    }, 500)
  },
  created: async function() {

    this.rangePickerOptions= {
      shortcuts: [
        {
          text: this.$t("datepicker.last_24_hours"),
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 1);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: this.$t("datepicker.last_7_days"),
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: this.$t("datepicker.previous_month"),
          onClick(picker) {
            const start = new Date();
            var dateFrom = moment(start)
              .subtract(1, "months")
              .startOf("month")
              .toDate();
            var dateTo = moment(start)
              .subtract(1, "months")
              .endOf("month")
              .toDate();
            picker.$emit("pick", [dateFrom, dateTo]);
          }
        },
        {
          text: this.$t("datepicker.current_month"),
          onClick(picker) {
            const start = new moment().startOf("month").toDate();
            const end = new moment().endOf("month").toDate();
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: this.$t("datepicker.next_month"),
          onClick(picker) {
            const start = new Date();
            var dateFrom = moment(start)
              .add(1, "months")
              .startOf("month")
              .toDate();
            var dateTo = moment(start)
              .add(1, "months")
              .endOf("month")
              .toDate();
            picker.$emit("pick", [dateFrom, dateTo]);
          }
        },
        {
          text: this.$t("datepicker.last_3_months"),
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: this.$t("datepicker.last_year"),
          onClick(picker) {
            const end = new Date();
            const start = new Date();
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 365);
            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: this.$t("datepicker.today"),
          onClick(picker) {
            const end = moment()
              .startOf("day")
              .add(1, "d")
              .toDate();
            const start = moment()
              .startOf("day")
              .toDate();

            picker.$emit("pick", [start, end]);
          }
        },
        {
          text: this.$t("datepicker.current_week"),
          onClick(picker) {
            const start = new moment().startOf("week").toDate();
            const end = new moment().endOf("week").toDate();
            picker.$emit("pick", [start, end]);
          }
        },
        {
          
          text: this.$t("datepicker.current_year"),
          onClick(picker) {
            const start = new moment().startOf("year").toDate();
            const end = new moment().endOf("year").toDate();
            picker.$emit("pick", [start, end]);
          }
        }
      ]
    }

    if (this.$store.getters.currentSubCategory == undefined && localStorage.authResponse) {
        var path = this.$route.path
        if(path[path.length-1] == '/')
          path = path.substring(0, path.length-1)

        var rec_id = path.replace('/main/', '')

        var authResponse = JSON.parse(localStorage.authResponse)

        var url =
          this.$store.getters.apiurl +
          "status?token=" +
          authResponse.data.cred.token;

        try {

          const response = await axios.get(url)

          if(response.status == 200 && response.data.error=='') {
            this.$store.commit({
              type: "login",
              data: authResponse.data
            });

            // Restore the user's language after a page reload.
            if(authResponse.data.cred.user.language != undefined) {
              this.$i18n.locale = authResponse.data.cred.user.language;
            }
            
            this.$store.commit({
              type: "changeApp",
              data: rec_id
            });

            if(authResponse.data.cred.user.privileges.includes('admin') || authResponse.data.cred.user.privileges.includes('user')) {
              this.$store.commit({
                type: "privileges",
                data: authResponse.data.all_priv
              });
              this.$store.commit({
                type: "filters",
                data: authResponse.data.all_filters
              });
            }
          }
        }
        catch (e){ // eslint-disable-line no-unused-vars
        }
    }


    if (this.$store.getters.currentSubCategory == undefined) {
      path = this.$route.path
      if(path[path.length-1] == '/')
              path = path.substring(0, path.length-1)


      this.$store.state.redirection = path
      
      
      this.$router.push("/");

      return;
    }

    const end = new Date();
    const start = new Date();
    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
    this.timeRangeChanged([start, end]);
  },
  mounted: function() {
    this.$globalbus.$on("forcetime", payLoad => {

      let val = payLoad.substring(0, payLoad.length-1)
      let unit = payLoad.substring(payLoad.length-1, payLoad.length)

      this.yearPicker =  moment().add(val, unit)
      this.monthPicker =  moment().add(val, unit)
      this.weekPicker =  moment().add(val, unit)
      this.dayPicker =  moment().add(val, unit)

      if(this.$store.getters.activeApp.timeSelectorChecked && (this.$store.getters.activeApp.timeSelectorType=='year')) {
        this.yearChanged(this.monthPicker.format('YYYY'))
      }
      else if(this.$store.getters.activeApp.timeSelectorChecked && (this.$store.getters.activeApp.timeSelectorType=='month')) {
        this.monthChanged(this.monthPicker.format('YYYY-MM'))
      }
      else if(this.$store.getters.activeApp.timeSelectorChecked && (this.$store.getters.activeApp.timeSelectorType=='week')) {
        this.weekChanged(this.monthPicker.format('YYYY-MM-DD'))
      }
      else if(this.$store.getters.activeApp.timeSelectorChecked && (this.$store.getters.activeApp.timeSelectorType=='day')) {
        this.dayChanged(this.monthPicker.format('YYYY-MM-DD'))
      }
      
      
    });
    this.$globalbus.$on("charttimerangeupdated", payLoad => {
      const end = new Date();
      const start = new Date();
      start.setTime(payLoad[0]);
      end.setTime(payLoad[1]);
      this.timeType = "absolute";

      this.timeRangeChanged([start, end]);
    });

    this.$store.commit({
      type: "changeContainerSize",
      data: { height: window.innerHeight, width: window.innerWidth }
    });

    this.$nextTick(() => {
      this.resizeListener = window.addEventListener("resize", () => {
        this.changeContainerSize(window);
      });
    });
  },
  beforeUnmount: function() {
    this.$globalbus.$off("charttimerangeupdated");
    this.$globalbus.$off("forcetime");
    window.removeEventListener("resize", this.resizeListener);
  }
};
</script>
<style>
.el-aside {
  border-right: 1px solid rgb(226, 226, 226);
}

.el-aside .el-menu {
  border-right: none;
}

.el-main {
  padding: 2px !important;
  padding-left: 10px !important;
}

body {
  margin: 0px;
  overflow: hidden;
}

.aside {
  text-align: left;
  overflow: none;
  height: 100%;
}
.aside .el-menu-vertical:not(.el-menu--collapse) {
  width: 100%;
}

/* Element Plus renamed `.el-submenu` to `.el-sub-menu`: without these selectors the 40 px heights
   defined here stopped applying and the entries fell back to the default 56 px, which made the left
   bar much taller than before. The old selectors are kept, they do no harm. */
.el-submenu__title,
.el-sub-menu__title {
  height: 40px !important;
  line-height: 40px !important;
  font-weight: bold;
}

.el-submenu .el-menu-item,
.el-sub-menu .el-menu-item {
  height: 40px !important;
  line-height: 40px !important;
  padding: 0 45px;
  min-width: 200px;
}

.aside .el-submenu .el-menu-item,
.aside .el-sub-menu .el-menu-item {
  min-width: 0;
}

/* The header centres its children with `line-height: 60px`. Element Plus buttons are
   `inline-flex`, so they sit on the baseline: the round button on the right dropped below the
   rest. */
/* Element UI 2 centred the header buttons through the line (`line-height: 60px`). Element Plus
   uses `inline-flex` boxes, which sit on the baseline: they dropped by 2 px, and the avatar button
   left the header altogether (-2 px) because its `.el-dropdown` was only 40 px tall.
   The row therefore becomes a flex container: each column centres its content vertically, and the
   last one is right-aligned. No more manual offsets. */
.el-header .el-row {
  display: flex;
  align-items: center;
  height: 60px;
  /* The header inherits `line-height: 60px`. With flex columns, that 60 px line adds to the
     content as soon as a date picker appears and shifts the buttons by a few pixels. In flex,
     centring is done by `align-items`: the line is no longer needed. */
  line-height: normal;
}

.el-header .el-row > .el-col {
  display: flex;
  align-items: center;
}

.el-header .el-row > .el-col:last-child {
  justify-content: flex-end;
}

/* The account menu trigger is wrapped in a <span>: the 60 px line of the span puts the
   `el-dropdown` at the top, which glues the avatar button to the upper edge. `vertical-align: middle`
   recentres it in the line, as Element UI 2 did. */
.el-header .el-dropdown {
  vertical-align: middle;
}

/* Without this, the flex column squeezes the round button (31 x 40 instead of 40 x 40). */
.el-header .el-button {
  flex-shrink: 0;
}

.el-header .el-button.is-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Element UI 2: 40 px round button. Element Plus sizes it with
     --el-component-size (36 px here), hence a button smaller than in the header. */
  width: 40px;
  height: 40px;
}

.menuiconaside {
  margin-bottom: 3px;
}
.menuiconbig {
  margin-bottom: -8px;
  color: white;
}
.nooverflowmain {
  overflow: hidden !important;
}

/* Element Plus puts the padding on `.el-dialog` (16 px), whereas Element UI 2 put it on
   `__header` and `__body`. The blue header therefore no longer touched the edges of the window: it
   floated inside, without the rounded corners, and the close cross turned black. We restore the
   Element UI 2 box model. */
/* The `.el-overlay` prefix is not cosmetic: Element Plus defines `.el-dialog` with a single
   class, and depending on the stylesheet injection order (development, HMR) its rule can come after
   ours. With two classes, ours wins in every case. */
.el-overlay .el-dialog {
  padding: 0;
  border-radius: 4px;
  overflow: hidden;
}

/* Element UI 2: 54 px band, title on the left, 16 px cross in the corner. Element Plus centres
   (it inherits `text-align: center` from #app), reserves 32 px on the right for a 48 px cross, and
   therefore leaves a lot of empty space at the top — that is what showed. */
.el-overlay .el-dialog__header {
  background-color: #409eff !important;
  /* Element UI 2: 20 px on both sides; the close cross is absolutely positioned, it does not
     need the title to leave it room. The 40 px on the right seen in production came from
     Element Plus, which reserves room for its 48 px cross. */
  padding: 20px 20px 10px;
  text-align: left;
}

.el-overlay .el-dialog__title {
  color: white !important;
  font-size: 18px;
  line-height: 24px;
}

.el-overlay .el-dialog__headerbtn {
  top: 20px;
  right: 20px;
  width: 24px;
  height: 24px;
  font-size: 16px;
}

.el-overlay .el-dialog__headerbtn .el-dialog__close {
  font-size: 16px;
}

/* Element UI 2 put 30 px at the top of the body; in use the gap under the title band looks too
   large (42 px measured), especially in the windows that start with a tab bar.
   20 px is an explicit choice of the user: the gap becomes 32 px and the port differs here from
   the previous production, on purpose. */
.el-overlay .el-dialog__body {
  padding: 20px 20px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.el-overlay .el-dialog__footer {
  padding: 10px 20px 20px;
}

/* The header centres its elements with `line-height: 60px`, and a field inherits that line height:
   the inner wrapper of Element Plus then stretches to 58 px inside a 28 px control, so the text sits
   at the bottom of a white box taller than the header. The month picker showed it most clearly (a
   single wide field, with empty space above the text). Two values give the field its height back: the
   wrapper becomes the flex Element Plus declares again, and its line becomes normal again. */
.el-header .el-date-editor .el-input__wrapper {
  display: inline-flex;
  align-items: center;
  line-height: normal;
  height: 26px;
}

/* Same gap for the confirmation boxes ($alert / $confirm / $prompt): Element Plus puts 12 px of
   padding around the box and none at the top of the header, so the title started 12 px lower than
   in Element UI 2. */
.el-overlay-message-box .el-message-box {
  padding: 0 0 10px;
  border-radius: 4px;
}

.el-overlay-message-box .el-message-box__header {
  padding: 15px 15px 10px;
}

.el-overlay-message-box .el-message-box__title {
  font-size: 18px;
  line-height: 24px;
  color: var(--el-text-color-primary);
}

.el-overlay-message-box .el-message-box__headerbtn {
  top: 15px;
  right: 15px;
  width: 24px;
  height: 24px;
}

.el-overlay-message-box .el-message-box__content {
  padding: 10px 15px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.el-overlay-message-box .el-message-box__btns {
  padding: 5px 15px 0;
}

.el-dialog__headerbtn .el-dialog__close {
  color: white !important;
}

.el-picker-panel [slot="sidebar"] + .el-picker-panel__body,
.el-picker-panel__sidebar + .el-picker-panel__body {
  margin-left: 160px !important;
}

.el-picker-panel [slot="sidebar"],
.el-picker-panel__sidebar {
  width: 150px !important;
}

.el-header {
  background-color: white !important;
  border-bottom: 1px solid lightgrey !important;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  line-height: 60px;
}

.el-header .el-col-5 span {
  font-weight: bold;
  color: #c0c4cc;
}

.el-header .el-col-5 {
  max-height: 60px;
  overflow: hidden;
}

.el-dialog__header {
  background-color: #409eff !important;
}
.login-container {
  background-color: #66b1ff !important;
}

.el-table th > .cell {
  color: black;
}

.el-form-item__error {
  top: 80% !important;
}

.el-loading-mask {
  background-color: hsla(0, 0%, 100%, 0.7) !important;
  transition: opacity 2.1s !important;
}

.time-selector-row div {
  display: inline-block;
}

</style>