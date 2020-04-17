<template slot="items">
  <div class="upload">
    <h2></h2>
    <div style="text-align:center;width:100%">
      <el-upload
        class="upload-box"
        drag
        :action="uploadurl"
        :auto-upload="true"
        :file-list="fileList"
        :accept="accept"
        :on-success="successUpload"
        multiple
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          {{$t("upload.drop_file_here")}}
          <em>{{$t("upload.click_to_upload")}}</em>
        </div>
        <div class="el-upload__tip" slot="tip">
          <h2>{{computeTranslatedText(config.config.tip,$store.getters.creds.user.language)}}</h2>
        </div>
        <span v-if="accept != undefined & accept != ''">          
        ({{accept}})
        </span>
      </el-upload>
    </div>
  </div>
</template>
  
<script>
import {computeTranslatedText} from '../globalfunctions'

export default {
  name: "Upload",
  data: () => ({
    fileList: [],
    accept:"",
    uploadurl: ""
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
    computeTranslatedText: function(inText,inLocale){      
      return computeTranslatedText(inText,inLocale);
    },
    successUpload: function(response, file, fileList) {
      console.log("emit event on-success");
      this.$emit("on-success", response, file, fileList);
    }
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
    configin: function() {
      this.uploadurl =
        this.$store.getters.apiurl +
        "upload?token=" +
        this.$store.getters.creds.token +
        "&queue=" +
        this.config.config.queue;
    }
  },
  created: function() {
    this.uploadurl =
      this.$store.getters.apiurl +
      "upload?token=" +
      this.$store.getters.creds.token +
      "&queue=" +
      this.config.config.queue;
    this.accept=this.config.config.filetypes;
  },
  mounted: function(){
    console.log("===============  REGISTERING LOCAL MESSSAGE:");
    this.$localbus.$on("localmessagereceived", payLoad => {
      console.log("LOCALBUS/GENERICCOMPONENT/LOCALMESSAGERECEIVED");
      console.log(payLoad);
      //alert(payLoad)      
    }); 
  },
  destroyed: function() {
    console.log("===============  UN REGISTERING LOCAL MESSSAGE:");
    this.$localbus.$off("localmessagereceived");
  }

};
</script>

<style>
.upload {
  text-align: left;
  padding-left: 10px;
}
</style>