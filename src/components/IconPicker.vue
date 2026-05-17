<template>
  <div class="icon-picker">
    <el-row :gutter="10" type="flex" align="middle">
      <el-col :span="iconPreview ? 18 : 24">
        <el-input 
          :size="size" 
          v-model="selectedIcon" 
          :placeholder="placeholder"
          @input="handleInput"
          autocomplete="off"
        >
          <el-button 
            slot="append" 
            icon="el-icon-search" 
            @click="dialogVisible = true"
          ></el-button>
        </el-input>
      </el-col>
      <el-col :span="6" v-if="iconPreview">
        <div class="icon-preview">
          <v-icon v-if="selectedIcon" :name="selectedIcon" :scale="previewScale" />
        </div>
      </el-col>
    </el-row>

    <!-- Icon Picker Dialog -->
    <el-dialog
      title="Icon Picker"
      :visible.sync="dialogVisible"
      width="70%"
      append-to-body
      class="icon-picker-dialog"
    >
      <div class="icon-picker-content">
        <!-- Search Bar -->
        <el-input
          v-model="searchQuery"
          placeholder="Search icons..."
          prefix-icon="el-icon-search"
          size="small"
          clearable
          style="margin-bottom: 20px;"
        ></el-input>

        <!-- Category Filter -->
        <el-radio-group v-model="categoryFilter" size="small" style="margin-bottom: 20px;">
          <el-radio-button label="all">All ({{ filteredIcons.length }})</el-radio-button>
          <el-radio-button label="regular">Regular</el-radio-button>
          <el-radio-button label="brands">Brands</el-radio-button>
          <el-radio-button label="solid">Solid</el-radio-button>
        </el-radio-group>

        <!-- Icons Grid -->
        <div class="icons-grid">
          <div 
            v-for="icon in paginatedIcons" 
            :key="icon"
            class="icon-item"
            :class="{ 'selected': selectedIcon === icon }"
            @click="selectIcon(icon)"
            :title="icon"
          >
            <v-icon :name="icon" scale="2" />
            <div class="icon-name">{{ getIconDisplayName(icon) }}</div>
          </div>
        </div>

        <!-- Empty State -->
        <el-empty 
          v-if="filteredIcons.length === 0" 
          description="No icons found"
          :image-size="100"
        ></el-empty>

        <!-- Pagination -->
        <el-pagination
          v-if="filteredIcons.length > pageSize"
          @current-change="handlePageChange"
          :current-page.sync="currentPage"
          :page-size="pageSize"
          layout="prev, pager, next, total"
          :total="filteredIcons.length"
          style="margin-top: 20px; text-align: center;"
        ></el-pagination>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false" size="small">Cancel</el-button>
        <el-button type="primary" @click="confirmSelection" size="small">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "IconPicker",
  props: {
    value: {
      type: String,
      default: ""
    },
    placeholder: {
      type: String,
      default: "Select an icon"
    },
    size: {
      type: String,
      default: "mini"
    },
    iconPreview: {
      type: Boolean,
      default: true
    },
    previewScale: {
      type: Number,
      default: 2
    }
  },
  data() {
    return {
      dialogVisible: false,
      searchQuery: "",
      categoryFilter: "all",
      currentPage: 1,
      pageSize: 48,
      selectedIcon: this.value,
      // All available icons from vue-awesome
      allIcons: [
        "ad", "address-book", "address-card", "adjust", "air-freshener", "align-center", 
        "align-justify", "align-left", "align-right", "allergies", "ambulance", 
        "american-sign-language-interpreting", "anchor", "angle-double-down", 
        "angle-double-left", "angle-double-right", "angle-double-up", "angle-down", 
        "angle-left", "angle-right", "angle-up", "angry", "ankh", "apple-alt", "archive", 
        "archway", "arrow-alt-circle-down", "arrow-alt-circle-left", "arrow-alt-circle-right", 
        "arrow-alt-circle-up", "arrow-circle-down", "arrow-circle-left", "arrow-circle-right", 
        "arrow-circle-up", "arrow-down", "arrow-left", "arrow-right", "arrow-up", 
        "arrows-alt", "arrows-alt-h", "arrows-alt-v", "assistive-listening-systems", 
        "asterisk", "at", "atlas", "atom", "audio-description", "award", "baby", 
        "baby-carriage", "backspace", "backward", "bacon", "bacteria", "bacterium", 
        "bahai", "balance-scale", "balance-scale-left", "balance-scale-right", "ban", 
        "band-aid", "barcode", "bars", "baseball-ball", "basketball-ball", "bath", 
        "battery-empty", "battery-full", "battery-half", "battery-quarter", 
        "battery-three-quarters", "bed", "beer", "bell", "bell-slash", "bezier-curve", 
        "bible", "bicycle", "biking", "binoculars", "biohazard", "birthday-cake", 
        "blender", "blender-phone", "blind", "blog", "bold", "bolt", "bomb", "bone", 
        "bong", "book", "book-dead", "book-medical", "book-open", "book-reader", 
        "bookmark", "border-all", "border-none", "border-style", "bowling-ball", "box", 
        "box-open", "box-tissue", "boxes", "braille", "brain", "bread-slice", 
        "briefcase", "briefcase-medical", "broadcast-tower", "broom", "brush", "bug", 
        "building", "bullhorn", "bullseye", "burn", "bus", "bus-alt", "business-time", 
        "calculator", "calendar", "calendar-alt", "calendar-check", "calendar-day", 
        "calendar-minus", "calendar-plus", "calendar-times", "calendar-week", "camera", 
        "camera-retro", "campground", "candy-cane", "cannabis", "capsules", "car", 
        "car-alt", "car-battery", "car-crash", "car-side", "caravan", "caret-down", 
        "caret-left", "caret-right", "caret-square-down", "caret-square-left", 
        "caret-square-right", "caret-square-up", "caret-up", "carrot", "cart-arrow-down", 
        "cart-plus", "cash-register", "cat", "certificate", "chair", "chalkboard", 
        "chalkboard-teacher", "charging-station", "chart-area", "chart-bar", "chart-line", 
        "chart-pie", "check", "check-circle", "check-double", "check-square", "cheese", 
        "chess", "chess-bishop", "chess-board", "chess-king", "chess-knight", "chess-pawn", 
        "chess-queen", "chess-rook", "chevron-circle-down", "chevron-circle-left", 
        "chevron-circle-right", "chevron-circle-up", "chevron-down", "chevron-left", 
        "chevron-right", "chevron-up", "child", "church", "circle", "circle-notch", 
        "city", "clinic-medical", "clipboard", "clipboard-check", "clipboard-list", 
        "clock", "clone", "closed-captioning", "cloud", "cloud-download-alt", 
        "cloud-meatball", "cloud-moon", "cloud-moon-rain", "cloud-rain", "cloud-showers-heavy", 
        "cloud-sun", "cloud-sun-rain", "cloud-upload-alt", "cocktail", "code", "code-branch", 
        "coffee", "cog", "cogs", "coins", "columns", "comment", "comment-alt", 
        "comment-dollar", "comment-dots", "comment-medical", "comment-slash", "comments", 
        "comments-dollar", "compact-disc", "compass", "compress", "compress-alt", 
        "compress-arrows-alt", "concierge-bell", "cookie", "cookie-bite", "copy", 
        "copyright", "couch", "credit-card", "crop", "crop-alt", "cross", "crosshairs", 
        "crow", "crown", "crutch", "cube", "cubes", "cut", "database", "deaf", "democrat", 
        "desktop", "dharmachakra", "diagnoses", "dice", "dice-d20", "dice-d6", "dice-five", 
        "dice-four", "dice-one", "dice-six", "dice-three", "dice-two", "digital-tachograph", 
        "directions", "disease", "divide", "dizzy", "dna", "dog", "dollar-sign", 
        "dolly", "dolly-flatbed", "donate", "door-closed", "door-open", "dot-circle", 
        "dove", "download", "drafting-compass", "dragon", "draw-polygon", "drum", 
        "drum-steelpan", "drumstick-bite", "dumbbell", "dumpster", "dumpster-fire", 
        "dungeon", "edit", "egg", "eject", "ellipsis-h", "ellipsis-v", "envelope", 
        "envelope-open", "envelope-open-text", "envelope-square", "equals", "eraser", 
        "ethernet", "euro-sign", "exchange-alt", "exclamation", "exclamation-circle", 
        "exclamation-triangle", "expand", "expand-alt", "expand-arrows-alt", 
        "external-link-alt", "external-link-square-alt", "eye", "eye-dropper", "eye-slash", 
        "fan", "fast-backward", "fast-forward", "faucet", "fax", "feather", "feather-alt", 
        "female", "fighter-jet", "file", "file-alt", "file-archive", "file-audio", 
        "file-code", "file-contract", "file-csv", "file-download", "file-excel", 
        "file-export", "file-image", "file-import", "file-invoice", "file-invoice-dollar", 
        "file-medical", "file-medical-alt", "file-pdf", "file-powerpoint", "file-prescription", 
        "file-signature", "file-upload", "file-video", "file-word", "fill", "fill-drip", 
        "film", "filter", "fingerprint", "fire", "fire-alt", "fire-extinguisher", 
        "first-aid", "fish", "fist-raised", "flag", "flag-checkered", "flag-usa", 
        "flask", "flushed", "folder", "folder-minus", "folder-open", "folder-plus", 
        "font", "football-ball", "forward", "frog", "frown", "frown-open", 
        "funnel-dollar", "futbol", "gamepad", "gas-pump", "gavel", "gem", "genderless", 
        "ghost", "gift", "gifts", "glass-cheers", "glass-martini", "glass-martini-alt", 
        "glass-whiskey", "glasses", "globe", "globe-africa", "globe-americas", 
        "globe-asia", "globe-europe", "golf-ball", "gopuram", "graduation-cap", 
        "greater-than", "greater-than-equal", "grimace", "grin", "grin-alt", 
        "grin-beam", "grin-beam-sweat", "grin-hearts", "grin-squint", "grin-squint-tears", 
        "grin-stars", "grin-tears", "grin-tongue", "grin-tongue-squint", 
        "grin-tongue-wink", "grin-wink", "grip-horizontal", "grip-lines", 
        "grip-lines-vertical", "grip-vertical", "guitar", "h-square", "hamburger", 
        "hammer", "hamsa", "hand-holding", "hand-holding-heart", "hand-holding-medical", 
        "hand-holding-usd", "hand-holding-water", "hand-lizard", "hand-middle-finger", 
        "hand-paper", "hand-peace", "hand-point-down", "hand-point-left", 
        "hand-point-right", "hand-point-up", "hand-pointer", "hand-rock", "hand-scissors", 
        "hand-sparkles", "hand-spock", "hands", "hands-helping", "hands-wash", 
        "handshake", "handshake-alt-slash", "handshake-slash", "hanukiah", "hard-hat", 
        "hashtag", "hat-cowboy", "hat-cowboy-side", "hat-wizard", "hdd", "head-side-cough", 
        "head-side-cough-slash", "head-side-mask", "head-side-virus", "heading", 
        "headphones", "headphones-alt", "headset", "heart", "heart-broken", "heartbeat", 
        "helicopter", "highlighter", "hiking", "hippo", "history", "hockey-puck", 
        "holly-berry", "home", "horse", "horse-head", "hospital", "hospital-alt", 
        "hospital-symbol", "hospital-user", "hot-tub", "hotdog", "hotel", "hourglass", 
        "hourglass-end", "hourglass-half", "hourglass-start", "house-damage", 
        "house-user", "hryvnia", "i-cursor", "ice-cream", "icicles", "icons", "id-badge", 
        "id-card", "id-card-alt", "igloo", "image", "images", "inbox", "indent", 
        "industry", "infinity", "info", "info-circle", "italic", "jedi", "joint", 
        "journal-whills", "kaaba", "key", "keyboard", "khanda", "kiss", "kiss-beam", 
        "kiss-wink-heart", "kiwi-bird", "landmark", "language", "laptop", "laptop-code", 
        "laptop-house", "laptop-medical", "laugh", "laugh-beam", "laugh-squint", 
        "laugh-wink", "layer-group", "leaf", "lemon", "less-than", "less-than-equal", 
        "level-down-alt", "level-up-alt", "life-ring", "lightbulb", "link", "lira-sign", 
        "list", "list-alt", "list-ol", "list-ul", "location-arrow", "lock", "lock-open", 
        "long-arrow-alt-down", "long-arrow-alt-left", "long-arrow-alt-right", 
        "long-arrow-alt-up", "low-vision", "luggage-cart", "lungs", "lungs-virus", 
        "magic", "magnet", "mail-bulk", "male", "map", "map-marked", "map-marked-alt", 
        "map-marker", "map-marker-alt", "map-pin", "map-signs", "marker", "mars", 
        "mars-double", "mars-stroke", "mars-stroke-h", "mars-stroke-v", "mask", 
        "medal", "medkit", "meh", "meh-blank", "meh-rolling-eyes", "memory", "menorah", 
        "mercury", "meteor", "microchip", "microphone", "microphone-alt", 
        "microphone-alt-slash", "microphone-slash", "microscope", "minus", "minus-circle", 
        "minus-square", "mitten", "mobile", "mobile-alt", "money-bill", "money-bill-alt", 
        "money-bill-wave", "money-bill-wave-alt", "money-check", "money-check-alt", 
        "monument", "moon", "mortar-pestle", "mosque", "motorcycle", "mountain", 
        "mouse", "mouse-pointer", "mug-hot", "music", "network-wired", "neuter", 
        "newspaper", "not-equal", "notes-medical", "object-group", "object-ungroup", 
        "oil-can", "om", "otter", "outdent", "pager", "paint-brush", "paint-roller", 
        "palette", "pallet", "paper-plane", "paperclip", "parachute-box", "paragraph", 
        "parking", "passport", "pastafarianism", "paste", "pause", "pause-circle", 
        "paw", "peace", "pen", "pen-alt", "pen-fancy", "pen-nib", "pen-square", 
        "pencil-alt", "pencil-ruler", "people-arrows", "people-carry", "pepper-hot", 
        "percent", "percentage", "person-booth", "phone", "phone-alt", "phone-slash", 
        "phone-square", "phone-square-alt", "phone-volume", "photo-video", "piggy-bank", 
        "pills", "pizza-slice", "place-of-worship", "plane", "plane-arrival", 
        "plane-departure", "plane-slash", "play", "play-circle", "plug", "plus", 
        "plus-circle", "plus-square", "podcast", "poll", "poll-h", "poo", "poo-storm", 
        "poop", "portrait", "pound-sign", "power-off", "pray", "praying-hands", 
        "prescription", "prescription-bottle", "prescription-bottle-alt", "print", 
        "procedures", "project-diagram", "pump-medical", "pump-soap", "puzzle-piece", 
        "qrcode", "question", "question-circle", "quidditch", "quote-left", "quote-right", 
        "quran", "radiation", "radiation-alt", "rainbow", "random", "receipt", "record-vinyl", 
        "recycle", "redo", "redo-alt", "registered", "remove-format", "reply", "reply-all", 
        "republican", "restroom", "retweet", "ribbon", "ring", "road", "robot", "rocket", 
        "route", "rss", "rss-square", "ruble-sign", "ruler", "ruler-combined", 
        "ruler-horizontal", "ruler-vertical", "running", "rupee-sign", "sad-cry", 
        "sad-tear", "satellite", "satellite-dish", "save", "school", "screwdriver", 
        "scroll", "sd-card", "search", "search-dollar", "search-location", "search-minus", 
        "search-plus", "seedling", "server", "shapes", "share", "share-alt", 
        "share-alt-square", "share-square", "shekel-sign", "shield-alt", "shield-virus", 
        "ship", "shipping-fast", "shoe-prints", "shopping-bag", "shopping-basket", 
        "shopping-cart", "shower", "shuttle-van", "sign", "sign-in-alt", "sign-language", 
        "sign-out-alt", "signal", "signature", "sim-card", "sink", "sitemap", "skating", 
        "skiing", "skiing-nordic", "skull", "skull-crossbones", "slash", "sleigh", 
        "sliders-h", "smile", "smile-beam", "smile-wink", "smog", "smoking", "smoking-ban", 
        "sms", "snowboarding", "snowflake", "snowman", "snowplow", "soap", "socks", 
        "solar-panel", "sort", "sort-alpha-down", "sort-alpha-down-alt", "sort-alpha-up", 
        "sort-alpha-up-alt", "sort-amount-down", "sort-amount-down-alt", "sort-amount-up", 
        "sort-amount-up-alt", "sort-down", "sort-numeric-down", "sort-numeric-down-alt", 
        "sort-numeric-up", "sort-numeric-up-alt", "sort-up", "spa", "space-shuttle", 
        "spell-check", "spider", "spinner", "splotch", "spray-can", "square", 
        "square-full", "square-root-alt", "stamp", "star", "star-and-crescent", 
        "star-half", "star-half-alt", "star-of-david", "star-of-life", "step-backward", 
        "step-forward", "stethoscope", "sticky-note", "stop", "stop-circle", "stopwatch", 
        "stopwatch-20", "store", "store-alt", "store-alt-slash", "store-slash", 
        "stream", "street-view", "strikethrough", "stroopwafel", "subscript", "subway", 
        "suitcase", "suitcase-rolling", "sun", "superscript", "surprise", "swatchbook", 
        "swimmer", "swimming-pool", "synagogue", "sync", "sync-alt", "syringe", "table", 
        "table-tennis", "tablet", "tablet-alt", "tablets", "tachometer-alt", "tag", 
        "tags", "tape", "tasks", "taxi", "teeth", "teeth-open", "temperature-high", 
        "temperature-low", "tenge", "terminal", "text-height", "text-width", "th", 
        "th-large", "th-list", "theater-masks", "thermometer", "thermometer-empty", 
        "thermometer-full", "thermometer-half", "thermometer-quarter", 
        "thermometer-three-quarters", "thumbs-down", "thumbs-up", "thumbtack", 
        "ticket-alt", "times", "times-circle", "tint", "tint-slash", "tired", 
        "toggle-off", "toggle-on", "toilet", "toilet-paper", "toilet-paper-slash", 
        "toolbox", "tools", "tooth", "torah", "torii-gate", "tractor", "trademark", 
        "traffic-light", "trailer", "train", "tram", "transgender", "transgender-alt", 
        "trash", "trash-alt", "trash-restore", "trash-restore-alt", "tree", "trophy", 
        "truck", "truck-loading", "truck-monster", "truck-moving", "truck-pickup", 
        "tshirt", "tty", "tv", "umbrella", "umbrella-beach", "underline", "undo", 
        "undo-alt", "universal-access", "university", "unlink", "unlock", "unlock-alt", 
        "upload", "user", "user-alt", "user-alt-slash", "user-astronaut", "user-check", 
        "user-circle", "user-clock", "user-cog", "user-edit", "user-friends", 
        "user-graduate", "user-injured", "user-lock", "user-md", "user-minus", 
        "user-ninja", "user-nurse", "user-plus", "user-secret", "user-shield", 
        "user-slash", "user-tag", "user-tie", "user-times", "users", "users-cog", 
        "utensil-spoon", "utensils", "vector-square", "venus", "venus-double", 
        "venus-mars", "vest", "vest-patches", "vial", "vials", "video", "video-slash", 
        "vihara", "virus", "virus-slash", "viruses", "voicemail", "volleyball-ball", 
        "volume-down", "volume-mute", "volume-off", "volume-up", "vote-yea", "vr-cardboard", 
        "walking", "wallet", "warehouse", "water", "wave-square", "weight", 
        "weight-hanging", "wheelchair", "wifi", "wind", "window-close", "window-maximize", 
        "window-minimize", "window-restore", "wine-bottle", "wine-glass", 
        "wine-glass-alt", "won-sign", "wrench", "x-ray", "yen-sign", "yin-yang",
        // Regular icons
        "regular/address-book", "regular/address-card", "regular/angry", "regular/arrow-alt-circle-down",
        "regular/arrow-alt-circle-left", "regular/arrow-alt-circle-right", "regular/arrow-alt-circle-up",
        "regular/bell", "regular/bell-slash", "regular/bookmark", "regular/building", "regular/calendar",
        "regular/calendar-alt", "regular/calendar-check", "regular/calendar-minus", "regular/calendar-plus",
        "regular/calendar-times", "regular/caret-square-down", "regular/caret-square-left",
        "regular/caret-square-right", "regular/caret-square-up", "regular/chart-bar", "regular/check-circle",
        "regular/check-square", "regular/circle", "regular/clipboard", "regular/clock", "regular/clone",
        "regular/closed-captioning", "regular/comment", "regular/comment-alt", "regular/comment-dots",
        "regular/comments", "regular/compass", "regular/copy", "regular/copyright", "regular/credit-card",
        "regular/dizzy", "regular/dot-circle", "regular/edit", "regular/envelope", "regular/envelope-open",
        "regular/eye", "regular/eye-slash", "regular/file", "regular/file-alt", "regular/file-archive",
        "regular/file-audio", "regular/file-code", "regular/file-excel", "regular/file-image",
        "regular/file-pdf", "regular/file-powerpoint", "regular/file-video", "regular/file-word",
        "regular/flag", "regular/flushed", "regular/folder", "regular/folder-open", "regular/frown",
        "regular/frown-open", "regular/futbol", "regular/gem", "regular/grimace", "regular/grin",
        "regular/grin-alt", "regular/grin-beam", "regular/grin-beam-sweat", "regular/grin-hearts",
        "regular/grin-squint", "regular/grin-squint-tears", "regular/grin-stars", "regular/grin-tears",
        "regular/grin-tongue", "regular/grin-tongue-squint", "regular/grin-tongue-wink",
        "regular/grin-wink", "regular/hand-lizard", "regular/hand-paper", "regular/hand-peace",
        "regular/hand-point-down", "regular/hand-point-left", "regular/hand-point-right",
        "regular/hand-point-up", "regular/hand-pointer", "regular/hand-rock", "regular/hand-scissors",
        "regular/hand-spock", "regular/handshake", "regular/hdd", "regular/heart", "regular/hospital",
        "regular/hourglass", "regular/id-badge", "regular/id-card", "regular/image", "regular/images",
        "regular/keyboard", "regular/kiss", "regular/kiss-beam", "regular/kiss-wink-heart",
        "regular/laugh", "regular/laugh-beam", "regular/laugh-squint", "regular/laugh-wink",
        "regular/lemon", "regular/life-ring", "regular/lightbulb", "regular/list-alt", "regular/map",
        "regular/meh", "regular/meh-blank", "regular/meh-rolling-eyes", "regular/minus-square",
        "regular/money-bill-alt", "regular/moon", "regular/newspaper", "regular/object-group",
        "regular/object-ungroup", "regular/paper-plane", "regular/pause-circle", "regular/play-circle",
        "regular/plus-square", "regular/question-circle", "regular/registered", "regular/sad-cry",
        "regular/sad-tear", "regular/save", "regular/share-square", "regular/smile", "regular/smile-beam",
        "regular/smile-wink", "regular/snowflake", "regular/square", "regular/star", "regular/star-half",
        "regular/sticky-note", "regular/stop-circle", "regular/sun", "regular/surprise",
        "regular/thumbs-down", "regular/thumbs-up", "regular/times-circle", "regular/tired",
        "regular/trash-alt", "regular/user", "regular/user-circle", "regular/window-close",
        "regular/window-maximize", "regular/window-minimize", "regular/window-restore",
        // Brands
        "brands/500px", "brands/accessible-icon", "brands/accusoft", "brands/acquisitions-incorporated",
        "brands/adn", "brands/adversal", "brands/affiliatetheme", "brands/airbnb", "brands/algolia",
        "brands/alipay", "brands/amazon", "brands/amazon-pay", "brands/amilia", "brands/android",
        "brands/angellist", "brands/angrycreative", "brands/angular", "brands/app-store",
        "brands/app-store-ios", "brands/apper", "brands/apple", "brands/apple-pay", "brands/artstation",
        "brands/asymmetrik", "brands/atlassian", "brands/audible", "brands/autoprefixer", "brands/avianex",
        "brands/aviato", "brands/aws", "brands/bandcamp", "brands/battle-net", "brands/behance",
        "brands/behance-square", "brands/bimobject", "brands/bitbucket", "brands/bitcoin", "brands/bity",
        "brands/black-tie", "brands/blackberry", "brands/blogger", "brands/blogger-b", "brands/bluetooth",
        "brands/bluetooth-b", "brands/bootstrap", "brands/btc", "brands/buffer", "brands/buromobelexperte",
        "brands/buy-n-large", "brands/buysellads", "brands/canadian-maple-leaf", "brands/cc-amazon-pay",
        "brands/cc-amex", "brands/cc-apple-pay", "brands/cc-diners-club", "brands/cc-discover",
        "brands/cc-jcb", "brands/cc-mastercard", "brands/cc-paypal", "brands/cc-stripe", "brands/cc-visa",
        "brands/centercode", "brands/centos", "brands/chrome", "brands/chromecast", "brands/cloudscale",
        "brands/cloudsmith", "brands/cloudversify", "brands/codepen", "brands/codiepie",
        "brands/confluence", "brands/connectdevelop", "brands/contao", "brands/cotton-bureau",
        "brands/cpanel", "brands/creative-commons", "brands/creative-commons-by",
        "brands/creative-commons-nc", "brands/creative-commons-nc-eu", "brands/creative-commons-nc-jp",
        "brands/creative-commons-nd", "brands/creative-commons-pd", "brands/creative-commons-pd-alt",
        "brands/creative-commons-remix", "brands/creative-commons-sa", "brands/creative-commons-sampling",
        "brands/creative-commons-sampling-plus", "brands/creative-commons-share",
        "brands/creative-commons-zero", "brands/critical-role", "brands/css3", "brands/css3-alt",
        "brands/cuttlefish", "brands/d-and-d", "brands/d-and-d-beyond", "brands/dailymotion",
        "brands/dashcube", "brands/deezer", "brands/delicious", "brands/deploydog", "brands/deskpro",
        "brands/dev", "brands/deviantart", "brands/dhl", "brands/diaspora", "brands/digg",
        "brands/digital-ocean", "brands/discord", "brands/discourse", "brands/dochub", "brands/docker",
        "brands/draft2digital", "brands/dribbble", "brands/dribbble-square", "brands/dropbox",
        "brands/drupal", "brands/dyalog", "brands/earlybirds", "brands/ebay", "brands/edge",
        "brands/edge-legacy", "brands/elementor", "brands/ello", "brands/ember", "brands/empire",
        "brands/envira", "brands/erlang", "brands/ethereum", "brands/etsy", "brands/evernote",
        "brands/expeditedssl", "brands/facebook", "brands/facebook-f", "brands/facebook-messenger",
        "brands/facebook-square", "brands/fantasy-flight-games", "brands/fedex", "brands/fedora",
        "brands/figma", "brands/firefox", "brands/firefox-browser", "brands/first-order",
        "brands/first-order-alt", "brands/firstdraft", "brands/flickr", "brands/flipboard",
        "brands/fly", "brands/font-awesome", "brands/font-awesome-alt", "brands/font-awesome-flag",
        "brands/fonticons", "brands/fonticons-fi", "brands/fort-awesome", "brands/fort-awesome-alt",
        "brands/forumbee", "brands/foursquare", "brands/free-code-camp", "brands/freebsd",
        "brands/fulcrum", "brands/galactic-republic", "brands/galactic-senate", "brands/get-pocket",
        "brands/gg", "brands/gg-circle", "brands/git", "brands/git-alt", "brands/git-square",
        "brands/github", "brands/github-alt", "brands/github-square", "brands/gitkraken", "brands/gitlab",
        "brands/gitter", "brands/glide", "brands/glide-g", "brands/gofore", "brands/goodreads",
        "brands/goodreads-g", "brands/google", "brands/google-drive", "brands/google-pay",
        "brands/google-play", "brands/google-plus", "brands/google-plus-g", "brands/google-plus-square",
        "brands/google-wallet", "brands/gratipay", "brands/grav", "brands/gripfire", "brands/grunt",
        "brands/gulp", "brands/hacker-news", "brands/hacker-news-square", "brands/hackerrank",
        "brands/hips", "brands/hire-a-helper", "brands/hooli", "brands/hornbill", "brands/hotjar",
        "brands/houzz", "brands/html5", "brands/hubspot", "brands/ideal", "brands/imdb",
        "brands/innosoft", "brands/instagram", "brands/instagram-square", "brands/instalod",
        "brands/intercom", "brands/internet-explorer", "brands/invision", "brands/ioxhost",
        "brands/itch-io", "brands/itunes", "brands/itunes-note", "brands/java", "brands/jedi-order",
        "brands/jenkins", "brands/jira", "brands/joget", "brands/joomla", "brands/js", "brands/js-square",
        "brands/jsfiddle", "brands/kaggle", "brands/keybase", "brands/keycdn", "brands/kickstarter",
        "brands/kickstarter-k", "brands/korvue", "brands/laravel", "brands/lastfm", "brands/lastfm-square",
        "brands/leanpub", "brands/less", "brands/line", "brands/linkedin", "brands/linkedin-in",
        "brands/linode", "brands/linux", "brands/lyft", "brands/magento", "brands/mailchimp",
        "brands/mandalorian", "brands/markdown", "brands/mastodon", "brands/maxcdn", "brands/mdb",
        "brands/medapps", "brands/medium", "brands/medium-m", "brands/medrt", "brands/meetup",
        "brands/megaport", "brands/mendeley", "brands/microblog", "brands/microsoft", "brands/mix",
        "brands/mixcloud", "brands/mixer", "brands/mizuni", "brands/modx", "brands/monero",
        "brands/napster", "brands/neos", "brands/nimblr", "brands/node", "brands/node-js",
        "brands/npm", "brands/ns8", "brands/nutritionix", "brands/octopus-deploy", "brands/odnoklassniki",
        "brands/odnoklassniki-square", "brands/old-republic", "brands/opencart", "brands/openid",
        "brands/opera", "brands/optin-monster", "brands/orcid", "brands/osi", "brands/page4",
        "brands/pagelines", "brands/palfed", "brands/patreon", "brands/paypal", "brands/penny-arcade",
        "brands/perbyte", "brands/periscope", "brands/phabricator", "brands/phoenix-framework",
        "brands/phoenix-squadron", "brands/php", "brands/pied-piper", "brands/pied-piper-alt",
        "brands/pied-piper-hat", "brands/pied-piper-pp", "brands/pied-piper-square", "brands/pinterest",
        "brands/pinterest-p", "brands/pinterest-square", "brands/playstation", "brands/product-hunt",
        "brands/pushed", "brands/python", "brands/qq", "brands/quinscape", "brands/quora",
        "brands/r-project", "brands/raspberry-pi", "brands/ravelry", "brands/react", "brands/reacteurope",
        "brands/readme", "brands/rebel", "brands/red-river", "brands/reddit", "brands/reddit-alien",
        "brands/reddit-square", "brands/redhat", "brands/renren", "brands/replyd", "brands/researchgate",
        "brands/resolving", "brands/rev", "brands/rocketchat", "brands/rockrms", "brands/rust",
        "brands/safari", "brands/salesforce", "brands/sass", "brands/schlix", "brands/scribd",
        "brands/searchengin", "brands/sellcast", "brands/sellsy", "brands/servicestack", "brands/shirtsinbulk",
        "brands/shopify", "brands/shopware", "brands/simplybuilt", "brands/sistrix", "brands/sith",
        "brands/sketch", "brands/skyatlas", "brands/skype", "brands/slack", "brands/slack-hash",
        "brands/slideshare", "brands/snapchat", "brands/snapchat-ghost", "brands/snapchat-square",
        "brands/soundcloud", "brands/sourcetree", "brands/speakap", "brands/speaker-deck",
        "brands/spotify", "brands/squarespace", "brands/stack-exchange", "brands/stack-overflow",
        "brands/stackpath", "brands/staylinked", "brands/steam", "brands/steam-square",
        "brands/steam-symbol", "brands/sticker-mule", "brands/strava", "brands/stripe",
        "brands/stripe-s", "brands/studiovinari", "brands/stumbleupon", "brands/stumbleupon-circle",
        "brands/superpowers", "brands/supple", "brands/suse", "brands/swift", "brands/symfony",
        "brands/teamspeak", "brands/telegram", "brands/telegram-plane", "brands/tencent-weibo",
        "brands/the-red-yeti", "brands/themeco", "brands/themeisle", "brands/think-peaks",
        "brands/tiktok", "brands/trade-federation", "brands/trello", "brands/tripadvisor",
        "brands/tumblr", "brands/tumblr-square", "brands/twitch", "brands/twitter", "brands/twitter-square",
        "brands/typo3", "brands/uber", "brands/ubuntu", "brands/uikit", "brands/umbraco", "brands/uniregistry",
        "brands/unity", "brands/unsplash", "brands/untappd", "brands/ups", "brands/usb", "brands/usps",
        "brands/ussunnah", "brands/vaadin", "brands/viacoin", "brands/viadeo", "brands/viadeo-square",
        "brands/viber", "brands/vimeo", "brands/vimeo-square", "brands/vimeo-v", "brands/vine",
        "brands/vk", "brands/vnv", "brands/vuejs", "brands/watchman-monitoring", "brands/waze",
        "brands/weebly", "brands/weibo", "brands/weixin", "brands/whatsapp", "brands/whatsapp-square",
        "brands/whmcs", "brands/wikipedia-w", "brands/windows", "brands/wix", "brands/wizards-of-the-coast",
        "brands/wodu", "brands/wolf-pack-battalion", "brands/wordpress", "brands/wordpress-simple",
        "brands/wpbeginner", "brands/wpexplorer", "brands/wpforms", "brands/wpressr", "brands/xbox",
        "brands/xing", "brands/xing-square", "brands/y-combinator", "brands/yahoo", "brands/yammer",
        "brands/yandex", "brands/yandex-international", "brands/yarn", "brands/yelp", "brands/yoast",
        "brands/youtube", "brands/youtube-square", "brands/zhihu"
      ]
    };
  },
  computed: {
    filteredIcons() {
      let icons = this.allIcons;

      // Filter by category
      if (this.categoryFilter !== "all") {
        icons = icons.filter(icon => {
          if (this.categoryFilter === "regular") {
            return icon.startsWith("regular/");
          } else if (this.categoryFilter === "brands") {
            return icon.startsWith("brands/");
          } else if (this.categoryFilter === "solid") {
            return !icon.startsWith("regular/") && !icon.startsWith("brands/");
          }
          return true;
        });
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        icons = icons.filter(icon => 
          icon.toLowerCase().includes(query)
        );
      }

      return icons;
    },
    paginatedIcons() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredIcons.slice(start, end);
    }
  },
  watch: {
    value(newVal) {
      this.selectedIcon = newVal;
    },
    searchQuery() {
      this.currentPage = 1; // Reset to first page when searching
    },
    categoryFilter() {
      this.currentPage = 1; // Reset to first page when changing category
    }
  },
  methods: {
    handleInput(value) {
      this.$emit("input", value);
      this.$emit("change", value);
    },
    selectIcon(icon) {
      this.selectedIcon = icon;
    },
    confirmSelection() {
      this.$emit("input", this.selectedIcon);
      this.$emit("change", this.selectedIcon);
      this.dialogVisible = false;
    },
    handlePageChange(page) {
      this.currentPage = page;
    },
    getIconDisplayName(icon) {
      // Remove prefix and show last part
      return icon.split("/").pop().replace(/-/g, " ");
    }
  }
};
</script>

<style scoped>
.icon-picker {
  width: 100%;
}

.icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
}

.icon-picker-content {
  min-height: 400px;
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 10px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #fff;
}

.icon-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
  transform: scale(1.05);
}

.icon-item.selected {
  border-color: #409eff;
  background-color: #409eff;
  color: white;
}

.icon-item.selected .icon-name {
  color: white;
}

.icon-name {
  margin-top: 8px;
  font-size: 11px;
  color: #606266;
  text-align: center;
  word-break: break-word;
  text-transform: capitalize;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.el-input-group__append {
  padding: 0 10px;
}
</style>
