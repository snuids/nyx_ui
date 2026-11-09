<template>
  <div id="config-table-editor">
    <el-card v-if="step==1">
      <h1 style="text-align:left;">{{ $t('cfg.step1') }}</h1>

      <el-row style="text-align:left;">
        <el-button @click="setFocus('indexPattern')" type="text">{{ $t('cfg.index_pattern') }}</el-button>
      </el-row>
      <el-row>
        <el-col :span="12">
          <input
            placeholder="index-field-*"
            @focus="focusInput"
            ref="indexPattern"
            id="indexPattern"
            type="text"
            autocomplete="off"
            @input="indexPatternChanged()"
            v-model="currentConfig.config.index"
          />
        </el-col>
        <el-col :offset="6" :span="6" style="text-align:right;">
          <el-button
            :disabled="!succesIndexPatternDefinition || currentConfig.config.index==''"
            plain
            :type="succesIndexPatternDefinition && currentConfig.config.index!=''?'primary': ''"
            :icon="$icons.ArrowRight"
            @click="goToStep(2)"
            size="small"
          >{{ $t('cfg.next_step') }}</el-button>
        </el-col>
      </el-row>
      <el-row style="text-align:left;">
        <span>
          {{ $t('cfg.index_pattern_help') }}
          <br />{{ $t('cfg.index_pattern_chars') }} \, /, ?, &quot;, &lt;, &gt;, |.
        </span>
      </el-row>

      <el-row>
        <el-table :data="esMapping || []" size="small" style="width: 100%">
          <el-table-column label="id" prop="id">
            <template #header>
              <p
                v-bind:class="{ 'text-success': succesIndexPatternDefinition }"
                v-html="helpMessage"
              ></p>
            </template>
            <template #default="scope">
              <el-button
                style="padding: 0px;"
                @click="setIndex(scope.row.id)"
                type="text"
              >{{scope.row.id}}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-row>
    </el-card>
    <el-card v-if="step==2">
      <el-row>
        <el-col :span="18" style="text-align:left;">
          <h1 style="text-align:left;">{{ $t('cfg.step2') }}</h1>
        </el-col>
        <el-col :span="6" style="text-align:right;">
          <el-button
            :disabled="!succesIndexPatternDefinition || currentConfig.config.index==''"
            plain
            :type="succesIndexPatternDefinition && currentConfig.config.index!=''?'primary': ''"
            :icon="$icons.ArrowLeft"
            @click="goToStep(1)"
            size="small"
          >{{ $t('cfg.back') }}</el-button>
        </el-col>
      </el-row>

      <el-row style="text-align:left;" v-if="!noTimeField">
        <span>
          {{ $t('cfg.youve_defined') }}
          <b>{{currentConfig.config.index}}</b> {{ $t('cfg.index_pattern_settings') }}
        </span>
      </el-row>
      <el-row style="text-align:left;" v-if="noTimeField">
        <span>{{ $t('cfg.no_time_fields') }}</span>
      </el-row>
      <el-row style="text-align:left;">
        <el-col :span="12" style="text-align:left;" v-if="!noTimeField">
          <el-button @click="setFocus('timeField')" type="text">{{ $t('cfg.time_filter_field') }}</el-button>
        </el-col>
        <el-col :span="6" style="text-align:left;">
          <el-button @click="setFocus('docType')" type="text">{{ $t('cfg.document_type') }}</el-button>
        </el-col>
        <el-col :span="6" style="text-align:left;">
          <el-button @click="setFocus('refreshtime')" type="text">{{ $t('cfg.auto_refresh') }}</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" v-if="!noTimeField" class="padding-right">
          <!-- v-model="currentConfig.config.timefield"  -->
          <el-select
            v-model="timefieldSelected"
            :placeholder="$t('cfg.select')"
            size="small"
            ref="timeField"
            @change="timeFieldChanged()"
            style="width:100%;"
          >
            <el-option
              v-for="item in timeFields"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="6" class="padding-right">
          <el-input
            :placeholder="$t('cfg.default_doc')"
            ref="docType"
            type="text"
            size="small"
            autocomplete="off"
            v-model="currentConfig.config.doc_type"
          ></el-input>
        </el-col>
        <el-col :span="6">
          <el-select size="small" style="width:100%" v-model="currentConfig.autoRefreshTime" :placeholder="$t('cfg.select')">
            <el-option
              v-for="item in timeRefreshOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-row v-if="!noTimeField && hasSelectedTimeField">
        <el-col :span="12" class="padding-right">
          <el-card shadow="never">
            <el-row>
              <el-switch v-model="currentConfig.graphicChecked" :active-text="$t('cfg.time_line')"></el-switch>
            </el-row>
            <el-row>
              <!-- Two `el-col` without a `span` take the whole row in Element Plus (`flex: 0 0 100%`),
                   whatever width the inline style asks for, so the type selector always wrapped under
                   the switch. One flex line keeps it to its right, where it reads as part of the same
                   setting — and `Day` was missing from this list while the other editors offer it. -->
              <div style="display:flex; align-items:center; gap:16px;">
                <el-switch v-model="currentConfig.timeSelectorChecked" :active-text="$t('cfg.time_selector')"></el-switch>
                <el-select
                  v-if="currentConfig.timeSelectorChecked"
                  style="width:180px;"
                  size="small"
                  v-model="currentConfig.timeSelectorType"
                  :placeholder="$t('cfg.select_type')"
                >
                  <el-option :label="$t('cfg.free')" value="classic"></el-option>
                  <el-option :label="$t('cfg.day')" value="day"></el-option>
                  <el-option :label="$t('cfg.month')" value="month"></el-option>
                  <el-option :label="$t('cfg.week')" value="week"></el-option>
                  <el-option :label="$t('cfg.year')" value="year"></el-option>
                </el-select>
              </div>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <el-row style="text-align:left;">
        <el-button @click="setFocus('fieldsToDisplay')" type="text">{{ $t('cfg.fields_to_display') }}</el-button>
      </el-row>
      <el-row>
        <el-col :span="24" style="text-align:left;">
          <el-select
            v-model="fieldsToDisplay"
            multiple
            filterable
            @change="selectFieldsToDisplayChanged"
            ref="fieldsToDisplay"
            :placeholder="$t('cfg.field_to_display')"
            size="small"
            style="width:100%;"
          >
            <el-option
              v-for="item in allFields"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            ></el-option>
          </el-select>
        </el-col>
      </el-row>

      <el-row v-if="currentConfig.config.headercolumns">
        <el-col :span="24">
          <el-card shadow="never" v-if="currentConfig.config.headercolumns.length>0">
            <table class="table-display">
              <thead class="thead-display">
                <tr>
                  <th>{{ $t('cfg.field') }}</th>
                  <th>{{ $t('cfg.label') }}</th>

                  <th>{{ $t('cfg.type') }}</th>
                  <th>{{ $t('cfg.format') }}</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <draggable
                @change="draggableChanged('display')"
                v-bind="dragOptionsDisplay"
                v-model="currentConfig.config.headercolumns"
                tag="tbody"
                handle=".handle"
                item-key="field"
              >
                <template #item="{ element: item, index }">
                  <tr>
                    <td>{{item.field}}</td>
                    <td>
                      <el-input
                        class="display-name-input"
                        ref="author"
                        :placeholder="$t('cfg.name')"
                        v-model="item.title"
                        size="small"
                      ></el-input>
                    </td>
                    <td>{{item.type}}</td>
                    <td style="width:200px;">
                      <el-input
                        v-if="item.type=='date' || item.type=='timestamp'"
                        class="display-name-input"
                        ref="author"
                        placeholder="eg. DD/MM/YYYY HH:mm"
                        v-model="item.format"
                        size="small"
                      ></el-input>
                      <el-input
                        v-else-if="item.type=='long' || item.type=='double'"
                        class="display-name-input"
                        ref="author"
                        placeholder="Numeral.js format"
                        v-model="item.format"
                        size="small"
                      ></el-input>
                      <el-select
                        v-else-if="item.type=='keyword' || item.type=='text'"
                        v-model="item.format"
                        filterable
                        :placeholder="$t('cfg.default')"
                        size="small"
                        style="width:100%;"
                      >
                        <el-option :label="$t('cfg.default')" value="default"></el-option>
                        <el-option :label="$t('cfg.icon')" value="icon"></el-option>
                        <el-option :label="$t('cfg.link')" value="link"></el-option>
                      </el-select>
                    </td>
                    <td>
                      <el-button @click="linkEditorVisible=true; selectedItem=item" v-if="item.format=='link'" size="small">{{ $t('cfg.configure') }}</el-button>
                    </td>
                    <td>
                      <el-icon class="handle"><component :is="$icons.DCaret" /></el-icon>
                    </td>
                  </tr>
                </template>
              </draggable>
            </table>
          </el-card>
            <LinkEditor
                v-on:dialogclose="linkUpdated"
                :item="selectedItem"
                v-if="linkEditorVisible"></LinkEditor>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-button @click="setFocus('order')" type="text">{{ $t('cfg.sort') }}</el-button>
        </el-col>
        <el-col :span="12">
          <el-button @click="setFocus('hiddenQuery')" type="text">{{ $t('cfg.hidden_query') }}</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="padding-right">
          <el-select
            v-model="currentConfig.config.orderField"
            filterable
            clearable
            ref="order"
            :placeholder="$t('cfg.sort_field')"
            size="small"
            style="width:100%;"
          >
            <el-option
              v-for="item in allFields"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="12">
          <el-input
            :placeholder="$t('cfg.filter_query')"
            ref="hiddenQuery"
            type="text"
            size="small"
            autocomplete="off"
            v-model="currentConfig.config.hiddenQuery"
          ></el-input>
        </el-col>
      </el-row>
      <el-row v-if="currentConfig.config.orderField">
        <el-col :span="12" class="padding-right">
          <el-card shadow="never">
            <el-switch
              v-model="currentConfig.config.orderDirection"
              :active-text="$t('cfg.descending')"
              :inactive-text="$t('cfg.ascending')"
            ></el-switch>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-button @click="setFocus('')" type="text">{{ $t('cfg.user_queries') }}</el-button>
        </el-col>
      </el-row>
      <el-row>
        <UserQueriesEditor
          :currentConfig="currentConfig"
          :allFields="allFieldsFilter"
        ></UserQueriesEditor>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-button @click="setFocus('download')" type="text">{{ $t('cfg.download_records') }}</el-button>
        </el-col>
        <el-col :span="12">
          <el-button @click="setFocus('geofields')" type="text">{{ $t('cfg.geo_fields') }}</el-button>
        </el-col>
      </el-row>

      <el-row style="text-align:left;">
        <el-col :span="12" class="padding-right">
          <el-card shadow="never">
            <el-row>
                <el-switch v-model="currentConfig.downloadChecked" :active-text="$t('cfg.download_button')"></el-switch>
            </el-row>
            <el-row v-if="currentConfig.downloadChecked">
              
                <el-button
                  @click="copyFieldsToDisplayToDownload()"
                  type="text"
                  size="small"
                  
                >{{ $t('cfg.copy_from_fields') }}</el-button>
              
            </el-row>
            <el-row v-if="currentConfig.downloadChecked">
              <el-select
                v-model="fieldsToDownload"
                multiple
                filterable
                @change="selectFieldsToDownloadChanged"
                ref="fieldsToDownload"
                :placeholder="$t('cfg.field_to_download')"
                size="small"
                style="width:100%;"
              >
                <el-option
                  v-for="item in allFields"
                  :key="item.field"
                  :label="item.field"
                  :value="item.field"
                ></el-option>
              </el-select>
            </el-row>
            <el-row v-if="currentConfig.downloadChecked && currentConfig.config.tableFieldsToDownload">
              <el-card shadow="never" v-if="currentConfig.config.tableFieldsToDownload.length>0">
                <table class="table-display">
                  <thead class="thead-display">
                    <tr>
                      <th>{{ $t('cfg.field') }}</th>
                      <th>{{ $t('cfg.label') }}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <draggable
                    @change="draggableChanged('download')"
                    v-bind="dragOptionsDownload"
                    v-model="currentConfig.config.tableFieldsToDownload"
                    tag="tbody"
                    handle=".handle"
                    item-key="field"
              >
                    <template #item="{ element: item, index }">
                      <tr>
                        <td>{{item.field}}</td>
                        <td>
                          <el-input
                            class="display-name-input"
                            ref="author2"
                            :placeholder="$t('cfg.name')"
                            v-model="item.title"
                            size="small"
                          ></el-input>
                        </td>
                        <td>
                          <el-icon class="handle"><component :is="$icons.DCaret" /></el-icon>
                        </td>
                      </tr>
                    </template>
                  </draggable>
                </table>
              </el-card>
            </el-row>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never">
            <el-row>
              <el-switch 
              :disabled="isEmpty(geoFields) && isEmpty(latLonFields)"
              v-model="currentConfig.mapChecked" :active-text="$t('cfg.map')"></el-switch>
            </el-row>
            <el-row v-if="currentConfig.mapChecked" style="margin-top: 15px;">
              <el-col :span="12">
                <el-button @click="setFocus('geoField')" type="text">{{ $t('cfg.geo_field') }}</el-button>
              </el-col>
              <el-col :span="12">
                <el-button @click="setFocus('zoom')" type="text">{{ $t('cfg.zoom') }}</el-button>
              </el-col>
            </el-row>
            <el-row  v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-select
                  v-model="currentConfig.config.mapfield"
                  :placeholder="$t('cfg.select')"
                  size="small"
                  ref="geoField"
                  style="width:90%;"
                >
                  <el-option
                    v-for="item in geoFields"
                    :key="item.field"
                    :label="item.field"
                    :value="item.field"
                  ></el-option>
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-input-number
                  :min="1"
                  :max="20"
                  size="small"
                  ref="zoom"
                  v-model="currentConfig.config.mapzoom"
                  autocomplete="off"
                ></el-input-number>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-button @click="setFocus('lat')" type="text">Lat.</el-button>
              </el-col>
              <el-col :span="12">
                <el-button @click="setFocus('long')" type="text">Lon.</el-button>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-input-number
                  size="small"
                  ref="lat"
                  v-model="currentConfig.config.maplat"
                  autocomplete="off"
                ></el-input-number>
              </el-col>
              <el-col :span="12">
                <el-input-number
                  size="small"
                  ref="long"
                  v-model="currentConfig.config.maplong"
                  autocomplete="off"
                ></el-input-number>
              </el-col>
            </el-row>

            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <small>{{ $t('cfg.map_two_fields') }}</small>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-button @click="setFocus('latfield')" type="text">{{ $t('cfg.lat_field') }}</el-button>
              </el-col>
              <el-col :span="12">
                <el-button @click="setFocus('lonfield')" type="text">{{ $t('cfg.lon_field') }}</el-button>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="12">
                <el-select
                  v-model="currentConfig.config.maplatfield"
                  :placeholder="$t('cfg.select')"
                  size="small"
                  ref="latfield"
                  clearable
                  style="width:90%;"
                >
                  <el-option
                    v-for="item in latLonFields"
                    :key="'lat-' + item.field"
                    :label="item.field"
                    :value="item.field"
                  ></el-option>
                </el-select>
              </el-col>
              <el-col :span="12">
                <el-select
                  v-model="currentConfig.config.maplonfield"
                  :placeholder="$t('cfg.select')"
                  size="small"
                  ref="lonfield"
                  clearable
                  style="width:90%;"
                >
                  <el-option
                    v-for="item in latLonFields"
                    :key="'lon-' + item.field"
                    :label="item.field"
                    :value="item.field"
                  ></el-option>
                </el-select>
              </el-col>
            </el-row>

          <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-button @click="setFocus('transparency')" type="text">{{ $t('cfg.transparency') }}</el-button>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-slider :min="0" :max="90" v-model="currentConfig.config.transparency" ref="transparency"></el-slider>
              </el-col>
            </el-row>

            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-button @click="setFocus('colorfunc')" type="text">{{ $t('cfg.fields_used_by_functions') }}</el-button>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-input
                  size="small"
                  ref:="colorfunc"
                  :placeholder="$t('cfg.fields_used_by_functions_hint')"
                  v-model="currentConfig.config.functionfields"
                  autocomplete="off"
                ></el-input>
              </el-col>
            </el-row>

            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-button @click="setFocus('colorfunc')" type="text">{{ $t('cfg.color_function') }}</el-button>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-input
                  size="small"
                  ref:="colorfunc"
                  v-model="currentConfig.config.colorfunction"
                  autocomplete="off"
                ></el-input>
              </el-col>
            </el-row>


            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-button @click="setFocus('iconfunc')" type="text">{{ $t('cfg.icon_function') }}</el-button>
              </el-col>
            </el-row>
            <el-row style="text-align:left;" v-if="currentConfig.mapChecked">
              <el-col :span="24">
                <el-input
                  size="small"
                  ref:="iconfunc"
                  v-model="currentConfig.config.iconfunction"
                  autocomplete="off"
                ></el-input>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
      
     
      <el-row style="text-align:left;">
        <el-col :span="12">
          <el-button @click="setFocus('specificEditor')" type="text">{{ $t('cfg.specific_editor') }}</el-button>
        </el-col>
        <el-col :span="12">
          <el-button @click="setFocus('writePrivileges')" type="text">{{ $t('cfg.write_privileges') }}</el-button>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="padding-right">
          <el-input
            :placeholder="$t('cfg.component_url')"
            ref="specificEditor"
            type="text"
            size="small"
            autocomplete="off"
            v-model="currentConfig.config.editorComponent"
          ></el-input>
        </el-col>
        <el-col :span="12">
          <el-select
            v-model="currentConfig.config.writeprivileges"
            multiple
            filterable
            allow-create
            ref="writePrivileges"
            :placeholder="$t('cfg.write_privileges_hint')"
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
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>
<script>
import { registerComponent } from '@/utils/vue3shim'
//import axios from "axios";
import axios from "axios";
import _ from "lodash";

