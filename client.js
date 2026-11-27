(() => {
  // src/plugin.js
  function createClient(React) {
    const NS = "projectCanvas";
    const API = "/project-canvas/api";
    const PANEL_ID = "project-canvas";
    const MIN_ZOOM = 0.1;
    const MAX_ZOOM = 4;
    const TEXT_MIN_ZOOM = 0.35;
    const MIN_WIDTH = 140;
    const MIN_HEIGHT = 80;
    const MAX_WIDTH = 1200;
    const MAX_HEIGHT = 900;
    const GRID = 24;
    const DICTS = {
      en: {
        panel: "Canvas",
        projects: "Projects",
        canvases: "Boards",
        newNote: "New note",
        delete: "Delete",
        group: "Group",
        refresh: "Refresh",
        fitAll: "Fit",
        undo: "Undo",
        redo: "Redo",
        loading: "Loading\u2026",
        retry: "Try again",
        dismiss: "Dismiss",
        cancel: "Cancel",
        save: "Save",
        create: "Create",
        noDatabase: "Project Canvas database was not found. Open the Project Canvas desktop app once, then try again.",
        noProjects: "No Project Canvas projects yet. Create one here, or in the desktop app.",
        boldTool: "Bold",
        italicTool: "Italic",
        strikeTool: "Strikethrough",
        codeTool: "Inline code",
        bulletTool: "Bullet list",
        orderedTool: "Numbered list",
        taskTool: "Checklist",
        clearFormat: "Clear list mark",
        taskDone: "Mark as not done",
        taskOpen: "Mark as done",
        importLegacy: "Import desktop data",
        imported: "Imported.",
        storagePath: "Data file:",
        syncLocked: "Another computer is using this data file; writes are paused here.",
        noCanvas: "This project has no board.",
        createFirst: "Create the first note",
        projectPrefix: "Project",
        filterProjects: "Filter projects\u2026",
        emptyCanvas: "Drag the blank canvas to pan \xB7 double-click to create a note \xB7 Shift+drag to marquee",
        notePlaceholder: "Double-click to write\u2026",
        collapsedSuffix: " (collapsed)",
        syncFailed: "Could not sync with the Project Canvas database.",
        saving: "Saving\u2026",
        mainCanvas: "Main board",
        subCanvas: "Sub-board",
        noteCount: "notes",
        searchPlaceholder: "Search notes\u2026",
        searchEmpty: "No matching notes.",
        searching: "Searching\u2026",
        recycleBin: "Recycle bin",
        recycleEmpty: "The recycle bin is empty.",
        restore: "Restore",
        newProject: "New project",
        projectName: "Project name",
        rename: "Rename",
        renameProject: "Rename project",
        deleteProject: "Delete project",
        confirmDelete: "Move the selected notes to the recycle bin?",
        confirmDeleteConnection: "Remove this connection?",
        confirmDeleteGroup: "Delete this group? Its notes are kept.",
        confirmDeleteProject: "Delete this project? Its boards and notes stay in the database.",
        confirmEmptyNote: "This note has no text. Move it to the recycle bin?",
        untitled: "Untitled",
        connection: "Connection",
        selectLine: "Choose a line",
        startConnect: "Start connecting",
        apply: "Apply",
        relation: "Line type",
        colour: "Line colour",
        defaultColour: "Default",
        connectHint: "Now click the target note",
        connected: "Connected.",
        cancelled: "Connection cancelled.",
        alreadyConnected: "Those notes are already connected.",
        created: "Created.",
        pasteEmpty: "Nothing to paste.",
        structuredReadOnly: "This note holds structured content (document, media, or sub-board). Edit it in the desktop app.",
        editNote: "Edit note",
        editLine: "Edit line",
        editorPlaceholder: "Write a note\u2026",
        more: "More",
        close: "Close",
        formatBold: "Bold",
        formatItalic: "Italic",
        formatUnderline: "Underline",
        formatStrike: "Strikethrough",
        formatBullet: "Bulleted list",
        formatImageUnsupported: "Images are not supported here yet",
        reconnected: "Endpoint reattached.",
        reconnectCancelled: "Reattach cancelled.",
        reconnectUnchanged: "That end is already attached there.",
        menuCreate: "Create note here",
        menuGroup: "Group selection",
        menuDelete: "Delete selection",
        menuFit: "Fit content",
        relation_MainThick1: "Main line",
        relation_MainThick2: "Main line 2",
        relation_MainThick3: "Main line 3",
        relation_Branch: "Branch",
        relation_References: "References",
        relation_Related: "Related",
        accent_none: "Default",
        accent_branch_a: "Branch blue",
        accent_branch_b: "Branch amber",
        accent_branch_c: "Branch violet",
        accent_branch_d: "Branch rose",
        accent_branch_e: "Branch teal",
        accent_emphasis: "Emphasis green"
      },
      zh: {
        panel: "\u753B\u5E03",
        projects: "\u9879\u76EE",
        canvases: "\u753B\u5E03",
        newNote: "\u65B0\u5EFA\u4FBF\u7B7E",
        delete: "\u5220\u9664",
        group: "\u5206\u7EC4",
        refresh: "\u5237\u65B0",
        fitAll: "\u9002\u5E94",
        undo: "\u64A4\u9500",
        redo: "\u91CD\u505A",
        loading: "\u52A0\u8F7D\u4E2D\u2026",
        retry: "\u91CD\u8BD5",
        dismiss: "\u5173\u95ED",
        cancel: "\u53D6\u6D88",
        save: "\u4FDD\u5B58",
        create: "\u521B\u5EFA",
        noDatabase: "\u6CA1\u6709\u627E\u5230 Project Canvas \u6570\u636E\u5E93\u3002\u8BF7\u5148\u6253\u5F00\u4E00\u6B21\u684C\u9762\u7AEF Project Canvas\uFF0C\u518D\u91CD\u8BD5\u3002",
        noProjects: "\u8FD8\u6CA1\u6709 Project Canvas \u9879\u76EE\u3002\u53EF\u4EE5\u5728\u8FD9\u91CC\u65B0\u5EFA\uFF0C\u6216\u5728\u684C\u9762\u7AEF\u521B\u5EFA\u3002",
        boldTool: "\u52A0\u7C97",
        italicTool: "\u659C\u4F53",
        strikeTool: "\u5220\u9664\u7EBF",
        codeTool: "\u884C\u5185\u4EE3\u7801",
        bulletTool: "\u9879\u76EE\u7B26\u53F7",
        orderedTool: "\u7F16\u53F7\u5217\u8868",
        taskTool: "\u590D\u9009\u6846\u5217\u8868",
        clearFormat: "\u6E05\u9664\u5217\u8868\u6807\u8BB0",
        taskDone: "\u6807\u8BB0\u4E3A\u672A\u5B8C\u6210",
        taskOpen: "\u6807\u8BB0\u4E3A\u5B8C\u6210",
        importLegacy: "\u4ECE\u684C\u9762\u7AEF\u5BFC\u5165",
        imported: "\u5DF2\u5BFC\u5165\u3002",
        storagePath: "\u6570\u636E\u6587\u4EF6\uFF1A",
        syncLocked: "\u53E6\u4E00\u53F0\u7535\u8111\u6B63\u5728\u4F7F\u7528\u8FD9\u4E2A\u6570\u636E\u6587\u4EF6\uFF0C\u8FD9\u91CC\u7684\u5199\u5165\u5DF2\u6682\u505C\u3002",
        noCanvas: "\u8FD9\u4E2A\u9879\u76EE\u8FD8\u6CA1\u6709\u753B\u5E03\u3002",
        createFirst: "\u521B\u5EFA\u7B2C\u4E00\u5F20\u4FBF\u7B7E",
        projectPrefix: "\u9879\u76EE",
        filterProjects: "\u7B5B\u9009\u9879\u76EE\u2026",
        emptyCanvas: "\u62D6\u62FD\u7A7A\u767D\u79FB\u52A8\u753B\u5E03 \xB7 \u53CC\u51FB\u521B\u5EFA\u4FBF\u7B7E \xB7 Shift \u62D6\u62FD\u6846\u9009",
        notePlaceholder: "\u53CC\u51FB\u5199\u4E0B\u5185\u5BB9\u2026",
        collapsedSuffix: "\uFF08\u5DF2\u6298\u53E0\uFF09",
        syncFailed: "\u65E0\u6CD5\u4E0E Project Canvas \u6570\u636E\u5E93\u540C\u6B65\u3002",
        saving: "\u4FDD\u5B58\u4E2D\u2026",
        mainCanvas: "\u4E3B\u753B\u5E03",
        subCanvas: "\u5C40\u90E8\u753B\u5E03",
        noteCount: "\u4E2A\u4FBF\u7B7E",
        searchPlaceholder: "\u641C\u7D22\u4FBF\u7B7E\u2026",
        searchEmpty: "\u6CA1\u6709\u5339\u914D\u7684\u4FBF\u7B7E\u3002",
        searching: "\u641C\u7D22\u4E2D\u2026",
        recycleBin: "\u56DE\u6536\u7AD9",
        recycleEmpty: "\u56DE\u6536\u7AD9\u662F\u7A7A\u7684\u3002",
        restore: "\u6062\u590D",
        newProject: "\u65B0\u5EFA\u9879\u76EE",
        projectName: "\u9879\u76EE\u540D",
        rename: "\u91CD\u547D\u540D",
        renameProject: "\u91CD\u547D\u540D\u9879\u76EE",
        deleteProject: "\u5220\u9664\u9879\u76EE",
        confirmDelete: "\u628A\u9009\u4E2D\u7684\u4FBF\u7B7E\u79FB\u5230\u56DE\u6536\u7AD9\uFF1F",
        confirmDeleteConnection: "\u5220\u9664\u8FD9\u6761\u8FDE\u7EBF\uFF1F",
        confirmDeleteGroup: "\u5220\u9664\u8FD9\u4E2A\u5206\u7EC4\uFF1F\u7EC4\u5185\u4FBF\u7B7E\u4F1A\u4FDD\u7559\u3002",
        confirmDeleteProject: "\u5220\u9664\u8FD9\u4E2A\u9879\u76EE\uFF1F\u5B83\u7684\u753B\u5E03\u548C\u4FBF\u7B7E\u4ECD\u7559\u5728\u6570\u636E\u5E93\u91CC\u3002",
        confirmEmptyNote: "\u8FD9\u5F20\u4FBF\u7B7E\u6CA1\u6709\u5185\u5BB9\uFF0C\u8981\u79FB\u5230\u56DE\u6536\u7AD9\u5417\uFF1F",
        untitled: "\u672A\u547D\u540D",
        connection: "\u8FDE\u7EBF",
        selectLine: "\u9009\u62E9\u7EBF\u6761",
        startConnect: "\u5F00\u59CB\u8FDE\u7EBF",
        apply: "\u5E94\u7528",
        relation: "\u7EBF\u6761\u7C7B\u578B",
        colour: "\u7EBF\u6761\u989C\u8272",
        defaultColour: "\u9ED8\u8BA4",
        connectHint: "\u518D\u70B9\u76EE\u6807\u4FBF\u7B7E\u63A5\u5165",
        connected: "\u5DF2\u8FDE\u63A5\u3002",
        cancelled: "\u8FDE\u63A5\u5DF2\u53D6\u6D88\u3002",
        alreadyConnected: "\u8FD9\u4E24\u4E2A\u4FBF\u7B7E\u5DF2\u7ECF\u8FDE\u8FC7\u4E86\u3002",
        created: "\u5DF2\u521B\u5EFA\u3002",
        pasteEmpty: "\u6CA1\u6709\u53EF\u7C98\u8D34\u7684\u5185\u5BB9\u3002",
        structuredReadOnly: "\u8FD9\u5F20\u4FBF\u7B7E\u5305\u542B\u7ED3\u6784\u5316\u5185\u5BB9\uFF08\u6587\u6863 / \u7D20\u6750 / \u5C40\u90E8\u753B\u5E03\uFF09\uFF0C\u8BF7\u5728\u684C\u9762\u7AEF\u7F16\u8F91\u3002",
        editNote: "\u7F16\u8F91\u4FBF\u7B7E",
        editLine: "\u7F16\u8F91\u8FDE\u7EBF",
        editorPlaceholder: "\u8BB0\u7B14\u8BB0\u2026",
        more: "\u66F4\u591A",
        close: "\u5173\u95ED",
        formatBold: "\u52A0\u7C97",
        formatItalic: "\u659C\u4F53",
        formatUnderline: "\u4E0B\u5212\u7EBF",
        formatStrike: "\u5220\u9664\u7EBF",
        formatBullet: "\u9879\u76EE\u7B26\u53F7",
        formatImageUnsupported: "\u6682\u4E0D\u652F\u6301\u63D2\u5165\u56FE\u7247",
        reconnected: "\u5DF2\u6539\u63A5\u8FDE\u7EBF\u7AEF\u70B9\u3002",
        reconnectCancelled: "\u6539\u63A5\u5DF2\u53D6\u6D88\u3002",
        reconnectUnchanged: "\u8BE5\u7AEF\u70B9\u5DF2\u7ECF\u63A5\u5728\u8FD9\u91CC\u3002",
        menuCreate: "\u5728\u6B64\u521B\u5EFA\u4FBF\u7B7E",
        menuGroup: "\u4ECE\u9009\u4E2D\u521B\u5EFA\u5206\u7EC4",
        menuDelete: "\u5220\u9664\u9009\u4E2D",
        menuFit: "\u9002\u5E94\u5185\u5BB9",
        relation_MainThick1: "\u4E3B\u7EBF",
        relation_MainThick2: "\u4E3B\u7EBF2",
        relation_MainThick3: "\u4E3B\u7EBF3",
        relation_Branch: "\u652F\u7EBF",
        relation_References: "\u5F15\u7528",
        relation_Related: "\u5173\u8054",
        accent_none: "\u9ED8\u8BA4",
        accent_branch_a: "\u5206\u652F\u84DD",
        accent_branch_b: "\u5206\u652F\u7425\u73C0",
        accent_branch_c: "\u5206\u652F\u7D2B",
        accent_branch_d: "\u5206\u652F\u73AB\u7470",
        accent_branch_e: "\u5206\u652F\u9752",
        accent_emphasis: "\u5F3A\u8C03\u7EFF"
      }
    };
    let translate = (key) => DICTS.en[key] ?? key;
    const t = (key) => translate(key);
    const PALETTE = {
      card: { light: "#EEF7F2", dark: "#24382E" },
      border: { light: "#C5D2C6", dark: "#2F4538" },
      hover: "#7FA88A",
      selected: "#3B7A57",
      title: { light: "#223E36", dark: "#E6F0EA" },
      body: { light: "#2F4A41", dark: "#C3D4C9" },
      meta: { light: "#6A8578", dark: "#9DB3A6" },
      tape: { light: "#8FA79A", dark: "#6F8A7C" },
      fills: {
        light: { "branch-a": "#E4F0F6", "branch-b": "#F6F0E4", "branch-c": "#EFE8F4", "branch-d": "#F5E8EC", "branch-e": "#E4F2EF", emphasis: "#E4EFE7" },
        dark: { "branch-a": "#243448", "branch-b": "#3A3224", "branch-c": "#322840", "branch-d": "#3A2830", "branch-e": "#24383A", emphasis: "#2A3A30" }
      },
      stripes: {
        light: { "branch-a": "#4A7A96", "branch-b": "#B8863A", "branch-c": "#7A5F96", "branch-d": "#A85A72", "branch-e": "#3A8A86", emphasis: "#3B7A57" },
        dark: { "branch-a": "#6FA0D8", "branch-b": "#D4A35C", "branch-c": "#A88BC8", "branch-d": "#D08098", "branch-e": "#5FB0B0", emphasis: "#8FB59A" }
      },
      relationColour: {
        MainThick1: "#3B7A57",
        MainThick2: "#4A7AB0",
        MainThick3: "#5A7A96",
        Branch: "#7FA88A",
        References: "#6A7A88",
        Related: "#8FA79A"
      },
      relationWidth: { MainThick1: 3.4, MainThick2: 2.5, MainThick3: 1.85, Branch: 1.05, References: 1.25, Related: 1.25 },
      relationDash: { References: "5 4", Related: "1.6 3.2" }
    };
    const ACCENT_KEYS = ["branch-a", "branch-b", "branch-c", "branch-d", "branch-e", "emphasis"];
    const ACCENT_COLOURS = {
      "branch-a": "#3f6f9e",
      "branch-b": "#4f8a6d",
      "branch-c": "#a2703f",
      "branch-d": "#8a5f9e",
      "branch-e": "#a04e58",
      emphasis: "#c2542f"
    };
    const RELATIONS = ["MainThick1", "MainThick2", "MainThick3", "Branch", "References", "Related"];
    const ANCHORS = ["Top", "Right", "Bottom", "Left"];
    const DEFAULT_LABEL_ALIASES = /* @__PURE__ */ new Set([
      "\u4E3B\u7EBF",
      "\u4E3B\u7EBF2",
      "\u4E3B\u7EBF3",
      "\u652F\u7EBF",
      "\u5F15\u7528",
      "\u5173\u8054",
      "\u4E3B\u7EBF \xB7 \u7C97\u7EBF\u67611",
      "\u4E3B\u7EBF \xB7 \u7C97\u7EBF\u67612",
      "\u4E3B\u7EBF \xB7 \u7C97\u7EBF\u67613",
      "Main line",
      "Main line 2",
      "Main line 3",
      "Branch",
      "References",
      "Related",
      "Main \xB7 thick 1",
      "Main \xB7 thick 2",
      "Main \xB7 thick 3"
    ]);
    function connectionLabel(connection) {
      const label = String(connection.label ?? "").trim();
      const fallback = t(`relation_${connection.relationType}`);
      if (label === "" || DEFAULT_LABEL_ALIASES.has(label)) return fallback;
      return label;
    }
    const isDark = () => {
      try {
        return document.body?.hasAttribute("data-ds-dark-theme") === true;
      } catch {
        return false;
      }
    };
    const mode = () => isDark() ? "dark" : "light";
    const cardFill = (accentKey) => {
      const m = mode();
      return accentKey && PALETTE.fills[m][accentKey] || PALETTE.card[m];
    };
    const stripeColour = (accentKey) => accentKey && PALETTE.stripes[mode()][accentKey] || PALETTE.tape[mode()];
    const accentLabel = (key) => t(`accent_${(key ?? "none").replace(/-/g, "_")}`);
    function displayContent(node) {
      const raw = node.content;
      if (raw === null || raw === void 0 || raw === "") return "";
      const text = String(raw);
      const trimmed = text.trim();
      if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return text;
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed?.blocks)) {
          const parts = [];
          const walk = (blocks) => {
            for (const block of blocks) {
              if (typeof block?.text === "string") parts.push(block.text);
              if (Array.isArray(block?.content)) walk(block.content);
              if (Array.isArray(block?.items)) walk(block.items);
            }
          };
          walk(parsed.blocks);
          return parts.join(" ");
        }
        if (typeof parsed?.childCanvasId === "string") return t("mainCanvas");
        if (typeof parsed?.fileName === "string") return parsed.fileName;
        if (typeof parsed?.path === "string") return String(parsed.path).split(/[\\/]/).pop() ?? parsed.path;
        return text;
      } catch {
        return text;
      }
    }
    function relativeTime(iso) {
      if (typeof iso !== "string" || iso === "") return "";
      const time = Date.parse(iso);
      if (Number.isNaN(time)) return "";
      const minutes = Math.round((Date.now() - time) / 6e4);
      const locale = typeof navigator !== "undefined" && navigator.language || "en";
      try {
        const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
        if (Math.abs(minutes) < 1) return format.format(0, "minute");
        if (Math.abs(minutes) < 60) return format.format(-minutes, "minute");
        const hours = Math.round(minutes / 60);
        if (Math.abs(hours) < 24) return format.format(-hours, "hour");
        const days = Math.round(hours / 24);
        if (Math.abs(days) < 30) return format.format(-days, "day");
        return new Date(time).toLocaleDateString(locale);
      } catch {
        return new Date(time).toLocaleDateString();
      }
    }
    function derivedTitleOf(node) {
      const text = displayContent(node).trim();
      if (text === "") return "";
      const chars = [...text];
      return chars.length <= 24 ? chars.join("") : `${chars.slice(0, 24).join("")}\u2026`;
    }
    function customTitleOf(node) {
      const title = String(node.title ?? "").trim();
      if (title === "") return "";
      if (title.startsWith("{") || title.startsWith("[")) return "";
      return title === derivedTitleOf(node) ? "" : title;
    }
    const RICH_INLINE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\n]+\*|`[^`\n]+`)/g;
    function renderInline(text, keyPrefix) {
      return String(text).split(RICH_INLINE).map((part, index) => {
        const key = `${keyPrefix}-${index}`;
        if (part === "") return null;
        if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
          return h("strong", { key }, part.slice(2, -2));
        }
        if (part.length > 4 && part.startsWith("__") && part.endsWith("__")) {
          return h("u", { key }, part.slice(2, -2));
        }
        if (part.length > 4 && part.startsWith("~~") && part.endsWith("~~")) {
          return h("s", { key }, part.slice(2, -2));
        }
        if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
          return h("em", { key }, part.slice(1, -1));
        }
        if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
          return h("code", { key, style: { fontFamily: "monospace", fontSize: "0.95em" } }, part.slice(1, -1));
        }
        return h("span", { key }, part);
      });
    }
    const BLOCK_TASK = /^(\s*)[-*+]\s+\[([ xX])\]\s?(.*)$/;
    const BLOCK_ORDERED = /^(\s*)(\d{1,9})[.)]\s+(.*)$/;
    const BLOCK_BULLET = /^(\s*)[-*+]\s+(.*)$/;
    function noteBlocks(node, text) {
      if (Array.isArray(node.blocks) && node.blocks.length > 0) return node.blocks;
      return parseBlockLines(text);
    }
    function parseBlockLines(text) {
      return String(text ?? "").split("\n").map((line) => {
        const indent = (match) => Math.max(0, Math.floor(match.replace(/\t/g, "  ").length / 2));
        const task = BLOCK_TASK.exec(line);
        if (task !== null) {
          return { k: "task", t: task[3], i: indent(task[1]), c: task[2].toLowerCase() === "x" };
        }
        const ordered = BLOCK_ORDERED.exec(line);
        if (ordered !== null) return { k: "ol", t: ordered[3], i: indent(ordered[1]), n: Number(ordered[2]) };
        const bullet = BLOCK_BULLET.exec(line);
        if (bullet !== null) return { k: "ul", t: bullet[2], i: indent(bullet[1]) };
        return { k: "p", t: line, i: 0 };
      });
    }
    function renderRichText(blocks, keyPrefix, onToggleTask) {
      if (blocks.length === 0) return null;
      let ordinal = 0;
      let previous = null;
      return blocks.map((block, index) => {
        const indent = Math.max(0, Number(block.i) || 0) * 15;
        if (block.k === "ol") {
          ordinal = previous !== null && previous.k === "ol" && previous.i === block.i ? ordinal + 1 : Number(block.n) || 1;
        } else {
          ordinal = 0;
        }
        previous = block;
        const marker = block.k === "ul" ? h("span", { style: markerStyle }, "\u2022") : block.k === "ol" ? h("span", { style: markerStyle }, `${ordinal}.`) : block.k === "task" ? checkboxBox(
          block.c === true,
          () => onToggleTask?.(index),
          block.c === true ? t("taskDone") : t("taskOpen")
        ) : null;
        return h(
          "div",
          {
            key: `${keyPrefix}-line-${index}`,
            style: { display: "flex", gap: 5, minHeight: "1em", paddingLeft: indent }
          },
          marker,
          h("span", {
            style: {
              flex: "1 1 auto",
              minWidth: 0,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              textDecoration: block.k === "task" && block.c === true ? "line-through" : void 0,
              opacity: block.k === "task" && block.c === true ? 0.65 : 1
            }
          }, renderInline(block.t, `${keyPrefix}-${index}`))
        );
      });
    }
    const markerStyle = { flex: "0 0 auto", opacity: 0.75, minWidth: 12, userSelect: "none" };
    function isStructuredContent(node) {
      if (node.type === "Idea" || node.type === void 0) return false;
      const text = String(node.content ?? "").trim();
      if (!(text.startsWith("{") || text.startsWith("["))) return false;
      try {
        JSON.parse(text);
        return true;
      } catch {
        return false;
      }
    }
    async function callApi(path, init) {
      const response = await fetch(`${API}${path}`, {
        credentials: "same-origin",
        headers: init?.body === void 0 ? void 0 : { "content-type": "application/json" },
        ...init
      });
      const text = await response.text();
      let payload;
      try {
        payload = text === "" ? {} : JSON.parse(text);
      } catch {
        payload = { message: text };
      }
      if (!response.ok) {
        const error = new Error(payload.message ?? `HTTP ${response.status}`);
        error.code = payload.code;
        throw error;
      }
      return payload;
    }
    const mutate = (op, payload) => callApi("/mutate", { method: "POST", body: JSON.stringify({ op, ...payload }) }).then((result) => result.result);
    const ANCHOR_POINT = {
      Top: (node) => ({ x: node.x + node.width / 2, y: node.y }),
      Right: (node) => ({ x: node.x + node.width, y: node.y + node.height / 2 }),
      Bottom: (node) => ({ x: node.x + node.width / 2, y: node.y + node.height }),
      Left: (node) => ({ x: node.x, y: node.y + node.height / 2 })
    };
    const ANCHOR_NORMAL = {
      Top: { x: 0, y: -1 },
      Right: { x: 1, y: 0 },
      Bottom: { x: 0, y: 1 },
      Left: { x: -1, y: 0 }
    };
    const ANCHOR_PLACEMENT = {
      Top: { left: "50%", top: -16, marginLeft: -5 },
      Right: { right: -16, top: "50%", marginTop: -5 },
      Bottom: { left: "50%", bottom: -16, marginLeft: -5 },
      Left: { left: -16, top: "50%", marginTop: -5 }
    };
    const anchorFor = (anchor, node) => (ANCHOR_POINT[anchor] ?? ANCHOR_POINT.Right)(node);
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const snap24 = (value) => Math.round(value / GRID) * GRID;
    function nearestAnchor(node, world) {
      let best = "Right";
      let bestDistance = Infinity;
      for (const anchor of ANCHORS) {
        const point = anchorFor(anchor, node);
        const distance = Math.hypot(point.x - world.x, point.y - world.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = anchor;
        }
      }
      return best;
    }
    function hitAnchor(node, world, zoom) {
      const threshold = 12 / Math.max(1e-3, zoom);
      let best;
      let bestDistance = threshold;
      for (const anchor of ANCHORS) {
        const point = anchorFor(anchor, node);
        const distance = Math.hypot(point.x - world.x, point.y - world.y);
        if (distance <= bestDistance) {
          bestDistance = distance;
          best = anchor;
        }
      }
      return best;
    }
    const RESIZE_HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    const RESIZE_CURSOR = { nw: "nwse-resize", n: "ns-resize", ne: "nesw-resize", e: "ew-resize", se: "nwse-resize", s: "ns-resize", sw: "nesw-resize", w: "ew-resize" };
    const HANDLE_POSITION = {
      nw: { left: -4, top: -4 },
      n: { left: "50%", top: -4, marginLeft: -4 },
      ne: { right: -4, top: -4 },
      e: { right: -4, top: "50%", marginTop: -4 },
      se: { right: -4, bottom: -4 },
      s: { left: "50%", bottom: -4, marginLeft: -4 },
      sw: { left: -4, bottom: -4 },
      w: { left: -4, top: "50%", marginTop: -4 }
    };
    function hitResizeHandle(node, world, zoom) {
      const threshold = 10 / Math.max(1e-3, zoom);
      const left = node.x;
      const right = node.x + node.width;
      const top = node.y;
      const bottom = node.y + node.height;
      const nearLeft = Math.abs(world.x - left) <= threshold;
      const nearRight = Math.abs(world.x - right) <= threshold;
      const nearTop = Math.abs(world.y - top) <= threshold;
      const nearBottom = Math.abs(world.y - bottom) <= threshold;
      const insideX = world.x >= left - threshold && world.x <= right + threshold;
      const insideY = world.y >= top - threshold && world.y <= bottom + threshold;
      if (!insideX || !insideY) return void 0;
      if (nearLeft && nearTop) return "nw";
      if (nearRight && nearTop) return "ne";
      if (nearLeft && nearBottom) return "sw";
      if (nearRight && nearBottom) return "se";
      if (nearLeft) return "w";
      if (nearRight) return "e";
      if (nearTop) return "n";
      if (nearBottom) return "s";
      return void 0;
    }
    function buildCurve(from, fromAnchor, to, toAnchor) {
      const normalFrom = ANCHOR_NORMAL[fromAnchor] ?? ANCHOR_NORMAL.Right;
      const normalTo = ANCHOR_NORMAL[toAnchor] ?? ANCHOR_NORMAL.Left;
      const chord = Math.hypot(to.x - from.x, to.y - from.y);
      const bend = clamp(chord * 0.35, 32, 160);
      const c1 = { x: from.x + normalFrom.x * bend, y: from.y + normalFrom.y * bend };
      const c2 = { x: to.x + normalTo.x * bend, y: to.y + normalTo.y * bend };
      return {
        from,
        to,
        c1,
        c2,
        mid: {
          x: 0.125 * from.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * to.x,
          y: 0.125 * from.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * to.y
        }
      };
    }
    function connectionPath(connection, nodes) {
      const source = nodes.find((node) => node.id === connection.sourceNodeId);
      const target = nodes.find((node) => node.id === connection.targetNodeId);
      if (source === void 0 || target === void 0) return void 0;
      return buildCurve(
        anchorFor(connection.sourceAnchor, source),
        connection.sourceAnchor,
        anchorFor(connection.targetAnchor, target),
        connection.targetAnchor
      );
    }
    function reconnectCurve(connection, reconnect, nodes) {
      const source = nodes.find((node) => node.id === connection.sourceNodeId);
      const target = nodes.find((node) => node.id === connection.targetNodeId);
      if (source === void 0 || target === void 0) return void 0;
      if (reconnect.isSourceEnd) {
        const anchor2 = reconnect.anchor ?? connection.sourceAnchor;
        const from = reconnect.hoverNode === void 0 ? reconnect.floating : anchorFor(anchor2, reconnect.hoverNode);
        return buildCurve(from, anchor2, anchorFor(connection.targetAnchor, target), connection.targetAnchor);
      }
      const anchor = reconnect.anchor ?? connection.targetAnchor;
      const to = reconnect.hoverNode === void 0 ? reconnect.floating : anchorFor(anchor, reconnect.hoverNode);
      return buildCurve(anchorFor(connection.sourceAnchor, source), connection.sourceAnchor, to, anchor);
    }
    function closestOnCurve(curve, point, samples = 48) {
      let best = { distance: Infinity, t: 0 };
      for (let step = 0; step <= samples; step += 1) {
        const s = step / samples;
        const mt = 1 - s;
        const x = mt * mt * mt * curve.from.x + 3 * mt * mt * s * curve.c1.x + 3 * mt * s * s * curve.c2.x + s * s * s * curve.to.x;
        const y = mt * mt * mt * curve.from.y + 3 * mt * mt * s * curve.c1.y + 3 * mt * s * s * curve.c2.y + s * s * s * curve.to.y;
        const distance = Math.hypot(x - point.x, y - point.y);
        if (distance < best.distance) best = { distance, t: s };
      }
      return best;
    }
    const pathOf = (curve) => `M ${curve.from.x} ${curve.from.y} C ${curve.c1.x} ${curve.c1.y}, ${curve.c2.x} ${curve.c2.y}, ${curve.to.x} ${curve.to.y}`;
    const defaultInk = () => isDark() ? "#ffffff" : "#000000";
    function connectionColour(connection) {
      const key = connection.strokeKey;
      if (key === "#000000") return defaultInk();
      if (typeof key === "string" && key.startsWith("#")) return key;
      if (key && PALETTE.stripes[mode()][key]) return PALETTE.stripes[mode()][key];
      return PALETTE.relationColour[connection.relationType] ?? PALETTE.stripe;
    }
    function boundsOf(nodes) {
      if (nodes.length === 0) return void 0;
      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;
      for (const node of nodes) {
        left = Math.min(left, node.x);
        top = Math.min(top, node.y);
        right = Math.max(right, node.x + node.width);
        bottom = Math.max(bottom, node.y + node.height);
      }
      return { left, top, right, bottom };
    }
    function Button({ children, onClick, primary, danger, disabled, title }) {
      return h("button", {
        type: "button",
        title,
        onClick: disabled ? void 0 : onClick,
        disabled,
        "aria-label": title,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          height: 28,
          padding: "0 10px",
          borderRadius: 6,
          cursor: disabled ? "default" : "pointer",
          fontSize: 12,
          lineHeight: "16px",
          border: "1px solid var(--dsw-alias-border-l2)",
          color: danger ? "var(--dsw-alias-state-error-primary)" : disabled ? "var(--dsw-alias-label-tertiary)" : "var(--dsw-alias-label-primary)",
          background: primary ? "var(--dsw-alias-bg-layer-2)" : "transparent",
          opacity: disabled ? 0.55 : 1,
          fontFamily: "inherit",
          whiteSpace: "nowrap"
        }
      }, children);
    }
    const inputStyle = {
      width: "100%",
      boxSizing: "border-box",
      padding: "6px 8px",
      borderRadius: 6,
      border: "1px solid var(--dsw-alias-border-l2)",
      background: "var(--dsw-alias-bg-base)",
      color: "var(--dsw-alias-label-primary)",
      font: "inherit",
      fontSize: 12,
      outline: "none"
    };
    function field(label, control) {
      return h(
        "label",
        { style: { display: "grid", gap: 4, fontSize: 12, color: "var(--dsw-alias-label-secondary)" } },
        h("span", null, label),
        control
      );
    }
    function Dialog({ title, children, onClose, footer, width = 420 }) {
      useEffect(() => {
        const onKey = (event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            onClose();
          }
        };
        document.addEventListener("keydown", onKey, true);
        return () => document.removeEventListener("keydown", onKey, true);
      }, [onClose]);
      const card = h(
        "div",
        {
          role: "dialog",
          "aria-label": title,
          "aria-modal": true,
          style: {
            width,
            maxWidth: "100%",
            maxHeight: "calc(100% - 8px)",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            borderRadius: 12,
            background: "var(--dsw-alias-bg-layer-2)",
            border: "1px solid var(--dsw-alias-border-l2)",
            boxShadow: "0 12px 40px var(--dsw-alias-bg-mask-2)"
          }
        },
        h("div", { style: { padding: "12px 16px 8px", fontSize: 13, fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, title),
        h("div", {
          style: {
            padding: "0 16px",
            display: "grid",
            gap: 10,
            minHeight: 0,
            overflowY: "auto",
            fontSize: 12,
            color: "var(--dsw-alias-label-secondary)"
          }
        }, children),
        h("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 16px 14px" } }, footer)
      );
      return h("div", {
        style: {
          position: "absolute",
          inset: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          boxSizing: "border-box",
          background: "var(--dsw-alias-bg-mask-2)"
        },
        onPointerDown: (event) => {
          if (event.target === event.currentTarget) onClose();
        }
      }, card);
    }
    function Swatch({ colour, selected, onClick, title }) {
      return h("button", {
        type: "button",
        title,
        onClick,
        "aria-pressed": selected === true,
        style: {
          width: 22,
          height: 22,
          borderRadius: "50%",
          cursor: "pointer",
          padding: 0,
          background: colour,
          border: selected === true ? "2px solid var(--dsw-alias-label-primary)" : "1px solid var(--dsw-alias-border-l2)"
        }
      });
    }
    const toolButton = (label, title, onPress, options = {}) => h("button", {
      type: "button",
      title,
      "aria-label": title,
      disabled: options.disabled === true,
      onPointerDown: (event) => {
        event.preventDefault();
        event.stopPropagation();
      },
      onClick: options.disabled === true ? void 0 : onPress,
      style: {
        minWidth: 30,
        height: 26,
        padding: "0 6px",
        borderRadius: 6,
        border: "1px solid transparent",
        background: "transparent",
        color: options.disabled === true ? "var(--dsw-alias-label-tertiary)" : "var(--dsw-alias-label-primary)",
        cursor: options.disabled === true ? "default" : "pointer",
        fontFamily: "inherit",
        fontSize: 13,
        opacity: options.disabled === true ? 0.45 : 1,
        ...options.style
      }
    }, label);
    function checkboxBox(checked, onToggle, title) {
      return h("button", {
        type: "button",
        role: "checkbox",
        "aria-checked": checked === true,
        title,
        onPointerDown: (event) => {
          event.preventDefault();
          event.stopPropagation();
        },
        onClick: (event) => {
          event.stopPropagation();
          onToggle();
        },
        style: {
          flex: "0 0 auto",
          width: 16,
          height: 16,
          marginTop: 3,
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 4,
          cursor: "pointer",
          border: `1.5px solid ${checked === true ? PALETTE.selected : "var(--dsw-alias-border-l3)"}`,
          background: checked === true ? PALETTE.selected : "transparent",
          color: checked === true ? "#fff" : "transparent",
          fontSize: 10,
          lineHeight: 1,
          fontFamily: "inherit",
          transition: "background 120ms ease, border-color 120ms ease"
        }
      }, "\u2713");
    }
    const HTML_ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
    const escapeHtml = (text) => String(text).replace(/[&<>"]/g, (ch) => HTML_ESCAPE[ch]);
    function inlineToHtml(text) {
      let out = escapeHtml(text);
      out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
      out = out.replace(/~~([^~]+)~~/g, "<s>$1</s>");
      out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
      return out;
    }
    function htmlToInline(root) {
      const walk = (node) => {
        if (node === null || node === void 0) return "";
        if (node.nodeType === 3) return node.nodeValue ?? "";
        if (node.nodeType !== 1) return "";
        const tag = node.tagName.toLowerCase();
        const inner = Array.from(node.childNodes).map(walk).join("");
        if (tag === "br") return "\n";
        if (tag === "strong" || tag === "b") return `**${inner}**`;
        if (tag === "em" || tag === "i") return `*${inner}*`;
        if (tag === "s" || tag === "strike" || tag === "del") return `~~${inner}~~`;
        if (tag === "code") return `\`${inner}\``;
        if (tag === "div" || tag === "p") return `${inner}
`;
        return inner;
      };
      return walk(root).replace(/\n+$/, "");
    }
    function blocksToEditorText(blocks) {
      return blocks.map((block) => {
        const indent = "  ".repeat(Math.max(0, Number(block.i) || 0));
        if (block.k === "task") return `${indent}- [${block.c === true ? "x" : " "}] ${block.t}`;
        if (block.k === "ol") return `${indent}${Number(block.n) || 1}. ${block.t}`;
        if (block.k === "ul") return `${indent}- ${block.t}`;
        return block.t;
      }).join("\n");
    }
    function RichBodyEditor({ initialText, onChange, onCommitEdit, onCancelEdit, t: t2 }) {
      const [blocks, setBlocks] = useState(() => parseBlockLines(initialText));
      const live = useRef(blocks);
      const nodes = useRef([]);
      const activeIndex = useRef(0);
      const focusIndex = useRef(void 0);
      const publish = (next) => {
        live.current = next;
        setBlocks(next);
        onChange(blocksToEditorText(next));
      };
      const setText = (index, text) => {
        const block = live.current[index];
        if (block === void 0 || block.t === text) return;
        publish(live.current.map((entry, position) => position === index ? { ...entry, t: text } : entry));
      };
      useEffect(() => {
        const index = focusIndex.current;
        if (index === void 0) return;
        focusIndex.current = void 0;
        const element = nodes.current[index];
        if (element === null || element === void 0) return;
        element.focus();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(true);
        const selection = window.getSelection();
        if (selection === null) return;
        selection.removeAllRanges();
        selection.addRange(range);
      });
      const markerOf = (block, ordinal2) => {
        const base = { flex: "0 0 auto", minWidth: 14, opacity: 0.7, userSelect: "none", lineHeight: "1.65" };
        if (block.k === "ul") return h("span", { style: base }, "\u2022");
        if (block.k === "ol") return h("span", { style: base }, `${ordinal2}.`);
        if (block.k === "task") {
          return checkboxBox(block.c === true, () => {
            publish(live.current.map((entry, position) => position === activeIndex.current && entry.k === "task" ? { ...entry, c: entry.c !== true } : entry));
          }, block.c === true ? t2("taskDone") : t2("taskOpen"));
        }
        return h("span", { style: { ...base, minWidth: 14 } }, "");
      };
      const ordinalAt = (index) => {
        const block = live.current[index];
        if (block === void 0 || block.k !== "ol") return 1;
        let ordinal2 = Number(block.n) || 1;
        for (let position = index - 1; position >= 0; position -= 1) {
          const previous2 = live.current[position];
          if (previous2.k === "ol" && previous2.i === block.i) ordinal2 = (Number(previous2.n) || 1) + 1;
          else break;
        }
        return ordinal2;
      };
      const commitActive = () => {
        const index = activeIndex.current;
        const element = nodes.current[index];
        if (element === null || element === void 0) return;
        setText(index, htmlToInline(element));
      };
      const runCommand = (command) => {
        document.execCommand("styleWithCSS", false, false);
        document.execCommand(command);
        commitActive();
      };
      const wrapCode = () => {
        const selection = window.getSelection();
        if (selection === null || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (range.collapsed) return;
        const code = document.createElement("code");
        code.style.fontFamily = "monospace";
        code.appendChild(range.extractContents());
        range.insertNode(code);
        selection.removeAllRanges();
        const after = document.createRange();
        after.selectNodeContents(code);
        selection.addRange(after);
        commitActive();
      };
      const setKind = (kind) => {
        const index = activeIndex.current;
        publish(live.current.map((entry, position) => {
          if (position !== index) return entry;
          if (entry.k === kind) return { ...entry, k: "p" };
          const next = { ...entry, k: kind };
          if (kind === "ol") next.n = 1;
          if (kind === "task") next.c = false;
          return next;
        }));
        focusIndex.current = index;
      };
      const onKeyDown = (event, index) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          onCancelEdit();
          return;
        }
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          onCommitEdit();
          return;
        }
        const block = live.current[index];
        if (block === void 0) return;
        if (event.key === "Enter") {
          if (event.shiftKey) return;
          event.preventDefault();
          if (block.k !== "p" && String(block.t).trim() === "") {
            publish(live.current.map((entry, position) => position === index ? { ...entry, k: "p", i: 0 } : entry));
            focusIndex.current = index;
            return;
          }
          let head = block.t;
          let tail = "";
          const element = nodes.current[index];
          const selection = window.getSelection();
          if (element !== null && element !== void 0 && selection !== null && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const after = range.cloneRange();
            after.selectNodeContents(element);
            after.setStart(range.endContainer, range.endOffset);
            const holder = document.createElement("div");
            holder.appendChild(after.extractContents());
            tail = htmlToInline(holder);
            head = htmlToInline(element);
          }
          const fresh = block.k === "task" ? { k: "task", t: tail, i: block.i, c: false } : block.k === "ol" ? { k: "ol", t: tail, i: block.i, n: ordinalAt(index) + 1 } : block.k === "ul" ? { k: "ul", t: tail, i: block.i } : { k: "p", t: tail, i: 0 };
          const next = live.current.map((entry, position) => position === index ? { ...entry, t: head } : entry);
          publish([...next.slice(0, index + 1), fresh, ...next.slice(index + 1)]);
          focusIndex.current = index + 1;
          return;
        }
        if (event.key === "Tab") {
          event.preventDefault();
          publish(live.current.map((entry, position) => position === index ? { ...entry, i: Math.max(0, (Number(entry.i) || 0) + (event.shiftKey ? -1 : 1)) } : entry));
          focusIndex.current = index;
          return;
        }
        if (event.key === "Backspace") {
          const element = nodes.current[index];
          const caretAtStart = element !== void 0 && element !== null && window.getSelection()?.anchorOffset === 0;
          if (!caretAtStart || index === 0) return;
          event.preventDefault();
          const previous2 = live.current[index - 1];
          const merged = { ...previous2, t: `${previous2.t}${block.t}` };
          const next = live.current.map((entry, position) => {
            if (position === index - 1) return merged;
            if (position === index) return void 0;
            return entry;
          }).filter((entry) => entry !== void 0);
          publish(next);
          focusIndex.current = index - 1;
        }
      };
      const toolbar = h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: "0 0 auto",
            padding: "6px 12px",
            borderTop: "1px solid var(--dsw-alias-border-l2)",
            background: "var(--dsw-alias-bg-layer-2)"
          }
        },
        toolButton("B", t2("boldTool"), () => runCommand("bold"), { style: { fontWeight: 700 } }),
        toolButton("I", t2("italicTool"), () => runCommand("italic"), { style: { fontStyle: "italic" } }),
        toolButton("S", t2("strikeTool"), () => runCommand("strikeThrough"), { style: { textDecoration: "line-through" } }),
        toolButton("</>", t2("codeTool"), wrapCode, { style: { fontSize: 11 } }),
        h("span", { style: { width: 1, height: 16, margin: "0 6px", background: "var(--dsw-alias-border-l2)" } }),
        toolButton("\u2022", t2("bulletTool"), () => setKind("ul")),
        toolButton("1.", t2("orderedTool"), () => setKind("ol")),
        toolButton("\u2611", t2("taskTool"), () => setKind("task"))
      );
      let ordinal = 0;
      let previous = null;
      const rows = blocks.map((block, index) => {
        if (block.k === "ol") ordinal = previous !== null && previous.k === "ol" && previous.i === block.i ? ordinal + 1 : Number(block.n) || 1;
        else ordinal = 0;
        previous = block;
        return h(
          "div",
          {
            key: `${index}-${block.k}-${block.i}`,
            style: {
              display: "flex",
              gap: 6,
              alignItems: "flex-start",
              paddingLeft: Math.max(0, Number(block.i) || 0) * 15
            }
          },
          markerOf(block, ordinal),
          h("div", {
            ref: (element) => {
              nodes.current[index] = element;
              if (element === null || element.dataset.hydrated === "1") return;
              element.dataset.hydrated = "1";
              element.innerHTML = inlineToHtml(block.t);
            },
            contentEditable: true,
            suppressContentEditableWarning: true,
            "data-block": index,
            onFocus: () => {
              activeIndex.current = index;
            },
            onInput: (event) => setText(index, htmlToInline(event.currentTarget)),
            onKeyDown: (event) => onKeyDown(event, index),
            onBlur: () => commitActive(),
            style: {
              flex: "1 1 auto",
              minWidth: 0,
              outline: "none",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--dsw-alias-label-primary)",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              caretColor: PALETTE.selected,
              textDecoration: block.k === "task" && block.c === true ? "line-through" : void 0,
              opacity: block.k === "task" && block.c === true ? 0.7 : 1
            }
          })
        );
      });
      return h(
        React.Fragment,
        null,
        h("div", {
          "data-rich-editor": true,
          onMouseDown: (event) => {
            if (event.target !== event.currentTarget) return;
            event.preventDefault();
            const last = live.current.length - 1;
            publish([...live.current, { k: "p", t: "", i: 0 }]);
            focusIndex.current = last + 1;
          },
          style: {
            flex: "1 1 auto",
            minWidth: 0,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            cursor: "text",
            padding: "12px 14px 24px"
          }
        }, rows),
        toolbar
      );
    }
    function CanvasView({
      graph,
      selection,
      selectedConnection,
      selectedGroup,
      editing,
      pendingLink,
      focusRequest,
      highlightId,
      onSelectNodes,
      onSelectConnection,
      onSelectGroup,
      onCreateNote,
      onMoveNodes,
      onResizeNode,
      onCommitEdit,
      onCancelEdit,
      onEditValue,
      onBeginEdit,
      onBeginLink,
      onCompleteLink,
      onCancelLink,
      onToggleTask,
      onAutoFit,
      onOpenConnection,
      onToggleGroup,
      onMoveGroup,
      onCamera,
      onViewport,
      onContextMenu,
      onWheelResize,
      onReconnect,
      onNewNote,
      onDeleteNote,
      t: t2
    }) {
      const hostRef = useRef(null);
      const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
      const [marquee, setMarquee] = useState(void 0);
      const [hover, setHover] = useState(void 0);
      const textRefs = useRef(/* @__PURE__ */ new Map());
      const [pointer, setPointer] = useState(void 0);
      const [space, setSpace] = useState(false);
      const [reconnect, setReconnect] = useState(void 0);
      const [endpointHover, setEndpointHover] = useState(void 0);
      const [editorMenu, setEditorMenu] = useState(false);
      const gesture = useRef(void 0);
      const initialisedFor = useRef(void 0);
      const cameraTimer = useRef(void 0);
      const wheelCommit = useRef(void 0);
      const bodyRef = useRef(null);
      const editingKey = editing?.nodeId;
      const selected = new Set(selection);
      const dark = isDark();
      const nodes = graph?.nodes ?? [];
      const connections = graph?.connections ?? [];
      const groups = graph?.groups ?? [];
      const collapsedMembers = new Set(groups.filter((group) => group.collapsed).flatMap((group) => group.memberIds));
      const editingId = editing?.nodeId;
      useEffect(() => {
        if (editingKey === void 0) return;
        const area = bodyRef.current;
        if (area === null) return;
        area.focus();
        area.setSelectionRange(area.value.length, area.value.length);
      }, [editingKey]);
      useEffect(() => {
        setEditorMenu(false);
      }, [editingKey]);
      useEffect(() => {
        if (!editorMenu) return void 0;
        const dismiss = (event) => {
          if (event.target instanceof Element && event.target.closest?.("[data-editor-menu],[data-editor-more]") !== null) return;
          setEditorMenu(false);
        };
        document.addEventListener("pointerdown", dismiss, true);
        return () => document.removeEventListener("pointerdown", dismiss, true);
      }, [editorMenu]);
      const beginReconnect = (connection, isSourceEnd, world, event) => {
        onSelectConnection(connection.id);
        onSelectNodes([]);
        onSelectGroup(void 0);
        gesture.current = {
          kind: "reconnect",
          connectionId: connection.id,
          isSourceEnd,
          fixedNodeId: isSourceEnd ? connection.targetNodeId : connection.sourceNodeId,
          floating: world,
          hoverNode: void 0,
          anchor: void 0
        };
        setReconnect({
          connectionId: connection.id,
          isSourceEnd,
          floating: world,
          hoverNode: void 0,
          anchor: void 0
        });
        setEndpointHover(`${connection.id}:${isSourceEnd ? "source" : "target"}`);
        capture(event);
      };
      const hitNode = (world) => {
        const visible = nodes.filter((node) => !collapsedMembers.has(node.id));
        let best;
        for (const node of visible) {
          if (world.x < node.x || world.x > node.x + node.width) continue;
          if (world.y < node.y || world.y > node.y + node.height) continue;
          if (best === void 0 || node.zIndex >= best.zIndex) best = node;
        }
        return best;
      };
      const hitGroupTitle = (world) => {
        for (let index = groups.length - 1; index >= 0; index -= 1) {
          const group = groups[index];
          if (world.x >= group.x && world.x <= group.x + group.width && world.y >= group.y && world.y <= group.y + 28) return group;
        }
        return void 0;
      };
      const hitGroupBody = (world) => {
        for (let index = groups.length - 1; index >= 0; index -= 1) {
          const group = groups[index];
          const height = group.collapsed ? 36 : group.height;
          if (world.x >= group.x && world.x <= group.x + group.width && world.y >= group.y && world.y <= group.y + height) return group;
        }
        return void 0;
      };
      const fitAll = useCallback(() => {
        const host = hostRef.current;
        if (host === null) return;
        const visible = nodes.filter((node) => !collapsedMembers.has(node.id));
        const bounds = boundsOf(visible);
        if (bounds === void 0) {
          setCamera({ zoom: 1, x: -host.clientWidth / 2, y: -host.clientHeight / 2 });
          return;
        }
        const padW = host.clientWidth * 0.05;
        const padH = host.clientHeight * 0.05;
        const zoom2 = clamp(Math.min(
          (host.clientWidth - padW * 2) / Math.max(1, bounds.right - bounds.left),
          (host.clientHeight - padH * 2) / Math.max(1, bounds.bottom - bounds.top)
        ), MIN_ZOOM, MAX_ZOOM);
        setCamera({
          zoom: zoom2,
          x: (bounds.left + bounds.right) / 2 - host.clientWidth / (2 * zoom2),
          y: (bounds.top + bounds.bottom) / 2 - host.clientHeight / (2 * zoom2)
        });
      }, [nodes, groups]);
      useEffect(() => {
        onViewport?.({ fitAll, center: () => {
          const host = hostRef.current;
          if (host === null) return void 0;
          return { x: camera.x + host.clientWidth / (2 * camera.zoom), y: camera.y + host.clientHeight / (2 * camera.zoom) };
        } });
        return () => onViewport?.(void 0);
      }, [camera, fitAll, onViewport]);
      useEffect(() => {
        if (graph === void 0) return;
        if (initialisedFor.current === graph.canvas.id) return;
        initialisedFor.current = graph.canvas.id;
        if (nodes.length === 0) {
          fitAll();
          return;
        }
        setCamera({
          x: graph.canvas.cameraX,
          y: graph.canvas.cameraY,
          zoom: clamp(graph.canvas.zoom || 1, MIN_ZOOM, MAX_ZOOM)
        });
      }, [graph]);
      useEffect(() => {
        if (graph === void 0) return void 0;
        if (cameraTimer.current !== void 0) clearTimeout(cameraTimer.current);
        cameraTimer.current = setTimeout(() => onCamera?.(camera), 350);
        return () => {
          if (cameraTimer.current !== void 0) clearTimeout(cameraTimer.current);
        };
      }, [camera, graph]);
      const cameraRef = useRef(camera);
      const cameraSink = useRef(onCamera);
      useEffect(() => {
        cameraRef.current = camera;
      }, [camera]);
      useEffect(() => {
        cameraSink.current = onCamera;
      }, [onCamera]);
      const canvasKey = graph?.canvas?.id;
      useEffect(() => {
        if (canvasKey === void 0) return void 0;
        return () => {
          cameraSink.current?.(cameraRef.current);
        };
      }, [canvasKey]);
      useEffect(() => {
        const down = (event) => {
          if (event.code === "Space" && !event.repeat) {
            const target = event.target;
            const tag = target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
            setSpace(true);
          }
        };
        const up = (event) => {
          if (event.code === "Space") setSpace(false);
        };
        const blur = () => setSpace(false);
        window.addEventListener("keydown", down);
        window.addEventListener("keyup", up);
        window.addEventListener("blur", blur);
        return () => {
          window.removeEventListener("keydown", down);
          window.removeEventListener("keyup", up);
          window.removeEventListener("blur", blur);
        };
      }, []);
      useEffect(() => {
        if (focusRequest === void 0 || graph === void 0) return;
        const host = hostRef.current;
        const node = nodes.find((candidate) => candidate.id === focusRequest.nodeId);
        if (host === null || node === void 0) return;
        setCamera({
          zoom: 1,
          x: node.x + node.width / 2 - host.clientWidth / 2,
          y: node.y + node.height / 2 - host.clientHeight / 2
        });
      }, [focusRequest, graph]);
      const toWorld = useCallback((clientX, clientY) => {
        const host = hostRef.current;
        const rect = host === null ? { left: 0, top: 0 } : host.getBoundingClientRect();
        return {
          x: (clientX - rect.left) / camera.zoom + camera.x,
          y: (clientY - rect.top) / camera.zoom + camera.y
        };
      }, [camera]);
      useEffect(() => {
        const host = hostRef.current;
        if (host === null) return void 0;
        const onWheel = (event) => {
          event.preventDefault();
          const rect = host.getBoundingClientRect();
          if (event.shiftKey) {
            setCamera((current) => ({ ...current, x: current.x - (event.deltaY > 0 ? 60 : -60) / current.zoom }));
            return;
          }
          if (!event.ctrlKey && selection.length === 1 && editingId === void 0) {
            const node = nodes.find((candidate) => candidate.id === selection[0]);
            if (node !== void 0) {
              onWheelResize(node, event.deltaY > 0 ? 1.08 : 1 / 1.08);
              return;
            }
          }
          const world = {
            x: (event.clientX - rect.left) / camera.zoom + camera.x,
            y: (event.clientY - rect.top) / camera.zoom + camera.y
          };
          const zoom2 = clamp(camera.zoom * (event.deltaY > 0 ? 1 / 1.1 : 1.1), MIN_ZOOM, MAX_ZOOM);
          setCamera({
            zoom: zoom2,
            x: world.x - (event.clientX - rect.left) / zoom2,
            y: world.y - (event.clientY - rect.top) / zoom2
          });
        };
        host.addEventListener("wheel", onWheel, { passive: false });
        return () => host.removeEventListener("wheel", onWheel);
      }, [camera, selection, editingId, nodes, onWheelResize]);
      useLayoutEffect(() => {
        if (zoom < TEXT_MIN_ZOOM) return;
        for (const node of nodes) {
          if (editing !== void 0 && editing.node?.id === node.id) continue;
          const layer = textRefs.current.get(node.id);
          if (layer === void 0) continue;
          const extra = layer.scrollHeight - layer.clientHeight;
          if (extra <= 2) continue;
          onAutoFit?.(node.id, Math.ceil(node.height + extra / zoom));
        }
      });
      const capture = (event) => {
        try {
          hostRef.current?.setPointerCapture(event.pointerId);
        } catch {
        }
      };
      const beginPan = (event) => {
        gesture.current = { kind: "pan", origin: { x: event.clientX, y: event.clientY, camera } };
        capture(event);
      };
      const onPointerDown = (event) => {
        if (editing !== void 0) {
          const target = event.target;
          if (target instanceof Element && target.closest("[data-note-editor]") !== null) return;
          onCommitEdit();
          return;
        }
        const world = toWorld(event.clientX, event.clientY);
        const middleOrSpace = event.button === 1 || space || event.altKey;
        if (middleOrSpace) {
          beginPan(event);
          return;
        }
        if (event.button !== 0) return;
        if (pendingLink !== void 0) {
          const target = hitNode(world);
          if (target !== void 0 && target.id !== pendingLink.sourceId) {
            onCompleteLink(target, world);
          } else {
            onCancelLink();
          }
          return;
        }
        const endpoint = hitConnectionEndpoint(world);
        if (endpoint !== void 0) {
          const insideNode = hitNode(world) !== void 0;
          const nearTerminal = Math.hypot(
            world.x - endpoint.terminal.x,
            world.y - endpoint.terminal.y
          ) * camera.zoom <= 16;
          if (!insideNode || nearTerminal) {
            beginReconnect(endpoint.connection, endpoint.isSourceEnd, world, event);
            return;
          }
        }
        if (selection.length === 1) {
          const node2 = nodes.find((candidate) => candidate.id === selection[0]);
          if (node2 !== void 0) {
            const handle = hitResizeHandle(node2, world, camera.zoom);
            if (handle !== void 0) {
              event.stopPropagation();
              gesture.current = {
                kind: "resize",
                nodeId: node2.id,
                handle,
                origin: { x: event.clientX, y: event.clientY, node: node2 }
              };
              capture(event);
              return;
            }
            const anchor = hitAnchor(node2, world, camera.zoom);
            if (anchor !== void 0) {
              event.stopPropagation();
              onBeginLink(node2, anchor);
              return;
            }
          }
        }
        const node = hitNode(world);
        if (node !== void 0) {
          const additive = event.metaKey || event.ctrlKey;
          let next;
          if (additive) {
            next = selected.has(node.id) ? selection.filter((id) => id !== node.id) : [...selection, node.id];
          } else if (!selected.has(node.id)) {
            next = [node.id];
          } else {
            next = selection;
          }
          onSelectNodes(next);
          onSelectConnection(void 0);
          onSelectGroup(void 0);
          const origins = nodes.filter((candidate) => next.includes(candidate.id)).map((candidate) => ({ id: candidate.id, x: candidate.x, y: candidate.y, width: candidate.width, height: candidate.height }));
          gesture.current = {
            kind: "move",
            origins,
            origin: { x: event.clientX, y: event.clientY },
            moved: false
          };
          capture(event);
          return;
        }
        const groupTitle = hitGroupTitle(world);
        if (groupTitle !== void 0) {
          onSelectGroup(groupTitle.id);
          onSelectNodes([]);
          const members = groupTitle.memberIds.map((id) => nodes.find((candidate) => candidate.id === id)).filter((member) => member !== void 0).map((member) => ({ id: member.id, x: member.x, y: member.y }));
          gesture.current = {
            kind: "group",
            groupId: groupTitle.id,
            members,
            origin: { x: event.clientX, y: event.clientY, groupX: groupTitle.x, groupY: groupTitle.y }
          };
          capture(event);
          return;
        }
        if (hitConnectionEndpoint(world) !== void 0) {
          const endpoint2 = hitConnectionEndpoint(world);
          const { connection, isSourceEnd } = endpoint2;
          onSelectConnection(connection.id);
          onSelectNodes([]);
          onSelectGroup(void 0);
          gesture.current = {
            kind: "reconnect",
            connectionId: connection.id,
            isSourceEnd,
            fixedNodeId: isSourceEnd ? connection.targetNodeId : connection.sourceNodeId,
            floating: world,
            hoverNode: void 0,
            anchor: void 0
          };
          setReconnect({
            connectionId: connection.id,
            isSourceEnd,
            floating: world,
            hoverNode: void 0,
            anchor: void 0
          });
          capture(event);
          return;
        }
        if (hitConnection(world) !== void 0) {
          const connection = hitConnection(world);
          onSelectConnection(connection.id);
          onSelectNodes([]);
          onSelectGroup(void 0);
          return;
        }
        onSelectNodes([]);
        onSelectConnection(void 0);
        onSelectGroup(void 0);
        if (event.shiftKey) {
          const host = hostRef.current;
          const rect = host === null ? { left: 0, top: 0 } : host.getBoundingClientRect();
          gesture.current = {
            kind: "marquee",
            start: world,
            origin: { x: event.clientX - rect.left, y: event.clientY - rect.top }
          };
          setMarquee({ x: event.clientX - rect.left, y: event.clientY - rect.top, width: 0, height: 0 });
          capture(event);
          return;
        }
        beginPan(event);
      };
      function hitConnection(world) {
        const tolerance = 10 / Math.max(1e-3, camera.zoom);
        for (let index = connections.length - 1; index >= 0; index -= 1) {
          const curve = connectionPath(connections[index], nodes);
          if (curve === void 0) continue;
          if (distanceToCurve(curve, world) <= tolerance) return connections[index];
        }
        return void 0;
      }
      function distanceToCurve(curve, point) {
        return closestOnCurve(curve, point).distance;
      }
      function hitConnectionEndpoint(world, toleranceDip = 18) {
        const tolerance = toleranceDip / Math.max(1e-3, camera.zoom);
        for (let index = connections.length - 1; index >= 0; index -= 1) {
          const connection = connections[index];
          const curve = connectionPath(connection, nodes);
          if (curve === void 0) continue;
          const closest = closestOnCurve(curve, world);
          if (closest.distance > tolerance) continue;
          if (closest.t > 0.25 && closest.t < 0.75) continue;
          const isSourceEnd = closest.t <= 0.25;
          const nodeId = isSourceEnd ? connection.sourceNodeId : connection.targetNodeId;
          const node = nodes.find((candidate) => candidate.id === nodeId);
          const anchor = isSourceEnd ? connection.sourceAnchor : connection.targetAnchor;
          return {
            connection,
            isSourceEnd,
            node,
            terminal: node === void 0 ? isSourceEnd ? curve.from : curve.to : anchorFor(anchor, node)
          };
        }
        return void 0;
      }
      const onPointerMove = (event) => {
        const world = toWorld(event.clientX, event.clientY);
        setPointer(world);
        const active = gesture.current;
        if (active === void 0) {
          const node = hitNode(world);
          setHover(node?.id);
          const endpoint = pendingLink === void 0 && editing === void 0 ? hitConnectionEndpoint(world) : void 0;
          setEndpointHover(endpoint === void 0 ? void 0 : `${endpoint.connection.id}:${endpoint.isSourceEnd ? "source" : "target"}`);
          return;
        }
        if (active.kind === "pan") {
          const zoom2 = active.origin.camera.zoom;
          setCamera({
            zoom: zoom2,
            x: active.origin.camera.x - (event.clientX - active.origin.x) / zoom2,
            y: active.origin.camera.y - (event.clientY - active.origin.y) / zoom2
          });
          return;
        }
        if (active.kind === "marquee") {
          const host = hostRef.current;
          const rect = host === null ? { left: 0, top: 0 } : host.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          setMarquee({
            x: Math.min(active.origin.x, x),
            y: Math.min(active.origin.y, y),
            width: Math.abs(x - active.origin.x),
            height: Math.abs(y - active.origin.y)
          });
          return;
        }
        if (active.kind === "move") {
          active.moved = true;
          if (active.captured !== true) {
            active.captured = true;
            try {
              hostRef.current?.setPointerCapture(active.pointerId);
            } catch {
            }
          }
          const dx = Math.round((event.clientX - active.origin.x) / camera.zoom);
          const dy = Math.round((event.clientY - active.origin.y) / camera.zoom);
          onMoveNodes(active.origins.map((entry) => ({ id: entry.id, x: entry.x + dx, y: entry.y + dy })), false);
          return;
        }
        if (active.kind === "group") {
          const dx = Math.round((event.clientX - active.origin.x) / camera.zoom);
          const dy = Math.round((event.clientY - active.origin.y) / camera.zoom);
          onMoveGroup(active.groupId, {
            x: active.origin.groupX + dx,
            y: active.origin.groupY + dy
          }, active.members.map((member) => ({ id: member.id, x: member.x + dx, y: member.y + dy })), false);
          return;
        }
        if (active.kind === "reconnect") {
          active.moved = true;
          const hovered = hitNode(world);
          const valid = hovered !== void 0 && hovered.id !== active.fixedNodeId;
          const anchor = valid ? nearestAnchor(hovered, world) : void 0;
          active.floating = world;
          active.hoverNode = valid ? hovered : void 0;
          active.anchor = anchor;
          setReconnect({
            connectionId: active.connectionId,
            isSourceEnd: active.isSourceEnd,
            floating: world,
            hoverNode: active.hoverNode,
            anchor
          });
          return;
        }
        if (active.kind === "resize") {
          const node = active.origin.node;
          const dx = (event.clientX - active.origin.x) / camera.zoom;
          const dy = (event.clientY - active.origin.y) / camera.zoom;
          const handle = active.handle;
          if (handle.length === 2) {
            const factorX = (node.width + (handle.includes("e") ? dx : -dx)) / node.width;
            const factorY = (node.height + (handle.includes("s") ? dy : -dy)) / node.height;
            let factor = (factorX + factorY) / 2;
            factor = Math.max(factor, MIN_WIDTH / node.width, MIN_HEIGHT / node.height);
            factor = Math.min(factor, MAX_WIDTH / node.width, MAX_HEIGHT / node.height);
            const uniformWidth = Math.round(node.width * factor);
            const uniformHeight = Math.round(node.height * factor);
            const uniformX = handle.includes("w") ? node.x + node.width - uniformWidth : node.x;
            const uniformY = handle.includes("n") ? node.y + node.height - uniformHeight : node.y;
            onResizeNode(active.nodeId, {
              x: Math.round(uniformX),
              y: Math.round(uniformY),
              width: uniformWidth,
              height: uniformHeight
            }, false);
            return;
          }
          let x = node.x;
          let y = node.y;
          let width = node.width;
          let height = node.height;
          if (handle.includes("e")) width = node.width + dx;
          if (handle.includes("s")) height = node.height + dy;
          if (handle.includes("w")) {
            width = node.width - dx;
            x = node.x + dx;
          }
          if (handle.includes("n")) {
            height = node.height - dy;
            y = node.y + dy;
          }
          width = clamp(Math.round(width), MIN_WIDTH, MAX_WIDTH);
          height = clamp(Math.round(height), MIN_HEIGHT, MAX_HEIGHT);
          onResizeNode(active.nodeId, { x: Math.round(x), y: Math.round(y), width, height }, false);
        }
      };
      const finish = (event) => {
        const active = gesture.current;
        gesture.current = void 0;
        if (active === void 0) return;
        try {
          hostRef.current?.releasePointerCapture(event.pointerId);
        } catch {
        }
        const world = toWorld(event.clientX, event.clientY);
        if (active.kind === "marquee") {
          const hit = nodes.filter((node) => !collapsedMembers.has(node.id) && node.x < world.x && node.x + node.width > active.start.x && node.y < world.y && node.y + node.height > active.start.y && active.start.x < node.x + node.width && world.x > node.x && active.start.y < node.y + node.height && world.y > node.y).map((node) => node.id);
          onSelectNodes([...new Set(hit)]);
          setMarquee(void 0);
          return;
        }
        if (active.kind === "move" && active.moved) {
          const moved = nodes.filter((node) => active.origins.some((origin) => origin.id === node.id)).map((node) => ({ id: node.id, x: node.x, y: node.y }));
          onMoveNodes(moved, true, active.origins.map((origin) => ({ id: origin.id, x: origin.x, y: origin.y })));
        }
        if (active.kind === "group") {
          const group = groups.find((candidate) => candidate.id === active.groupId);
          if (group !== void 0) {
            onMoveGroup(group.id, { x: group.x, y: group.y }, [], true);
          }
        }
        if (active.kind === "resize") {
          const node = nodes.find((candidate) => candidate.id === active.nodeId);
          if (node !== void 0) {
            onResizeNode(node.id, { x: node.x, y: node.y, width: node.width, height: node.height }, true, {
              x: active.origin.node.x,
              y: active.origin.node.y,
              width: active.origin.node.width,
              height: active.origin.node.height
            });
          }
        }
        if (active.kind === "reconnect") {
          setReconnect(void 0);
          if (active.moved !== true) return;
          const hovered = hitNode(world);
          const valid = hovered !== void 0 && hovered.id !== active.fixedNodeId;
          if (valid) {
            onReconnect?.({
              connectionId: active.connectionId,
              isSourceEnd: active.isSourceEnd,
              nodeId: hovered.id,
              anchor: nearestAnchor(hovered, world)
            });
          } else {
            onReconnect?.(void 0);
          }
          setReconnect(void 0);
        }
      };
      useEffect(() => {
        const onKey = (event) => {
          if (event.key !== "Escape") return;
          if (gesture.current?.kind === "reconnect") {
            gesture.current = void 0;
            setReconnect(void 0);
            onReconnect?.(void 0);
          }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [onReconnect]);
      const onCanvasDoubleClick = (event) => {
        if (editing !== void 0) return;
        if (event.target !== event.currentTarget && event.target.dataset?.role !== "canvas-bg") return;
        const world = toWorld(event.clientX, event.clientY);
        if (hitNode(world) !== void 0) return;
        const connection = hitConnection(world);
        if (connection !== void 0) {
          onSelectConnection(connection.id);
          onOpenConnection(connection);
          return;
        }
        const group = hitGroupBody(world);
        if (group !== void 0) {
          onToggleGroup(group);
          return;
        }
        onCreateNote({ x: world.x, y: world.y });
      };
      const openContextMenu = (event) => {
        event.preventDefault();
        if (pendingLink !== void 0) {
          onCancelLink();
          return;
        }
        const world = toWorld(event.clientX, event.clientY);
        const node = hitNode(world);
        if (node !== void 0 && !selected.has(node.id)) onSelectNodes([node.id]);
        const connection = node === void 0 ? hitConnection(world) : void 0;
        const target = node !== void 0 ? { kind: "node", id: node.id } : connection !== void 0 ? { kind: "connection", id: connection.id } : { kind: "blank" };
        onContextMenu?.({
          x: event.clientX,
          y: event.clientY,
          world,
          target
        });
      };
      const zoom = camera.zoom;
      const worldOffset = { x: -camera.x * zoom, y: -camera.y * zoom };
      const groupRectangles = groups.map((group) => {
        const height = group.collapsed ? 36 : group.height;
        const isSelected = selectedGroup === group.id;
        const label = group.collapsed ? `${group.title}${t2("collapsedSuffix")}` : group.title;
        return h(
          "g",
          { key: `g-${group.id}` },
          h("rect", {
            x: group.x,
            y: group.y,
            width: group.width,
            height,
            rx: 16,
            fill: isSelected ? `color-mix(in srgb, ${PALETTE.selected} 10%, transparent)` : "color-mix(in srgb, var(--dsw-alias-label-tertiary) 5%, transparent)",
            stroke: isSelected ? PALETTE.selected : "var(--dsw-alias-border-l3)",
            strokeWidth: isSelected ? 1.6 : 1,
            strokeDasharray: isSelected ? void 0 : "6 5"
          }),
          zoom < TEXT_MIN_ZOOM ? null : h("text", {
            x: group.x + 14,
            y: group.y + 20,
            fontSize: 12.5,
            fill: "var(--dsw-alias-label-secondary)",
            style: { letterSpacing: 0.2 }
          }, `${group.collapsed ? "\u25B8" : "\u25BE"} ${label}`)
        );
      });
      const groupRects = h("g", null, groupRectangles);
      const connectionLayer = connections.map((connection) => {
        const reconnecting = reconnect !== void 0 && reconnect.connectionId === connection.id;
        const curve = reconnecting ? reconnectCurve(connection, reconnect, nodes) : connectionPath(connection, nodes);
        if (curve === void 0) return null;
        const isSelected = selectedConnection === connection.id || reconnecting;
        const width = (PALETTE.relationWidth[connection.relationType] ?? 1.25) + (isSelected ? 0.9 : 0);
        const dash = reconnecting ? "5 4" : PALETTE.relationDash[connection.relationType];
        const label = connectionLabel(connection);
        const showLabel = !reconnecting && (isSelected || zoom >= 0.85) && zoom >= 0.4;
        const labelWidth = Math.max(28, label.length * 11 * zoom * 0.62);
        return h(
          "g",
          { key: `c-${connection.id}` },
          h("path", {
            d: pathOf(curve),
            fill: "none",
            stroke: connectionColour(connection),
            strokeWidth: width,
            strokeDasharray: dash,
            strokeLinecap: "round",
            opacity: isSelected ? 1 : 0.92,
            style: reconnecting ? { pointerEvents: "none" } : { pointerEvents: "stroke", cursor: "pointer" },
            onPointerDown: (event) => {
              event.stopPropagation();
              if (event.button !== 0) return;
              const world = toWorld(event.clientX, event.clientY);
              const closest = closestOnCurve(curve, world);
              if (closest.t <= 0.25 || closest.t >= 0.75) {
                beginReconnect(connection, closest.t <= 0.25, world, event);
              }
            },
            onPointerMove: (event) => {
              const world = toWorld(event.clientX, event.clientY);
              const closest = closestOnCurve(curve, world);
              const quarter = closest.t <= 0.25 || closest.t >= 0.75;
              event.currentTarget.style.cursor = quarter ? "crosshair" : "pointer";
              if (quarter) {
                setEndpointHover(`${connection.id}:${closest.t <= 0.25 ? "source" : "target"}`);
              } else {
                setEndpointHover((current) => current?.startsWith(`${connection.id}:`) ? void 0 : current);
              }
            },
            onPointerLeave: () => {
              setEndpointHover((current) => current?.startsWith(`${connection.id}:`) ? void 0 : current);
            },
            onClick: (event) => {
              event.stopPropagation();
              onSelectConnection(connection.id);
              onSelectNodes([]);
              onSelectGroup(void 0);
            },
            onDoubleClick: (event) => {
              event.stopPropagation();
              onSelectConnection(connection.id);
              onOpenConnection(connection);
            }
          }),
          h("path", {
            d: `M ${curve.to.x - 9} ${curve.to.y - 3} L ${curve.to.x} ${curve.to.y} L ${curve.to.x - 9} ${curve.to.y + 3}`,
            fill: "none",
            stroke: connectionColour(connection),
            strokeWidth: width,
            strokeLinecap: "round",
            style: { pointerEvents: "none" }
          }),
          isSelected || endpointHover?.startsWith(`${connection.id}:`) ? h(
            "g",
            { style: { pointerEvents: "none" } },
            h("circle", {
              cx: curve.from.x,
              cy: curve.from.y,
              r: 5,
              fill: "var(--dsw-alias-bg-base)",
              stroke: connectionColour(connection),
              strokeWidth: 1.6
            }),
            h("circle", {
              cx: curve.to.x,
              cy: curve.to.y,
              r: 5,
              fill: "var(--dsw-alias-bg-base)",
              stroke: connectionColour(connection),
              strokeWidth: 1.6
            })
          ) : null,
          showLabel ? h(
            "g",
            { style: { pointerEvents: "none" } },
            h("rect", {
              x: curve.mid.x - labelWidth / 2,
              y: curve.mid.y - 17 * zoom,
              width: labelWidth,
              height: 17 * zoom,
              rx: 999,
              fill: "var(--dsw-alias-bg-layer-2)",
              stroke: "var(--dsw-alias-border-l2)",
              strokeWidth: 0.75,
              opacity: 0.96
            }),
            h("text", {
              x: curve.mid.x,
              y: curve.mid.y - 4 * zoom,
              textAnchor: "middle",
              fontSize: Math.max(9, 10.5 * zoom),
              fill: isSelected ? PALETTE.selected : "var(--dsw-alias-label-secondary)",
              style: { letterSpacing: 0.2 }
            }, label)
          ) : null
        );
      });
      const linkPreview = pendingLink === void 0 || pointer === void 0 ? null : (() => {
        const source = nodes.find((node) => node.id === pendingLink.sourceId);
        if (source === void 0) return null;
        const from = anchorFor(pendingLink.anchor, source);
        return h("path", {
          d: `M ${from.x} ${from.y} L ${pointer.x} ${pointer.y}`,
          fill: "none",
          stroke: pendingLink.strokeKey === "#000000" ? defaultInk() : PALETTE.stripes[mode()][pendingLink.strokeKey] ?? PALETTE.relationColour[pendingLink.relationType] ?? PALETTE.selected,
          strokeWidth: PALETTE.relationWidth[pendingLink.relationType] ?? 1.6,
          strokeDasharray: PALETTE.relationDash[pendingLink.relationType],
          opacity: 0.85,
          style: { pointerEvents: "none" }
        });
      })();
      const nodeCards = nodes.map((node) => {
        const isSelected = selected.has(node.id);
        const isEditing = editingId === node.id;
        const isHover = hover === node.id;
        const showText = zoom >= TEXT_MIN_ZOOM;
        const accent = node.accentKey;
        const isHighlight = highlightId === node.id;
        const accentStripe = accent === null || accent === void 0 ? "var(--dsw-alias-border-l3)" : ACCENT_COLOURS[accent] ?? "var(--dsw-alias-border-l3)";
        const hasAccent = accent !== null && accent !== void 0;
        const card = {
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          borderRadius: 10,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--dsw-alias-card-fill)",
          border: `${isHighlight ? 2 : 1}px solid ${isHighlight ? "#C47B2C" : isSelected || isEditing ? "var(--dsw-alias-border-selected)" : "var(--dsw-alias-border-l2)"}`,
          boxShadow: isSelected || isEditing || isHighlight ? "0 4px 16px var(--dsw-alias-bg-mask-2)" : "0 1px 4px var(--dsw-alias-bg-mask-2)",
          overflow: "hidden",
          cursor: "grab",
          userSelect: "none"
        };
        const bodyText = displayContent(node);
        const customTitle = customTitleOf(node);
        const scale = Math.min(1, zoom);
        const showTitleBand = showText && customTitle !== "" && node.height * zoom > 40;
        const headerBand = showTitleBand || hasAccent ? h("div", {
          style: {
            flex: "0 0 auto",
            display: "flex",
            alignItems: "center",
            height: showTitleBand ? Math.max(26, 30 * scale) : Math.max(5, 7 * scale),
            padding: showTitleBand ? `0 ${12 * scale}px` : 0,
            background: hasAccent ? accentStripe : "var(--dsw-alias-bg-layer-2)",
            color: hasAccent ? "#ffffff" : "var(--dsw-alias-label-primary)"
          }
        }, showTitleBand ? h("div", {
          style: {
            minWidth: 0,
            width: "100%",
            fontSize: 12 * Math.max(0.8, zoom),
            fontWeight: 600,
            lineHeight: 1.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }
        }, customTitle) : null) : null;
        const bodyFont = 11 * Math.max(0.75, zoom);
        const bodyPadding = `${(showTitleBand ? 8 : 10) * scale}px ${12 * scale}px ${10 * scale}px`;
        const textLayer = showText ? h("div", {
          style: {
            position: "relative",
            overflow: "hidden",
            flex: "1 1 auto",
            minHeight: 0,
            padding: bodyPadding,
            fontSize: bodyFont,
            lineHeight: 1.45,
            color: "var(--dsw-alias-label-secondary)"
          },
          ref: (element) => {
            if (element === null) textRefs.current.delete(node.id);
            else textRefs.current.set(node.id, element);
          }
        }, bodyText === "" ? h("span", { style: { color: "var(--dsw-alias-label-tertiary)", fontStyle: "italic", opacity: 0.8 } }, t2("notePlaceholder")) : renderRichText(
          noteBlocks(node, bodyText),
          `n-${node.id}`,
          (index) => onToggleTask?.(node.id, index)
        )) : null;
        const wrapperStyle = {
          position: "absolute",
          left: node.x * zoom + worldOffset.x,
          top: node.y * zoom + worldOffset.y,
          width: node.width * zoom,
          height: node.height * zoom,
          zIndex: isSelected || isEditing ? 6 : 1
        };
        const handles = isSelected && selection.length === 1 && !isEditing ? RESIZE_HANDLES.map((handle) => h("div", {
          key: handle,
          role: "resize-handle",
          "data-handle": handle,
          onPointerDown: (event) => {
            if (event.button !== 0) return;
            event.stopPropagation();
            gesture.current = {
              kind: "resize",
              nodeId: node.id,
              handle,
              origin: { x: event.clientX, y: event.clientY, node }
            };
            capture(event);
          },
          style: {
            position: "absolute",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "var(--dsw-alias-bg-base)",
            border: `1.5px solid ${PALETTE.selected}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.18)",
            zIndex: 4,
            cursor: RESIZE_CURSOR[handle],
            ...HANDLE_POSITION[handle]
          }
        })) : null;
        let anchors = null;
        if (reconnect !== void 0) {
          if (reconnect.hoverNode !== void 0 && reconnect.hoverNode.id === node.id) {
            anchors = ANCHORS.map((anchor) => anchorDot(anchor, "MainThick1"));
          }
        } else if (pendingLink !== void 0) {
          if (hover === node.id && pendingLink.sourceId !== node.id) {
            anchors = ANCHORS.map((anchor) => anchorDot(
              anchor,
              pendingLink.relationType,
              node,
              () => onCompleteLink(node, anchorFor(anchor, node))
            ));
          }
        } else if (!isEditing && (hover === node.id || isSelected && selection.length === 1)) {
          anchors = ANCHORS.map((anchor) => anchorDot(anchor, "MainThick1", node, (picked) => onBeginLink(node, picked)));
        }
        function anchorDot(anchor, relation, targetNode, onClick) {
          return h("div", {
            key: `a-${anchor}`,
            role: "note-anchor",
            onPointerDown: (event) => {
              if (event.button !== 0) return;
              event.stopPropagation();
              if (onClick !== void 0) onClick(anchor);
            },
            style: {
              position: "absolute",
              width: 11,
              height: 11,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${PALETTE.selected} 0 2.6px, transparent 3.2px), var(--dsw-alias-bg-base)`,
              border: `1.5px solid ${PALETTE.selected}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.22)",
              zIndex: 5,
              cursor: "crosshair",
              ...ANCHOR_PLACEMENT[anchor]
            }
          });
        }
        return h(
          "div",
          {
            key: node.id,
            style: wrapperStyle,
            onPointerDown: (event) => {
              if (event.button !== 0 || editing !== void 0) return;
              event.stopPropagation();
              if (pendingLink !== void 0) {
                if (pendingLink.sourceId === node.id) onCancelLink();
                else onCompleteLink(node, toWorld(event.clientX, event.clientY));
                return;
              }
              const additive = event.metaKey || event.ctrlKey;
              let next;
              if (additive) {
                next = selected.has(node.id) ? selection.filter((id) => id !== node.id) : [...selection, node.id];
              } else if (!selected.has(node.id)) {
                next = [node.id];
              } else {
                next = selection;
              }
              onSelectNodes(next);
              onSelectConnection(void 0);
              onSelectGroup(void 0);
              gesture.current = {
                kind: "move",
                pointerId: event.pointerId,
                origins: nodes.filter((candidate) => next.includes(candidate.id)).map((candidate) => ({ id: candidate.id, x: candidate.x, y: candidate.y, width: candidate.width, height: candidate.height })),
                origin: { x: event.clientX, y: event.clientY },
                moved: false
              };
            },
            onDoubleClick: (event) => {
              event.stopPropagation();
              onBeginEdit(node);
            },
            onPointerEnter: () => setHover(node.id),
            onPointerLeave: () => setHover((current) => current === node.id ? void 0 : current)
          },
          h("div", { style: card }, headerBand, textLayer),
          handles,
          anchors
        );
      });
      const editorScale = Math.min(1, zoom);
      const hostBox = hostRef.current;
      const hostWidth = hostBox?.clientWidth ?? 800;
      const hostHeight = hostBox?.clientHeight ?? 600;
      const editorWidth = editing === void 0 ? 0 : Math.min(Math.max(editing.node.width * zoom, 420), Math.max(320, hostWidth - 24));
      const editorHeight = editing === void 0 ? 0 : Math.min(Math.max(editing.node.height * zoom, 460), Math.max(320, hostHeight - 24));
      const accentColour = editing?.accentKey ? ACCENT_COLOURS[editing.accentKey] : void 0;
      const headerBackground = accentColour ?? "var(--dsw-alias-bg-layer-2)";
      const headerInk = accentColour === void 0 ? "var(--dsw-alias-label-primary)" : "#ffffff";
      const headerInkMuted = accentColour === void 0 ? "var(--dsw-alias-label-tertiary)" : "rgba(255,255,255,0.8)";
      const headerButtonStyle = {
        width: 30,
        height: 30,
        flex: "0 0 auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        borderRadius: 6,
        border: "none",
        background: "transparent",
        color: headerInk,
        cursor: "pointer",
        fontSize: 18,
        lineHeight: 1,
        fontFamily: "inherit"
      };
      const applyInline = (prefix, suffix) => {
        if (editing === void 0) return;
        const value = editing.body;
        const area = bodyRef.current;
        if (area === null) {
          onEditValue("body", `${value}${prefix}${suffix}`);
          return;
        }
        const start = area.selectionStart ?? value.length;
        const end = area.selectionEnd ?? value.length;
        const selected2 = value.slice(start, end);
        const next = `${value.slice(0, start)}${prefix}${selected2}${suffix}${value.slice(end)}`;
        onEditValue("body", next);
        requestAnimationFrame(() => {
          const target = bodyRef.current;
          if (target === null) return;
          target.focus();
          const caret = start + prefix.length;
          target.setSelectionRange(caret, caret + selected2.length);
        });
      };
      const applyList = (kind) => {
        if (editing === void 0) return;
        const value = editing.body;
        const area = bodyRef.current;
        const start = area === null ? value.length : area.selectionStart ?? value.length;
        const end = area === null ? start : area.selectionEnd ?? start;
        const from = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
        const to = value.indexOf("\n", end) === -1 ? value.length : value.indexOf("\n", end);
        const lines = value.slice(from, to).split("\n");
        const PREFIX = /^([-*+]\s+\[[ xX]\]\s+|[-*+]\s+|\d{1,9}[.)]\s+)/;
        const already = kind !== "none" && lines.every((line) => {
          const rest = line.replace(/^\s*/, "");
          if (kind === "ul") return /^[-*+]\s+/.test(rest) && !/^[-*+]\s+\[/.test(rest);
          if (kind === "task") return /^[-*+]\s+\[[ xX]\]/.test(rest);
          return /^\d{1,9}[.)]\s+/.test(rest);
        });
        let ordinal = 0;
        const next = lines.map((line) => {
          const indent = /^\s*/.exec(line)[0];
          const rest = line.slice(indent.length).replace(PREFIX, "");
          ordinal += 1;
          if (kind === "none" || already) return `${indent}${rest}`;
          if (kind === "ol") return `${indent}${ordinal}. ${rest}`;
          if (kind === "task") return `${indent}- [ ] ${rest}`;
          return `${indent}- ${rest}`;
        }).join("\n");
        onEditValue("body", value.slice(0, from) + next + value.slice(to));
        requestAnimationFrame(() => {
          const target = bodyRef.current;
          if (target === null) return;
          target.focus();
          target.setSelectionRange(from, from + next.length);
        });
      };
      const editorToolbar = editing === void 0 ? null : h(
        "div",
        {
          "data-editor-toolbar": true,
          style: {
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: "0 0 auto",
            padding: "4px 10px",
            borderTop: "1px solid var(--dsw-alias-border-l2)",
            background: "var(--dsw-alias-bg-layer-2)"
          }
        },
        toolButton("B", t2("boldTool"), () => applyInline("**", "**"), { style: { fontWeight: 700 } }),
        toolButton("I", t2("italicTool"), () => applyInline("*", "*"), { style: { fontStyle: "italic" } }),
        toolButton("S", t2("strikeTool"), () => applyInline("~~", "~~"), { style: { textDecoration: "line-through" } }),
        toolButton("</>", t2("codeTool"), () => applyInline("`", "`"), { style: { fontSize: 11 } }),
        h("span", { style: { width: 1, height: 16, margin: "0 6px", background: "var(--dsw-alias-border-l2)" } }),
        toolButton("\u2022", t2("bulletTool"), () => applyList("ul")),
        toolButton("1.", t2("orderedTool"), () => applyList("ol")),
        toolButton("\u2611", t2("taskTool"), () => applyList("task")),
        toolButton("\u27F2", t2("clearFormat"), () => applyList("none"))
      );
      const swatchMenu = editing === void 0 || !editorMenu ? null : h(
        "div",
        {
          "data-editor-menu": true,
          style: {
            position: "absolute",
            top: 44,
            right: 8,
            zIndex: 3,
            padding: 8,
            borderRadius: 10,
            minWidth: 176,
            background: "var(--dsw-alias-bg-layer-2)",
            border: "1px solid var(--dsw-alias-border-l2)",
            boxShadow: "0 10px 26px var(--dsw-alias-bg-mask-2)"
          }
        },
        h("button", {
          type: "button",
          onPointerDown: (event) => {
            event.preventDefault();
            event.stopPropagation();
          },
          onClick: () => {
            setEditorMenu(false);
            onCancelEdit();
            onDeleteNote?.(editing.nodeId);
          },
          style: {
            display: "block",
            width: "100%",
            textAlign: "left",
            padding: "6px 8px",
            border: "none",
            background: "transparent",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            color: "var(--dsw-alias-state-error-primary)",
            fontFamily: "inherit"
          }
        }, t2("deleteNote"))
      );
      const editor = editing === void 0 ? null : h(
        "div",
        {
          "data-note-editor": true,
          onPointerDown: (event) => event.stopPropagation(),
          onDoubleClick: (event) => event.stopPropagation(),
          onBlur: (event) => {
            if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
            onCommitEdit();
          },
          style: {
            position: "absolute",
            zIndex: 20,
            left: Math.max(8, Math.min(
              editing.node.x * zoom + worldOffset.x,
              hostWidth - editorWidth - 8
            )),
            top: Math.max(8, Math.min(
              editing.node.y * zoom + worldOffset.y,
              hostHeight - editorHeight - 8
            )),
            width: editorWidth,
            height: editorHeight,
            display: "flex",
            flexDirection: "column",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--dsw-alias-border-l2)",
            background: "var(--dsw-alias-bg-base)",
            boxShadow: "0 12px 32px var(--dsw-alias-bg-mask-2)",
            fontFamily: "inherit"
          }
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 4,
              flex: "0 0 auto",
              height: 44,
              padding: "0 6px",
              background: headerBackground,
              color: headerInk
            }
          },
          h("button", {
            type: "button",
            title: t2("newNote"),
            "aria-label": t2("newNote"),
            onPointerDown: (event) => {
              event.preventDefault();
              event.stopPropagation();
            },
            onClick: () => {
              onCommitEdit();
              onNewNote?.();
            },
            style: headerButtonStyle
          }, "+"),
          h("input", {
            value: editing.title,
            placeholder: t2("titlePlaceholder"),
            "aria-label": t2("title"),
            onChange: (event) => onEditValue("title", event.target.value),
            onKeyDown: (event) => {
              event.stopPropagation();
              if (event.key === "Escape") {
                event.preventDefault();
                onCancelEdit();
                return;
              }
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                onCommitEdit();
                return;
              }
              const area = bodyRef.current;
              if (area === null) return;
              const value = editing.body;
              const write = (nextValue, caret) => {
                onEditValue("body", nextValue);
                requestAnimationFrame(() => {
                  const target = bodyRef.current;
                  if (target === null) return;
                  target.focus();
                  target.setSelectionRange(caret, caret);
                });
              };
              if (event.key === "Tab") {
                event.preventDefault();
                const from = value.lastIndexOf("\n", area.selectionStart - 1) + 1;
                const to = value.indexOf("\n", area.selectionEnd) === -1 ? value.length : value.indexOf("\n", area.selectionEnd);
                const block = value.slice(from, to);
                const next = block.split("\n").map((line2) => event.shiftKey ? line2.replace(/^ {1,2}/, "") : `  ${line2}`).join("\n");
                write(value.slice(0, from) + next + value.slice(to), from + next.length);
                return;
              }
              if (event.key !== "Enter" || event.shiftKey) return;
              const lineStart = value.lastIndexOf("\n", area.selectionStart - 1) + 1;
              const line = value.slice(lineStart, area.selectionStart);
              const task = /^(\s*)([-*+])\s+\[[ xX]\]\s?(.*)$/.exec(line);
              const ordered = task === null ? /^(\s*)(\d{1,9})([.)])\s+(.*)$/.exec(line) : null;
              const bullet = task === null && ordered === null ? /^(\s*)([-*+])\s+(.*)$/.exec(line) : null;
              const match = task ?? ordered ?? bullet;
              if (match === null) return;
              event.preventDefault();
              const content = task !== null ? task[3] : ordered !== null ? ordered[4] : bullet[3];
              if (String(content).trim() === "") {
                const stripped = match[1];
                write(value.slice(0, lineStart) + stripped + value.slice(area.selectionStart), lineStart + stripped.length);
                return;
              }
              const prefix = task !== null ? `${task[1]}${task[2]} [ ] ` : ordered !== null ? `${ordered[1]}${Number(ordered[2]) + 1}${ordered[3]} ` : `${bullet[1]}${bullet[2]} `;
              write(
                `${value.slice(0, area.selectionStart)}
${prefix}${value.slice(area.selectionEnd)}`,
                area.selectionStart + 1 + prefix.length
              );
            },
            style: {
              flex: 1,
              minWidth: 0,
              border: "none",
              background: "transparent",
              outline: "none",
              padding: 0,
              fontSize: 14,
              fontWeight: 600,
              color: headerInk,
              fontFamily: "inherit"
            }
          }),
          h("button", {
            type: "button",
            title: t2("more"),
            "aria-label": t2("more"),
            "data-editor-more": true,
            onPointerDown: (event) => {
              event.preventDefault();
              event.stopPropagation();
            },
            onClick: () => setEditorMenu((open) => !open),
            style: { ...headerButtonStyle, fontSize: 16 }
          }, "\u22EF"),
          h("button", {
            type: "button",
            title: t2("close"),
            "aria-label": t2("close"),
            onPointerDown: (event) => {
              event.preventDefault();
              event.stopPropagation();
            },
            onClick: () => onCommitEdit(),
            style: { ...headerButtonStyle, fontSize: 20 }
          }, "\xD7")
        ),
        h("div", {
          style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }
        }, h(RichBodyEditor, {
          initialText: editing.body,
          onChange: (text) => onEditValue("body", text),
          onCommitEdit,
          onCancelEdit,
          t: t2
        })),
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: "0 0 auto",
              padding: "8px 12px",
              background: "var(--dsw-alias-bg-layer-2)"
            }
          },
          [null, ...ACCENT_KEYS].map((key) => h("button", {
            key: key ?? "none",
            type: "button",
            title: accentLabel(key),
            "aria-label": accentLabel(key),
            "aria-pressed": (editing.accentKey ?? null) === (key ?? null),
            onPointerDown: (event) => {
              event.preventDefault();
              event.stopPropagation();
            },
            onClick: () => onEditValue("accentKey", key),
            style: {
              width: 22,
              height: 22,
              borderRadius: "50%",
              padding: 0,
              cursor: "pointer",
              background: key === null ? "var(--dsw-alias-card-fill)" : ACCENT_COLOURS[key],
              border: (editing.accentKey ?? null) === (key ?? null) ? "2px solid var(--dsw-alias-label-primary)" : "1px solid var(--dsw-alias-border-l2)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)"
            }
          }))
        ),
        swatchMenu
      );
      const marqueeBox = marquee === void 0 ? null : h("div", {
        style: {
          position: "absolute",
          zIndex: 8,
          pointerEvents: "none",
          left: marquee.x,
          top: marquee.y,
          width: marquee.width,
          height: marquee.height,
          border: `1.2px dashed ${PALETTE.selected}`,
          background: "rgba(130,154,135,0.16)"
        }
      });
      const hint = selection.length === 0 && pendingLink === void 0 && nodes.length > 0 ? null : null;
      const zoomChip = h(
        "div",
        {
          style: {
            position: "absolute",
            right: 12,
            bottom: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            background: "var(--dsw-alias-bg-layer-2)",
            border: "1px solid var(--dsw-alias-border-l2)",
            color: "var(--dsw-alias-label-secondary)"
          }
        },
        h("span", null, `${Math.round(zoom * 100)}%`),
        h("button", {
          type: "button",
          title: t2("fitAll"),
          onClick: fitAll,
          style: { border: "none", background: "transparent", cursor: "pointer", color: "inherit", fontSize: 11, padding: 0 }
        }, t2("fitAll"))
      );
      const guide = nodes.length === 0 ? h("button", {
        type: "button",
        onClick: () => {
          const host = hostRef.current;
          if (host === null) return;
          const world = { x: camera.x + host.clientWidth / (2 * camera.zoom), y: camera.y + host.clientHeight / (2 * camera.zoom) };
          onCreateNote({ x: world.x, y: world.y });
        },
        style: {
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, 72px)",
          padding: "7px 14px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 12,
          border: "1px solid var(--dsw-alias-border-l2)",
          background: "var(--dsw-alias-bg-layer-2)",
          color: "var(--dsw-alias-label-primary)",
          fontFamily: "inherit",
          zIndex: 7
        }
      }, t2("createFirst")) : null;
      const hintBar = h("div", {
        style: {
          position: "absolute",
          left: 12,
          bottom: 12,
          fontSize: 11,
          pointerEvents: "none",
          color: "var(--dsw-alias-label-tertiary)",
          maxWidth: "calc(100% - 200px)"
        }
      }, pendingLink === void 0 ? t2("emptyCanvas") : t2("connectHint"));
      return h(
        "div",
        {
          ref: hostRef,
          "data-role": "canvas-bg",
          onPointerDown,
          onPointerMove,
          onPointerUp: finish,
          onPointerCancel: finish,
          onDoubleClick: onCanvasDoubleClick,
          onContextMenu: openContextMenu,
          style: {
            position: "absolute",
            inset: 0,
            overflow: "hidden",
            cursor: space ? "grab" : endpointHover !== void 0 ? "crosshair" : "default",
            background: "var(--dsw-alias-bg-base)",
            backgroundImage: zoom < 1 / 3 ? "none" : "radial-gradient(var(--dsw-alias-border-l3) 1px, transparent 1px)",
            backgroundSize: `${GRID * zoom}px ${GRID * zoom}px`,
            backgroundPosition: `${worldOffset.x}px ${worldOffset.y}px`,
            touchAction: "none"
          }
        },
        h(
          "svg",
          { style: { position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" } },
          h(
            "g",
            { transform: `translate(${worldOffset.x} ${worldOffset.y}) scale(${zoom})` },
            groupRects,
            connectionLayer,
            linkPreview
          )
        ),
        nodeCards,
        editor,
        marqueeBox,
        guide,
        zoomChip,
        hintBar,
        hint
      );
    }
    function CanvasPage() {
      const [bootstrap, setBootstrap] = useState(void 0);
      const [fatal, setFatal] = useState(void 0);
      const [banner, setBanner] = useState(void 0);
      const [notice, setNotice] = useState(void 0);
      const [pendingCount, setPendingCount] = useState(0);
      const [projectId, setProjectId] = useState(void 0);
      const [canvasId, setCanvasId] = useState(void 0);
      const [graph, setGraph] = useState(void 0);
      const [selection, setSelection] = useState([]);
      const [selectedConnection, setSelectedConnection] = useState(void 0);
      const [selectedGroup, setSelectedGroup] = useState(void 0);
      const [editing, setEditing] = useState(void 0);
      const [pendingLink, setPendingLink] = useState(void 0);
      const [connectionDraft, setConnectionDraft] = useState(void 0);
      const [projectDraft, setProjectDraft] = useState(void 0);
      const [confirm, setConfirm] = useState(void 0);
      const [menu, setMenu] = useState(void 0);
      const [contextMenu, setContextMenu] = useState(void 0);
      const [search, setSearch] = useState({ query: "", open: false, hits: [], loading: false, active: -1 });
      const [recycle, setRecycle] = useState({ open: false, items: [], loading: false });
      const [focusRequest, setFocusRequest] = useState(void 0);
      const [highlightId, setHighlightId] = useState(void 0);
      const [projectFilter, setProjectFilter] = useState("");
      const [historyTick, setHistoryTick] = useState(0);
      const queue = useRef(Promise.resolve());
      const projectRef = useRef(void 0);
      const canvasRef = useRef(void 0);
      const pageRef = useRef(null);
      const bootstrapRef = useRef(void 0);
      const editGuard = useRef(void 0);
      const graphRequest = useRef(0);
      const viewport = useRef(void 0);
      const undoStack = useRef([]);
      const redoStack = useRef([]);
      const clipboard = useRef(void 0);
      const pasteOffset = useRef(0);
      const wheelTimer = useRef(void 0);
      const wheelNode = useRef(void 0);
      const searchTimer = useRef(void 0);
      const noticeTimer = useRef(void 0);
      const highlightTimer = useRef(void 0);
      const searchInput = useRef(null);
      const initialized = useRef(false);
      useEffect(() => {
        projectRef.current = projectId;
      }, [projectId]);
      useEffect(() => {
        canvasRef.current = canvasId;
      }, [canvasId]);
      useEffect(() => () => {
        if (noticeTimer.current !== void 0) clearTimeout(noticeTimer.current);
        if (wheelTimer.current !== void 0) clearTimeout(wheelTimer.current);
        if (highlightTimer.current !== void 0) clearTimeout(highlightTimer.current);
      }, []);
      const flash = useCallback((message) => {
        setNotice(message);
        if (noticeTimer.current !== void 0) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setNotice(void 0), 2600);
      }, []);
      const enqueue = useCallback((task) => {
        setPendingCount((count) => count + 1);
        const started = queue.current.then(task);
        queue.current = started.catch(() => {
        }).then(() => setPendingCount((count) => Math.max(0, count - 1)));
        return started;
      }, []);
      const loadBootstrap = useCallback(async ({ resetSelection = false } = {}) => {
        try {
          const data = await callApi("/bootstrap");
          setBootstrap(data);
          bootstrapRef.current = data;
          setFatal(void 0);
          setBanner(void 0);
          const projects2 = data.projects ?? [];
          const current = projectRef.current;
          if (!initialized.current || resetSelection || !projects2.some((project2) => project2.id === current)) {
            const next = projects2[0];
            initialized.current = true;
            projectRef.current = next?.id;
            setProjectId(next?.id);
            const main = next?.canvases?.find((canvas) => canvas.parentCanvasId === null) ?? next?.canvases?.[0];
            canvasRef.current = main?.id;
            setCanvasId(main?.id);
          }
          return data;
        } catch (cause) {
          if (bootstrapRef.current === void 0) setFatal(cause);
          else setBanner(cause);
          return void 0;
        }
      }, []);
      const loadGraph = useCallback(async (id) => {
        if (id === void 0) {
          setGraph(void 0);
          return;
        }
        const requestId = ++graphRequest.current;
        try {
          const data = await callApi(`/canvas/${encodeURIComponent(id)}`);
          if (requestId !== graphRequest.current) return;
          if (data?.canvas?.id !== id) return;
          setGraph(data);
          setBanner(void 0);
        } catch (cause) {
          if (requestId !== graphRequest.current) return;
          setBanner(cause);
        }
      }, []);
      useEffect(() => {
        if (contextMenu === void 0) return void 0;
        const dismiss = (event) => {
          if (event.target instanceof Element && event.target.closest?.("[data-context-menu]") !== null) return;
          setContextMenu(void 0);
        };
        document.addEventListener("pointerdown", dismiss, true);
        return () => document.removeEventListener("pointerdown", dismiss, true);
      }, [contextMenu]);
      useEffect(() => {
        void loadBootstrap();
      }, [loadBootstrap]);
      useEffect(() => {
        setGraph(void 0);
        setSelection([]);
        setSelectedConnection(void 0);
        setSelectedGroup(void 0);
        setEditing(void 0);
        setPendingLink(void 0);
        undoStack.current = [];
        redoStack.current = [];
        setHistoryTick((value) => value + 1);
        void loadGraph(canvasId);
      }, [canvasId, loadGraph]);
      useEffect(() => {
        const onVisible = () => {
          if (document.visibilityState === "visible") void loadGraph(canvasId);
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
      }, [canvasId, loadGraph]);
      const pushHistory = useCallback((entry) => {
        undoStack.current.push(entry);
        if (undoStack.current.length > 100) undoStack.current.shift();
        redoStack.current = [];
        setHistoryTick((value) => value + 1);
      }, []);
      const refresh = useCallback(async () => {
        await loadGraph(canvasRef.current);
        await loadBootstrap();
      }, [loadBootstrap, loadGraph]);
      const commit = useCallback((task, options = {}) => enqueue(async () => {
        try {
          const result = await task();
          if (options.history !== void 0) pushHistory(options.history(result));
          await refresh();
          if (options.notice !== void 0) flash(options.notice);
          return result;
        } catch (cause) {
          setBanner(cause);
          await refresh();
          return void 0;
        }
      }), [enqueue, flash, pushHistory, refresh]);
      const undo = useCallback(() => {
        const entry = undoStack.current.pop();
        if (entry === void 0) return;
        enqueue(async () => {
          try {
            await entry.undo();
            redoStack.current.push(entry);
            await refresh();
          } catch (cause) {
            setBanner(cause);
          }
          setHistoryTick((value) => value + 1);
        });
      }, [enqueue, refresh]);
      const redo = useCallback(() => {
        const entry = redoStack.current.pop();
        if (entry === void 0) return;
        enqueue(async () => {
          try {
            await entry.redo();
            undoStack.current.push(entry);
            await refresh();
          } catch (cause) {
            setBanner(cause);
          }
          setHistoryTick((value) => value + 1);
        });
      }, [enqueue, refresh]);
      const createNoteAt = useCallback((point) => {
        const width = 220;
        const height = 120;
        const x = point === void 0 ? void 0 : Math.round(point.x - width / 2);
        const y = point === void 0 ? void 0 : Math.round(point.y - height / 2);
        void commit(() => mutate("create-note", {
          canvasId: canvasRef.current,
          content: "",
          width,
          height,
          x,
          y
        }), {
          history: (result) => ({
            undo: () => mutate("delete-note", { nodeId: result.id }),
            redo: () => mutate("restore-note", { nodeId: result.id })
          })
        }).then((result) => {
          if (result === void 0) return;
          setSelection([result.id]);
          editGuard.current = void 0;
          setEditing({
            nodeId: result.id,
            node: { ...result, width, height, content: null, accentKey: null, title: "" },
            title: "",
            body: "",
            accentKey: null
          });
        });
      }, [commit]);
      const createNoteAtCenter = useCallback(() => {
        const center = viewport.current?.center?.();
        createNoteAt(center);
      }, [createNoteAt]);
      const beginEdit = useCallback((node) => {
        setPendingLink(void 0);
        if (isStructuredContent(node)) {
          flash(t("structuredReadOnly"));
          return;
        }
        editGuard.current = void 0;
        setEditing({
          nodeId: node.id,
          node,
          // Legacy rows carry a title derived from the body; treat it as no title.
          title: customTitleOf(node),
          body: node.content ?? "",
          accentKey: node.accentKey ?? null
        });
      }, [flash, t]);
      const commitEdit = useCallback(() => {
        if (editGuard.current !== void 0) {
          editGuard.current = void 0;
          setEditing(void 0);
          return;
        }
        const current = editing;
        if (current === void 0) return;
        editGuard.current = "done";
        setEditing(void 0);
        const title = current.title.trim();
        const body = current.body.trim();
        const accentKey = current.accentKey ?? null;
        const before = current.node;
        const beforeTitle = customTitleOf(before);
        const beforeBody = String(before.content ?? "").trim();
        const beforeAccent = before.accentKey ?? null;
        if (title === "" && body === "") {
          if (beforeTitle === "" && beforeBody === "") {
            return;
          }
          commit(() => mutate("delete-note", { nodeId: before.id }), {
            history: () => ({
              undo: () => mutate("restore-note", { nodeId: before.id }),
              redo: () => mutate("delete-note", { nodeId: before.id })
            })
          });
          return;
        }
        if (title === beforeTitle && body === beforeBody && accentKey === beforeAccent) return;
        commit(() => mutate("update-note", {
          nodeId: before.id,
          title,
          content: body,
          accentKey: accentKey ?? "none"
        }), {
          history: () => ({
            undo: () => mutate("update-note", {
              nodeId: before.id,
              title: beforeTitle,
              content: beforeBody,
              accentKey: beforeAccent ?? "none"
            }),
            redo: () => mutate("update-note", {
              nodeId: before.id,
              title,
              content: body,
              accentKey: accentKey ?? "none"
            })
          })
        });
      }, [commit, editing]);
      const cancelEdit = useCallback(() => {
        editGuard.current = "cancel";
        setEditing(void 0);
      }, []);
      const moveNodes = useCallback((changes, done, previous) => {
        setGraph((current) => current === void 0 ? current : {
          ...current,
          nodes: current.nodes.map((node) => {
            const change = changes.find((entry) => entry.id === node.id);
            return change === void 0 ? node : { ...node, x: change.x, y: change.y };
          })
        });
        if (done !== true) return;
        commit(() => mutate("update-nodes", { positions: changes }), {
          history: previous === void 0 ? void 0 : () => ({
            undo: () => mutate("update-nodes", { positions: previous }),
            redo: () => mutate("update-nodes", { positions: changes })
          })
        });
      }, [commit]);
      const autoFitNode = useCallback((nodeId, height) => {
        const node = graph?.nodes.find((candidate) => candidate.id === nodeId);
        if (node === void 0 || height <= node.height + 1) return;
        setGraph((current) => current === void 0 ? current : {
          ...current,
          nodes: current.nodes.map((entry) => entry.id === nodeId ? { ...entry, height } : entry)
        });
        void mutate("update-note", { nodeId, x: node.x, y: node.y, width: node.width, height }).catch(() => {
        });
      }, [graph, mutate]);
      const toggleTask = useCallback((nodeId, index) => {
        const node = graph?.nodes.find((candidate) => candidate.id === nodeId);
        if (node === void 0) return;
        const lines = String(node.content ?? "").split("\n");
        const line = lines[index];
        if (line === void 0 || !/\[[ xX]\]/.test(line)) return;
        const before = lines.join("\n");
        const after = lines.map((entry, position) => position === index ? entry.replace(/\[([ xX])\]/, (match) => match === "[x]" ? "[ ]" : "[x]") : entry).join("\n");
        if (after === before) return;
        commit(() => mutate("update-note", { nodeId, content: after }), {
          history: () => ({
            undo: () => mutate("update-note", { nodeId, content: before }),
            redo: () => mutate("update-note", { nodeId, content: after })
          })
        });
      }, [graph, commit, mutate]);
      const resizeNode = useCallback((nodeId, box, done, previous) => {
        setGraph((current) => current === void 0 ? current : {
          ...current,
          nodes: current.nodes.map((node) => node.id === nodeId ? { ...node, ...box } : node)
        });
        if (done !== true) return;
        commit(() => mutate("update-note", { nodeId, ...box }), {
          history: previous === void 0 ? void 0 : () => ({
            undo: () => mutate("update-note", { nodeId, ...previous }),
            redo: () => mutate("update-note", { nodeId, ...box })
          })
        });
      }, [commit]);
      const moveGroup = useCallback((groupId, position, members, done) => {
        setGraph((current) => current === void 0 ? current : {
          ...current,
          groups: current.groups.map((group) => group.id === groupId ? { ...group, ...position } : group),
          nodes: current.nodes.map((node) => {
            const change = members.find((entry) => entry.id === node.id);
            return change === void 0 ? node : { ...node, x: change.x, y: change.y };
          })
        });
        if (done !== true) return;
        commit(() => mutate("update-group", { groupId, x: position.x, y: position.y }));
      }, [commit]);
      const toggleGroup = useCallback((group) => {
        commit(() => mutate("update-group", { groupId: group.id, collapsed: !group.collapsed }));
      }, [commit]);
      const createGroup = useCallback(() => {
        if (selection.length === 0) {
          flash(t("menuGroup"));
          return;
        }
        commit(() => mutate("create-group", { canvasId: canvasRef.current, nodeIds: selection }), {
          notice: t("created"),
          history: (result) => ({
            undo: () => mutate("delete-group", { groupId: result.id }),
            redo: () => mutate("restore-group", { groupId: result.id })
          })
        }).then((result) => {
          if (result === void 0) return;
          setSelectedGroup(result.id);
          setSelection(result.memberIds ?? []);
        });
      }, [commit, flash, selection, t]);
      const beginLink = useCallback((node, anchor) => {
        setSelection([node.id]);
        setConnectionDraft(void 0);
        setPendingLink({ sourceId: node.id, anchor, relationType: "MainThick1", strokeKey: "#000000" });
      }, []);
      const completeLink = useCallback((target, world) => {
        const link = pendingLink;
        if (link === void 0) return;
        setPendingLink(void 0);
        const targetAnchor = nearestAnchor(target, world);
        commit(() => mutate("create-connection", {
          canvasId: canvasRef.current,
          sourceNodeId: link.sourceId,
          targetNodeId: target.id,
          sourceAnchor: link.anchor,
          targetAnchor,
          relationType: link.relationType,
          strokeKey: link.strokeKey
        }), {
          notice: t("connected"),
          history: (result) => ({
            undo: () => mutate("delete-connection", { connectionId: result.id }),
            redo: () => mutate("create-connection", {
              canvasId: canvasRef.current,
              sourceNodeId: link.sourceId,
              targetNodeId: target.id,
              sourceAnchor: link.anchor,
              targetAnchor,
              relationType: link.relationType,
              strokeKey: link.strokeKey
            })
          })
        });
      }, [commit, flash, graph, pendingLink, t]);
      const cancelLink = useCallback(() => {
        setPendingLink(void 0);
        flash(t("cancelled"));
      }, [flash, t]);
      const beginConnectionPick = useCallback((connection) => {
        setConnectionDraft({
          mode: "edit",
          connectionId: connection.id,
          relationType: connection.relationType,
          strokeKey: connection.strokeKey ?? "#000000",
          label: connection.label ?? ""
        });
      }, []);
      const applyConnectionDraft = useCallback((draft) => {
        const current = connectionDraft;
        setConnectionDraft(void 0);
        if (current === void 0) return;
        if (current.mode === "create") {
          setPendingLink({
            sourceId: current.sourceId,
            anchor: current.anchor,
            relationType: draft.relationType,
            strokeKey: draft.strokeKey
          });
          return;
        }
        const before = graph?.connections.find((connection) => connection.id === current.connectionId);
        commit(() => mutate("update-connection", {
          connectionId: current.connectionId,
          relationType: draft.relationType,
          strokeKey: draft.strokeKey
        }), {
          history: before === void 0 ? void 0 : () => ({
            undo: () => mutate("update-connection", {
              connectionId: before.id,
              relationType: before.relationType,
              strokeKey: before.strokeKey ?? "#000000"
            }),
            redo: () => mutate("update-connection", {
              connectionId: before.id,
              relationType: draft.relationType,
              strokeKey: draft.strokeKey
            })
          })
        });
      }, [commit, connectionDraft, graph]);
      const deleteSelected = useCallback(() => {
        if (selectedConnection !== void 0) {
          const connection = graph?.connections.find((entry) => entry.id === selectedConnection);
          const connectionId = selectedConnection;
          setSelectedConnection(void 0);
          commit(() => mutate("delete-connection", { connectionId }), {
            history: connection === void 0 ? void 0 : () => ({
              undo: () => mutate("create-connection", {
                canvasId: canvasRef.current,
                sourceNodeId: connection.sourceNodeId,
                targetNodeId: connection.targetNodeId,
                sourceAnchor: connection.sourceAnchor,
                targetAnchor: connection.targetAnchor,
                relationType: connection.relationType,
                label: connection.label ?? void 0,
                strokeKey: connection.strokeKey ?? "#000000"
              }),
              redo: () => mutate("delete-connection", { connectionId })
            })
          });
          return;
        }
        if (selectedGroup !== void 0) {
          setConfirm({ kind: "group", id: selectedGroup });
          return;
        }
        if (selection.length > 0) setConfirm({ kind: "notes", ids: selection });
      }, [commit, graph, selectedConnection, selectedGroup, selection]);
      const confirmDelete = useCallback(() => {
        const target = confirm;
        setConfirm(void 0);
        if (target === void 0) return;
        if (target.kind === "notes") {
          const ids = target.ids;
          setSelection([]);
          commit(() => mutate("delete-nodes", { nodeIds: ids }), {
            history: () => ({
              undo: async () => {
                for (const id of ids) await mutate("restore-note", { nodeId: id });
              },
              redo: () => mutate("delete-nodes", { nodeIds: ids })
            })
          });
          return;
        }
        if (target.kind === "connection") {
          setSelectedConnection(void 0);
          commit(() => mutate("delete-connection", { connectionId: target.id }));
          return;
        }
        if (target.kind === "group") {
          setSelectedGroup(void 0);
          commit(() => mutate("delete-group", { groupId: target.id }), {
            history: () => ({
              undo: () => mutate("restore-group", { groupId: target.id }),
              redo: () => mutate("delete-group", { groupId: target.id })
            })
          });
        }
      }, [commit, confirm]);
      const openProject = useCallback((project2) => {
        projectRef.current = project2.id;
        setProjectId(project2.id);
        const main = project2.canvases.find((canvas) => canvas.parentCanvasId === null) ?? project2.canvases[0];
        canvasRef.current = main?.id;
        setCanvasId(main?.id);
        setSelection([]);
        setSelectedConnection(void 0);
        setSelectedGroup(void 0);
      }, []);
      const openCreateProject = useCallback(() => {
        const now = /* @__PURE__ */ new Date();
        const stamp = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
        setProjectDraft({ mode: "create", name: `${t("projectPrefix")} ${stamp}` });
      }, [t]);
      const importLegacy = useCallback(() => {
        enqueue(async () => {
          try {
            await mutate("import-legacy", {});
            await loadBootstrap({ resetSelection: true });
            await loadGraph(canvasIdRef.current);
            flash(t("imported"));
          } catch (cause) {
            setBanner(cause);
          }
        });
      }, [enqueue, flash, loadBootstrap, loadGraph, t]);
      const saveProjectDraft = useCallback((draft) => {
        const current = projectDraft;
        setProjectDraft(void 0);
        if (current === void 0) return;
        const name = draft.name.trim() === "" ? t("untitled") : draft.name.trim();
        if (current.mode === "create") {
          commit(() => mutate("create-project", { name }), { notice: t("created") });
          return;
        }
        commit(() => mutate("update-project", { projectId: current.projectId, name }));
      }, [commit, projectDraft, t]);
      const runSearch = useCallback(async (query) => {
        if (query.trim() === "") {
          setSearch((current) => ({ ...current, hits: [], loading: false, active: -1 }));
          return;
        }
        setSearch((current) => ({ ...current, loading: true }));
        try {
          const params = new URLSearchParams({ q: query, limit: "50" });
          if (projectRef.current !== void 0) params.set("project", projectRef.current);
          const data = await callApi(`/search?${params.toString()}`);
          const hits = data.hits ?? [];
          setSearch((current) => ({ ...current, hits, loading: false, active: hits.length === 1 ? 0 : -1 }));
          if (hits.length === 1) openHit(hits[0]);
        } catch (cause) {
          setSearch((current) => ({ ...current, hits: [], loading: false }));
          setBanner(cause);
        }
      }, []);
      const openHit = useCallback((hit) => {
        setSearch({ query: "", open: false, hits: [], loading: false, active: -1 });
        projectRef.current = hit.projectId;
        setProjectId(hit.projectId);
        canvasRef.current = hit.canvasId;
        setCanvasId(hit.canvasId);
        setSelection([hit.nodeId]);
        setSelectedConnection(void 0);
        setSelectedGroup(void 0);
        setFocusRequest({ nodeId: hit.nodeId, nonce: Date.now() });
        setHighlightId(hit.nodeId);
        if (highlightTimer.current !== void 0) clearTimeout(highlightTimer.current);
        highlightTimer.current = setTimeout(() => setHighlightId(void 0), 1600);
      }, []);
      const copySelection = useCallback(() => {
        if (selection.length === 0) return;
        const set = new Set(selection);
        const nodes = (graph?.nodes ?? []).filter((node) => set.has(node.id)).map((node) => ({
          id: node.id,
          content: node.content ?? "",
          width: node.width,
          height: node.height,
          status: node.status
        }));
        clipboard.current = {
          nodes,
          connections: (graph?.connections ?? []).filter((connection) => set.has(connection.sourceNodeId) && set.has(connection.targetNodeId)).map((connection) => ({
            source: connection.sourceNodeId,
            target: connection.targetNodeId,
            relationType: connection.relationType,
            label: connection.label,
            sourceAnchor: connection.sourceAnchor,
            targetAnchor: connection.targetAnchor,
            strokeKey: connection.strokeKey
          }))
        };
        pasteOffset.current = 0;
        flash(`${nodes.length} \xD7 ${t("noteCount")}`);
      }, [flash, graph, selection, t]);
      const pasteSelection = useCallback(() => {
        const data = clipboard.current;
        if (data === void 0 || data.nodes.length === 0) {
          flash(t("pasteEmpty"));
          return;
        }
        const center = viewport.current?.center?.() ?? { x: 0, y: 0 };
        pasteOffset.current += 1;
        const shift = (pasteOffset.current - 1) * 16 + 24;
        commit(async () => {
          const mapping = /* @__PURE__ */ new Map();
          for (const [index, node] of data.nodes.entries()) {
            const created = await mutate("create-note", {
              canvasId: canvasRef.current,
              content: node.content,
              width: node.width,
              height: node.height,
              x: Math.round(center.x + shift + index * 16 - node.width / 2),
              y: Math.round(center.y + shift + index * 16 - node.height / 2)
            });
            mapping.set(node.id, created.id);
          }
          for (const connection of data.connections) {
            const source = mapping.get(connection.source);
            const target = mapping.get(connection.target);
            if (source === void 0 || target === void 0) continue;
            await mutate("create-connection", {
              canvasId: canvasRef.current,
              sourceNodeId: source,
              targetNodeId: target,
              sourceAnchor: connection.sourceAnchor,
              targetAnchor: connection.targetAnchor,
              relationType: connection.relationType,
              label: connection.label ?? void 0,
              strokeKey: connection.strokeKey ?? "#000000"
            });
          }
          return [...mapping.values()];
        }).then((ids) => {
          if (ids === void 0) return;
          setSelection(ids);
          flash(`${ids.length} \xD7 ${t("noteCount")}`);
        });
      }, [commit, flash, t]);
      const deleteNoteById = useCallback((nodeId) => {
        setEditing(void 0);
        setSelection([]);
        commit(() => mutate("delete-note", { nodeId }), {
          history: () => ({
            undo: () => mutate("restore-note", { nodeId }),
            redo: () => mutate("delete-note", { nodeId })
          })
        });
      }, [commit]);
      const reconnectConnection = useCallback((payload) => {
        if (payload === void 0) {
          flash(t("reconnectCancelled"));
          return;
        }
        const connection = graph?.connections.find((entry) => entry.id === payload.connectionId);
        if (connection === void 0) return;
        const beforeNode = payload.isSourceEnd ? connection.sourceNodeId : connection.targetNodeId;
        const beforeAnchor = payload.isSourceEnd ? connection.sourceAnchor : connection.targetAnchor;
        if (beforeNode === payload.nodeId && beforeAnchor === payload.anchor) {
          flash(t("reconnectUnchanged"));
          return;
        }
        const patch = payload.isSourceEnd ? { sourceNodeId: payload.nodeId, sourceAnchor: payload.anchor } : { targetNodeId: payload.nodeId, targetAnchor: payload.anchor };
        const inverse = payload.isSourceEnd ? { sourceNodeId: beforeNode, sourceAnchor: beforeAnchor } : { targetNodeId: beforeNode, targetAnchor: beforeAnchor };
        commit(() => mutate("update-connection", { connectionId: payload.connectionId, ...patch }), {
          notice: t("reconnected"),
          history: () => ({
            undo: () => mutate("update-connection", { connectionId: payload.connectionId, ...inverse }),
            redo: () => mutate("update-connection", { connectionId: payload.connectionId, ...patch })
          })
        });
      }, [commit, flash, graph, t]);
      const applyAccent = useCallback((nodeId, accentKey) => {
        const before = graph?.nodes.find((node) => node.id === nodeId);
        setContextMenu(void 0);
        commit(() => mutate("update-note", { nodeId, accentKey: accentKey ?? "none" }), {
          history: before === void 0 ? void 0 : () => ({
            undo: () => mutate("update-note", { nodeId, accentKey: before.accentKey ?? "none" }),
            redo: () => mutate("update-note", { nodeId, accentKey: accentKey ?? "none" })
          })
        });
      }, [commit, graph]);
      const deleteConnectionById = useCallback((connectionId) => {
        const connection = graph?.connections.find((entry) => entry.id === connectionId);
        setContextMenu(void 0);
        setSelectedConnection(void 0);
        commit(() => mutate("delete-connection", { connectionId }), {
          history: connection === void 0 ? void 0 : () => ({
            undo: () => mutate("create-connection", {
              canvasId: canvasRef.current,
              sourceNodeId: connection.sourceNodeId,
              targetNodeId: connection.targetNodeId,
              sourceAnchor: connection.sourceAnchor,
              targetAnchor: connection.targetAnchor,
              relationType: connection.relationType,
              label: connection.label ?? void 0,
              strokeKey: connection.strokeKey ?? "#000000"
            }),
            redo: () => mutate("delete-connection", { connectionId })
          })
        });
      }, [commit, graph]);
      const openRecycle = useCallback(() => {
        setRecycle({ open: true, items: [], loading: true });
        enqueue(async () => {
          try {
            const params = new URLSearchParams({ limit: "200" });
            if (projectRef.current !== void 0) params.set("project", projectRef.current);
            const data = await callApi(`/recycle?${params.toString()}`);
            setRecycle({ open: true, items: data.items ?? [], loading: false });
          } catch (cause) {
            setRecycle({ open: true, items: [], loading: false });
            setBanner(cause);
          }
        });
      }, [enqueue]);
      const restoreNote = useCallback((nodeId) => {
        commit(() => mutate("restore-note", { nodeId }), {
          notice: t("restore"),
          history: () => ({
            undo: () => mutate("delete-note", { nodeId }),
            redo: () => mutate("restore-note", { nodeId })
          })
        });
        void openRecycle();
      }, [commit, openRecycle, t]);
      useEffect(() => {
        const onKey = (event) => {
          const target = event.target;
          if (target instanceof Element) {
            const tag = target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable || target.closest?.('[contenteditable="true"],[role="textbox"],[role="dialog"]') !== null) return;
          }
          const mod = event.metaKey || event.ctrlKey;
          const key = event.key.toLowerCase();
          if (mod && key === "z" && !event.shiftKey) {
            event.preventDefault();
            undo();
            return;
          }
          if (mod && (key === "y" || key === "z" && event.shiftKey)) {
            event.preventDefault();
            redo();
            return;
          }
          if (mod && key === "g") {
            event.preventDefault();
            createGroup();
            return;
          }
          if (mod && key === "f") {
            event.preventDefault();
            searchInput.current?.focus();
            searchInput.current?.select();
            return;
          }
          if (mod && event.key === "0") {
            event.preventDefault();
            viewport.current?.fitAll?.();
            return;
          }
          if (mod && key === "c") {
            copySelection();
            return;
          }
          if (mod && key === "v") {
            event.preventDefault();
            pasteSelection();
            return;
          }
          if (event.key === "Escape") {
            setPendingLink(void 0);
            setContextMenu(void 0);
            setMenu(void 0);
            setSearch((current) => ({ ...current, open: false }));
            return;
          }
          if (event.key === "F2") {
            const node = (graph?.nodes ?? []).find((candidate) => candidate.id === selection[0]);
            if (node !== void 0) {
              event.preventDefault();
              beginEdit(node);
            }
            return;
          }
          if (event.key === "Delete") {
            if (selection.length > 0 || selectedConnection !== void 0 || selectedGroup !== void 0) {
              event.preventDefault();
              deleteSelected();
            }
          }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
      }, [
        beginEdit,
        copySelection,
        createGroup,
        deleteSelected,
        graph,
        pasteSelection,
        redo,
        search,
        selectedConnection,
        selectedGroup,
        selection,
        undo
      ]);
      const storage = bootstrap?.storage;
      const storageLock = storage?.lockedBy ?? void 0;
      const projects = bootstrap?.projects ?? [];
      const project = projects.find((candidate) => candidate.id === projectId);
      const canvases = project?.canvases ?? [];
      const noteCount = graph?.nodes.length ?? 0;
      const filter = projectFilter.trim().toLowerCase();
      const filteredProjects = filter === "" ? projects : projects.filter((entry) => entry.name.toLowerCase().includes(filter));
      const canUndo = historyTick >= 0 && undoStack.current.length > 0;
      const canRedo = historyTick >= 0 && redoStack.current.length > 0;
      const saveCamera = useCallback((next) => {
        if (canvasRef.current === void 0) return;
        void mutate("save-camera", { canvasId: canvasRef.current, cameraX: next.x, cameraY: next.y, zoom: next.zoom }).catch(() => {
        });
      }, []);
      const wheelResize = useCallback((node, factor) => {
        const base = wheelNode.current?.id === node.id ? wheelNode.current : {
          id: node.id,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height
        };
        wheelNode.current = base;
        const width = clamp(Math.round(base.width * factor), MIN_WIDTH, MAX_WIDTH);
        const height = clamp(Math.round(base.height * factor), MIN_HEIGHT, MAX_HEIGHT);
        setGraph((current) => current === void 0 ? current : {
          ...current,
          nodes: current.nodes.map((candidate) => candidate.id === node.id ? { ...candidate, width, height } : candidate)
        });
        if (wheelTimer.current !== void 0) clearTimeout(wheelTimer.current);
        wheelTimer.current = setTimeout(() => {
          const final = wheelNode.current;
          wheelNode.current = void 0;
          if (final === void 0) return;
          commit(() => mutate("update-note", {
            nodeId: final.id,
            x: final.x,
            y: final.y,
            width,
            height
          }), {
            history: () => ({
              undo: () => mutate("update-note", {
                nodeId: final.id,
                x: final.x,
                y: final.y,
                width: final.width,
                height: final.height
              }),
              redo: () => mutate("update-note", { nodeId: final.id, x: final.x, y: final.y, width, height })
            })
          });
        }, 450);
      }, [commit]);
      if (fatal !== void 0) {
        const body = h(
          "div",
          { style: { fontSize: 12, maxWidth: 420, lineHeight: 1.6 } },
          fatal.code === "DB_NOT_FOUND" ? t("noDatabase") : t("syncFailed")
        );
        return h(
          "div",
          {
            style: {
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              padding: 40,
              textAlign: "center",
              color: "var(--dsw-alias-label-secondary)",
              background: "var(--dsw-alias-bg-base)"
            }
          },
          h("div", { style: { fontSize: 14, fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, t("panel")),
          body,
          h("div", { style: { fontSize: 11, opacity: 0.8, maxWidth: 420, wordBreak: "break-word" } }, fatal.message),
          h(Button, { primary: true, onClick: () => {
            setFatal(void 0);
            void loadBootstrap({ resetSelection: true });
          } }, t("retry"))
        );
      }
      if (bootstrap === void 0) {
        return h("div", {
          style: {
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "var(--dsw-alias-label-secondary)",
            background: "var(--dsw-alias-bg-base)"
          }
        }, t("loading"));
      }
      if (projects.length === 0) {
        return h(
          React.Fragment,
          null,
          h(
            "div",
            {
              style: {
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: 24,
                textAlign: "center",
                color: "var(--dsw-alias-label-secondary)",
                background: "var(--dsw-alias-bg-base)"
              }
            },
            h("div", { style: { fontSize: 13, fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, t("panel")),
            h("div", { style: { fontSize: 12, maxWidth: 380, lineHeight: 1.6 } }, t("noProjects")),
            h(Button, { primary: true, onClick: () => openCreateProject() }, t("newProject")),
            storage?.legacyAvailable ? h(Button, { onClick: () => importLegacy() }, t("importLegacy")) : null,
            h(Button, { onClick: () => {
              void loadBootstrap({ resetSelection: true });
            } }, t("refresh"))
          ),
          projectDraft === void 0 ? null : h(ProjectDialog, {
            key: "project",
            t,
            draft: projectDraft,
            onCancel: () => setProjectDraft(void 0),
            onSave: saveProjectDraft
          })
        );
      }
      const headerButtons = [
        h(Button, { key: "new", primary: true, onClick: createNoteAtCenter }, t("newNote")),
        h(Button, { key: "group", onClick: createGroup, disabled: selection.length === 0 }, t("group")),
        h(Button, {
          key: "delete",
          danger: true,
          disabled: selection.length === 0 && selectedConnection === void 0 && selectedGroup === void 0,
          onClick: deleteSelected
        }, t("delete")),
        h(Button, { key: "undo", onClick: undo, disabled: !canUndo, title: t("undo") }, "\u21B6"),
        h(Button, { key: "redo", onClick: redo, disabled: !canRedo, title: t("redo") }, "\u21B7"),
        h(Button, { key: "fit", onClick: () => viewport.current?.fitAll?.() }, t("fitAll")),
        h(Button, { key: "recycle", primary: recycle.open, onClick: openRecycle }, t("recycleBin")),
        h(Button, { key: "refresh", onClick: () => {
          void loadBootstrap();
          void loadGraph(canvasId);
        } }, t("refresh"))
      ];
      const searchBox = h(
        "div",
        { style: { position: "relative", flex: "1 1 160px", minWidth: 140, maxWidth: 320 } },
        h("input", {
          ref: searchInput,
          type: "search",
          value: search.query,
          placeholder: t("searchPlaceholder"),
          "aria-label": t("searchPlaceholder"),
          onChange: (event) => {
            const value = event.target.value;
            setSearch((current) => ({ ...current, query: value, open: true }));
            if (searchTimer.current !== void 0) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
              void runSearch(value);
            }, 250);
          },
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const hit = search.hits[search.active];
              if (hit !== void 0) openHit(hit);
              else void runSearch(search.query);
            }
            if (event.key === "Escape") setSearch((current) => ({ ...current, open: false }));
          },
          style: { ...inputStyle, height: 28 }
        }),
        search.open && search.query.trim() !== "" ? h(
          "div",
          {
            style: {
              position: "absolute",
              left: 0,
              right: 0,
              top: 32,
              zIndex: 25,
              maxHeight: 280,
              overflowY: "auto",
              borderRadius: 8,
              padding: 4,
              background: "var(--dsw-alias-bg-layer-2)",
              border: "1px solid var(--dsw-alias-border-l2)",
              boxShadow: "0 8px 24px var(--dsw-alias-bg-mask-2)"
            }
          },
          search.loading ? h("div", { style: { padding: "6px 8px", fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, t("searching")) : null,
          !search.loading && search.hits.length === 0 ? h("div", { style: { padding: "6px 8px", fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, t("searchEmpty")) : null,
          search.hits.map((hit, index) => h(
            "button",
            {
              key: hit.nodeId,
              type: "button",
              onClick: () => openHit(hit),
              onDoubleClick: () => openHit(hit),
              style: {
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "6px 8px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
                background: index === search.active ? "var(--dsw-alias-bg-layer-3)" : "transparent",
                color: "var(--dsw-alias-label-primary)"
              }
            },
            h(
              "div",
              { style: { fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
              `${t("noteCount") === "notes" ? "Note" : "\u4FBF\u7B7E"} \xB7 ${hit.title || hit.excerpt || t("untitled")}`
            ),
            h("div", {
              style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
            }, `${hit.projectName} / ${hit.canvasName} \u2014 ${hit.excerpt}`)
          ))
        ) : null
      );
      const header = h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "0 0 auto",
            flexWrap: "wrap",
            padding: "14px 16px 10px",
            borderBottom: "1px solid var(--dsw-alias-border-l2)"
          }
        },
        h("div", { style: { fontSize: 13, fontWeight: 600 } }, t("panel")),
        h("div", { style: { fontSize: 12, color: "var(--dsw-alias-label-tertiary)" } }, `${noteCount} ${t("noteCount")}`),
        pendingCount > 0 ? h("div", { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, t("saving")) : null,
        searchBox,
        h("div", { style: { flex: 1, minWidth: 8 } }),
        headerButtons
      );
      const lockBar = storageLock === void 0 ? null : h("div", {
        role: "alert",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: "0 0 auto",
          padding: "6px 16px",
          fontSize: 12,
          background: "color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, var(--dsw-alias-bg-base))",
          borderBottom: "1px solid var(--dsw-alias-border-l2)",
          color: "var(--dsw-alias-state-warn-label)"
        }
      }, `${t("syncLocked")} ${storageLock.host} \xB7 PID ${storageLock.pid}`);
      const errorBar = banner === void 0 ? null : h(
        "div",
        {
          role: "alert",
          style: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: "0 0 auto",
            padding: "6px 16px",
            fontSize: 12,
            background: "var(--dsw-alias-bg-mask-2)",
            borderBottom: "1px solid var(--dsw-alias-border-l2)",
            color: "var(--dsw-alias-state-error-primary)"
          }
        },
        h(
          "span",
          { style: { flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" } },
          `${t("syncFailed")} ${banner.message}`
        ),
        h(Button, { onClick: () => {
          setBanner(void 0);
          void loadGraph(canvasId);
        } }, t("retry")),
        h(Button, { onClick: () => setBanner(void 0) }, t("dismiss"))
      );
      const projectRows = filteredProjects.map((entry) => {
        const active = entry.id === projectId;
        const rowStyle = {
          position: "relative",
          display: "flex",
          alignItems: "center",
          borderRadius: 6,
          marginBottom: 2,
          background: active ? "var(--dsw-alias-bg-layer-2)" : "transparent"
        };
        const main = entry.canvases.find((canvas) => canvas.parentCanvasId === null) ?? entry.canvases[0];
        const openButton = h(
          "button",
          {
            key: "open",
            type: "button",
            onClick: () => openProject(entry),
            style: {
              flex: 1,
              minWidth: 0,
              display: "block",
              textAlign: "left",
              padding: "6px 8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--dsw-alias-label-primary)",
              fontFamily: "inherit",
              fontSize: 12
            }
          },
          h("div", { style: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }, entry.name),
          h("div", { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, `${entry.nodeCount} ${t("noteCount")}`)
        );
        const more = h("button", {
          key: "more",
          type: "button",
          title: t("rename"),
          onClick: () => setMenu((current) => current === entry.id ? void 0 : entry.id),
          style: {
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "0 6px",
            color: "var(--dsw-alias-label-tertiary)",
            fontSize: 12
          }
        }, "\u22EF");
        const menuPanel = menu === entry.id ? h(
          "div",
          {
            key: "menu",
            "data-project-menu": true,
            style: {
              position: "absolute",
              right: 4,
              top: 26,
              zIndex: 20,
              minWidth: 130,
              padding: 4,
              borderRadius: 8,
              background: "var(--dsw-alias-bg-layer-2)",
              border: "1px solid var(--dsw-alias-border-l2)",
              boxShadow: "0 8px 24px var(--dsw-alias-bg-mask-2)"
            }
          },
          h("button", {
            type: "button",
            onClick: () => {
              setMenu(void 0);
              setProjectDraft({ mode: "rename", projectId: entry.id, name: entry.name });
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              borderRadius: 6,
              color: "var(--dsw-alias-label-primary)",
              fontFamily: "inherit"
            }
          }, t("renameProject")),
          h("button", {
            type: "button",
            onClick: () => {
              setMenu(void 0);
              setConfirm({ kind: "project", id: entry.id, name: entry.name });
            },
            style: {
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "6px 8px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 12,
              borderRadius: 6,
              color: "var(--dsw-alias-state-error-primary)",
              fontFamily: "inherit"
            }
          }, t("deleteProject"))
        ) : null;
        return h("div", { key: entry.id, style: rowStyle }, openButton, more, menuPanel);
      });
      const canvasRows = canvases.map((canvas) => h("button", {
        key: canvas.id,
        type: "button",
        onClick: () => {
          canvasRef.current = canvas.id;
          setCanvasId(canvas.id);
          setSelection([]);
        },
        style: {
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "6px 8px",
          borderRadius: 6,
          border: "none",
          cursor: "pointer",
          fontSize: 12,
          marginBottom: 2,
          background: canvas.id === canvasId ? "var(--dsw-alias-bg-layer-2)" : "transparent",
          color: "var(--dsw-alias-label-primary)",
          fontFamily: "inherit"
        }
      }, h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 6 } },
        h("span", { style: { opacity: 0.6 } }, canvas.parentCanvasId === null ? "\u25A3" : "\u25A2"),
        h(
          "span",
          { style: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
          canvas.name || t(canvas.parentCanvasId === null ? "mainCanvas" : "subCanvas")
        )
      )));
      const rail = h(
        "div",
        {
          style: {
            width: "clamp(150px, 26%, 220px)",
            flex: "0 0 auto",
            borderRight: "1px solid var(--dsw-alias-border-l2)",
            overflowY: "auto",
            padding: "10px 8px",
            boxSizing: "border-box"
          }
        },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 6, padding: "0 6px 6px" } },
          h("div", { style: { flex: 1, fontSize: 11, letterSpacing: 0.4, color: "var(--dsw-alias-label-tertiary)" } }, t("projects")),
          h("button", {
            type: "button",
            title: t("newProject"),
            onClick: () => openCreateProject(),
            style: {
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--dsw-alias-label-secondary)",
              fontSize: 14,
              lineHeight: 1,
              padding: "0 2px"
            }
          }, "+")
        ),
        projectRows,
        h("input", {
          type: "search",
          value: projectFilter,
          placeholder: t("filterProjects"),
          "aria-label": t("filterProjects"),
          onChange: (event) => setProjectFilter(event.target.value),
          style: { ...inputStyle, height: 24, fontSize: 11, marginTop: 2, marginBottom: 2 }
        }),
        filter !== "" && filteredProjects.length === 0 ? h(
          "div",
          { style: { padding: "4px 6px", fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } },
          t("searchEmpty")
        ) : null,
        h("div", {
          style: {
            fontSize: 11,
            letterSpacing: 0.4,
            color: "var(--dsw-alias-label-tertiary)",
            padding: "12px 6px 6px"
          }
        }, t("canvases")),
        canvasRows,
        canvases.length === 0 ? h("div", { style: { padding: "6px", fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, t("noCanvas")) : null,
        h("div", {
          title: storage?.dbPath ?? "",
          style: {
            marginTop: 12,
            padding: "0 6px",
            fontSize: 10,
            lineHeight: 1.5,
            color: "var(--dsw-alias-label-tertiary)",
            wordBreak: "break-all"
          }
        }, `${t("storagePath")} ${storage?.dbPath ?? ""}`)
      );
      const board = h(
        "div",
        { style: { position: "relative", flex: 1, minWidth: 0 } },
        graph === void 0 ? h("div", {
          style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "var(--dsw-alias-label-secondary)"
          }
        }, canvasId === void 0 ? t("noCanvas") : t("loading")) : h(CanvasView, {
          graph,
          selection,
          selectedConnection,
          selectedGroup,
          editing,
          pendingLink,
          focusRequest,
          highlightId,
          t,
          onSelectNodes: (ids) => {
            setSelection(ids);
            if (ids.length > 0) {
              setSelectedGroup(void 0);
            }
          },
          onSelectConnection: (id) => {
            setSelectedConnection(id);
            if (id !== void 0) {
              setSelection([]);
              setSelectedGroup(void 0);
            }
          },
          onSelectGroup: (id) => {
            setSelectedGroup(id);
            if (id !== void 0) setSelection([]);
          },
          onCreateNote: createNoteAt,
          onMoveNodes: moveNodes,
          onResizeNode: resizeNode,
          onToggleTask: toggleTask,
          onAutoFit: autoFitNode,
          onBeginEdit: beginEdit,
          onEditValue: (field2, value) => setEditing((current) => current === void 0 ? current : { ...current, [field2]: value }),
          onCommitEdit: commitEdit,
          onCancelEdit: cancelEdit,
          onBeginLink: beginLink,
          onCompleteLink: completeLink,
          onCancelLink: cancelLink,
          onOpenConnection: beginConnectionPick,
          onToggleGroup: toggleGroup,
          onMoveGroup: moveGroup,
          onCamera: saveCamera,
          onViewport: (value) => {
            viewport.current = value;
          },
          onContextMenu: (info) => setContextMenu(info),
          onWheelResize: wheelResize,
          onReconnect: reconnectConnection,
          onNewNote: createNoteAtCenter,
          onDeleteNote: deleteNoteById
        })
      );
      const recyclePanel = !recycle.open ? null : h(
        "div",
        {
          style: {
            width: "clamp(180px, 26%, 260px)",
            flex: "0 0 auto",
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid var(--dsw-alias-border-l2)",
            minHeight: 0
          }
        },
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 10px",
              borderBottom: "1px solid var(--dsw-alias-border-l2)"
            }
          },
          h("div", { style: { flex: 1, fontSize: 12, fontWeight: 600 } }, t("recycleBin")),
          h("button", {
            type: "button",
            title: t("dismiss"),
            onClick: () => setRecycle((current) => ({ ...current, open: false })),
            style: {
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "var(--dsw-alias-label-tertiary)",
              fontSize: 14,
              padding: 0
            }
          }, "\xD7")
        ),
        h(
          "div",
          { style: { flex: 1, overflowY: "auto", padding: 8 } },
          recycle.loading ? h("div", { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, t("loading")) : recycle.items.length === 0 ? h("div", { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, t("recycleEmpty")) : recycle.items.map((item) => h(
            "div",
            {
              key: item.nodeId,
              style: {
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 8px",
                marginBottom: 4,
                borderRadius: 6,
                border: "1px solid var(--dsw-alias-border-l2)"
              }
            },
            h(
              "div",
              { style: { flex: 1, minWidth: 0 } },
              h(
                "div",
                { style: { fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } },
                item.title || t("untitled")
              ),
              h("div", {
                style: { fontSize: 10, color: "var(--dsw-alias-label-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }
              }, `${item.projectName ?? ""} / ${item.canvasName ?? ""} \xB7 ${String(item.deletedAt).slice(0, 16).replace("T", " ")}`)
            ),
            h("button", {
              type: "button",
              onClick: () => restoreNote(item.nodeId),
              style: {
                border: "1px solid var(--dsw-alias-border-l2)",
                background: "transparent",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 11,
                padding: "2px 8px",
                color: "var(--dsw-alias-label-primary)",
                fontFamily: "inherit"
              }
            }, t("restore"))
          ))
        )
      );
      const contextItems = [];
      if (contextMenu !== void 0) {
        const target = contextMenu.target ?? { kind: "blank" };
        const node = target.kind === "node" ? (graph?.nodes ?? []).find((entry) => entry.id === target.id) : void 0;
        const connection = target.kind === "connection" ? (graph?.connections ?? []).find((entry) => entry.id === target.id) : void 0;
        if (node !== void 0) {
          const swatches = [
            h(Swatch, {
              key: "none",
              colour: "var(--dsw-alias-card-fill)",
              selected: (node.accentKey ?? null) === null,
              title: accentLabel(null),
              onClick: () => applyAccent(node.id, null)
            }),
            ...ACCENT_KEYS.map((key) => h(Swatch, {
              key,
              colour: ACCENT_COLOURS[key],
              selected: node.accentKey === key,
              title: accentLabel(key),
              onClick: () => applyAccent(node.id, key)
            }))
          ];
          contextItems.push(h("div", {
            key: "colours",
            style: { display: "flex", flexWrap: "wrap", gap: 6, padding: "4px 6px 6px" }
          }, swatches));
          contextItems.push(menuEntry(t("editNote"), () => {
            setContextMenu(void 0);
            beginEdit(node);
          }));
          contextItems.push(menuEntry(t("menuDelete"), () => {
            setContextMenu(void 0);
            setSelection([node.id]);
            setConfirm({ kind: "notes", ids: [node.id] });
          }, true));
        } else if (connection !== void 0) {
          contextItems.push(menuEntry(t("editLine"), () => {
            setContextMenu(void 0);
            beginConnectionPick(connection);
          }));
          contextItems.push(menuEntry(t("menuDelete"), () => deleteConnectionById(connection.id), true));
        } else {
          contextItems.push(menuEntry(t("menuCreate"), () => {
            setContextMenu(void 0);
            createNoteAt(contextMenu.world);
          }));
          contextItems.push(menuEntry(t("menuGroup"), () => {
            setContextMenu(void 0);
            createGroup();
          }, false, selection.length === 0));
          contextItems.push(menuEntry(t("menuDelete"), () => {
            setContextMenu(void 0);
            deleteSelected();
          }, true, selection.length === 0 && selectedConnection === void 0 && selectedGroup === void 0));
          contextItems.push(menuEntry(t("menuFit"), () => {
            setContextMenu(void 0);
            viewport.current?.fitAll?.();
          }));
        }
      }
      const pageBox = pageRef.current?.getBoundingClientRect();
      const menuLeft = pageBox === null || pageBox === void 0 ? contextMenu?.x ?? 0 : clamp(contextMenu?.x - pageBox.left, 4, Math.max(4, pageBox.width - 190));
      const menuTop = pageBox === null || pageBox === void 0 ? contextMenu?.y ?? 0 : clamp(contextMenu?.y - pageBox.top, 4, Math.max(4, pageBox.height - (32 + contextItems.length * 30)));
      const contextPanel = contextMenu === void 0 ? null : h("div", {
        "data-context-menu": true,
        style: {
          position: "absolute",
          left: menuLeft,
          top: menuTop,
          zIndex: 28,
          minWidth: 180,
          padding: 4,
          borderRadius: 8,
          background: "var(--dsw-alias-bg-layer-2)",
          border: "1px solid var(--dsw-alias-border-l2)",
          boxShadow: "0 8px 24px var(--dsw-alias-bg-mask-2)"
        },
        onPointerDown: (event) => event.stopPropagation()
      }, contextItems);
      const noticeBar = notice === void 0 ? null : h("div", {
        role: "status",
        "aria-live": "polite",
        style: {
          position: "absolute",
          left: "50%",
          bottom: 20,
          transform: "translateX(-50%)",
          zIndex: 20,
          padding: "6px 12px",
          borderRadius: 999,
          fontSize: 12,
          maxWidth: "80%",
          background: "var(--dsw-alias-bg-layer-2)",
          border: "1px solid var(--dsw-alias-border-l2)",
          color: "var(--dsw-alias-label-primary)",
          boxShadow: "0 6px 20px var(--dsw-alias-bg-mask-2)"
        }
      }, notice);
      const dialogs = [
        connectionDraft === void 0 ? null : h(ConnectionDialog, {
          key: "connection",
          t,
          draft: connectionDraft,
          onCancel: () => setConnectionDraft(void 0),
          onApply: applyConnectionDraft
        }),
        projectDraft === void 0 ? null : h(ProjectDialog, {
          key: "project",
          t,
          draft: projectDraft,
          onCancel: () => setProjectDraft(void 0),
          onSave: saveProjectDraft
        }),
        confirm === void 0 ? null : h(ConfirmDialog, {
          key: "confirm",
          t,
          target: confirm,
          onCancel: () => setConfirm(void 0),
          onConfirm: () => {
            if (confirm.kind === "project") {
              const target = confirm;
              setConfirm(void 0);
              commit(() => mutate("delete-project", { projectId: target.id }), { notice: t("deleteProject") });
              return;
            }
            confirmDelete();
          }
        })
      ];
      return h(
        "div",
        {
          ref: pageRef,
          style: {
            position: "relative",
            height: "100%",
            minHeight: 0,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "var(--dsw-alias-bg-base)",
            color: "var(--dsw-alias-label-primary)",
            fontFamily: "inherit"
          }
        },
        header,
        lockBar,
        errorBar,
        h("div", { style: { display: "flex", flex: 1, minHeight: 0 } }, rail, board, recyclePanel),
        contextPanel,
        noticeBar,
        dialogs
      );
    }
    const menuItemStyle = {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "6px 8px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: 12,
      borderRadius: 6,
      color: "var(--dsw-alias-label-primary)",
      fontFamily: "inherit"
    };
    function menuEntry(label, onClick, danger, disabled) {
      return h("button", {
        key: label,
        type: "button",
        onClick: disabled ? void 0 : onClick,
        disabled,
        style: {
          ...menuItemStyle,
          color: danger ? "var(--dsw-alias-state-error-primary)" : menuItemStyle.color,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "default" : "pointer"
        }
      }, label);
    }
    function ConnectionDialog({ t: t2, draft, onCancel, onApply }) {
      const [relationType, setRelationType] = useState(draft.relationType ?? "MainThick1");
      const [strokeKey, setStrokeKey] = useState(draft.strokeKey ?? "#000000");
      const isCreate = draft.mode === "create";
      const relationChips = RELATIONS.map((relation) => h(
        "button",
        {
          key: relation,
          type: "button",
          onClick: () => setRelationType(relation),
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 8px",
            borderRadius: 999,
            cursor: "pointer",
            fontSize: 11,
            fontFamily: "inherit",
            border: `1px solid ${relationType === relation ? PALETTE.selected : "var(--dsw-alias-border-l2)"}`,
            background: relationType === relation ? "var(--dsw-alias-bg-layer-3)" : "transparent",
            color: "var(--dsw-alias-label-primary)"
          }
        },
        h("span", {
          style: {
            width: 22,
            height: 0,
            borderTop: `${PALETTE.relationWidth[relation]}px ${PALETTE.relationDash[relation] === void 0 ? "solid" : "dashed"} ${PALETTE.relationColour[relation]}`
          }
        }),
        t2(`relation_${relation}`)
      ));
      const swatches = [h(Swatch, {
        key: "#000000",
        colour: defaultInk(),
        selected: strokeKey === "#000000",
        title: t2("defaultColour"),
        onClick: () => setStrokeKey("#000000")
      })].concat(ACCENT_KEYS.map((key) => h(Swatch, {
        key,
        colour: PALETTE.stripes[mode()][key],
        selected: strokeKey === key,
        title: accentLabel(key),
        onClick: () => setStrokeKey(key)
      })));
      const summary = `${t2("relation")}: ${t2(`relation_${relationType}`)}`;
      return h(
        Dialog,
        {
          title: isCreate ? t2("selectLine") : t2("connection"),
          onClose: onCancel,
          footer: [
            h(Button, { key: "cancel", onClick: onCancel }, t2("cancel")),
            h(
              Button,
              { key: "ok", primary: true, onClick: () => onApply({ relationType, strokeKey }) },
              isCreate ? t2("startConnect") : t2("apply")
            )
          ]
        },
        h("div", { style: { fontSize: 11, color: "var(--dsw-alias-label-tertiary)" } }, summary),
        field(t2("relation"), h("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 } }, relationChips)),
        field(t2("colour"), h("div", { style: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" } }, swatches))
      );
    }
    function ProjectDialog({ t: t2, draft, onCancel, onSave }) {
      const [name, setName] = useState(draft.name ?? "");
      const canSave = draft.mode === "rename" ? name.trim() !== "" : true;
      return h(
        Dialog,
        {
          title: draft.mode === "create" ? t2("newProject") : t2("renameProject"),
          onClose: onCancel,
          footer: [
            h(Button, { key: "cancel", onClick: onCancel }, t2("cancel")),
            h(Button, {
              key: "save",
              primary: true,
              disabled: !canSave,
              onClick: () => onSave({ name: name.trim() })
            }, draft.mode === "create" ? t2("create") : t2("save"))
          ]
        },
        field(t2("projectName"), h("input", {
          style: inputStyle,
          value: name,
          autoFocus: true,
          placeholder: draft.mode === "create" ? t2("untitled") : "",
          onChange: (event) => setName(event.target.value),
          onKeyDown: (event) => {
            if (event.key === "Enter" && canSave) onSave({ name: name.trim() });
          }
        }))
      );
    }
    function ConfirmDialog({ t: t2, target, onCancel, onConfirm }) {
      const text = target.kind === "notes" ? t2("confirmDelete") : target.kind === "connection" ? t2("confirmDeleteConnection") : target.kind === "group" ? t2("confirmDeleteGroup") : `${t2("confirmDeleteProject")}${target.name ? ` (${target.name})` : ""}`;
      return h(Dialog, {
        title: target.kind === "project" ? t2("deleteProject") : t2("delete"),
        onClose: onCancel,
        footer: [
          h(Button, { key: "cancel", onClick: onCancel }, t2("cancel")),
          h(Button, { key: "ok", danger: true, onClick: onConfirm }, t2("delete"))
        ]
      }, h("div", null, text));
    }
    function PanelIcon({ size = 16 }) {
      return h(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 20 20",
          "aria-hidden": true,
          style: { display: "block", color: "currentColor" }
        },
        h("rect", {
          x: 2,
          y: 3.5,
          width: 16,
          height: 13,
          rx: 2.5,
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.4,
          opacity: 0.75
        }),
        h("rect", { x: 5, y: 7, width: 5, height: 4, rx: 1, fill: "currentColor", opacity: 0.85 }),
        h("rect", { x: 12, y: 10, width: 3.5, height: 3.5, rx: 1, fill: "currentColor", opacity: 0.5 }),
        h("path", { d: "M10 9h2", stroke: "currentColor", strokeWidth: 1.2, strokeLinecap: "round" })
      );
    }
    return {
      inject: ["slots", "locale"],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICTS), "project-canvas: dictionaries");
        const bound = ctx.locale.bind(NS);
        translate = (key) => {
          const value = bound(key);
          return value === void 0 || value === key ? DICTS.en[key] ?? key : value;
        };
        ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL_ID, locale: NS }, CanvasPage));
        ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
          name: "sidebar.panellist",
          id: PANEL_ID,
          order: 20,
          label: () => translate("panel"),
          locale: NS
        }, PanelIcon));
      }
    };
  }

  // src/entry.js
  window.__ModuleLoader__.load({
    id: "dsh-project-canvas",
    factory(require2) {
      return createClient(require2("react"));
    }
  });
})();
