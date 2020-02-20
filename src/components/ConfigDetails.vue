<template>
  <el-dialog
    width="80%"
    :title="isAdd?'Create Application':'Modify Application'"
    :visible.sync="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :model="curConfig">
      <el-tabs v-model="activeName" @tab-click="refresh2">
        <el-tab-pane label="Main" name="main" key="main">
          <el-card>
            <el-row>
              <el-col :span="8">
                <el-form-item label="Category" :label-width="formLabelWidth">
                  <el-autocomplete
                    class="inline-input"
                    v-model="curConfig.category"
                    :fetch-suggestions="categorySuggestion"
                    placeholder="Enter Category"
                    @select="handleSelect"
                    size="mini"
                    style="width:100%"
                  ></el-autocomplete>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Sub/Category" :label-width="formLabelWidth">
                  <el-autocomplete
                    class="inline-input"
                    v-model="curConfig.subcategory"
                    :fetch-suggestions="subcategorySuggestion"
                    placeholder="Enter Sub/Category"
                    @select="handleSelect"
                    size="mini"
                    style="width:100%"
                  ></el-autocomplete>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Title" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="curConfig.title" autocomplete="off"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <el-form-item label="Type" :label-width="formLabelWidth" style="text-align: left;">
                  <el-select
                    size="mini"
                    @change="typeChanged"
                    v-model="curConfig.type"
                    placeholder="Please select a type"
                    style="width:100%"
                  >
                    <el-option label="ES Table" value="generic-table"></el-option>
                    <el-option label="PGSQL Table" value="pgsql-generic-table"></el-option>
                    <el-option label="Kibana" value="kibana"></el-option>
                    <el-option label="External" value="external"></el-option>
                    <el-option label="Upload" value="upload"></el-option>
                    <el-option label="Internal" value="internal"></el-option>
                    <el-option label="Form" value="form"></el-option>
                    <el-option label="Free Text" value="free-text"></el-option>
                    <el-option label="Vega" value="vega"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Order" :label-width="formLabelWidth" style="text-align: left;">
                  <el-input-number
                    style="width:100%"
                    :min="1"
                    size="mini"
                    v-model="curConfig.order"
                    autocomplete="off"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="Icon" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="curConfig.icon" autocomplete="off"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="2">
                &nbsp;&nbsp;
                <v-icon v-if="curConfig.icon" :name="curConfig.icon" scale="2" />
              </el-col>
            </el-row>
            <el-row v-if="(curConfig.type === 'kibana') || (curConfig.type === 'generic-table')">
              <el-col
                :span="8"
                v-if="(curConfig.type === 'kibana') || (curConfig.type === 'generic-table')"
              >
                <el-form-item label="Hidden Query" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="curConfig.config.hiddenQuery" autocomplete="off"></el-input>
                </el-form-item>
              </el-col>

              <el-col :span="8" v-if="(curConfig.type === 'kibana')">
                <el-form-item label="Filter Column" :label-width="formLabelWidth">
                  <el-input size="mini" v-model="curConfig.config.filtercolumn" autocomplete="off"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row v-if="(curConfig.type === 'kibana')">
              <el-col :span="8" style="text-align: left;">
                <el-form-item label="Dashboard" :label-width="formLabelWidth">
                  <el-select
                    size="mini"
                    @change="kibanaDashboardSelected"
                    v-model="curConfig.config.kibanaId"
                    placeholder="Select"
                    :loading="listLoading"
                    style="width:100%"
                    filterable
                  >
                    <el-option
                      v-for="dash in dashboards"
                      :key="dash.id"
                      :label="dash.space+' - '+dash.attributes.title"
                      :value="dash.id"
                    ></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8" style="text-align: left;">
                <el-form-item :label-width="formLabelWidth">
                  <el-button
                    :disabled="curConfig.config.kibanaId==null||dashboards.length==0"
                    size="mini"
                    type="danger"
                    @click="openInKibana()"
                    style="width:100%"
                  >Open in Kibana</el-button>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item
                  label="Kibana Time"
                  :label-width="formLabelWidth"
                  prop="config.kibanaTime"
                >
                  <el-input
                    size="mini"
                    @blur="kibanaTimeChange"
                    v-model="curConfig.config.kibanaTime"
                  ></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row
              :gutter="24"
              v-if="(curConfig.type === 'kibana') || (curConfig.type === 'pgsql-generic-table') || (curConfig.type === 'generic-table') || (curConfig.type === 'vega')"
              style="text-align:left"
            >
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryBarChecked" active-text="Query Bar"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.downloadChecked" active-text="Download"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryFilterChecked" active-text="Query Filter"></el-switch>
                  </el-row>

                  <el-row>
                    <el-switch v-model="curConfig.timeSelectorChecked" active-text="Time Selector"></el-switch>
                  </el-row>

                  <el-row>
                    <el-select
                      size="mini"
                      v-model="curConfig.timeSelectorType"
                      placeholder="Please select a type"
                      @change="timeSelectorTypeChange"
                    >
                      <el-option label="Free" value="classic"></el-option>
                      <el-option label="Day" value="day"></el-option>
                      <el-option label="Month" value="month"></el-option>
                      <el-option label="Week" value="week"></el-option>
                      <el-option label="Year" value="year"></el-option>
                    </el-select>
                  </el-row>
                </el-form-item>
              </el-col>
              <el-col :span="8" v-if="(curConfig.type === 'kibana')">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.hideFilter" active-text="Hide Filter"></el-switch>
                  </el-row>

                  <el-row>
                    <el-switch
                      v-model="curConfig.timeRefresh"
                      @change="timeRefreshSwitchChange"
                      active-text="Time Refresh"
                    ></el-switch>
                  </el-row>
                  <el-row>
                    <el-select
                      size="mini"
                      v-model="curConfig.timeRefreshValue"
                      placeholder="Refresh Interval"
                      @change="timeRefreshSelectChange"
                    >
                      <el-option label="5 seconds" value="5000"></el-option>
                      <el-option label="10 seconds" value="10000"></el-option>
                      <el-option label="30 seconds" value="30000"></el-option>
                      <el-option label="45 seconds" value="45000"></el-option>
                      <el-option label="1 minute" value="60000"></el-option>
                      <el-option label="5 minutes" value="300000"></el-option>
                      <el-option label="15 minutes" value="900000"></el-option>
                      <el-option label="30 minutes" value="1800000"></el-option>
                      <el-option label="1 hour" value="3600000"></el-option>
                      <el-option label="2 hours" value="7200000"></el-option>
                      <el-option label="12 hours" value="43200000"></el-option>
                      <el-option label="1 day" value="86400000"></el-option>
                    </el-select>
                  </el-row>
                </el-form-item>
              </el-col>
              <el-col
                :span="8"
                v-if="(curConfig.type === 'generic-table') || (curConfig.type === 'pgsql-generic-table')"
              >
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.graphicChecked" active-text="Graphic"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.mapChecked" active-text="Map"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row
              :gutter="24"
              v-if="(curConfig.type === 'kibana') || (curConfig.type === 'generic-table')"
              style="text-align:left"
            >
              <el-col :span="4"></el-col>
            </el-row>
            <el-row v-if="curConfig.mapChecked && (curConfig.type === 'generic-table')">
              <el-col :span="8">
                <el-form-item label="Zoom" :label-width="formLabelWidth">
                  <el-input-number
                    :min="1"
                    :max="20"
                    size="mini"
                    v-model="curConfig.config.mapzoom"
                    autocomplete="off"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Longitude" :label-width="formLabelWidth">
                  <el-input-number
                    size="mini"
                    v-model="curConfig.config.maplong"
                    autocomplete="off"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="Latitude" :label-width="formLabelWidth">
                  <el-input-number size="mini" v-model="curConfig.config.maplat" autocomplete="off"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- Specific Time -->
            <!-- <el-row v-if="curConfig.type === 'kibana'">
              <el-col :span="8">
                <el-form-item label="Time Field" :label-width="formLabelWidth">
                  <el-input
                    size="mini"
                    v-model="curConfig.config.specificTimeField"
                    autocomplete="off"
                    placeholder="Use only if the time field must be formatted"
                  ></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="Time Format" :label-width="formLabelWidth">
                  <el-input
                    size="mini"
                    v-model="curConfig.config.specificTimeFormat"
                    autocomplete="off"
                    placeholder="Use only if the time field must be formatted. (Moment Format)"
                  ></el-input>
                </el-form-item>
              </el-col>
            </el-row> -->

            <!-- URL -->
            <!-- <el-form-item
              v-if="(curConfig.type === 'external') || (curConfig.type === 'kibana')"
              label="Url"
              :label-width="formLabelWidth"
            > -->
            <el-form-item
              v-if="(curConfig.type === 'external')"
              label="Url"
              :label-width="formLabelWidth"
            >
              <el-input size="mini" v-model="curConfig.config.url" autocomplete="off"></el-input>
            </el-form-item>

            <!-- Controller -->
            <el-form-item
              v-if="(curConfig.type === 'internal')"
              label="Controller"
              :label-width="formLabelWidth"
            >
              <el-input size="mini" v-model="curConfig.config.controller" autocomplete="off"></el-input>
            </el-form-item>
            <el-form-item
              v-if="(curConfig.type === 'internal')"
              label="Parameters"
              :label-width="formLabelWidth"
            >
              <el-input
                size="mini"
                v-model="curConfig.config.controllerparameters"
                autocomplete="off"
              ></el-input>
            </el-form-item>

            <!-- Upload -->
            <div v-if="(curConfig.type === 'upload')">
              <el-form-item label="Queue" :label-width="formLabelWidth">
                <el-input size="mini" v-model="curConfig.config.queue" autocomplete="off"></el-input>
              </el-form-item>
              <el-form-item label="Tip" :label-width="formLabelWidth">
                <el-input size="mini" v-model="curConfig.config.tip" autocomplete="off"></el-input>
              </el-form-item>
            </div>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="Privileges" name="privileges" key="privileges">
          <el-card>
            <div>
              <div style="display: table;margin: 0 auto;">
                <el-transfer
                  style="text-align:left;"
                  filterable
                  v-model="curConfig.privileges"
                  :props="{
                  key: 'value',
                  label: 'desc'
                }"
                  :data="allPrivileges"
                  :titles="['Available', 'Assigned']"
                ></el-transfer>
              </div>
            </div>
            <br />
          </el-card>
        </el-tab-pane>
        <el-tab-pane
          label="Table"
          name="pgtable"
          key="pgtable"
          v-if="(curConfig.type === 'pgsql-generic-table')"
        >
          <el-card>
            <!-- GENERIC TABLE -->
            <div>
              <el-row>
                <el-col :span="6">
                  <el-form-item label="Index/Table" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="curConfig.config.index" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Time Field" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="curConfig.config.timefield" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label="Doc Type"
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'generic-table')"
                  >
                    <el-input size="mini" v-model="curConfig.config.doc_type" autocomplete="off"></el-input>
                  </el-form-item>
                  <el-form-item
                    label="PKey"
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'pgsql-generic-table')"
                  >
                    <el-input size="mini" v-model="curConfig.config.pkey" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label="Map Field"
                    :label-width="formLabelWidth"
                    v-if="curConfig.mapChecked"
                  >
                    <el-input size="mini" v-model="curConfig.config.mapfield" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="(curConfig.type === 'pgsql-generic-table')">
                <el-col :span="24">
                  <el-form-item label="SQL" :label-width="formLabelWidth">
                    <el-input
                      placeholder="SQL: select * from my_table"
                      size="mini"
                      v-model="curConfig.config.sql"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-form-item label="Editor" :label-width="formLabelWidth">
                    <el-input
                      placeholder="Your specific component url. Eg. specificComponent"
                      size="mini"
                      v-model="curConfig.config.editorComponent"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label="Default Order"
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'generic-table')"
                  >
                    <el-input size="mini" v-model="curConfig.config.orderField" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'generic-table')"
                  >
                    <el-checkbox v-model="curConfig.config.orderDirection">Descending</el-checkbox>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-form-item label="Export" :label-width="formLabelWidth">
                    <el-input
                      placeholder="Columns to export"
                      size="mini"
                      v-model="curConfig.config.exportColumns"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Write Privilege" :label-width="formLabelWidth">
                    <el-input
                      size="mini"
                      v-model="curConfig.config.writeprivileges"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-button size="mini" @click="handleAddField()">Add Field</el-button>
                </el-col>
                <el-col :span="20">
                  <!-- Header dialog -->
                  <el-dialog
                    title="Columns"
                    :visible.sync="dialogHeaderVisible"
                    width="30%"
                    append-to-body
                  >
                    <el-form v-if="currentHeader" :model="currentHeader">
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item label="Field" :label-width="formLabelWidth">
                            <el-input size="mini" v-model="currentHeader.field" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item label="Title" :label-width="formLabelWidth">
                            <el-input size="mini" v-model="currentHeader.title" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item label="Type" :label-width="formLabelWidth">
                            <el-select
                              size="mini"
                              v-model="currentHeader.type"
                              placeholder="Please select a type"
                            >
                              <el-option label="Generic" value="generic"></el-option>
                              <el-option label="Date" value="date"></el-option>
                              <el-option label="Timestamp" value="timestamp"></el-option>
                              <el-option label="Boolean" value="boolean"></el-option>
                            </el-select>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row
                        :gutter="20"
                        v-if="currentHeader.type=='date' || currentHeader.type=='timestamp'"
                      >
                        <el-col :span="20">
                          <el-form-item label="Format" :label-width="formLabelWidth">
                            <el-input size="mini" v-model="currentHeader.format" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </el-form>
                    <span slot="footer" class="dialog-footer">
                      <el-button type="primary" @click="dialogHeaderVisible = false">Close</el-button>
                    </span>
                  </el-dialog>

                  <el-table
                    class="headertable"
                    :data="curConfig.config.headercolumns"
                    @current-change="handleCurrentHeaderChange"
                    border
                    style="width: 100%"
                  >
                    <el-table-column prop="field" label="Field"></el-table-column>
                    <el-table-column prop="title" label="Title"></el-table-column>
                    <el-table-column prop="type" label="Type"></el-table-column>
                    <el-table-column prop="format" label="Format"></el-table-column>
                    <el-table-column prop="title" label="Action">
                      <template slot-scope="scope2">
                        <el-button
                          size="mini"
                          circle
                          @click="handleEditHeader(scope2.$index, scope2.row)"
                          icon="el-icon-edit"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="danger"
                          @click="handleDeleteHeader(scope2.$index, scope2.row)"
                          icon="el-icon-delete"
                        ></el-button>

                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,false)"
                          icon="el-icon-arrow-down"
                          v-if="scope2.$index<curConfig.config.headercolumns.length-1"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,true)"
                          icon="el-icon-arrow-up"
                          v-if="scope2.$index>0"
                        ></el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-tab-pane>
        <el-tab-pane
          label="Table"
          name="table"
          key="table"
          v-if="(curConfig.type === 'generic-table')"
        >
          <ESTableEditor
            :allPrivileges="allPrivileges"
            :currentConfig="curConfig"
            @configchanged="esTableConfigChanged"
            :forcestep="isAdd?1:2"
          ></ESTableEditor>
        </el-tab-pane>

     

        <!-- ******* FORM ******* -->
        <el-tab-pane label="Form" name="form" key="form" v-if="(curConfig.type === 'form')">
          <el-card>
            <div>
              <el-row>
                <el-col :span="8">
                  <el-form-item label="Index" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="curConfig.config.index" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="Form Title" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="curConfig.config.formtitle" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-button size="mini" @click="handleAddField()">Add Field</el-button>
                </el-col>
                <el-col :span="20">
                  <FormFieldEditor
                    :currentField="currentHeader"
                    :title="'Form Field Edition'"
                    v-if="formFielfEditorVisible"
                    v-on:dialogclose="formFieldEditorClosed"
                  ></FormFieldEditor>
                  <el-table
                    class="headertable"
                    :data="curConfig.config.headercolumns"
                    @current-change="handleCurrentHeaderChange"
                    border
                    style="width: 100%"
                  >
                    <el-table-column prop="field" label="Field"></el-table-column>
                    <el-table-column prop="title" label="Title"></el-table-column>
                    <el-table-column prop="type" label="Type"></el-table-column>
                    <el-table-column prop="default" label="Default"></el-table-column>
                    <el-table-column prop="title" label="Action">
                      <template slot-scope="scope2">
                        <el-button
                          size="mini"
                          circle
                          @click="handleEditFormField(scope2.$index, scope2.row)"
                          icon="el-icon-edit"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="danger"
                          @click="handleDeleteHeader(scope2.$index, scope2.row)"
                          icon="el-icon-delete"
                        ></el-button>

                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,false)"
                          icon="el-icon-arrow-down"
                          v-if="scope2.$index<curConfig.config.headercolumns.length-1"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,true)"
                          icon="el-icon-arrow-up"
                          v-if="scope2.$index>0"
                        ></el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-tab-pane>
        <!-- FREE TEXT -->
        <el-tab-pane
          label="Free Text"
          name="freetext"
          key="freetext"
          v-if="(curConfig.type === 'free-text')"
        >
          <el-card>
            <FreeTextDetails :config="currentConfig" v-on:freetextchanged="freeTextChanged"></FreeTextDetails>
          </el-card>
        </el-tab-pane>
        <!-- Vega -->
        <el-tab-pane label="Vega" name="vega" key="vega" v-if="(curConfig.type === 'vega')">
          <el-card>
            <el-input
              type="textarea"
              :rows="10"
              placeholder="Vega Specification"
              v-model="curConfig.config.vegaSpec"
            ></el-input>
          </el-card>
          <br />
        </el-tab-pane>
        <!-- QUERY FILTER -->
        <el-tab-pane
          label="Query-Filter"
          key="queryfilter"
          name="queryfilter"
          v-if="((curConfig.type === 'kibana')||(curConfig.type === 'generic-table')) && (curConfig.queryFilterChecked)"
        >
          <el-card>
            <div>
              <el-row>
                <el-col :span="4">
                  <el-button size="mini" @click="handleAddQueryFilterField()">Add Field</el-button>
                </el-col>
                <el-col :span="20">
                  <QueryFilterEditor
                    :currentField="currentQueryFilter"
                    :title="'Field Edition'"
                    v-if="queryFilterEditorVisible"
                    v-on:dialogclose="queryFilterEditorClosed"
                  ></QueryFilterEditor>
                  <el-table
                    class="headertable"
                    :data="curConfig.config.queryfilters"
                    @current-change="handleCurrentQueryFilterChange"
                    border
                    style="width: 100%"
                  >
                    <el-table-column prop="field" label="Field"></el-table-column>
                    <el-table-column prop="title" label="Title"></el-table-column>
                    <el-table-column prop="type" label="Type"></el-table-column>
                    <el-table-column prop="default" label="Default"></el-table-column>
                    <el-table-column prop="title" label="Action">
                      <template slot-scope="scope2">
                        <el-button
                          size="mini"
                          circle
                          @click="handleEditQueryFilterField(scope2.$index, scope2.row)"
                          icon="el-icon-edit"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="danger"
                          @click="handleDeleteQueryFilter(scope2.$index, scope2.row)"
                          icon="el-icon-delete"
                        ></el-button>

                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveQueryFilter(scope2.$index, scope2.row,false)"
                          icon="el-icon-arrow-down"
                          v-if="scope2.$index<curConfig.config.queryfilters.length-1"
                        ></el-button>
                        <el-button
                          size="mini"
                          circle
                          type="primary"
                          @click="handleMoveQueryFilter(scope2.$index, scope2.row,true)"
                          icon="el-icon-arrow-up"
                          v-if="scope2.$index>0"
                        ></el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-tab-pane>
        <!-- Dev mode YAML -->
        <el-tab-pane :label="$t('generictable.new')" key="New" name="New" v-if="!isAdd">
          <el-card>
            <editor
              v-model="strNewRec"
              id="test"
              @init="editorInit"
              lang="yaml"
              theme="chrome"
              width="99%"
              style="border: solid 1px #c0c4cc;"
              height="600"
            ></editor>
            <div>&nbsp;</div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button @click="$emit('dialogclose');">Cancel</el-button>
      <el-button
        :disabled="(JSON.stringify(curConfig)==JSON.stringify(orgConfig._source)) && (strNewRec==strOrgRec)"
        type="primary"
        @click="saveRecord()"
      >Confirm</el-button>
    </span>
  </el-dialog>
