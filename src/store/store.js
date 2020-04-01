import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios";
import moment from 'moment';
import _ from "lodash";

Vue.use(Vuex);



function computeAutoTime(minutes) {
  if (minutes <= 120)
    return "1m";
  else if (minutes <= 360)
    return "5m";
  else if (minutes <= 1440)
    return "20m";
  else if (minutes <= 1440 * 2)
    return "30m";
  else if (minutes <= 1440 * 3)
    return "2h";
  else if (minutes <= 1440 * 7)
    return "4h";
  else if (minutes <= 1440 * 32)
    return "12h";
  else if (minutes <= 1440 * 90)
    return "1d";
  else if (minutes <= 1440 * 180)
    return "7d";
  else
    return "20d";
}

export default new Vuex.Store({
  state: {
    apiurl: "api/v1/",
    apiVersion: "",
    kibanaurl: "/kibana/",
    version: "v3.12.0",
    devMode: false,
    menus: [],
    menuOpen: true,
    apps: [],
    currentSubCategory: null,
    activeApp: null,
    creds: {},
    timeRange: null,
    timeRangeWeek: null,
    timeRangeMonth: null,
    timeRangeYear: null,
    timeRangeDay: null,
    initialized: false,
    filteredmenus: [],
    autoTime: "10m",
    autoTimeDay: "5m",
    autoTimeWeek: "4h",
    autoTimeMonth: "1d",
    autoTimeYear: "1w",
    privileges: [],
    maintitle: "NYX",
    mainsubtitle: "",
    containerSize: { "width": 1200, "height": 800 },
    appConfigObj: null,
    redirection: null,
    searchCache: {},
  },
  getters: {
    apiVersion: state => state.apiVersion,
    apiurl: state => state.apiurl,
    menuOpen: state => state.menuOpen,
    kibanaurl: state => state.kibanaurl,
    menus: state => state.menus,
    apps: state => state.apps,
    creds: state => state.creds,
    currentSubCategory: state => state.currentSubCategory,
    devMode: state => state.devMode,
    activeApp: state => state.activeApp,
    timeRange: state => state.timeRange,
    timeRangeDay: state => state.timeRangeDay,
    timeRangeWeek: state => state.timeRangeWeek,
    timeRangeMonth: state => state.timeRangeMonth,
    timeRangeYear: state => state.timeRangeYear,
    initialized: state => state.initialized,
    filteredmenus: state => state.filteredmenus,
    autoTime: state => state.autoTime,
    autoTimeDay: state => state.autoTimeDay,
    autoTimeWeek: state => state.autoTimeWeek,
    autoTimeMonth: state => state.autoTimeMonth,
    autoTimeYear: state => state.autoTimeYear,
    privileges: state => state.privileges,
    filters: state => state.filters,
    maintitle: state => state.maintitle,
    mainsubtitle: state => state.mainsubtitle,
    containerSize: state => state.containerSize,
    version: state => state.version,
    appConfigObj: state => state.appConfigObj,
    redirection: state => state.redirection,
    searchCache: state => state.searchCache,

  },
  actions: {
    // privileges({ commit, state }) {
    //   var url =
    //     state.apiurl +
    //     "generic_search/nyx_privilege?token=" +
    //     state.creds.token;

    //   axios
    //     .post(url, {"size":1000})
    //     .then(response => {
    //       if (response.data.error != "")
    //         console.log("Privileges error...");
    //       else {
    //         console.log("Privileges success...");
    //         commit("privileges", response.data.records);
    //       }
    //     })
    //     .catch(error => {
    //       console.log(error);
    //     });
    // },
    // filters({ commit, state }) {
    //   var url =
    //     state.apiurl +
    //     "generic_search/nyx_filter?token=" +
    //     state.creds.token;

    //   axios
    //     .post(url, {})
    //     .then(response => {
    //       if (response.data.error != "")
    //         console.log("Filters error...");
    //       else {
    //         console.log("Filters success...");
    //         commit("filters", response.data.records);
    //       }
    //     })
    //     .catch(error => {
    //       console.log(error);
    //     });
    // }
  },

  mutations: {
    setAppConfigObj(state, payload) {
      state.appConfigObj = JSON.parse(JSON.stringify(payload));
    },
    setMenuState(state, payload) {
      state.menuOpen = payload.data;
    },
    filters(state, payload) {
      state.filters = payload.data;
    },
    privileges(state, payload) {
      state.privileges = payload.data;
    }
    ,
    version(state, payload) {
      console.log("Version mutation called.");
      state.apiVersion = payload.data;
    }
    ,
    login(state, payload) {
      console.log("Login mutation called.");
      state.initialized = false;
      state.menuOpen = true;
      state.creds = payload.data.cred;
      state.creds.hasPrivilege = function (inPrivilege) {
        if (_.includes(state.creds.user.privileges, "admin"))
          return true;
        if (_.includes(state.creds.user.privileges, inPrivilege))
          return true;
        return false;
      }
      state.menus = payload.data.menus;
      state.apps = [];
      for (var m in payload.data.menus) {
        var menu1 = payload.data.menus[m];
        if (menu1.category == "apps") {
          if (menu1.submenus != undefined && menu1.submenus.length > 0) {
            for (var sub in menu1.submenus) {
              state.apps = menu1.submenus[sub].apps;
            }
          }
        }
      }

      state.filteredmenus = []

      var cmenus = state.menus;
      for (var i in cmenus) {
        if (cmenus[i].category != "apps") {
          cmenus[i].value = cmenus[i].category.replace(/ /g, '').toLowerCase();
          for (var j in cmenus[i].submenus) {
            cmenus[i].submenus[j].value = cmenus[i].submenus[j].title.replace(/ /g, '').toLowerCase();
            cmenus[i].submenus[j].fulltitle = (cmenus[i].value + "/" + cmenus[i].submenus[j].value)
          }
          state.filteredmenus.push(cmenus[i]);
        }
      }

      var e = new Date();
      var dstart = moment(e);
      var dend;

      dstart = moment(e);
      dstart.startOf('day');
      dend = moment(e);
      dend.endOf('day');
      state.timeRangeDay = [dstart.toDate(), dend.toDate()];

      dstart = moment(e);
      dstart.startOf('week');
      dend = moment(e);
      dend.endOf('week');
      state.timeRangeWeek = [dstart.toDate(), dend.toDate()];

      dstart = moment(e);
      dstart.startOf('month');
      dend = moment(e);
      dend.endOf('month');
      state.timeRangeMonth = [dstart.toDate(), dend.toDate()];

      dstart = moment(e);
      dstart.startOf('year');
      dend = moment(e);
      dend.endOf('year');
      state.timeRangeYear = [dstart.toDate(), dend.toDate()];



      console.log("Login mutation done.");
    },
    logout(state) {
      var url =
        state.apiurl +
        "cred/logout?token=" +
        state.creds.token;

      axios
        .get(url)
        .then(response => {
          if (response.data.error != "")
            console.log("Logout error...");
          else {
            console.log("Logout success...");
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    changeContainerSize(state, payload) {
      console.log("VUEX:Change container size:");
      console.log(payload.data);
      state.containerSize = payload.data;
    },
    changeApp(state, payload) {
      console.log("changeApp mutation called.");
      var app = null;

      for (var i = 0; i < state.filteredmenus.length; i++) {
        var cat = state.filteredmenus[i]

        for (var j = 0; j < cat.submenus.length; j++) {
          var subcat = cat.submenus[j]
          for (var k = 0; k < subcat.apps.length; k++) {
            if (subcat.apps[k].rec_id === payload.data) {
              app = subcat.apps[k]
              state.currentSubCategory = subcat
              break
            }
          }
          if (app !== null)
            break
        }
        if (app !== null)
          break
      }



      state.maintitle = state.currentSubCategory.loc_title;

      state.activeApp = app
    },

    // eslint-disable-next-line
    refreshTimeRange(state, payload) {
      console.log("VUEX:RefreshTimeRange:");
      if (state.lastTimeRangeEvent.type == "relative") {// UGLY COPY OF CODE in setTimeRanbge
        var minutesmulti = 1;
        switch (state.lastTimeRangeEvent.relativeType) {
          case 'h':
            minutesmulti = 60;
            break;
          case 'd':
            minutesmulti = 24 * 60;
            break;
          case 'w':
            minutesmulti = 24 * 60 * 7;
            break;
        }
        state.autoTime = computeAutoTime(minutesmulti * state.lastTimeRangeEvent.relativeValue);
        state.timeRange = [moment().unix() - (minutesmulti * state.lastTimeRangeEvent.relativeValue * 60), moment().unix()];
        state.timeRange[0] = new Date(state.timeRange[0] * 1000);
        state.timeRange[1] = new Date(state.timeRange[1] * 1000);
      }

    },
    setTab(state, payload) {
      console.log("VUEX:Set Tab:");

      if (state.currentSubCategory.apps.length > 1)
        state.mainsubtitle = " / " + payload.data.loc_title;
      else
        state.mainsubtitle = "";
      state.activeApp = payload.data;
    },
    setTimeRange(state, payload) {
      console.log("VUEX:Set Time Range:");
      console.log(payload);

      console.log("VUEX:Sub Type " + payload.data.subtype);
      state.lastTimeRangeEvent = payload.data;

      if (payload.data.subtype == null) {
        payload.data.subtype = "classic"
      }

      let startTime = null;
      let endTime = null;
      let minutes = 0;
      let startTimeAsUtc = null; // eslint-disable-line
      let endTimeAsUtc = null;  // eslint-disable-line

      switch (payload.data.subtype) {
        case "day":
          //alert('Week Change');
          state.timeRangeDay = payload.data.range;
          startTime = moment(state.timeRangeDay[0]);
          endTime = moment(state.timeRangeDay[1]);

          //state.autoTime = "1h";
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();

          //state.autoTime = computeAutoTime(minutes);

          startTimeAsUtc = moment(state.timeRangeDay[0]).utc();
          endTimeAsUtc = moment(state.timeRangeDay[1]).utc();

          break;
        case "week":
          //alert('Week Change');
          state.timeRangeWeek = payload.data.range;
          startTime = moment(state.timeRangeWeek[0]);
          endTime = moment(state.timeRangeWeek[1]);

          //state.autoTime = "1h";
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();

          //state.autoTime = computeAutoTime(minutes);

          startTimeAsUtc = moment(state.timeRangeWeek[0]).utc();
          endTimeAsUtc = moment(state.timeRangeWeek[1]).utc();

          break;
        case "month":
          //alert('Month Change');
          state.timeRangeMonth = payload.data.range;
          startTime = moment(state.timeRangeMonth[0]);
          endTime = moment(state.timeRangeMonth[1]);

          //state.autoTime = "1d";
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();

          //state.autoTime = computeAutoTime(minutes);

          startTimeAsUtc = moment(state.timeRangeMonth[0]).utc();
          endTimeAsUtc = moment(state.timeRangeMonth[1]).utc();

          break;
        case "year":
          //alert('Year Change');
          state.timeRangeYear = payload.data.range;
          startTime = moment(state.timeRangeYear[0]);
          endTime = moment(state.timeRangeYear[1]);

          //state.autoTime = "1w";
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();

          //state.autoTime = computeAutoTime(minutes);

          startTimeAsUtc = moment(state.timeRangeYear[0]).utc();
          endTimeAsUtc = moment(state.timeRangeYear[1]).utc();
          break;

        default:
          if (payload.data.type == "absolute") {
            state.timeRange = payload.data.range;
            startTime = moment(state.timeRange[0]);
            endTime = moment(state.timeRange[1]);

            state.autoTime = "1h";
            minutes = moment.duration(endTime.diff(startTime)).asMinutes();

            state.autoTime = computeAutoTime(minutes);

            startTimeAsUtc = moment(state.timeRange[0]).utc();
            endTimeAsUtc = moment(state.timeRange[1]).utc();
          }
          else {
            //alert('coucou VUEX');
            //alert(JSON.stringify(payload.data));
            var minutesmulti = 1;
            switch (payload.data.relativeType) {
              case 'h':
                minutesmulti = 60;
                break;
              case 'd':
                minutesmulti = 24 * 60;
                break;
              case 'w':
                minutesmulti = 24 * 60 * 7;
                break;
            }
            state.autoTime = computeAutoTime(minutesmulti * payload.data.relativeValue);
            state.timeRange = [moment().unix() - (minutesmulti * payload.data.relativeValue * 60), moment().unix()];
            state.timeRange[0] = new Date(state.timeRange[0] * 1000);
            state.timeRange[1] = new Date(state.timeRange[1] * 1000);
          }
          break;
      }
    }
    ,
    updateRecord(state, payload) {
      var url =
        state.apiurl +
        "generic/" + payload.data._index + "/" + payload.data._id + "?token=" +
        state.creds.token;

      axios
        .post(url, payload.data._source)
        .then(response => {
          if (response.data.error != "")
            console.log("Save object error...");
          else {
            console.log("Save object success...");
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
    ,
    deleteRecord(state, payload) {
      console.log('deleteRecord')
      console.log(payload)
      var url =
        state.apiurl +
        "generic/" + payload.data._index + "/" + payload.data._id + "?token=" +
        state.creds.token;

      if(Object.keys(payload.data).includes('_type'))

      axios
        .delete(url)
        .then(response => {
          if (response.data.error != "")
            console.log("Save object error...");
          else {
            console.log("Save object success...");
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
    ,
    updatePGRecord(state, payload) {
      var url =
        state.apiurl +
        "pg_generic/" +
        payload.data.config.index +
        "/" +
        payload.data.config.pkey +
        "/" +
        payload.data.id +
        "?token=" +
        state.creds.token;

        console.log("updatePGRecord URL: " + url)

        axios
          .post(url, { record: payload.data.record, mode: payload.data.mode })
          .then(response => {
            if (response.data.error != "")
              console.log("Save PG object error...");
            else {
              console.log("Save PG object success...");
            }
          })
          .catch(error => {
            console.log(error);
          });
    },
    deletePGRecord(state, payload) {
      console.log(payload)
      console.log("====================================================")
      var url =
        state.apiurl +
        "pg_generic/" + payload.data.config.config.index + "/" + payload.data.config.config.pkey + "/" + payload.data.row._id + "?token=" +
        state.creds.token;

      axios
        .delete(url)
        .then(response => {
          if (response.data.error != "")
            console.log("Save object error...");
          else {
            console.log("Save object success...");
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
    ,
    sendMessage(state,payload) {
      console.log("Send Message");

      var url =
        state.apiurl +
        "sendmessage?token=" +
        state.creds.token;

      var message = {
        destination: "" + payload.data.destination,
        body: payload.data.message
      };

      axios
        .post(url, message)
        .then(response => {
          if (response.data.error != "") console.log("Unable to send message");
          else {
            
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  }
})
