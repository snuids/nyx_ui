<template>
  <el-dialog
    width="90%"
    :title="isAdd?$t('configdetails.create_application'):$t('configdetails.modify_application')"
    v-model="dialogFormVisible"
    :before-close="closeDialog"
    :close-on-click-modal="false"
    append-to-body
  >
    <el-form :model="curConfig">
      <el-tabs v-model="activeName" @tab-click="refresh2" >
        <el-tab-pane :label="$t('configdetails.tab_main')" name="main" key="main">
          <el-card>
            <el-row>
              <el-col :span="8">
                <el-form-item :label="$t('configdetails.category')" :label-width="formLabelWidth">
                  <el-autocomplete
                    class="inline-input"
                    v-model="curConfig.category"
                    :fetch-suggestions="categorySuggestion"
                    :placeholder="$t('configdetails.enter_category')"
                    @select="handleSelect"
                    size="small"
                    style="width:100%"
                  ></el-autocomplete>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('configdetails.subcategory')" :label-width="formLabelWidth">
                  <el-autocomplete
                    class="inline-input"
                    v-model="curConfig.subcategory"
                    :fetch-suggestions="subcategorySuggestion"
                    :placeholder="$t('configdetails.enter_subcategory')"
                    @select="handleSelect"
                    size="small"
                    style="width:100%"
                  ></el-autocomplete>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('configdetails.title')" :label-width="formLabelWidth">
                  <el-input size="small" v-model="curConfig.title" autocomplete="off"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="8">
                <el-form-item :label="$t('configdetails.type')" :label-width="formLabelWidth" style="text-align: left;">
                  <el-select
                    size="small"
                    @change="typeChanged"
                    v-model="curConfig.type"
                    :placeholder="$t('configdetails.select_type')"
                    style="width:100%"
                  >
                    <el-option :label="$t('configdetails.type_es_table')" value="generic-table"></el-option>
                    <el-option :label="$t('configdetails.type_sql_table')" value="pgsql-generic-table"></el-option>
                    <el-option :label="$t('configdetails.type_kibana')" value="kibana"></el-option>
                    <el-option :label="$t('configdetails.type_grafana')" value="grafana"></el-option>
                    <el-option :label="$t('configdetails.type_external')" value="external"></el-option>
                    <el-option :label="$t('configdetails.type_upload')" value="upload"></el-option>
                    <el-option :label="$t('configdetails.type_internal')" value="internal"></el-option>
                    <el-option :label="$t('configdetails.type_form')" value="form"></el-option>
                    <el-option :label="$t('configdetails.type_free_text')" value="free-text"></el-option>
                    <el-option :label="$t('configdetails.type_file_system')" value="file-system"></el-option>
                    <el-option :label="$t('configdetails.type_vega')" value="vega"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('configdetails.order')" :label-width="formLabelWidth" style="text-align: left;">
                  <el-input-number
                    style="width:100%"
                    :min="1"
                    size="small"
                    v-model="curConfig.order"
                    autocomplete="off"
                  ></el-input-number>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="$t('configdetails.icon')" :label-width="formLabelWidth">
                  <IconPicker v-model="curConfig.icon" size="small" :icon-preview="true" :preview-scale="2" />
                </el-form-item>
              </el-col>
            </el-row>
         
             <el-row v-if="curConfig.type === 'kibana'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="chart-pie" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>{{ $t('configdetails.desc_kibana') }}</b>
                <br/> 
                {{ $t('configdetails.desc_kibana_detail') }}<br/> 
                <br/> 
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'grafana'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="chart-pie" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>{{ $t('configdetails.desc_grafana') }}</b>
                <br/> 
                {{ $t('configdetails.desc_grafana_detail') }}<br/> 
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
                <b>{{ $t('configdetails.desc_es_table') }}</b>
                <br/> 
                {{ $t('configdetails.desc_es_table_detail') }}<br/> 
                
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
                <b>{{ $t('ui.table_sql_desc') }}</b>
                <br/> 
                {{ $t('ui.table_sql_detail_1') }}<br/> 
                {{ $t('ui.table_sql_detail_2') }}                
                <br/> 
              </el-col>
              </el-card>
            </el-row>
           
           <el-row v-if="curConfig.type === 'external'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:120px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="external-link-alt" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>{{ $t('configdetails.desc_external') }}</b>
                <br/> 
                {{ $t('configdetails.desc_external_detail_1') }}<br/> 
                <b>{{ $t('configdetails.desc_external_detail_2') }}</b><br/>                 
                <br/> 
                {{ $t('configdetails.desc_external_detail_3') }}<br/>
                {{ $t('configdetails.desc_external_detail_4') }}
                
              </el-col>
              </el-card>
            </el-row>

            <el-row v-if="curConfig.type === 'upload'" class="transition-box" style="text-align:left;">     
              <el-card shadow="never" style="height:70px;background-color:rgb(236, 245, 255);">     
              <el-col :span="4" style="text-align:right;padding-right:20px">
                <v-icon name="file-upload" scale="2.2" />
              </el-col>
              <el-col :span="20">
                <b>{{ $t('configdetails.desc_upload') }}</b>
                <br/> 
                {{ $t('configdetails.desc_upload_detail') }}<br/> 
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
                <b>{{ $t('configdetails.desc_file_system') }}</b>
                <br/> 
                {{ $t('configdetails.desc_file_system_detail') }}<br/> 
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
                <b>{{ $t('configdetails.desc_internal') }}</b>
                <br/> 
                {{ $t('configdetails.desc_internal_detail') }}<br/> 
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
                <b>{{ $t('configdetails.desc_form') }}</b>
                <br/> 
                {{ $t('configdetails.desc_form_detail') }}<br/> 
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
                <b>{{ $t('configdetails.desc_free_text') }}</b>
                <br/>                 
                {{ $t('configdetails.desc_free_text_detail') }}
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
                <b>{{ $t('configdetails.desc_vega') }}</b>
                <br/>                 
                {{ $t('configdetails.desc_vega_detail_1') }}<br/>
                {{ $t('configdetails.desc_vega_detail_2') }}
                <br/>{{ $t('configdetails.desc_vega_detail_3') }}
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
                    <el-switch v-model="curConfig.queryBarChecked" :active-text="$t('configdetails.query_bar')" @change="query_bar_changed"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.downloadChecked" :active-text="$t('configdetails.download')"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryFilterChecked" :active-text="$t('configdetails.query_filter')" @change="query_filter_changed"></el-switch>
                  </el-row>

                  <!-- Le selecteur de type sur la meme ligne que l'interrupteur : empile, il se lit comme un
                       reglage independant. Le `el-row` est un conteneur flex en Element Plus, la ligne tient. -->
                  <el-row>
                    <div style="display:flex; align-items:center; gap:16px;">
                      <el-switch v-model="curConfig.timeSelectorChecked" :active-text="$t('configdetails.time_selector')"></el-switch>
                      <el-select
                        size="small"
                        style="width:180px;"
                        v-model="curConfig.timeSelectorType"
                        :placeholder="$t('configdetails.select_type')"
                        @change="timeSelectorTypeChange"
                      >
                        <el-option :label="$t('configdetails.time_type_free')" value="classic"></el-option>
                        <el-option :label="$t('configdetails.time_type_day')" value="day"></el-option>
                        <el-option :label="$t('configdetails.time_type_month')" value="month"></el-option>
                        <el-option :label="$t('configdetails.time_type_week')" value="week"></el-option>
                        <el-option :label="$t('configdetails.time_type_year')" value="year"></el-option>
                      </el-select>
                    </div>
                  </el-row>
                </el-form-item>
              </el-col>
              
              <el-col
                :span="8"
                v-if="/*(curConfig.type === 'generic-table') || */(curConfig.type === 'pgsql-generic-table')"
              >
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.graphicChecked" :active-text="$t('configdetails.graphic')"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.mapChecked" :active-text="$t('configdetails.map')"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
            </el-row>
            
    
           
            <el-form-item
              v-if="(curConfig.type === 'external')"
              :label="$t('configdetails.url')"
              :label-width="formLabelWidth"
            >
              <el-input size="small" v-model="curConfig.config.url" autocomplete="off"></el-input>
              <!-- Le selecteur de type sur la meme ligne que l'interrupteur : empile, il se lit comme un
                   reglage independant. Le `el-row` est un conteneur flex en Element Plus, la ligne tient. -->
              <el-row>
                <div style="display:flex; align-items:center; gap:16px;">
                  <el-switch v-model="curConfig.timeSelectorChecked" :active-text="$t('configdetails.time_selector')"></el-switch>
                  <el-select
                    size="small"
                    style="width:180px;"
                    v-model="curConfig.timeSelectorType"
                    :placeholder="$t('configdetails.select_type')"
                    @change="timeSelectorTypeChange"
                  >
                    <el-option :label="$t('configdetails.time_type_free')" value="classic"></el-option>
                    <el-option :label="$t('configdetails.time_type_day')" value="day"></el-option>
                    <el-option :label="$t('configdetails.time_type_month')" value="month"></el-option>
                    <el-option :label="$t('configdetails.time_type_week')" value="week"></el-option>
                    <el-option :label="$t('configdetails.time_type_year')" value="year"></el-option>
                  </el-select>
                </div>
              </el-row>
            </el-form-item>

            <!-- Controller -->
            <el-form-item
              v-if="(curConfig.type === 'internal')"
              :label="$t('configdetails.controller')"
              :label-width="formLabelWidth"
            >
              <el-select
                v-model="curConfig.config.controller"
                size="small"
                filterable
                allow-create
                clearable
                default-first-option
                style="width:100%"
                :placeholder="$t('configdetails.controller_placeholder')"
              >
                <el-option-group :label="$t('configdetails.controller_pages')">
                  <el-option
                    v-for="page in controllerPages"
                    :key="page.name"
                    :label="page.name"
                    :value="page.name"
                  ></el-option>
                </el-option-group>
                <el-option-group
                  v-if="otherControllers.length > 0"
                  :label="$t('configdetails.controller_components')"
                >
                  <el-option
                    v-for="name in otherControllers"
                    :key="name"
                    :label="name"
                    :value="name"
                  ></el-option>
                </el-option-group>
              </el-select>
              <div class="controller-help">
                <el-icon><component :is="$icons.InfoFilled" /></el-icon>
                <span>{{ selectedControllerHelp }}</span>
              </div>
            </el-form-item>
            <el-form-item
              v-if="(curConfig.type === 'internal')"
              :label="$t('configdetails.parameters')"
              :label-width="formLabelWidth"
            >
              <el-input
                size="small"
                v-model="curConfig.config.controllerparameters"
                autocomplete="off"
              ></el-input>
            </el-form-item>

          </el-card>
        </el-tab-pane>
        <el-tab-pane :label="$t('configdetails.tab_privileges')" name="privileges" key="privileges">
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
                  :titles="[$t('configdetails.available'), $t('configdetails.assigned')]"
                ></el-transfer>
              </div>
            </div>
            <br />
          </el-card>
        </el-tab-pane>
        <el-tab-pane
          :label="$t('configdetails.tab_table')"
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
                    <el-switch v-model="curConfig.queryBarChecked" :active-text="$t('configdetails.query_bar')" @change="query_bar_changed"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.downloadChecked" :active-text="$t('configdetails.download')"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.queryFilterChecked" :active-text="$t('configdetails.query_filter')" @change="query_filter_changed"></el-switch>
                  </el-row>

                  <!-- Le selecteur de type sur la meme ligne que l'interrupteur : empile, il se lit comme un
                       reglage independant. Le `el-row` est un conteneur flex en Element Plus, la ligne tient. -->
                  <el-row>
                    <div style="display:flex; align-items:center; gap:16px;">
                      <el-switch v-model="curConfig.timeSelectorChecked" :active-text="$t('configdetails.time_selector')"></el-switch>
                      <el-select
                        size="small"
                        style="width:180px;"
                        v-model="curConfig.timeSelectorType"
                        :placeholder="$t('configdetails.select_type')"
                        @change="timeSelectorTypeChange"
                      >
                        <el-option :label="$t('configdetails.time_type_free')" value="classic"></el-option>
                        <el-option :label="$t('configdetails.time_type_day')" value="day"></el-option>
                        <el-option :label="$t('configdetails.time_type_month')" value="month"></el-option>
                        <el-option :label="$t('configdetails.time_type_week')" value="week"></el-option>
                        <el-option :label="$t('configdetails.time_type_year')" value="year"></el-option>
                      </el-select>
                    </div>
                  </el-row>
                </el-form-item>
              </el-col>
              
              <el-col
                :span="8"                
              >
                <el-form-item label :label-width="formLabelWidth">
                  <el-row>
                    <el-switch v-model="curConfig.graphicChecked" :active-text="$t('configdetails.graphic')"></el-switch>
                  </el-row>
                  <el-row>
                    <el-switch v-model="curConfig.mapChecked" :active-text="$t('configdetails.map')"></el-switch>
                  </el-row>
                </el-form-item>
              </el-col>
            </el-row>
              <el-row>
                
                  <el-col :span="6">
                    <el-form-item :label="$t('configdetails.database_type')" :label-width="formLabelWidth">
                      <el-select
                        size="small"
                        v-model="curConfig.config.databaseType"
                        :placeholder="$t('configdetails.select_db_type')"
                        style="width: 100%;"
                      >
                        <el-option :label="$t('configdetails.db_type_postgresql')" value="postgres"></el-option>
                        <el-option :label="$t('configdetails.db_type_sqlserver')" value="sqlserver"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                
              </el-row>
              <el-row>

                <el-col :span="6">
                  <el-form-item :label="$t('configdetails.database')" :label-width="formLabelWidth">
                    <el-input   size="small" v-model="curConfig.config.database" :placeholder="$t('configdetails.database_name_placeholder')" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>        
                
                <el-col :span="6">
                  <el-form-item :label="$t('configdetails.index_table')" :label-width="formLabelWidth">
                    <el-input size="small" v-model="curConfig.config.index" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                




                <el-col :span="6">
                  <el-form-item
                    :label="$t('configdetails.doc_type')"
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'generic-table')"
                  >
                    <el-input size="small" v-model="curConfig.config.doc_type" autocomplete="off"></el-input>
                  </el-form-item>
                  <el-form-item
                    :label="$t('configdetails.pkey')"
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'pgsql-generic-table')"
                  >
                    <el-input size="small" v-model="curConfig.config.pkey" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    :label="$t('configdetails.map_field')"
                    :label-width="formLabelWidth"
                    v-if="curConfig.mapChecked"
                  >
                    <el-input size="small" v-model="curConfig.config.mapfield" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col :span="6">
                  <el-form-item :label="$t('configdetails.sort')" :label-width="formLabelWidth">
                    <el-input size="small" v-model="curConfig.config.sort_column" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item :label="$t('configdetails.order')" :label-width="formLabelWidth">
                    <el-input size="small" v-model="curConfig.config.sort_order" :placeholder="$t('configdetails.order_placeholder')" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col> 
                <el-col :span="6">
                  <el-form-item :label="$t('configdetails.time_field')" :label-width="formLabelWidth">
                    <el-input size="small" v-model="curConfig.config.timefield" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                       
              </el-row>

              <el-row v-if="(curConfig.type === 'pgsql-generic-table')">
                <el-col :span="24">
                  <el-form-item :label="$t('configdetails.sql')" :label-width="formLabelWidth">
                    <el-input
                      :placeholder="$t('configdetails.sql_placeholder')"
                      size="small"
                      v-model="curConfig.config.sql"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-form-item :label="$t('configdetails.editor')" :label-width="formLabelWidth">
                    <el-input
                      :placeholder="$t('configdetails.editor_placeholder')"
                      size="small"
                      v-model="curConfig.config.editorComponent"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    :label="$t('configdetails.default_order')"
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'generic-table')"
                  >
                    <el-input size="small" v-model="curConfig.config.orderField" autocomplete="off"></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item
                    label
                    :label-width="formLabelWidth"
                    v-if="(curConfig.type === 'generic-table')"
                  >
                    <el-checkbox v-model="curConfig.config.orderDirection">{{ $t('configdetails.descending') }}</el-checkbox>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="12">
                  <el-form-item :label="$t('configdetails.export')" :label-width="formLabelWidth">
                    <el-input
                      :placeholder="$t('configdetails.export_placeholder')"
                      size="small"
                      v-model="curConfig.config.exportColumns"
                      autocomplete="off"
                    ></el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item :label="$t('configdetails.write_privilege')" :label-width="formLabelWidth">
                    <!-- <el-input
                      size="small"
                      v-model="curConfig.config.writeprivileges"
                      autocomplete="off"
                    ></el-input> -->

                    <el-select
                      v-model="curConfig.config.writeprivileges"
                      multiple
                      filterable
                      allow-create
                      ref="writePrivileges"
                      :placeholder="$t('configdetails.write_privilege_placeholder')"
                      size="small"
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
                  <el-button size="small" @click="handleAddField()">{{ $t('cfg.add_field') }}</el-button>
                </el-col>
                <el-col :span="20">
                  <!-- Header dialog -->
                  <el-dialog
                    :title="$t('configdetails.columns')"
                    v-model="dialogHeaderVisible"
                    width="30%"
                    append-to-body
                  >
                    <el-form v-if="currentHeader" :model="currentHeader">
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item :label="$t('configdetails.field')" :label-width="formLabelWidth">
                            <el-input size="small" v-model="currentHeader.field" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item :label="$t('configdetails.title')" :label-width="formLabelWidth">
                            <el-input size="small" v-model="currentHeader.title" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row :gutter="20">
                        <el-col :span="20">
                          <el-form-item :label="$t('configdetails.type')" :label-width="formLabelWidth">
                            <el-select
                              size="small"
                              v-model="currentHeader.type"
                              :placeholder="$t('configdetails.select_type')"
                            >
                              <el-option :label="$t('configdetails.col_type_generic')" value="generic"></el-option>
                              <el-option :label="$t('configdetails.col_type_date')" value="date"></el-option>
                              <el-option :label="$t('configdetails.col_type_timestamp')" value="timestamp"></el-option>
                              <el-option :label="$t('configdetails.col_type_boolean')" value="boolean"></el-option>
                            </el-select>
                          </el-form-item>
                        </el-col>
                      </el-row>
                      <el-row
                        :gutter="20"
                        v-if="currentHeader.type=='date' || currentHeader.type=='timestamp'"
                      >
                        <el-col :span="20">
                          <el-form-item :label="$t('configdetails.format')" :label-width="formLabelWidth">
                            <el-input size="small" v-model="currentHeader.format" autocomplete="off"></el-input>
                          </el-form-item>
                        </el-col>
                      </el-row>
                    </el-form>
                    <template #footer><span class="dialog-footer">
                      <el-button type="primary" @click="dialogHeaderVisible = false">{{ $t('configdetails.close') }}</el-button>
                    </span></template>
                  </el-dialog>

                  <el-table
                    class="headertable"
                    :data="curConfig.config.headercolumns"
                    @current-change="handleCurrentHeaderChange"
                    border
                    style="width: 100%"
                  >
                    <el-table-column prop="field" :label="$t('configdetails.field')"></el-table-column>
                    <el-table-column prop="title" :label="$t('configdetails.title')"></el-table-column>
                    <el-table-column prop="type" :label="$t('configdetails.type')"></el-table-column>
                    <el-table-column prop="format" :label="$t('configdetails.format')"></el-table-column>
                    <el-table-column prop="title" :label="$t('configdetails.action')">
                      <template #default="scope2">
                        <el-button
                          size="small"
                          circle
                          @click="handleEditHeader(scope2.$index, scope2.row)"
                          :icon="$icons.EditPen"
                        ></el-button>
                        <el-button
                          size="small"
                          circle
                          type="danger"
                          @click="handleDeleteHeader(scope2.$index, scope2.row)"
                          :icon="$icons.Delete"
                        ></el-button>

                        <el-button
                          size="small"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,false)"
                          :icon="$icons.ArrowDown"
                          v-if="scope2.$index<curConfig.config.headercolumns.length-1"
                        ></el-button>
                        <el-button
                          size="small"
                          circle
                          type="primary"
                          @click="handleMoveHeader(scope2.$index, scope2.row,true)"
                          :icon="$icons.ArrowUp"
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
          :label="$t('configdetails.tab_table')"
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
          :label="$t('configdetails.tab_kibana')"
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
          :label="$t('configdetails.tab_grafana')"
          name="grafana"
          key="grafana"
          v-if="(curConfig.type === 'grafana')"
        >
          <GrafanaEditor
            :allPrivileges="allPrivileges"
            :currentConfig="curConfig"
          ></GrafanaEditor>
        </el-tab-pane>

        <el-tab-pane
          :label="$t('configdetails.tab_upload')"
          name="upload"
          key="upload"
          v-if="(curConfig.type === 'upload')"
        >
          <UploadEditor            
            :currentConfig="curConfig"
          ></UploadEditor>
        </el-tab-pane>
        <el-tab-pane
          :label="$t('configdetails.tab_file_system')"
          name="filesystem"
          key="filesystem"
          v-if="(curConfig.type === 'file-system')"
        >
        
          <FileSystemEditor            
            :currentConfig="curConfig"
          ></FileSystemEditor>
        </el-tab-pane>

     

        <!-- ******* FORM ******* -->
        <el-tab-pane :label="$t('configdetails.tab_form')" name="form" key="form" v-if="(curConfig.type === 'form')">
          <FormEditor
            :currentConfig="curConfig"
          ></FormEditor>
        </el-tab-pane>
        <!-- FREE TEXT -->
        <el-tab-pane
          :label="$t('configdetails.tab_free_text')"
          name="freetext"
          key="freetext"
          v-if="(curConfig.type === 'free-text')"
        >
          <el-card>
            <FreeTextDetails :config="curConfig" v-on:freetextchanged="freeTextChanged"></FreeTextDetails>
          </el-card>
        </el-tab-pane>
        <!-- Vega -->
        <el-tab-pane :label="$t('configdetails.tab_vega')" name="vega" key="vega" v-if="(curConfig.type === 'vega')">
          <el-card>
            <el-input
              type="textarea"
              :rows="10"
              :placeholder="$t('configdetails.vega_spec_placeholder')"
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
          v-if="((curConfig.type === 'kibana')||(curConfig.type === 'generic-table')) && (curConfig.queryFilterChecked) && (!curConfig.config.useShortUrl)"
        >
          <el-card>
            <div>
              <el-row>
                <el-col :span="4">
                  <el-button size="small" @click="handleAddQueryFilterField()">{{ $t('cfg.add_field') }}</el-button>
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
                      <template #default="scope2">
                        <el-button
                          size="small"
                          circle
                          @click="handleEditQueryFilterField(scope2.$index, scope2.row)"
                          :icon="$icons.EditPen"
                        ></el-button>
                        <el-button
                          size="small"
                          circle
                          type="danger"
                          @click="handleDeleteQueryFilter(scope2.$index, scope2.row)"
                          :icon="$icons.Delete"
                        ></el-button>

                        <el-button
                          size="small"
                          circle
                          type="primary"
                          @click="handleMoveQueryFilter(scope2.$index, scope2.row,false)"
                          :icon="$icons.ArrowDown"
                          v-if="scope2.$index<curConfig.config.queryfilters.length-1"
                        ></el-button>
                        <el-button
                          size="small"
                          circle
                          type="primary"
                          @click="handleMoveQueryFilter(scope2.$index, scope2.row,true)"
                          :icon="$icons.ArrowUp"
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
              v-model:value="strNewRec"
              id="test"
              @init="editorInit"
              lang="yaml"
              :theme="aceTheme"
              style="border: solid 1px #c0c4cc; height: 600px; width: 99%;"
            ></editor>
            <div>&nbsp;</div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </el-form>
    <template #footer><span class="dialog-footer">
      <el-button @click="$emit('dialogclose');">{{ $t('configdetails.cancel') }}</el-button>
      <el-button
        :disabled="(JSON.stringify(curConfig)==JSON.stringify(orgConfig._source)) && (strNewRec==strOrgRec)"
        type="primary"
        @click="saveRecord()"
      >{{ $t('configdetails.confirm') }}</el-button>
    </span></template>
  </el-dialog>