</template>
<script>
//import axios from "axios";
import freetextdetails from "@/components/FreeTextDetails";
import formfieldeditor from "@/components/FormFieldEditor";
import queryfiltereditor from "@/components/QueryFilterEditor";
import estableeditor from "@/components/ConfigDetailsESTableEditor";


import Vue from "vue";
import axios from "axios";
import rison from "rison";
import YAML from "js-yaml";

Vue.component("FreeTextDetails", freetextdetails);
Vue.component("FormFieldEditor", formfieldeditor);
Vue.component("QueryFilterEditor", queryfiltereditor);
Vue.component("ESTableEditor", estableeditor);


function transformObject(obj) {
  return rison.encode(obj);
}

export default {
  name: "ConfigDetails",
  data() {
    return (
      window.__FORM__ || {
        // curConfig: {},
        dialogFormVisible: false,
        activeName: "main",
        dialogHeaderVisible: false,
        formFielfEditorVisible: false,
        queryFilterEditorVisible: false,
        currentHeader: {},
        currentQueryFilter: {},
        formLabelWidth: "120px",
        privileges: [],
        dashboards: [],
        selectedDash: null,
        selectedDashId: null,
        listLoading: false,
        strOrgRec: "",
        strNewRec: "",
        esMapping: null,
      }
    );
  },
  components: {
    editor: require("vue2-ace-editor")
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    },
    curConfig: {
      get() {
        return this.$store.getters.appConfigObj;
      },
      set(value) {
        this.$store.commit("setAppConfigObj", value);
      }
    }
  },
  watch: {
    curConfigIn: {
      handler: function() {
        //this.prepareData();
      },
      deep: true
    }
  },
  props: {
    currentConfig: { type: Object },
    orgConfig: { type: Object },
    isAdd: { type: Boolean },
    allPrivileges: { type: Array }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    // loadPrivileges: function() {
    //   console.log('load')
    //   var data = [];
    //   for (var i in this.$store.getters.privileges) {
    //     var priv = this.$store.getters.privileges[i];
    //     data.push({
    //       value: priv._source.value,
    //       desc: priv._source.name
    //     });
    //   }
    //   this.allPrivileges = data;
    // },
    esTableConfigChanged: function(newModel) {
      console.log("ConfigDetails - esTableConfigChanged");
      console.log(newModel);

      this.curConfig = Object.assign(
        {},
        JSON.parse(JSON.stringify(this.curConfig)),
        JSON.parse(JSON.stringify(newModel))
      );
    },
    closeDialog: function() {
      this.$emit("dialogclose");
    },
    openInKibana() {
      console.log(this.curConfig);
      window.open(
        this.curConfig.config.url
          .replace("kibananyx", "kibana")
          .replace("embed=true", "")
          .replace(",title:Test", "")
          .replace("title:Test,", "")
      );
    },
    categorySuggestion: function(queryString, cb) {
      var cat = [];
      for (var i in this.$store.getters.filteredmenus) {
        cat.push({ value: this.$store.getters.filteredmenus[i].category });
      }

      var results = queryString
        ? cat.filter(function(el) {
            if (el.value.indexOf(queryString) >= 0) return el;
          })
        : cat;

      cb(results);
    },
    handleSelect(item) {},
    subcategorySuggestion: function(queryString, cb) {
      if (this.curConfig.category == "") return cb([]);

      var submenus = [];

      for (var i in this.$store.getters.filteredmenus) {
        if (
          this.curConfig.category ==
          this.$store.getters.filteredmenus[i].category
        ) {
          for (var j in this.$store.getters.filteredmenus[i].submenus) {
            submenus.push({
              value: this.$store.getters.filteredmenus[i].submenus[j].loc_title
            });
          }
          break;
        }
      }

      var results = queryString
        ? submenus.filter(function(el) {
            if (el.value.indexOf(queryString) >= 0) return el;
          })
        : submenus;

      cb(results);
    },
    editorInitRO: function(editor) {
      require("brace/ext/language_tools"); //language extension prerequsite...
      require("brace/mode/html");
      require("brace/mode/yaml");
      require("brace/mode/javascript"); //language
      require("brace/mode/less");
      require("brace/theme/chrome");
      require("brace/snippets/javascript"); //snippet

      editor.setReadOnly(true);
    },
    editorInit: function(editor) {
      // eslint-disable-line
      require("brace/ext/language_tools"); //language extension prerequsite...
      require("brace/mode/html");
      require("brace/mode/yaml");
      require("brace/mode/javascript"); //language
      require("brace/mode/less");
      require("brace/theme/chrome");
      require("brace/snippets/javascript"); //snippet
    },
    handleMoveHeader(index, row, down) {
      this.curConfig.config.headercolumns.splice(index, 1);
      if (down) this.curConfig.config.headercolumns.splice(index - 1, 0, row);
      else this.curConfig.config.headercolumns.splice(index + 1, 0, row);
    },
    handleMoveQueryFilter(index, row, down) {
      this.curConfig.config.queryfilters.splice(index, 1);
      if (down) this.curConfig.config.queryfilters.splice(index - 1, 0, row);
      else this.curConfig.config.queryfilters.splice(index + 1, 0, row);
    },
    typeChanged(e) {
      if (e == "free-text") {
        this.curConfig.config.controller = "FreeText";
      } else if (e == "vega") {
        this.curConfig.config.controller = "Vega";
      } else if (e == "pgsql-generic-table") {
        this.curConfig.config.controller = "PGGenericTable";
      } else if (e == "generic-table") {
        console.log("generic-table chosen");
      }
    },

    freeTextChanged(newvalue) {
      this.curConfig.config.freetext = newvalue;
    },
    prepareData() {
      this.dialogFormVisible = true;
      this.curConfig = JSON.parse(JSON.stringify(this.currentConfig));

      this.dialogHeaderVisible = false;
      this.formFielfEditorVisible = false;
      this.currentHeader = {};
      if (this.curConfig.config == undefined) this.curConfig.config = {};
      if (this.curConfig.config.queryfilters == undefined)
        this.curConfig.config.queryfilters = [];


      if(this.currentConfig.timeRefreshValue != null)
        this.curConfig.timeRefreshValue = this.curConfig.timeRefreshValue.replace('refreshInterval:(pause:!f,value:', '').replace(')', '')

      console.log(this.currentConfig)


      this.strNewRec = "";
      this.strOrgRec = "";

      this.loadKibanaDashboards();

      this.$nextTick(() => {
        this.refresh2();
      });
    },
    refresh2: function() {
      this.strNewRec = "";
      this.strOrgRec = "";

      this.strNewRec = YAML.safeDump(this.curConfig, 10);
      this.strOrgRec = YAML.safeDump(this.currentConfig, 10);
    },
    handleAddField() {
      if (this.curConfig.config.headercolumns == undefined) {
        this.curConfig.config.headercolumns = [];
      }
      this.curConfig.config.headercolumns.push({
        title: "title",
        field: "field"
      });
    },
    handleAddQueryFilterField() {
      if (this.curConfig.config.queryfilters == undefined) {
        this.curConfig.config.queryfilters = [];
      }
      this.curConfig.config.queryfilters.push({
        title: "title",
        field: "field"
      });
    },
    computeKibanaUrlFromSelectedDash() {
      console.log('computeKibanaUrlFromSelectedDash')
      var dashdata = this.selectedDash;
      var url = "";
      url += "/dashboard/" + dashdata.id + "";
      var timek = "from:now-7d,mode:quick,to:now";
      if (
        this.curConfig.config != undefined &&
        this.curConfig.config.kibanaTime != undefined
      ) {
        console.log("saving kibana time");
        console.log(this.curConfig.config.kibanaTime);
        timek = this.curConfig.config.kibanaTime;
      }

      console.log(timek);
      this.curConfig.config.kibanaTime = timek;

      var strRefresh = "refreshInterval:(pause:!t,value:0)";

      if (this.curConfig.timeRefresh && this.curConfig.timeRefreshValue != null)
        strRefresh = 'refreshInterval:(pause:!f,value:'+this.curConfig.timeRefreshValue+')'

      url +=
        "?embed=true&_g=(" + strRefresh + ",time:(" + timek + "))";
      url += "&_a=(description:'" + dashdata.attributes.description + "'";
      url += ",filters:!(),fullScreenMode:!f";
      console.log(url);
      if (dashdata.attributes.optionsJSON != undefined) {
        var options = JSON.parse(dashdata.attributes.optionsJSON);
        var urloptions = Object.entries(options)
          .map(e => e.join(":"))
          .join(",");
        urloptions = urloptions.replace(/true/g, "!t").replace(/false/g, "!f");

        url += ",options:(" + urloptions + ")";
      } else url += ",options:()";

      var panels = [];
      var panelsJSON = JSON.parse(dashdata.attributes.panelsJSON);

      console.log(url);
      console.log(panelsJSON);
      for (var p in panelsJSON) {
        console.log("==========+>");
        console.log(panelsJSON[p]);

        if (
          dashdata.migrationVersion != null &&
          dashdata.migrationVersion.dashboard != null &&
          dashdata.migrationVersion.dashboard == "7.0.0"
        ) {
          for (var j in dashdata.references) {
            if (dashdata.references[j].name == panelsJSON[p].panelRefName) {
              panelsJSON[p].id = dashdata.references[p].id;
              panelsJSON[p].type = dashdata.references[p].type;
            }
          }
        }

        var panel = transformObject(panelsJSON[p]);

        panels.push("" + panel + "");
      }

      panels = panels
        .join(",")
        .replace(/#/g, "%23")
        .replace(/&/g, "%26");
      url += ",panels:!(" + panels + ")";

      var querybag = "query:(language:lucene,query:'*')";
      if (
        dashdata.attributes.kibanaSavedObjectMeta != undefined &&
        dashdata.attributes.kibanaSavedObjectMeta.searchSourceJSON != undefined
      ) {
        var querybag2 = JSON.parse(
          dashdata.attributes.kibanaSavedObjectMeta.searchSourceJSON
        );
        if (querybag2.query != undefined) {
          querybag = transformObject(querybag2.query);
          querybag = "query:" + querybag;
        }
      }

      url += "," + querybag + ",timeRestore:!f,title:Test,viewMode:view)";

      console.log(
        "********************compute kibana url***********************"
      );
      console.log(url);

      return url;
    },
    kibanaDashboardSelected() {
      for (var i in this.dashboards) {
        if (this.dashboards[i].id == this.curConfig.config.kibanaId) {
          console.log("FOUND");
          this.selectedDash = this.dashboards[i];
          console.log(this.dashboards[i]);
        }
      }

      var space = "";
      if (this.selectedDash.space != "default") {
        space = "s/" + this.selectedDash.space; //.toLowerCase();
      }

      this.curConfig.config.url =
        "." +
        this.$store.getters.kibanaurl.replace("kibana", "kibananyx") +
        space +
        "/app/kibana#" +
        this.computeKibanaUrlFromSelectedDash();

      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;
    },
    loadKibanaDashboards: function() {
      this.listLoading = true;
      this.dashboards = [];

      this.addDashboards(
        {
          page: 1,
          per_page: 1000,
          total: 4,
          saved_objects: [
            {
              "type": "dashboard",
              "id": "ede7b7b0-eb5e-11e9-b31c-91fd0a97e7fc",
              "attributes": {
                "title": "LUTOSA - Calendar",
                "hits": 0,
                "description": "",
                "panelsJSON": [{"embeddableConfig":{},"gridData":{"h":20,"i":"1","w":41,"x":0,"y":0},"id":"67239870-eb5e-11e9-b31c-91fd0a97e7fc","panelIndex":"1","title":"Calendar","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"h":10,"i":"2","w":7,"x":41,"y":0},"id":"83795190-eb5e-11e9-b31c-91fd0a97e7fc","panelIndex":"2","title":"Days","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"h":10,"i":"3","w":7,"x":41,"y":10},"id":"9faf26a0-eb5e-11e9-b31c-91fd0a97e7fc","panelIndex":"3","title":"Open days","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"h":10,"i":"4","w":48,"x":0,"y":20},"id":"342e2c20-eb6b-11e9-b31c-91fd0a97e7fc","panelIndex":"4","title":"Targets","type":"visualization","version":"6.5.4"}],
                "optionsJSON": {"darkTheme":false,"hidePanelTitles":false,"useMargins":true},
                "version": 1,
                "timeRestore": false,
                "kibanaSavedObjectMeta": {
                  "searchSourceJSON": {"query":{"language":"lucene","query":""},"filter":[]}
                }
              },
              "updated_at": "2019-10-10T14:45:45.529Z",
              "version": 5
            },
            {
              type: "dashboard",
              id: "0c8aea00-174a-11e9-8fa5-c79677d29cc9",
              attributes: {
                title: "Nyx API",
                hits: 0,
                description: "",
                panelsJSON:
                  '[{"embeddableConfig":{},"gridData":{"x":0,"y":12,"w":18,"h":27,"i":"1"},"id":"235bc8e0-1749-11e9-8fa5-c79677d29cc9","panelIndex":"1","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":0,"y":0,"w":48,"h":12,"i":"2"},"id":"6aaced00-1749-11e9-8fa5-c79677d29cc9","panelIndex":"2","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":18,"y":25,"w":15,"h":14,"i":"3"},"id":"cdba9780-1749-11e9-8fa5-c79677d29cc9","panelIndex":"3","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":33,"y":25,"w":15,"h":14,"i":"4"},"id":"ddc92830-1749-11e9-8fa5-c79677d29cc9","panelIndex":"4","type":"visualization","version":"6.5.4"},{"gridData":{"x":18,"y":12,"w":30,"h":13,"i":"5"},"version":"6.5.4","panelIndex":"5","type":"visualization","id":"a863c3c0-174a-11e9-8fa5-c79677d29cc9","embeddableConfig":{}}]',
                optionsJSON:
                  '{"darkTheme":false,"hidePanelTitles":true,"useMargins":true}',
                version: 1,
                timeRestore: false,
                kibanaSavedObjectMeta: {
                  searchSourceJSON:
                    '{"query":{"language":"lucene","query":""},"filter":[]}'
                }
              },
              updated_at: "2019-01-13T15:54:24.567Z",
              version: 4
            },
            {
              type: "dashboard",
              id: "c0beaa00-1e18-11e9-8fa5-c79677d29cc9",
              attributes: {
                title: "Nyx User Statistics",
                hits: 0,
                description: "",
                panelsJSON:
                  '[{"embeddableConfig":{},"gridData":{"x":0,"y":0,"w":48,"h":13,"i":"1"},"id":"30d22e80-1e18-11e9-8fa5-c79677d29cc9","panelIndex":"1","type":"visualization","version":"6.5.4","title":"Statistics"},{"embeddableConfig":{},"gridData":{"x":0,"y":13,"w":24,"h":15,"i":"2"},"id":"5cb9ce40-1e18-11e9-8fa5-c79677d29cc9","panelIndex":"2","title":"Users","type":"visualization","version":"6.5.4"},{"embeddableConfig":{},"gridData":{"x":24,"y":13,"w":24,"h":15,"i":"3"},"id":"cdba9780-1749-11e9-8fa5-c79677d29cc9","panelIndex":"3","title":"Platforms","type":"visualization","version":"6.5.4"}]',
                optionsJSON:
                  '{"darkTheme":false,"hidePanelTitles":false,"useMargins":true}',
                version: 1,
                timeRestore: false,
                kibanaSavedObjectMeta: {
                  searchSourceJSON:
                    '{"query":{"language":"lucene","query":""},"filter":[]}'
                }
              },
              updated_at: "2019-01-22T07:38:47.328Z",
              version: 1
            },
            {
              type: "dashboard",
              id: "7bbb3390-2243-11e9-9a68-772c982ed0ab",
              attributes: {
                title: "Docker",
                hits: 0,
                description: "",
                panelsJSON:
                  '[{"gridData":{"x":0,"y":15,"w":48,"h":22,"i":"1"},"version":"6.5.4","panelIndex":"1","type":"visualization","id":"9b91cb80-2242-11e9-9a68-772c982ed0ab","embeddableConfig":{}},{"gridData":{"x":0,"y":0,"w":48,"h":15,"i":"2"},"version":"6.5.4","panelIndex":"2","type":"visualization","id":"195fc210-2243-11e9-9a68-772c982ed0ab","embeddableConfig":{}}]',
                optionsJSON:
                  '{"darkTheme":false,"useMargins":true,"hidePanelTitles":false}',
                version: 1,
                timeRestore: false,
                kibanaSavedObjectMeta: {
                  searchSourceJSON:
                    '{"query":{"query":"","language":"lucene"},"filter":[]}'
                }
              },
              updated_at: "2019-01-27T14:54:44.552Z",
              version: 1
            }
          ]
        },
        "nyx"
      );

      var url = this.$store.getters.kibanaurl + "api/spaces/space";
      axios
        .get(url)
        .then(response => {
          console.log("Space success...");
          this.loadKibanaDashboards2(response.data);
        })
        .catch(error => {
          console.log(error);
          this.listLoading = false;
        });
    },
    loadKibanaDashboards2: async function(spaces) {
      console.log(spaces);
      this.dashboards = [];
      for (var i in spaces) {
        var space = spaces[i];

        var spaceurl = "";

        if (space.id != "default") spaceurl = "s/" + space.id + "/";
        var url =
          this.$store.getters.kibanaurl +
          spaceurl +
          "api/saved_objects/_find?type=dashboard&per_page=1000&page=1";

        const response = await axios.get(url, {});

        this.addDashboards(response.data, space.id);
      }
      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;

      this.listLoading = false;
    },
    addDashboards: function(newdashs, space) {
      console.log("Adding Space:" + space);
      for (var i in newdashs.saved_objects) {
        var dash = newdashs.saved_objects[i];
        dash.space = space;
        this.dashboards.push(dash);
      }
    },
    handleDeleteHeader(index) {
      this.currentHeader = {};
      this.curConfig.config.headercolumns.splice(index, 1);
    },
    handleDeleteQueryFilter(index) {
      this.currentQueryFilter = {};
      this.curConfig.config.queryfilters.splice(index, 1);
    },
    handleCurrentHeaderChange(val) {
      this.currentHeader = val;
    },
    handleCurrentQueryFilterChange(val) {
      this.currentQueryFilter = val;
    },
    handleEditHeader(index, row) {
      // eslint-disable-line
      this.currentHeader = row;
      this.dialogHeaderVisible = true;
    },
    handleEditFormField(index, row) {
      // eslint-disable-line
      this.formFielfEditorVisible = true;
    },
    handleEditQueryFilterField(index, row) {
      // eslint-disable-line
      this.currentQueryFilter = row;
      this.queryFilterEditorVisible = true;
    },
    timeRefreshSelectChange() {
      if (this.curConfig.timeRefreshValue != null)
        this.curConfig.timeRefresh = true;


      this.computeUrlFromKibana();


      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;
    },
    timeRefreshSwitchChange() {
      this.computeUrlFromKibana();


      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;

      console.log(this.curConfig.config.url)
    },
    timeSelectorTypeChange() {
      if (this.curConfig.timeSelectorType != null)
        this.curConfig.timeSelectorChecked = true;

      var tmp = JSON.parse(JSON.stringify(this.curConfig));
      this.curConfig = null;
      this.curConfig = tmp;
    },
    kibanaTimeChange() {
      console.log("kibana time changed");
      this.computeUrlFromKibana();
    },
    computeUrlFromKibana() {
      console.log('computeUrlFromKibana')
      if (this.selectedDash != null) {
        var space = "";
        if (this.selectedDash.space != "default") {
          space = "s/" + this.selectedDash.space; //.toLowerCase();
        }
        this.curConfig.config.url =
          "." +
          this.$store.getters.kibanaurl.replace("kibana", "kibananyx") +
          space +
          "/app/kibana#" +
          this.computeKibanaUrlFromSelectedDash();
      }
    },
    saveRecord() {
      if (this.strNewRec != this.strOrgRec && !this.isAdd) {
        this.orgConfig._source = YAML.safeLoad(this.strNewRec);
      } else {
        this.orgConfig._source = this.curConfig;
      }

      this.$store.commit({
        type: "updateRecord",
        data: this.orgConfig
      });
      this.$notify({
        title: "Record saved.",
        type: "success",
        message: "Logout/Login to see changes.",
        position: "bottom-right"
      });
      this.$emit("dialogclose");
    },
    formFieldEditorClosed(field) {
      console.log(field);
      this.formFielfEditorVisible = false;

      for (var i in this.curConfig.config.headercolumns) {
        if (this.curConfig.config.headercolumns[i].field == field.field) {
          console.log("overwriting current header");
        }
      }
    },
    queryFilterEditorClosed(field) {
      console.log(field);
      this.queryFilterEditorVisible = false;

      for (var i in this.curConfig.config.headercolumns) {
        if (this.curConfig.config.headercolumns[i].field == field.field) {
          console.log("overwriting current header");
        }
      }
    }
  }
};
</script>
<style>
.el-form-item {
  margin-bottom: 5px !important;
}
.searchfield {
  width: 150px !important;
}
.addbutton {
}
</style>