import userquerieseditor from "@/components/appConfigEditor/UserQueriesEditor";
import linkeditor from "@/components/appConfigEditor/LinkEditor";
import {
  allFieldsAsList,
  exportColumnsFromTableFields,
  fieldsOf,
  flattenMapping,
  latLonCandidates,
  selectionToColumns,
  tableFieldsFromExportColumns,
  timefieldSelection,
  withTimeSelectors,
} from "@/utils/tableEditorFields";
registerComponent("UserQueriesEditor", userquerieseditor);
registerComponent("LinkEditor", linkeditor);

export default {
  field: "ESTableEditor",
  data() {
    return (
      window.__FORM__ || {
        dragging: false,
        activeName: "first",
        esMapping: null,
        allesMapping: null,
        geoFieldSelected: null,
        timeFields: {},
        timefieldSelected: null,
        geoFields: {},
        allFields: {},
        writePrivileges: [],
        fieldsToDownload: [],
        fieldsToDisplay: [],
        helpMessage: "",
        succesIndexPatternDefinition: false,
        noTimeField: true,
        linkEditorVisible: false,
        selectedItem: null,
        step: 1,
        timeRefreshOptions: [
          {
            label: 'No time refresh',
            value: null,
          },
          {
            label: '5 seconds',
            value: 5000,
          },
          {
            label: '10 seconds',
            value: 10000,
          },
          {
            label: '30 seconds',
            value: 30000,
          },
          {
            label: '1 minute',
            value: 60000,
          },
          {
            label: '5 minutes',
            value: 300000,
          },
        ],
      }
    );
  },
  computed: {
    hasSelectedTimeField: function() {
      return (
        this.timefieldSelected &&
        this.timefieldSelected != "I don't want to use the Time Filter"
      );
    },
    curConfigIn: function() {
      return this.currentConfig;
    },
    indexPattern: function() {
      return this.currentConfig.config.index;
    },
    tableFieldsToDownload: function() {
      return this.currentConfig.config.tableFieldsToDownload;
    },
    dragOptionsDisplay() {
      return {
        animation: 0,
        group: "display",
        disabled: false,
        ghostClass: "ghost"
      };
    },
    dragOptionsDownload() {
      return {
        animation: 0,
        group: "download",
        disabled: false,
        ghostClass: "ghost"
      };
    },
    allFieldsFilter() {
      return allFieldsAsList(this.allFields);
    },
    // Champs candidats pour une latitude / une longitude, quand l'index ne porte pas de `geo_point`
    // (deux champs numeriques, ou deux textes qui contiennent la coordonnee). On retombe sur tous les
    // champs si le mapping n'en declare aucun du bon type, pour ne jamais proposer une liste vide.
    latLonFields() {
      return latLonCandidates(this.allFields);
    }
  },
  watch: {
    indexPattern: {
      handler: function() {
        this.indexPatternChanged();
      }
    },
    tableFieldsToDownload: {
      handler: function() {
        this.tableFieldsToDownloadToExportColumns();
      },
      deep: true
    },
    timefieldSelected: {
      handler: function() {
        const selection = timefieldSelection(this.timefieldSelected);

        // Retour en arriere dans le selecteur : rien d'autre a changer.
        if (selection.backToNone) {
          this.timefieldSelected = null;
          this.currentConfig.config.timefield = null;
          return;
        }

        // Pas de filtre de temps : le graphique et le selecteur de periode n'ont plus de sens.
        if (selection.clearGraphic) {
          this.currentConfig.config.timefield = null;
          this.currentConfig.graphicChecked = false;
          this.currentConfig.timeSelectorChecked = false;
          return;
        }

        this.currentConfig.config.timefield = selection.timefield;
      }
    },
  },
  props: {
    forcestep: { type: Number },
    currentConfig: { type: Object },
    allPrivileges: { type: Array }
  },
  created: function() {
    this.prepareData();
  },
  methods: {
    linkUpdated: function(item) {
      console.log('link updated')
      console.log(item)
      this.linkEditorVisible=false

      for(var i=0; i<this.currentConfig.config.headercolumns.length; i++){
        if(this.currentConfig.config.headercolumns[i].field == item.field) {
          console.log(this.currentConfig.config.headercolumns[i])
                  this.currentConfig.config.headercolumns[i] = JSON.parse(JSON.stringify(item))
        }
      }
      // this.currentConfig.config.headercolumns.forEach(element => {
      //   if(element.field == item.field) {
      //     element = item
      //   }
      // });
    },
    tableFieldsToDownloadToExportColumns: _.debounce(function() {
      // this function is here to transform this.currentConfig.config.tableFieldsToDownload to this.currentConfig.exportColumns
      console.log("WATCHER TABLE FIELDS DL");
      if (
        this.currentConfig.config.tableFieldsToDownload == null ||
        this.currentConfig.config.tableFieldsToDownload.length == 0
      ) {
        delete this.currentConfig.config.exportColumns;
        return;
      }

      this.currentConfig.config.exportColumns = exportColumnsFromTableFields(
        this.currentConfig.config.tableFieldsToDownload
      );
    }, 500),
    setIndex(indexPattern) {
      console.log("setindex");
      console.log(indexPattern);

      this.currentConfig.config.index = "";
      this.$nextTick(() => (this.currentConfig.config.index = indexPattern));
      this.indexPatternChanged();
    },
    copyFieldsToDisplayToDownload() {
      this.fieldsToDownload = JSON.parse(JSON.stringify(this.fieldsToDisplay));
      this.selectFieldsToDownloadChanged();
    },
    draggableChanged(type) {
      const lists = {
        display: ["headercolumns", "fieldsToDisplay"],
        download: ["tableFieldsToDownload", "fieldsToDownload"],
        filter: ["queryfilters", "fieldsToFilter"],
      };
      const [configKey, localKey] = lists[type];

      this[localKey] = fieldsOf(this.currentConfig.config[configKey]);
    },
    prepareData() {
      console.log("prepareData ESTableEditor");
      console.log(this.currentConfig);

      this.loadEsMapping();

      // instanciate the timefieldSelected field
      if (this.currentConfig.config && this.currentConfig.config.timefield)
        this.timefieldSelected = this.currentConfig.config.timefield;
      else this.timefieldSelected = null;

      // initialize fieldsToDisplay and fieldsToDownload
      if (this.currentConfig.config.headercolumns != null) {
        for (
          var i = 0;
          i < this.currentConfig.config.headercolumns.length;
          i++
        ) {
          this.fieldsToDisplay.push(
            this.currentConfig.config.headercolumns[i].field
          );
        }
      }
      if (this.currentConfig.config.exportColumns != null) {
        this.currentConfig.config.tableFieldsToDownload = tableFieldsFromExportColumns(
          this.currentConfig.config.exportColumns
        );
        this.currentConfig.config.tableFieldsToDownload.forEach((entry) => {
          this.fieldsToDownload.push(entry.field);
        });
      }

      // this.$nextTick(() => {this.step = this.forcestep;});
      this.step = this.forcestep;
    },
    isEmpty: function(obj) {
      return _.isEmpty(obj);
    },
    indexPatternChanged: function() {
      this.timeFields = {};
      this.geoFields = {};
      this.allFields = {};

      this.loadEsMapping();
    },
    loadEsMapping: _.debounce(function() {
      var indexToSearch = this.currentConfig.config.index;

      if (indexToSearch == null || indexToSearch == "") indexToSearch = "*";

      var url =
        this.$store.getters.apiurl +
        "esmapping/" +
        indexToSearch +
        "?token=" +
        this.$store.getters.creds.token;
      // await axios
      axios
        .get(url)
        .then(response => {
          if (response.data.data != null && response.data.data.length > 0) {
            this.esMapping = response.data.data;

            if (indexToSearch == "*") {
              this.allesMapping = response.data.data;
              this.helpMessage =
                "Your index pattern can match any of your " +
                this.esMapping.length +
                " indices, below.";
              this.succesIndexPatternDefinition = false;
            } else {
              this.helpMessage =
                "Success! Your index pattern matches " +
                this.esMapping.length +
                " indices.";
              this.succesIndexPatternDefinition = true;
              this.computeFields();
            }
          } else {
            this.esMapping = JSON.parse(JSON.stringify(this.allesMapping));
            this.helpMessage =
              "The index pattern you've entered doesn't match any indices. You can match any of your " +
              this.esMapping.length +
              " indices, below.";
            this.succesIndexPatternDefinition = false;
          }
        })
        .catch(error => {
          console.log(error);
          this.succesIndexPatternDefinition = false;
        });
    }, 500),
    focusInput: _.debounce(function() {
      if (this.currentConfig.config.index == "") {
        this.currentConfig.config.index = "*";
        let input = this.$refs.indexPattern;
        this.$nextTick(() => this.setCursorPosition(input, 0));
      }
    }, 50),

    setCursorPosition(el, pos) {
      el.focus();
      el.setSelectionRange(pos, pos);
    },
    setFocus: function(el) {
      this.$nextTick(() => this.$refs[el].focus());
    },
    setFocusInput: function() {
      let input = this.$refs.indexPattern;
      console.log(input);
      this.$nextTick(() => input.focus());
    },
    setFocusSelect: function() {
      let select = this.$refs.timeField;
      console.log(select);
      this.$nextTick(() => select.focus());
    },
    selectFieldsToDisplayChanged: function(val) {
      this.currentConfig.config.headercolumns = selectionToColumns(
        val,
        this.currentConfig.config.headercolumns,
        this.allFields
      );
    },
    selectFieldsToDownloadChanged: function(val) {
      this.currentConfig.config.tableFieldsToDownload = selectionToColumns(
        val,
        this.currentConfig.config.tableFieldsToDownload,
        this.allFields
      );
    },
    resetTest: function() {
      this.fieldsToDisplay = [];
    },
    timeFieldChanged: function() {
      if (this.currentConfig.config.timefield == "_____________________") {
        this.currentConfig.config.timefield = "";
      }

      if (
        !this.currentConfig.config.timefield ||
        this.currentConfig.config.timefield ==
          "I don't want to use the Time Filter"
      ) {
        // this.currentConfig.graphicChecked = false;
        // this.currentConfig.timeSelectorChecked = false;
      }
    },
    goToStep: function(step) {
      console.log("go to step" + step);

      this.step = step;
    },
    computeFields: function() {
      const flattened = flattenMapping(this.esMapping);

      this.allFields = flattened.allFields;
      this.timeFields = withTimeSelectors(flattened.timeFields);
      this.geoFields = flattened.geoFields;
      this.noTimeField = flattened.noTimeField;
    }
  }
};
</script>
<style>
.text-success {
  color: green;
}

