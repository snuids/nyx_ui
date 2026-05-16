<template>
  <el-dialog
    width="80%"
    :title="title"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    class="sql-editor"
    append-to-body
  >
    <el-card v-if="record" shadow="never">
      <el-form>
        <el-row>
          <el-col :span="24">
            <el-form-item label="SQL Query" :label-width="formLabelWidth">
              <editor
                v-if="sqlQuery"
                :key="editorKey"
                ref="aceEditorComponent"
                v-model="sqlQuery"
                id="sqlEditor"
                @init="editorInit"
                lang="sql"
                theme="chrome"
                width="100%"
                height="200"
                style="border: solid 1px #c0c4cc;"
              ></editor>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <span slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">Cancel</el-button>
      <el-button
        type="primary"
        :disabled="!hasChanged"
        @click="saveRecord()"
      >Save</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "SQLEditor",
  data: () => ({
    dialogFormVisible: false,
    formLabelWidth: "120px",
    sqlQuery: "",
    originalQuery: "",
    queryFieldPath: null, // Store the path to the query field
    _keyListener: null,
    aceEditor: null, // Store ace editor instance
    editorKey: 0 // Key to force re-render
  }),
  components: {
    editor: require("vue2-ace-editor")
  },
  computed: {
    hasChanged: function() {
      return this.sqlQuery !== this.originalQuery;
    },
    title: function() {
      if (this.record && this.record._id) {
        return `SQL Query Editor (${this.record._id})`;
      }
      return "SQL Query Editor";
    }
  },
  props: {
    record: {
      type: Object,
      required: true
    },
    config: {
      type: Object
    },
    editMode: {
      type: String
    }
  },
  watch: {
    record: {
      handler: function() {
        this.prepareData();
      },
      deep: true,
      immediate: true
    },
    aceEditor: {
      handler: function(newEditor) {
        if (newEditor && this.sqlQuery) {
          this.$nextTick(() => {
            newEditor.setValue(this.sqlQuery, -1);
          });
        }
      }
    }
  },
  created: function() {
    this.dialogFormVisible = true;
  },
  mounted: function() {
    // Load data after component is fully mounted
    this.$nextTick(() => {
      this.prepareData();
    });
    
    // Fallback: Try to access editor from refs if @init didn't fire
    setTimeout(() => {
      if (!this.aceEditor && this.sqlQuery && this.$refs.aceEditorComponent) {
        const editorComponent = this.$refs.aceEditorComponent;
        if (editorComponent && editorComponent.editor) {
          this.aceEditor = editorComponent.editor;
          this.aceEditor.setValue(this.sqlQuery, -1);
        }
      }
    }, 500);
    
    this._keyListener = function(e) {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (this.hasChanged) {
          this.saveRecord();
        }
      }
    };
    document.addEventListener("keydown", this._keyListener.bind(this));
  },
  beforeDestroy: function() {
    if (this._keyListener) {
      document.removeEventListener("keydown", this._keyListener);
    }
  },
  methods: {
    editorInit: function(editor) {
      require("brace/ext/language_tools");
      require("brace/mode/sql");
      require("brace/theme/chrome");
      require("brace/snippets/sql");
      editor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true
      });
      
      // Store editor reference
      this.aceEditor = editor;
      
      // Set initial value if already loaded
      if (this.sqlQuery) {
        editor.setValue(this.sqlQuery, -1);
      }
      
      // Set up change listener to update v-model
      editor.on('change', () => {
        this.sqlQuery = editor.getValue();
      });
    },
    prepareData: function() {
      // Try different possible locations for the query field
      let query = "";
      this.queryFieldPath = null;
      
      if (!this.record) {
        return;
      }
      
      // Try _source.query (most common case)
      if (this.record._source && this.record._source.query !== undefined) {
        query = this.record._source.query;
        this.queryFieldPath = "_source.query";
      }
      // Try direct query property
      else if (this.record.query !== undefined) {
        query = this.record.query;
        this.queryFieldPath = "query";
      }
      // Try looking in all _source fields for anything with 'query' in the name
      else if (this.record._source) {
        for (let key in this.record._source) {
          if (key.toLowerCase().includes('query') || key.toLowerCase().includes('sql')) {
            query = this.record._source[key];
            this.queryFieldPath = `_source.${key}`;
            break;
          }
        }
      }
      
      // Try looking in root level for any field with query or sql
      if (!this.queryFieldPath) {
        for (let key in this.record) {
          if (key !== '_source' && key !== '_id' && key !== '_index' && 
              (key.toLowerCase().includes('query') || key.toLowerCase().includes('sql'))) {
            query = this.record[key];
            this.queryFieldPath = key;
            break;
          }
        }
      }
      
      // Handle multi-line queries (with >- YAML format)
      if (typeof query === 'string') {
        query = query.trim();
      }
      
      this.sqlQuery = query || "";
      this.originalQuery = query || "";
      
      // Force editor re-render with new data
      this.editorKey++;
      
      // Manually update ace editor if it's already initialized
      if (this.aceEditor && this.sqlQuery) {
        this.$nextTick(() => {
          this.aceEditor.setValue(this.sqlQuery, -1);
        });
      }
    },
    closeDialog: function() {
      if (this.hasChanged) {
        this.$confirm(
          "You have unsaved changes. Are you sure you want to close?",
          "Warning",
          {
            confirmButtonText: "OK",
            cancelButtonText: "Cancel",
            type: "warning"
          }
        )
          .then(() => {
            this.dialogFormVisible = false;
            this.$emit("dialogclose");
          })
          .catch(() => {});
      } else {
        this.dialogFormVisible = false;
        this.$emit("dialogclose");
      }
    },
    saveRecord: function() {
      // Update the record with the new query
      let updatedRecord = JSON.parse(JSON.stringify(this.record));
      
      // Use the stored field path to save to the correct location
      if (this.queryFieldPath) {
        if (this.queryFieldPath.startsWith("_source.")) {
          const fieldName = this.queryFieldPath.substring(8); // Remove "_source."
          if (!updatedRecord._source) updatedRecord._source = {};
          updatedRecord._source[fieldName] = this.sqlQuery;
        } else {
          updatedRecord[this.queryFieldPath] = this.sqlQuery;
        }
      } else {
        // Fallback to default behavior
        if (updatedRecord._source) {
          updatedRecord._source.query = this.sqlQuery;
        } else {
          updatedRecord.query = this.sqlQuery;
        }
      }

      this.$store.commit({
        type: "updateRecord",
        data: updatedRecord
      });

      this.$notify({
        title: "Success",
        message: "SQL query updated successfully",
        type: "success",
        position: "bottom-right"
      });

      this.originalQuery = this.sqlQuery;
      this.dialogFormVisible = false;
      this.$emit("dialogcloseupdated");
    }
  }
};
</script>

<style>
.sql-editor .el-dialog__body {
  padding: 20px;
}
.sql-editor .el-form-item__label {
  color: #464646;
  font-weight: 600;
}
</style>