</template>
<script>
import "@/utils/aceModules";
import { registerComponent } from '@/utils/vue3shim'
import { VAceEditor } from "vue3-ace-editor";
import freetextdetails from "@/components/FreeTextDetails";
import iconpicker from "@/components/IconPicker";

import queryfiltereditor from "@/components/appConfigEditor/QueryFilterEditor";
import estableeditor from "@/components/appConfigEditor/ESTableEditor";
import kibanaeditor from "@/components/appConfigEditor/KibanaEditor";
import grafanaeditor from "@/components/appConfigEditor/GrafanaEditor";
import formeditor from "@/components/appConfigEditor/FormEditor";
import uploadeditor from "@/components/appConfigEditor/UploadEditor";
import filesystemeditor from "@/components/appConfigEditor/FileSystemEditor";


import { CONTROLLER_PAGES, describeController, otherComponents } from "@/controllerCatalog";

import aceThemeMixin from "@/mixins/aceTheme";
import { kibanaAppUrl, kibanaDashboardPath } from "@/utils/kibanaUrl";
import {
  configYaml,
  controllerLabel,
  normaliseConfigForForm,
  resolveSavedSource,
  suggestCategories,
  suggestSubcategories,
} from "@/utils/appConfigForm";

registerComponent("FreeTextDetails", freetextdetails);
registerComponent("IconPicker", iconpicker);

