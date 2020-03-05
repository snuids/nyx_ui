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
        :on-success="successUpload"
        multiple
      >
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">
          {{$t("upload.drop_file_here")}}
          <em>{{$t("upload.click_to_upload")}}</em>
        </div>
        <div class="el-upload__tip" slot="tip">
          <h2>{{config.config.tip}}</h2>
        </div>
      </el-upload>
    </div>
  </div>
</template>
  
<script>
export default {
  name: "Upload",
  data: () => ({
    fileList: [],
    uploadurl: ""
  }),
  props: {
    config: {
      type: Object
    }
  },
  methods: {
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
  }
};
</script>

<style>
.upload {
  text-align: left;
  padding-left: 10px;
}
</style>