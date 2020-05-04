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
      <el-tabs v-model="activeName" @tab-click="refresh2" >
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
         
             <el-row v-if="curConfig.type === 'kibana'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="chart-pie" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays a kibana dashboard.</b>
                <br/> 
                The dashboard must previously be created in Kibana.<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'generic-table'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="table" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays a collection stored in elastic search.</b>
                <br/> 
                It displays the data as a table that can optionaly include a time line or a map.<br/> 
                
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'pgsql-generic-table'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:90px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="database" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays a table stored in PostgreSQL.</b>
                <br/> 
                It displays the data as a table that can optionaly include a time line or a map.<br/> 
                It can also display the result of a query.                
                <br/> 
              </el-col>
              </el-card>
            </el-row>
           
           <el-row v-if="curConfig.type === 'external'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="external-link-alt" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays an external URL in an iframe.</b>
                <br/> 
                It the external url contains <b>token=TOKEN</b>, the <b>TOKEN</b> tag is replaced by the actual user token.<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'upload'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="file-upload" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays an upload form.</b>
                <br/> 
                The file is sent to an ActiveMQ destination and can be handled by Camel, NodeRed or a Lambda.<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'file-system'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="regular/folder-open" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays a file explorer.</b>
                <br/> 
                The file system must be shared with the nyx_ui container via Docker.<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'internal'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="cogs" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays an internal VUE controller.</b>
                <br/> 
                This controller must be added to the external nyx_ui folder and the UI recompiled.<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>

             <el-row v-if="curConfig.type === 'form'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="regular/keyboard" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Displays an input form.</b>
                <br/> 
                Fields of the form must be filled by the user. The target of the form can be an elastic search collection or a message.<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'free-text'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(255, 245, 236);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="align-left" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Experimental</b>
                <br/>                 
                Displays html
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'vega'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:110px;background-color:rgb(255, 245, 236);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="align-left" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>Experimental</b>
                <br/>                 
                Displays a vega visualization. The data must be accessed via a data source defined in NYX.<br/>
                Ex: <b>https://173.242.183.147/api/v1/datasource/my_ds1?token=@TOKEN@&start=@START@&end=@END@</b>
                </br>START and END are only used if a time selector is checked.
                <br/> 
              </el-col>
              </el-card>
            </el-row>
           
      
            <el-row
              :gutter="24"
              v-if="/*(curConfig.type === 'kibana') || (curConfig.type === 'pgsql-generic-table') || (curConfig.type === 'generic-table') ||*/ (curConfig.type === 'vega')"
              style="text-align:left"
            >
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryBarChecked" active-text="Query Bar" @change="query_bar_changed"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.downloadChecked" active-text="Download"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryFilterChecked" active-text="Query Filter" @change="query_filter_changed"></el-switch>
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
              
              <el-col
                :span="8"
                v-if="/*(curConfig.type === 'generic-table') || */(curConfig.type === 'pgsql-generic-table')"
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
            <!-- PG GENERIC TABLE -->
            <div>
              <el-row
              :gutter="24"              
              style="text-align:left"
            >
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryBarChecked" active-text="Query Bar" @change="query_bar_changed"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.downloadChecked" active-text="Download"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryFilterChecked" active-text="Query Filter" @change="query_filter_changed"></el-switch>
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
              
              <el-col
                :span="8"                
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

              <el-row>
                <el-col :span="6">
                  <el-form-item label="Sort" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="curConfig.config.sort_column" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="Order" :label-width="formLabelWidth">
                    <el-input size="mini" v-model="curConfig.config.sort_order" placeholder="ascending/descending" autocomplete="off"></el-input>
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
                    <!-- <el-input
                      size="mini"
                      v-model="curConfig.config.writeprivileges"
                      autocomplete="off"
                    ></el-input> -->

                    <el-select
                      v-model="curConfig.config.writeprivileges"
                      multiple
                      filterable
                      allow-create
                      ref="writePrivileges"
                      placeholder="write privileges"
                      size="mini"
                      style="width:100%;"
                    >
                      <el-option
                        v-for="item in allPrivileges"
                        :key="item.value"
                        :label="item.value"
                        :value="item.value"
                      ></el-option>
                    </el-select>
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
            :forcestep="isAdd?1:2"
          ></ESTableEditor>
        </el-tab-pane>

        <el-tab-pane
          label="Kibana"
          name="kibana"
          key="kibana"
          v-if="(curConfig.type === 'kibana')"
        >
          <KibanaEditor
            :allPrivileges="allPrivileges"
            :currentConfig="curConfig"
          ></KibanaEditor>
        </el-tab-pane>
        <el-tab-pane
          label="Upload"
          name="upload"
          key="upload"
          v-if="(curConfig.type === 'upload')"
        >
          <UploadEditor            
            :currentConfig="curConfig"
          ></UploadEditor>
        </el-tab-pane>
        <el-tab-pane
          label="File System"
          name="filesystem"
          key="filesystem"
          v-if="(curConfig.type === 'file-system')"
        >
          <FileSystemEditor            
            :currentConfig="curConfig"
          ></FileSystemEditor>
        </el-tab-pane>

     

        <!-- ******* FORM ******* -->
        <el-tab-pane label="Form" name="form" key="form" v-if="(curConfig.type === 'form')">
          <FormEditor
            :currentConfig="curConfig"
          ></FormEditor>
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
import freetextdetails from "@/components/FreeTextDetails";

import queryfiltereditor from "@/components/appConfigEditor/QueryFilterEditor";
import estableeditor from "@/components/appConfigEditor/ESTableEditor";
import kibanaeditor from "@/components/appConfigEditor/KibanaEditor";
import formeditor from "@/components/appConfigEditor/FormEditor";
import uploadeditor from "@/components/appConfigEditor/UploadEditor";
import filesystemeditor from "@/components/appConfigEditor/FileSystemEditor";


import Vue from "vue";
import axios from "axios";
import rison from "rison";
import YAML from "js-yaml";

Vue.component("FreeTextDetails", freetextdetails);

Vue.component("QueryFilterEditor", queryfiltereditor);
Vue.component("ESTableEditor", estableeditor);
Vue.component("FormEditor", formeditor);
Vue.component("KibanaEditor", kibanaeditor);
Vue.component("UploadEditor", uploadeditor);
Vue.component("FileSystemEditor", filesystemeditor);


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
    query_filter_changed:function() {
        if(this.curConfig.queryFilterChecked)
          this.curConfig.queryBarChecked=false;

    },
    query_bar_changed:function() {
        if(this.curConfig.queryBarChecked)
          this.curConfig.queryFilterChecked=false;

    },
    closeDialog: function() {
      this.$emit("dialogclose");
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
      console.log(this.currentConfig)
      this.dialogFormVisible = true;
      this.curConfig = JSON.parse(JSON.stringify(this.currentConfig));
      console.log('end of prepare date configDetails')
      console.log(this.curConfig)

      this.dialogHeaderVisible = false;
      this.formFielfEditorVisible = false;
      this.currentHeader = {};
      if (this.curConfig.config == undefined) this.curConfig.config = {};
      if (this.curConfig.config.queryfilters == undefined)
        this.curConfig.config.queryfilters = [];


      if(this.currentConfig.timeRefreshValue != null)
        this.curConfig.timeRefreshValue = this.curConfig.timeRefreshValue.replace('refreshInterval:(pause:!f,value:', '').replace(')', '')


      this.strNewRec = "";
      this.strOrgRec = "";

      //this.loadKibanaDashboards();

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