registerComponent("QueryFilterEditor", queryfiltereditor);
registerComponent("ESTableEditor", estableeditor);
registerComponent("FormEditor", formeditor);
registerComponent("KibanaEditor", kibanaeditor);
registerComponent("GrafanaEditor", grafanaeditor);
registerComponent("UploadEditor", uploadeditor);
registerComponent("FileSystemEditor", filesystemeditor);


export default {
  mixins: [aceThemeMixin],
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
        formLabelWidth: "200px",
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
    editor: VAceEditor
  },
  computed: {
    curConfigIn: function() {
      return this.currentConfig;
    },
    // Pages available as an `internal` application, described for the person creating it.
    controllerPages: function() {
      return CONTROLLER_PAGES.map(page => ({
        name: page.name,
        description: this.controllerDescription(page)
      }));
    },
    otherControllers: function() {
      return otherComponents();
    },
    selectedControllerHelp: function() {
      const selected = this.curConfig && this.curConfig.config && this.curConfig.config.controller;
      const page = describeController(selected);
      if (page) return this.controllerDescription(page);
      if (selected) return this.$t("configdetails.controller_custom");
      return this.$t("configdetails.controller_help");
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
    // The translation wins when it exists, the English description of the catalogue is the fallback.
    controllerDescription: function(page) {
      return controllerLabel(
        page,
        (key) => this.$te(key),
        (key) => this.$t(key)
      );
    },
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
      cb(suggestCategories(this.$store.getters.filteredmenus, queryString));
    },
    handleSelect() {},
    subcategorySuggestion: function(queryString, cb) {
      cb(
        suggestSubcategories(
          this.$store.getters.filteredmenus,
          this.curConfig.category,
          queryString
        )
      );
    },
    editorInitRO: function(editor) {

      editor.setReadOnly(true);
    },
    editorInit: function() {
      // eslint-disable-line
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
      // Copie profonde, listes par defaut, valeur de rafraichissement Kibana remise en clair :
      // c'est `normaliseConfigForForm`, teste sans monter l'ecran.
      this.curConfig = normaliseConfigForForm(this.currentConfig);

      this.dialogHeaderVisible = false;
      this.formFielfEditorVisible = false;
      this.currentHeader = {};

      this.strNewRec = "";
      this.strOrgRec = "";

      //this.loadKibanaDashboards();

      this.$nextTick(() => {
        this.refresh2();
      });



    },
    refresh2: function() {
      // Le YAML sert d'apercu et de comparaison : editer l'apercu est le seul moyen d'ecrire ce
      // que le formulaire ne montre pas.
      this.strNewRec = configYaml(this.curConfig);
      this.strOrgRec = configYaml(this.currentConfig);
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
      // Le chemin du tableau de bord est construit dans `utils/kibanaUrl.js` : ici on ne garde que
      // la periode retenue, que le formulaire doit reafficher.
      const built = kibanaDashboardPath({
        dash: this.selectedDash,
        kibanaTime: this.curConfig.config && this.curConfig.config.kibanaTime,
        timeRefresh: this.curConfig.timeRefresh,
        timeRefreshValue: this.curConfig.timeRefreshValue,
      });

      if (this.curConfig.config == undefined) this.curConfig.config = {};
      this.curConfig.config.kibanaTime = built.kibanaTime;

      return built.path;
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

      // Le passage par `null` datait de Vue 2, ou il servait a forcer la reactivite des champs
      // imbriques. Ici `curConfig` est un computed dont le setter commite dans le store : rendre le
      // composant entre les deux affectations le faisait rendre avec `curConfig` a null, et le
      // template tombait sur `curConfig.type`.
      this.curConfig = JSON.parse(JSON.stringify(this.curConfig));
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


      // Le passage par `null` datait de Vue 2, ou il servait a forcer la reactivite des champs
      // imbriques. Ici `curConfig` est un computed dont le setter commite dans le store : rendre le
      // composant entre les deux affectations le faisait rendre avec `curConfig` a null, et le
      // template tombait sur `curConfig.type`.
      this.curConfig = JSON.parse(JSON.stringify(this.curConfig));
    },
    timeRefreshSwitchChange() {
      this.computeUrlFromKibana();


      // Le passage par `null` datait de Vue 2, ou il servait a forcer la reactivite des champs
      // imbriques. Ici `curConfig` est un computed dont le setter commite dans le store : rendre le
      // composant entre les deux affectations le faisait rendre avec `curConfig` a null, et le
      // template tombait sur `curConfig.type`.
      this.curConfig = JSON.parse(JSON.stringify(this.curConfig));

      console.log(this.curConfig.config.url)
    },
    timeSelectorTypeChange() {
      if (this.curConfig.timeSelectorType != null)
        this.curConfig.timeSelectorChecked = true;

      // Le passage par `null` datait de Vue 2, ou il servait a forcer la reactivite des champs
      // imbriques. Ici `curConfig` est un computed dont le setter commite dans le store : rendre le
      // composant entre les deux affectations le faisait rendre avec `curConfig` a null, et le
      // template tombait sur `curConfig.type`.
      this.curConfig = JSON.parse(JSON.stringify(this.curConfig));
    },
    kibanaTimeChange() {
      console.log("kibana time changed");
      this.computeUrlFromKibana();
    },
    computeUrlFromKibana() {
      if (this.selectedDash != null) {
        this.curConfig.config.url = kibanaAppUrl({
          dash: this.selectedDash,
          baseUrl: this.$store.getters.kibanaurl,
          dashboardPath: this.computeKibanaUrlFromSelectedDash(),
        });

        this.curConfig = JSON.parse(JSON.stringify(this.curConfig));
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
    handleEditQueryFilterField(index, row) {
      // eslint-disable-line
      this.currentQueryFilter = row;
      this.queryFilterEditorVisible = true;
    },
    timeRefreshSelectChange() {
      if (this.curConfig.timeRefreshValue != null)
        this.curConfig.timeRefresh = true;


      this.computeUrlFromKibana();


      // Le passage par `null` datait de Vue 2, ou il servait a forcer la reactivite des champs
      // imbriques. Ici `curConfig` est un computed dont le setter commite dans le store : rendre le
      // composant entre les deux affectations le faisait rendre avec `curConfig` a null, et le
      // template tombait sur `curConfig.type`.
      this.curConfig = JSON.parse(JSON.stringify(this.curConfig));
    },
    timeRefreshSwitchChange() {
      this.computeUrlFromKibana();


      // Le passage par `null` datait de Vue 2, ou il servait a forcer la reactivite des champs
      // imbriques. Ici `curConfig` est un computed dont le setter commite dans le store : rendre le
      // composant entre les deux affectations le faisait rendre avec `curConfig` a null, et le
      // template tombait sur `curConfig.type`.
      this.curConfig = JSON.parse(JSON.stringify(this.curConfig));

      console.log(this.curConfig.config.url)
    },
    timeSelectorTypeChange() {
      if (this.curConfig.timeSelectorType != null)
        this.curConfig.timeSelectorChecked = true;

      // Le passage par `null` datait de Vue 2, ou il servait a forcer la reactivite des champs
      // imbriques. Ici `curConfig` est un computed dont le setter commite dans le store : rendre le
      // composant entre les deux affectations le faisait rendre avec `curConfig` a null, et le
      // template tombait sur `curConfig.type`.
      this.curConfig = JSON.parse(JSON.stringify(this.curConfig));
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
      this.orgConfig._source = resolveSavedSource({
        newText: this.strNewRec,
        orgText: this.strOrgRec,
        curConfig: this.curConfig,
        isAdd: this.isAdd,
      });

      this.$store.commit({
        type: "updateRecord",
        data: this.orgConfig
      });
      this.$notify({
        title: this.$t("rep.record_saved"),
        type: "success",
        message: this.$t("ui.logout_login_changes"),
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
.controller-help {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.35;
  color: #909399;
}
.controller-help .el-icon-info {
  margin-top: 2px;
  flex: 0 0 auto;
}
.searchfield {
  width: 150px !important;
}
</style>