#indexPattern {
  height: 28px;
  line-height: 28px;
  -webkit-writing-mode: horizontal-tb !important;
  text-rendering: auto;
  color: initial;
  letter-spacing: normal;
  word-spacing: normal;
  text-transform: none;
  text-indent: 0px;
  text-shadow: none;
  display: inline-block;
  text-align: start;
  -webkit-appearance: textfield;
  background-color: var(--el-fill-color-blank);
  -webkit-rtl-ordering: logical;
  cursor: text;
  margin: 0em;
  font: 400 11px system-ui;
  padding: 1px;
  border-width: 2px;
  border-style: inset;
  border-color: initial;
  border-image: initial;
  -webkit-appearance: none;
  background-image: none;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  box-sizing: border-box;
  color: var(--el-text-color-regular);
  display: inline-block;
  font-size: inherit;
  outline: none;
  padding: 0 15px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  width: 100%;
}

#indexPattern:focus {
  outline: none;
  border-color: #409eff;
}

.table-display {
  width: 100%;
  border-spacing: 0px !important;
  font-size: 12px;
}

.thead-display th {
  padding-bottom: 10px;
  text-align: left;
}

.table-display tr {
}

.table-display td {
  padding: 5px 18px 5px 0px;
  border-top: solid 1px var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
}

.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.handle {
  cursor: move;
}

.ghost {
  opacity: 0.2;
  /* background-color: #409eff !important; */
}

.sortable-chosen {
  color: white !important;
  background-color: #1070ff !important;
}

#config-table-editor .padding-right {
  padding-right: 10px;
}
</style>