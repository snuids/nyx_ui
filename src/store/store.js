import Vue from 'vue'
import Vuex from 'vuex'
import axios from "axios";
import moment from 'moment';
import _ from "lodash";

import { extractURLParts } from "../globalfunctions";

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
function stopSocket(wsObject)
{
  if(wsObject.socket!=undefined)
  {
    console.log("Closing socket....");
    try{
      wsObject.socket.close();
    }
    catch(err)
    {
      console.log("ERROR"+err);
    }
    
  }
}


export default new Vuex.Store({
  state: {
    apiurl: "api/v1/",
    apiVersion: "",
    kibanaurl: "/kibana/",
    version: "v3.27.2",
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
    elasticVersion: 0,
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
    passwordRules: null,
    searchCache: {},
    wsObject:{"check_alive":false}
  },
  getters: {
    wsObject: state => state.wsObject,
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
    elasticVersion: state => state.elasticVersion,
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
    passwordRules: state => state.passwordRules,

  },
  actions: {
    switchToApp(context, payload) {
      console.log("switch to app mutation called.");
      console.log(payload);
      for (var i = 0; i < context.getters.filteredmenus.length; i++) {
        var cat = context.getters.filteredmenus[i]

        for (var j = 0; j < cat.submenus.length; j++) {
          var subcat = cat.submenus[j]
          for (var k = 0; k < subcat.apps.length; k++) {
            console.log(subcat.apps[k].title);
            if (subcat.apps[k].title.toLowerCase() === payload) {              
              return Promise.resolve(subcat.apps[k].rec_id);              
            }
          }
        }
      } 
    }
    ,
    check_websocket : (context,payload) => {
      //state.name = payload,
      if(context.getters.wsObject.check_alive)
      {
        if(context.getters.wsObject.socket!=null)
        {          
          if((context.getters.wsObject.last_lifesign!=null)
          &&(moment(new Date())-context.getters.wsObject.last_lifesign>10000))
          {
            console.log(moment(new Date())-context.getters.wsObject.last_lifesign);
            console.log("Socket Not Responding...");
            stopSocket(context.getters.wsObject);
            context.getters.wsObject.socket=null;
          }
        }
        if(context.getters.wsObject.socket===null)
        {
          console.log("MUST CREATE SOCKET");
          try {
            context.getters.wsObject.last_lifesign=moment(new Date());
          //var socket = new WebSocket('ws://localhost:8080/nyx_ui_websocket/');
          //var socket = new WebSocket('wss://test2.nyx-ds.com/nyx_ui_websocket/');
          //var wsurl=context.getters.apiurl.replace("http://","ws://").replace("https://","wss://").replace("/api/v1","/nyx_ui_websocket/");
          var mainurl=extractURLParts(window.location.href);
          var wsurl=mainurl.protocol+"//"+mainurl.host+"/nyx_ui_websocket/"; 
                   
          wsurl=wsurl.replace("https://","wss://").replace("http://","ws://");
          if(context.getters.apiurl.indexOf("http")>=0)
          {
            wsurl=context.getters.apiurl.replace("http://","ws://").replace("https://","wss://").replace("/api/v1","/nyx_ui_websocket/");
          }
          //wsurl='ws://localhost:8080/nyx_ui_websocket/';

          var socket = new WebSocket(wsurl);
          // Connection opened
          socket.addEventListener('open', function (event) {
            
            socket.send(JSON.stringify(context.getters.creds));
          });

          // Connection opened
          socket.addEventListener('error', function (event) {
            console.log('SOCKET error');
            stopSocket(context.getters.wsObject);
            context.getters.wsObject.socket=null;
          });
    
          // Listen for messages
          socket.addEventListener('message', function (event) {
            //console.log('Message from server ', event.data);
            var inmes=JSON.parse(event.data);
            context.getters.wsObject.last_lifesign=moment(new Date());
            //console.log(inmes);
            
            if(inmes.type=="message")
              Vue.prototype.$globalbus.$emit("messagereceived",inmes.data);
          });
          context.getters.wsObject.socket=socket; 
          } catch (error) {
            console.error('Web Socket Error:', error);
            
          }
                   
        }
        
      }
      
      
    }
    ,
  },
  mutations: {
    elasticVersion(state, payload) {
      state.elasticVersion = payload.data;
    },
    setAppConfigObj(state, payload) {
      state.appConfigObj = JSON.parse(JSON.stringify(payload));
    },
    setMenuState(state, payload) {
      state.menuOpen = payload.data;
    },
    filters(state, payload) {
      state.filters = payload.data;
      //alert(JSON.stringify(state.filters));
    },
    privileges(state, payload) {
      state.privileges = payload.data;
    }
    ,
    version(state, payload) {
      console.log("Version mutation called.");
      state.apiVersion = payload.data;
    },
    setPasswordRules(state, payload) {
      let index =  'nyx_config'
      let id    =  'password_rules'

      var url =
        state.apiurl +
        "generic/"+index+"/"+id+"?token=" +
        state.creds.token;

      axios
        .post(url, payload.data)
        .then(response => {
          state.passwordRules = payload.data
        })
        .catch(error => {
          console.log(error);
        });
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

        
        if( Array.isArray(inPrivilege))
        {
          for (var i=0;i<inPrivilege.length;i++)
            if (_.includes(state.creds.user.privileges, inPrivilege[i]))
              return true;
        }
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

      // WEB SOCKET
      //const socket = new WebSocket('wss://test2.nyx-ds.com/nyx_ui_websocket/');
      state.wsObject.check_alive=true;

      // PASSWORD RULES
      let index =  'nyx_config'
      let id    =  'password_rules'

      var url =
        state.apiurl +
        "generic/"+index+"/"+id+"?token=" +
        state.creds.token;

      state.passwordRules = {
        length: [10, 40],
        forceUpper: false,
        minUpper: 0,
        forceNumber: false,
        minNumber: 0,
        forceSpecial: false,
        minSpecial: 0
      };
      // axios
      //   .get(url)
      //   .then(response => {
          
      //     if (response.data.error != "")
      //       state.passwordRules = {
      //         length: [10, 40],
      //         forceUpper: false,
      //         minUpper: 0,
      //         forceNumber: false,
      //         minNumber: 0,
      //         forceSpecial: false,
      //         minSpecial: 0
      //       };
      //     else {
      //       state.passwordRules = response.data.data._source
      //     }
      //   })
      //   .catch(error => {
      //     console.log(error);
      //   });
      
    },    
    logout(state) {
      state.wsObject.check_alive=false;
      stopSocket(state.wsObject);

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

      console.log(app)
      if(app.timeDefault != null && app.timeDefault != '') {
        console.log('send forcetime')
        Vue.prototype.$globalbus.$emit("forcetime",app.timeDefault);
        console.log('send forcetime')
      }
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
          state.timeRangeDay = payload.data.range;
          startTime = moment(state.timeRangeDay[0]);
          endTime = moment(state.timeRangeDay[1]);
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();
          startTimeAsUtc = moment(state.timeRangeDay[0]).utc();
          endTimeAsUtc = moment(state.timeRangeDay[1]).utc();

          break;
        case "week":
          state.timeRangeWeek = payload.data.range;
          startTime = moment(state.timeRangeWeek[0]);
          endTime = moment(state.timeRangeWeek[1]);
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();
          startTimeAsUtc = moment(state.timeRangeWeek[0]).utc();
          endTimeAsUtc = moment(state.timeRangeWeek[1]).utc();

          break;
        case "month":
          state.timeRangeMonth = payload.data.range;
          startTime = moment(state.timeRangeMonth[0]);
          endTime = moment(state.timeRangeMonth[1]);
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();
          startTimeAsUtc = moment(state.timeRangeMonth[0]).utc();
          endTimeAsUtc = moment(state.timeRangeMonth[1]).utc();

          break;
        case "year":
          state.timeRangeYear = payload.data.range;
          startTime = moment(state.timeRangeYear[0]);
          endTime = moment(state.timeRangeYear[1]);
          minutes = moment.duration(endTime.diff(startTime)).asMinutes();
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
      let url =
        state.apiurl +
        "generic/" + payload.data._index + "/" + payload.data._id + "?token=" +
        state.creds.token;

      if(Object.keys(payload.data).includes('_type'))
        url += '&doc_type=' + payload.data._type

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
            console.log('message sent')
          }
        })
        .catch(error => {
          console.log(error);
        });
    }
  }
})
