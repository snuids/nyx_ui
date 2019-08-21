<template>
  <div style="text-align:left;">
    <editor-menu-bar :editor="editor">
      <div slot-scope="{ commands, isActive }">
        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.bold() }"
          @click="commands.bold"
        >
          <v-icon name="bold" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.italic() }"
          @click="commands.italic"
        >
          <v-icon name="italic" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.strike() }"
          @click="commands.strike"
        >
          <v-icon name="strikethrough" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.underline() }"
          @click="commands.underline"
        >
          <v-icon name="underline" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.code() }"
          @click="commands.code"
        >
          <v-icon name="code" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.paragraph() }"
          @click="commands.paragraph"
        >
          <v-icon name="paragraph" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 1 }) }"
          @click="commands.heading({ level: 1 })"
        >H1</el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >H2</el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 3 }) }"
          @click="commands.heading({ level: 3 })"
        >H3</el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.bullet_list() }"
          @click="commands.bullet_list"
        >
          <v-icon name="circle" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.ordered_list() }"
          @click="commands.ordered_list"
        >
          <v-icon name="list-ul" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.blockquote() }"
          @click="commands.blockquote"
        >
        <v-icon name="list-ol" scale="1"/>
        </el-button>

        <el-button
          class="menubar__button"
          :class="{ 'is-active': isActive.code_block() }"
          @click="commands.code_block"
        >
          <v-icon name="square" scale="1"/>
        </el-button>
      </div>
    </editor-menu-bar>
    <div class="editor__div">
    <editor-content class="editor__content" :editor="editor"/>
    
    </div>
    
  </div>
</template>
<script>
import { Editor, EditorContent, EditorMenuBar } from "tiptap";

import {
  Blockquote,
  CodeBlock,
  HardBreak,
  Heading,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
  History
} from "tiptap-extensions";

export default {
  components: {
    EditorContent,
    EditorMenuBar

  },
  name: "FreeTextDetails",
  data: () => ({
    editor: null,
    html:""
  }),
  props: {
    config: {
      type: Object
    }
  },
  watch:{
    html:{
      handler:function() {
        this.$emit("freetextchanged",this.html);
        }
    }
  }
  ,
  created: function() {},
  mounted() {
    
    if (this.config.config.freetext==undefined)
    {
      this.config.config.freetext="<p>Free Text</p>"
    }
    this.editor = new Editor({
      extensions: [
        new Blockquote(),
        new BulletList(),
        new CodeBlock(),
        new HardBreak(),
        new Heading({ levels: [1, 2, 3] }),
        new ListItem(),
        new OrderedList(),
        new TodoItem(),
        new TodoList(),
        new Bold(),
        new Code(),
        new Italic(),
        new Link(),
        new Strike(),
        new Underline(),
        new History()
      ],
      content: this.config.config.freetext
      ,
      onUpdate: ({getHTML  }) => {
          this.html=getHTML();          
        },
    });
  },
  beforeDestroy() {
    this.editor.destroy();
  }
};
</script>
<style>
.editor__div
{
}
.editor__content
{
}
</style>