<template>
  <div style="height:100%;overflow:auto;padding:6px 10px 20px 10px;">
    <!-- ------------------------------------------------------------------ -->
    <!-- Toolbar                                                            -->
    <!-- ------------------------------------------------------------------ -->
    <el-card shadow="never" body-style="padding:8px 12px;">
      <el-row :gutter="8" type="flex" align="middle">
        <el-col :span="9">
          <el-radio-group v-model="preset" size="small" @change="onPresetChange">
            <el-radio-button value="1h">1h</el-radio-button>
            <el-radio-button value="24h">24h</el-radio-button>
            <el-radio-button value="7d">7d</el-radio-button>
            <el-radio-button value="30d">30d</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="9">
          <el-date-picker
            v-model="customRange"
            type="datetimerange"
            size="small"
            :start-placeholder="$t('activity.start')"
            :end-placeholder="$t('activity.end')"
            :clearable="true"
            @change="onCustomRangeChanged"
            style="width:100%"
          ></el-date-picker>
        </el-col>
        <el-col :span="6" style="text-align:right;white-space:nowrap;">
          <el-button size="small" :icon="$icons.Refresh" :loading="loading" @click="load()">
            {{ $t('activity.refresh') }}
          </el-button>
          <el-button size="small" :icon="$icons.Download" :loading="exporting" @click="exportFile()">
            CSV
          </el-button>
        </el-col>
      </el-row>

      <el-row :gutter="8" style="margin-top:6px;">
        <el-col :span="7">
          <el-input
            v-model="filters.user"
            size="small"
            clearable
            prefix-:icon="$icons.User"
            :placeholder="$t('activity.filter_user')"
            @change="load()"
          ></el-input>
        </el-col>
        <el-col :span="7">
          <el-input
            v-model="filters.path"
            size="small"
            clearable
            prefix-:icon="$icons.Search"
            :placeholder="$t('activity.filter_path')"
            @change="load()"
          ></el-input>
        </el-col>
        <el-col :span="5">
          <el-switch v-model="filters.onlyErrors" @change="load()"></el-switch>
          <span style="margin-left:6px;font-size:12px;">{{ $t('activity.only_errors') }}</span>
        </el-col>
        <el-col :span="5">
          <el-switch v-model="autoRefresh" @change="applyAutoRefresh()"></el-switch>
          <span style="margin-left:6px;font-size:12px;">
            {{ $t('activity.auto_refresh') }} ({{ refreshSeconds }}s)
          </span>
        </el-col>
      </el-row>
    </el-card>

    <!-- ------------------------------------------------------------------ -->
    <!-- KPIs                                                               -->
    <!-- ------------------------------------------------------------------ -->
    <el-row :gutter="8" style="margin-top:8px;" v-loading="loading">
      <el-col :span="6" v-for="kpi in kpis" :key="kpi.key">
        <el-card shadow="never" body-style="padding:8px 12px;">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-value" :style="{ color: kpi.color }">{{ kpi.value }}</div>
          <div class="kpi-sub">{{ kpi.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ------------------------------------------------------------------ -->
    <!-- Breakdowns                                                         -->
    <!-- ------------------------------------------------------------------ -->
    <el-row :gutter="8" style="margin-top:8px;">
      <el-col :span="12">
        <el-card shadow="never" body-style="padding:6px 10px;">
          <div class="panel-title">{{ $t('activity.top_endpoints') }}</div>
          <el-table :data="topEndpoints" size="small" :show-header="true" max-height="240">
            <el-table-column prop="key" :label="$t('activity.col_path')" show-overflow-tooltip>
              <template #default="scope">
                <div class="bar-row">
                  <span class="bar" :style="{ width: scope.row.pct + '%' }"></span>
                  <span class="bar-text">{{ scope.row.key }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="count" :label="$t('activity.col_calls')" width="80" align="right"></el-table-column>
            <el-table-column prop="avg" :label="$t('activity.col_avg_ms')" width="90" align="right"></el-table-column>
          </el-table>
          <div v-if="topEndpoints.length === 0" class="empty">{{ $t('activity.no_data') }}</div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="never" body-style="padding:6px 10px;">
          <div class="panel-title">{{ $t('activity.errors_and_users') }}</div>
          <el-tabs v-model="breakdownTab" style="margin-top:-6px;">
            <el-tab-pane :label="$t('activity.tab_errors')" name="errors">
              <el-table :data="errorBuckets" size="small" max-height="200">
                <el-table-column prop="key" :label="$t('activity.col_error')" show-overflow-tooltip></el-table-column>
                <el-table-column prop="count" :label="$t('activity.col_calls')" width="80" align="right"></el-table-column>
              </el-table>
              <div v-if="errorBuckets.length === 0" class="empty">{{ $t('activity.no_data') }}</div>
            </el-tab-pane>
            <el-tab-pane :label="$t('activity.tab_users')" name="users">
              <el-table :data="userBuckets" size="small" max-height="200">
                <el-table-column prop="key" :label="$t('activity.col_user')" show-overflow-tooltip></el-table-column>
                <el-table-column prop="count" :label="$t('activity.col_calls')" width="80" align="right"></el-table-column>
              </el-table>
              <div v-if="userBuckets.length === 0" class="empty">{{ $t('activity.no_data') }}</div>
            </el-tab-pane>
            <el-tab-pane :label="$t('activity.tab_methods')" name="methods">
              <el-table :data="methodBuckets" size="small" max-height="200">
                <el-table-column prop="key" :label="$t('activity.col_method')" width="110"></el-table-column>
                <el-table-column prop="count" :label="$t('activity.col_calls')" align="right"></el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <!-- ------------------------------------------------------------------ -->
    <!-- Calls                                                              -->
    <!-- ------------------------------------------------------------------ -->
    <el-card shadow="never" body-style="padding:6px 10px;" style="margin-top:8px;">
      <div class="panel-title">
        {{ $t('activity.last_calls') }}
        <span class="panel-meta">
          {{ total }} {{ $t('activity.calls') }} · {{ tookMs }} ms · {{ index }}
        </span>
      </div>
      <el-table :data="records" size="small" border max-height="520" stripe>
        <el-table-column :label="$t('activity.col_time')" width="150">
          <template #default="scope">{{ formatTime(scope.row) }}</template>
        </el-table-column>
        <el-table-column :label="$t('activity.col_user')" width="130" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.user }}</template>
        </el-table-column>
        <el-table-column :label="$t('activity.col_method')" width="90">
          <template #default="scope">
            <el-tag size="small" :type="methodTag(scope.row.method)">{{ scope.row.method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('activity.col_path')" min-width="260" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.url }}</template>
        </el-table-column>
        <el-table-column :label="$t('activity.col_ms')" width="90" align="right" sortable prop="timespan">
          <template #default="scope">{{ scope.row.timespan }}</template>
        </el-table-column>
        <el-table-column :label="$t('activity.col_error')" min-width="180" show-overflow-tooltip>
          <template #default="scope">
            <el-tag v-if="scope.row.error" size="small" type="danger">{{ scope.row.error }}</el-tag>
            <span v-else class="ok">ok</span>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="records.length === 0 && !loading" class="empty">{{ $t('activity.no_data') }}</div>
    </el-card>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Activity",
  props: {
    config: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      // nyx_apicalls-YYYY.MM.DD documents are written by the API itself
      index: "nyx_apicalls-*",
      preset: "24h",
      customRange: null,
      filters: { user: "", path: "", onlyErrors: false },
      autoRefresh: false,
      refreshSeconds: 30,
      refreshTimer: null,
      loading: false,
      exporting: false,
      records: [],
      total: 0,
      took: 0,
      aggs: {},
      breakdownTab: "errors",
      // Terms aggregations need a keyword field; resolved from the mapping.
      fields: { url: "url.keyword", error: "error.keyword", user: "user.keyword", method: "method.keyword" }
    };
  },
  computed: {
    token() {
      return this.$store.getters.creds.token;
    },
    apiurl() {
      return this.$store.getters.apiurl;
    },
    timeField() {
      return (this.config && this.config.config && this.config.config.timefield) || "@timestamp";
    },
    docType() {
      const dt = this.config && this.config.config && this.config.config.doc_type;
      return dt ? "&doc_type=" + dt : "";
    },
    buckets() {
      const aggs = this.aggs || {};
      const get = name =>
        aggs[name] && aggs[name].buckets ? aggs[name].buckets : [];
      return {
        url: get("by_url"),
        error: get("by_error").filter(b => b.key !== ""),
        user: get("by_user").filter(b => b.key !== ""),
        method: get("by_method").filter(b => b.key !== "")
      };
    },
    topEndpoints() {
      const list = this.buckets.url;
      const max = list.reduce((m, b) => Math.max(m, b.doc_count), 0) || 1;
      return list.map(b => ({
        key: b.key,
        count: b.doc_count,
        avg: b.avg_ms && b.avg_ms.value != null ? Math.round(b.avg_ms.value) : "-",
        pct: Math.round((b.doc_count / max) * 100)
      }));
    },
    errorBuckets() {
      return this.buckets.error.map(b => ({ key: b.key, count: b.doc_count }));
    },
    userBuckets() {
      return this.buckets.user.map(b => ({ key: b.key, count: b.doc_count }));
    },
    methodBuckets() {
      return this.buckets.method.map(b => ({ key: b.key, count: b.doc_count }));
    },
    errorCount() {
      const agg = this.aggs && this.aggs.errors_total;
      if (agg && typeof agg.doc_count === "number") return agg.doc_count;
      // fallback when the bucket list is capped (older mappings)
      return this.buckets.error.reduce((sum, b) => sum + b.doc_count, 0);
    },
    activeUsers() {
      const agg = this.aggs && this.aggs.users_total;
      if (agg && typeof agg.value === "number") return agg.value;
      return this.buckets.user.length;
    },
    tookMs() {
      return Math.round((Number(this.took) || 0) * 1000);
    },
    latencies() {
      const p = this.aggs && this.aggs.latency && this.aggs.latency.values;
      if (!p) return { p50: null, p95: null, p99: null };
      const round = v => (v == null ? "-" : Math.round(v));
      return { p50: round(p["50.0"]), p95: round(p["95.0"]), p99: round(p["99.0"]) };
    },
    kpis() {
      const errPct = this.total > 0 ? (this.errorCount / this.total) * 100 : 0;
      return [
        {
          key: "calls",
          label: this.$t("activity.kpi_calls"),
          value: this.total,
          sub: this.$t("activity.kpi_calls_sub"),
          color: "var(--nyx-text, #303133)"
        },
        {
          key: "errors",
          label: this.$t("activity.kpi_errors"),
          value: this.errorCount,
          sub: errPct.toFixed(2) + " %",
          color: this.errorCount > 0 ? "#f56c6c" : "#67c23a"
        },
        {
          key: "users",
          label: this.$t("activity.kpi_users"),
          value: this.activeUsers,
          sub: this.buckets.user.length ? this.buckets.user[0].key : "-",
          color: "var(--nyx-text, #303133)"
        },
        {
          key: "latency",
          label: this.$t("activity.kpi_latency"),
          value: this.latencies.p95 + " ms",
          sub: "p50 " + this.latencies.p50 + " · p99 " + this.latencies.p99,
          color: "var(--nyx-text, #303133)"
        }
      ];
    }
  },
  created() {
    this.index = (this.config && this.config.config && this.config.config.index) || this.index;
  },
  mounted() {
    this.resolveKeywordFields().then(() => this.load());
  },
  beforeUnmount() {
    this.stopAutoRefresh();
  },
  methods: {
    // ------------------------------------------------------------------
    // Time range
    // ------------------------------------------------------------------
    timeBounds() {
      if (this.customRange && this.customRange.length === 2) {
        return [this.customRange[0].getTime(), this.customRange[1].getTime()];
      }
      const now = Date.now();
      const hours = { "1h": 1, "24h": 24, "7d": 24 * 7, "30d": 24 * 30 }[this.preset] || 24;
      return [now - hours * 3600 * 1000, now];
    },
    onPresetChange() {
      this.customRange = null;
      this.load();
    },
    onCustomRangeChanged() {
      if (this.customRange && this.customRange.length === 2) this.load();
    },

    // ------------------------------------------------------------------
    // Mapping: text fields need .keyword for terms aggregations
    // ------------------------------------------------------------------
    resolveKeywordFields() {
      const url =
        this.apiurl + "esmapping/" + this.index + "?token=" + this.token;
      return axios
        .get(url)
        .then(response => {
          const list = (response.data && response.data.data) || [];
          const pattern = this.index.replace("*", "");
          const hit =
            list.find(m => m.id && m.id.indexOf(pattern) === 0) ||
            (list.length ? list[0] : null);
          if (!hit || !hit.obj || !hit.obj.mappings) return;

          const mappings = hit.obj.mappings;
          const propsKey = mappings.properties ? "properties" : Object.keys(mappings)[0];
          const props = mappings[propsKey] || {};

          const pick = field => {
            const def = props[field];
            if (!def) return field;
            if (def.type === "text") {
              return def.fields && def.fields.keyword ? field + ".keyword" : field;
            }
            return field;
          };
          this.fields = {
            url: pick("url"),
            error: pick("error"),
            user: pick("user"),
            method: pick("method")
          };
        })
        .catch(() => {
          // keep the keyword defaults, the query will still run
        });
    },

    // ------------------------------------------------------------------
    // Query
    // ------------------------------------------------------------------
    buildQuery(download) {
      const bounds = this.timeBounds();
      const must = [];
      const range = { format: "epoch_millis", gte: bounds[0], lte: bounds[1] };
      const rangeClause = { range: {} };
      rangeClause.range[this.timeField] = range;
      must.push(rangeClause);

      const clauses = [];
      if (this.filters.user) {
        clauses.push({ wildcard: { [this.fields.user]: "*" + this.filters.user + "*" } });
      }
      if (this.filters.path) {
        clauses.push({ wildcard: { [this.fields.url]: "*" + this.filters.path + "*" } });
      }
      if (clauses.length === 1) must.push(clauses[0]);
      if (clauses.length > 1) must.push({ bool: { should: clauses, minimum_should_match: 1 } });

      const query = {
        size: download ? 10000 : 200,
        query: { bool: { must: must } },
        sort: [{ "@timestamp": { order: "desc" } }]
      };

      if (this.filters.onlyErrors) {
        query.query.bool.must_not = [{ term: { [this.fields.error]: "" } }];
      }

      if (!download) {
        query.aggs = {
          by_url: {
            terms: { field: this.fields.url, size: 10, order: { _count: "desc" } },
            aggs: { avg_ms: { avg: { field: "timespan" } } }
          },
          by_error: { terms: { field: this.fields.error, size: 10, order: { _count: "desc" } } },
          by_user: { terms: { field: this.fields.user, size: 10, order: { _count: "desc" } } },
          by_method: { terms: { field: this.fields.method, size: 10 } },
          // exact counters: the terms aggregations above are capped at 10 buckets
          errors_total: {
            filter: { bool: { must_not: [{ term: { [this.fields.error]: "" } }] } }
          },
          users_total: { cardinality: { field: this.fields.user } },
          latency: { percentiles: { field: "timespan", percents: [50, 95, 99] } }
        };
      }
      return query;
    },

    searchUrl(download, output) {
      return (
        this.apiurl +
        "generic_search/" +
        this.index +
        "?token=" +
        this.token +
        "&download=" +
        (download ? 1 : 0) +
        "&output=" +
        (output || "csv") +
        this.docType
      );
    },

    // ------------------------------------------------------------------
    // Load / refresh
    // ------------------------------------------------------------------
    load() {
      if (!this.token) return;
      this.loading = true;
      axios
        .post(this.searchUrl(false), this.buildQuery(false))
        .then(response => {
          const data = response.data || {};
          if (data.error && data.error !== "") {
            this.$message.error(data.error);
            this.records = [];
            return;
          }
          this.total = data.total || 0;
          this.took = data.took || 0;
          this.aggs = data.aggs || {};
          this.records = (data.records || []).map(hit => {
            const src = hit._source || {};
            return {
              _id: hit._id,
              _index: hit._index,
              user: src.user || "",
              method: src.method || "",
              url: src.url || "",
              timespan: src.timespan,
              error: src.error || "",
              timestamp: src["@timestamp"]
            };
          });
        })
        .catch(error => {
          this.records = [];
          this.$message.error(
            this.$t("activity.load_failed") + " " + (error && error.message ? error.message : "")
          );
        })
        .finally(() => {
          this.loading = false;
        });
    },

    exportFile() {
      if (!this.token) return;
      this.exporting = true;
      axios
        .post(this.searchUrl(true, "csv"), this.buildQuery(true))
        .then(response => {
          const data = response.data || {};
          if (data.error && data.error !== "") {
            this.$message.error(data.error);
            return;
          }
          if (data.type === "mail") {
            this.$notify({
              title: this.$t("ui.data_sent_mail"),
              message: data.total + " " + this.$t("activity.calls"),
              type: "success",
              position: "bottom-right",
              duration: 4000
            });
          } else if (data.url) {
            window.open(data.url, "_blank");
          }
        })
        .catch(() => {
          this.$message.error(this.$t("activity.export_failed"));
        })
        .finally(() => {
          this.exporting = false;
        });
    },

    // ------------------------------------------------------------------
    // Auto refresh
    // ------------------------------------------------------------------
    applyAutoRefresh() {
      this.stopAutoRefresh();
      if (this.autoRefresh) {
        this.refreshTimer = setInterval(() => this.load(), this.refreshSeconds * 1000);
      }
    },
    stopAutoRefresh() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    },

    // ------------------------------------------------------------------
    // Display helpers
    // ------------------------------------------------------------------
    formatTime(row) {
      const ms = row.timestamp;
      if (!ms) return "";
      const date = new Date(Number(ms));
      if (isNaN(date.getTime())) return "";
      const pad = n => (n < 10 ? "0" + n : "" + n);
      return (
        date.getFullYear() +
        "-" + pad(date.getMonth() + 1) +
        "-" + pad(date.getDate()) +
        " " + pad(date.getHours()) +
        ":" + pad(date.getMinutes()) +
        ":" + pad(date.getSeconds())
      );
    },
    methodTag(method) {
      if (method === "POST") return "success";
      if (method === "DELETE") return "danger";
      if (method === "PUT" || method === "PATCH") return "warning";
      return "";
    }
  }
};
</script>

<style scoped>
.kpi-label {
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.kpi-value {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
}
.kpi-sub {
  font-size: 11px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.panel-title {
  font-size: 13px;
  font-weight: 600;
  /* `#606266` en dur : identique en clair, illisible sur une carte sombre. */
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}
.panel-meta {
  font-weight: 400;
  font-size: 11px;
  color: #909399;
  margin-left: 8px;
}
.bar-row {
  position: relative;
  padding: 1px 0;
}
.bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: #ecf5ff;
  border-left: 2px solid #409eff;
}
.bar-text {
  position: relative;
  font-family: Menlo, Consolas, monospace;
  font-size: 11px;
}
.empty {
  text-align: center;
  color: #909399;
  font-size: 12px;
  padding: 12px 0;
}
.ok {
  color: #67c23a;
  font-size: 11px;
}
</style>
