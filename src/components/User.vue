<template>
  <div>
    <UserDetails
      v-if="dialogFormVisible"
      :record="currentRecord"
      v-on:dialogcloseupdated="dialogClosed()"
      v-on:dialogclose="dialogClosed()"
    ></UserDetails>

    <el-table
      size="mini"
      :data="tableData.filter(data => !search || ((JSON.stringify(data._source).toLowerCase().includes(search.toLowerCase())))      
      )"
      :default-sort="{prop: '_id', order: 'descending'}"
      style="width: 100%"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="_id" label="ID" sortable width="250"></el-table-column>
      <el-table-column prop="_source.firstname" label="Firstname" sortable width="180"></el-table-column>
      <el-table-column prop="_source.lastname" label="Lastname" sortable width="180"></el-table-column>
      <el-table-column label="Privileges">
        <template slot-scope="scope">
          <el-popover placement="left-start" title="Privileges" width="200" trigger="hover">
            <span :key="item" v-for="item in scope.row._source.privileges">
              &nbsp;
              <el-tag size="mini">{{item}}</el-tag>
            </span>
            <el-button size="mini" slot="reference">{{scope.row._source.privileges.length}}</el-button>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="Filters">
        <template slot-scope="scope">
          <el-popover
            v-if="scope.row._source.filters?true:false"
            placement="left-start"
            title="Filters"
            width="200"
            trigger="hover"
          >
            <span :key="item" v-for="item in scope.row._source.filters">
              &nbsp;
              <el-tag size="mini">{{item}}</el-tag>
            </span>
            <el-button size="mini" slot="reference">{{scope.row._source.filters.length}}</el-button>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column align="right" width="250">
        <!-- Removed from line below: slot-scope="scope" -->
        <template slot="header" slot-scope="scope">
          <div>
            <el-button
              size="mini"
              @click="handleAddUser()"
              class="addbutton"
              type="primary"
              circle
              icon="el-icon-plus"
              plain
            ></el-button>
          </div>
          <el-input v-model="search" size="mini" placeholder="Type to search" class="searchfield" />
        </template>
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="primary"
            plain
            icon="el-icon-edit"
            @click="handleView(scope.$index, scope.row)"
          ></el-button>
          <el-button
            size="mini"
            type="danger"
            plain
            icon="el-icon-delete"
            @click="handleDelete(scope.$index, scope.row)"
          ></el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>
<script>
import axios from "axios";
import Vue from "vue";

import userdetails from "@/components/UserDetails";
Vue.component("UserDetails", userdetails);

export default {
  data() {
    return {
      tableData: [],
      dialogFormVisible: false,
      currentRecord: null,
      search: ""
    };
  },
  methods: {
    setCurrent(row) {
      this.$refs.singleTable.setCurrentRow(row);
    },
    handleCurrentChange(val) {
      this.currentRow = val;
    },
    handleView(index, row) {
      this.currentRecord = {}; // required by the detail watcher
      this.currentRecord = row;
      this.dialogFormVisible = true;
    },
    dialogClosed() {
      this.dialogFormVisible = false;
      setTimeout(() => {
        this.loadData();
      }, 1000);
    },
    loadData() {
      var url =
        this.$store.getters.apiurl +
        "generic_search/nyx_user*?token=" +
        this.$store.getters.creds.token;

      axios
        .post(url, { size: 1000 })
        .then(response => {
          if (response.data.error != "") console.log("User list error...");
          else {
            console.log(response.data.records);
            console.log(this);
            this.tableData = response.data.records;
          }
        })
        .catch(error => {
          console.log(error);
        });
    },
    handleDelete(index, row) {
      this.$confirm(
        "This will permanently delete the user. Continue?",
        "Warning",
        {
          confirmButtonText: "OK",
          cancelButtonText: "Cancel",
          type: "warning"
        }
      )
        .then(() => {
          //this.tableData.splice(index, 1);
          this.$store.commit({
            type: "deleteRecord",
            data: row
          });
          setTimeout(() => {
            this.loadData();
          }, 1000);
          this.$notify({
            title: "Success",
            type: "success",
            message: "Delete completed",
            position: "bottom-right"
          });
        })
        .catch(() => {
          this.$notify({
            title: "Cancelled",
            type: "info",
            message: "Delete canceled",
            position: "bottom-right"
          });
        });
    },
    handleAddUser() {
      var newrec = {
        _id: "",
        _index: "nyx_user",
        isadd: true,
        _source: {
          login: "",
          firstname: "",
          lastname: "",
          password:
            "$pbkdf2-sha256$29000$Yqy1VmotpRTCOAdAaO0dww$/c6x7Fns2XPzyWByRQkb.HF4HxYpLFih7smLE5Uqq/Q",
          privileges: [],
          filters: [],
          language: "en",
          phone: ""
        },

        _type: "doc"
      };
      this.currentRecord = {}; // required by the detail watcher
      this.currentRecord = newrec;
      this.dialogFormVisible = true;
    }
  },
  created: function() {
    this.loadData();
  }
};
</script>