import React, { useContext, useState, useEffect, useRef, useMemo } from "react";
import noteContext from "../context/notes/NoteContext";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaBook, FaMagic, FaMicrophone, FaFileUpload, FaFont, FaLanguage, FaList, FaBookOpen, FaTimes } from "react-icons/fa";
import DOMPurify from "dompurify";
import { Editor } from "@tinymce/tinymce-react";
import Select from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import VoiceInput from "./AddNoteComponents/VoiceInput";
import languageOptions from "./AddNoteComponents/languageOptions";
import getFontOptions from "./AddNoteComponents/FontOptions";
import DrawingCanvas from "./AddNoteComponents/DrawingCanvas";
import NoteTemplates from "./AddNoteComponents/NoteTemplates";
import AIGenerateModal from "./AddNoteComponents/AIGenerateModal";
import UploadComponent from "./AddNoteComponents/UploadComponent";

// AddNote component
const AddNote = ({ showAlert }) => {
  const { addNote } = useContext(noteContext);
  const [note, setNote] = useState({ title: "", description: "", tag: "" });
  const [formError, setFormError] = useState({ title: false, description: false, tag: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [matchedSuggestions, setMatchedSuggestions] = useState([]);
  const [editorHeight, setEditorHeight] = useState(400);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [clearCanvasTrigger, setClearCanvasTrigger] = useState(0);
  const [selectedFont, setSelectedFont] = useState({ value: "Arial", label: "Arial" });
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);
  // Updated to consider tablet screens (up to 1024px)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(window.innerWidth < 1024);
  const [isAIGenerateModalOpen, setIsAIGenerateModalOpen] = useState(false);
  const [navbarPosition, setNavbarPosition] = useState({
    x: (window.innerWidth - (isNavbarCollapsed ? 60 : 600)) / 2,
    y: window.innerHeight - 80,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const voiceInputRef = useRef(null);
  const editorRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const navbarRef = useRef(null);
  const fontModalRef = useRef(null);
  const languageModalRef = useRef(null);
  const uploadRef = useRef(null);
  const templatesModalRef = useRef(null);
  const [activeTab, setActiveTab] = useState("editor");

  const predefinedTags = ["General", "Work", "Personal"];
  const suggestionsList = [
    { keyword: "meeting", suggestion: "Add details about the meeting agenda and participants.", suggestionHindi: "Meeting ka agenda aur participants ke details add karein." },
    { keyword: "project", suggestion: "Include deadlines and key deliverables for the project.", suggestionHindi: "Project ke deadlines aur key deliverables ko include karein." },
    { keyword: "idea", suggestion: "Describe your idea to expand on it later.", suggestionHindi: "Apne idea ko describe karein taaki usko baad mein expand kiya ja sake." },
  ];

  const isPremium = localStorage.getItem("isPremium") === "true";
  const fontOptions = getFontOptions(isPremium);
  const fontFormats = fontOptions.map((font) => `${font.value}=${font.value}, ${font.premium ? "cursive" : "sans-serif"}`).join(";");

  // Load Google Fonts
  useEffect(() => {
    fontOptions.forEach((font) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${font.value.replace(/ /g, "+")}&display=swap`;
      document.head.appendChild(link);
    });
  }, [fontOptions]);

  // Initialize AOS and handle window resize
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    const handleResize = () => {
      setNavbarPosition({
        x: (window.innerWidth - (isNavbarCollapsed ? 60 : 600)) / 2,
        y: window.innerHeight - 160,
      });
      setIsMobileOrTablet(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isNavbarCollapsed]);

  // Apply selected font to editor
  useEffect(() => {
    if (editorRef.current && selectedFont && activeTab === "editor") {
      editorRef.current.execCommand("FontName", false, selectedFont.value);
    }
  }, [selectedFont, activeTab]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key === "f") setIsFontModalOpen(true);
      else if (e.key === "l") setIsLanguageModalOpen(true);
      else if (e.key === "t") setIsTemplatesModalOpen(true);
      else if (e.key === "Escape") {
        setIsFontModalOpen(false);
        setIsLanguageModalOpen(false);
        setIsTemplatesModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Drag-and-drop file upload
  useEffect(() => {
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
      e.preventDefault();
      setIsModalOpen(true);
    };
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);
    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Focus management for modals
  useEffect(() => {
    if (isFontModalOpen) fontModalRef.current?.focus();
    if (isLanguageModalOpen) languageModalRef.current?.focus();
    if (isTemplatesModalOpen) templatesModalRef.current?.focus();
  }, [isFontModalOpen, isLanguageModalOpen, isTemplatesModalOpen]);

  // Handle navbar dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setNavbarPosition((prev) => ({
        x: Math.max(0, Math.min(window.innerWidth - (isNavbarCollapsed ? 60 : 600), prev.x + e.movementX)),
        y: Math.max(0, Math.min(window.innerHeight - 80, prev.y + e.movementY)),
      }));
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isNavbarCollapsed]);

  // Track feature usage
  const getUsageCount = (feature) => parseInt(localStorage.getItem(`${feature}UsageCount`) || "0", 10);
  const incrementUsageCount = (feature) => {
    const count = getUsageCount(feature);
    localStorage.setItem(`${feature}UsageCount`, count + 1);
  };
  const aiUsageReached = !isPremium && getUsageCount("ai") >= 2;
  const voiceUsageReached = !isPremium && getUsageCount("voice") >= 2;

  const handleGenerateDescription = () => {
    if (!note.title.trim()) {
      showAlert("Please enter a title to generate a description.", "danger");
      return;
    }
    if (aiUsageReached) {
      showAlert("Your free AI generation limit is reached. Pleaseays upgrade.", "warning");
      return;
    }
    setIsAIGenerateModalOpen(true);
  };

  const handleTranscribe = (text) => {
    if (!text || activeTab !== "editor" || !editorRef.current) return;
    const editor = editorRef.current;
    editor.execCommand("FontName", false, selectedFont.value);
    const styledText = `<p style="font-family: '${selectedFont.value}';">${text}</p>`;
    editor.insertContent(styledText);
    setNote((prev) => ({ ...prev, description: editor.getContent() }));
  };

  const handleAIAction = async (action, text) => {
    if (action === "summarize") {
      try {
        return `<p style="font-family: '${selectedFont.value}';">Summary: ${text.slice(0, 50)}...</p>`;
      } catch (err) {
        showAlert("Failed to process AI action.", "danger");
        return text;
      }
    }
    return text;
  };

  const handleClick = (e) => {
    e.preventDefault();
    const errors = {
      title: note.title.trim() === "",
      description: activeTab === "editor" && note.description.trim() === "",
      tag: note.tag.trim() === "",
    };
    setFormError(errors);
    if (Object.values(errors).some((error) => error)) {
      showAlert("Please fill in all required fields", "danger");
      return;
    }
    setIsSubmitting(true);
    let finalDescription = note.description;
    if (activeTab === "canvas" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const isCanvasEmpty = !imageData.some((color) => color !== 0);
      if (!isCanvasEmpty) {
        finalDescription = `<img src="${canvas.toDataURL("image/png")}" alt="Drawing" />`;
      } else {
        showAlert("Please create a drawing on the canvas", "danger");
        setIsSubmitting(false);
        return;
      }
    }
    setTimeout(() => {
      addNote(note.title, finalDescription, note.tag);
      setNote({ title: "", description: "", tag: "" });
      setFormError({ title: false, description: false, tag: false });
      setMatchedSuggestions([]);
      showAlert("Note added successfully", "success");
      setIsSubmitting(false);
      if (editorRef.current && activeTab === "editor") editorRef.current.setContent("");
    }, 500);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setNote({ ...note, [name]: value });
    setFormError({ ...formError, [name]: false });
    if (name === "description" && activeTab === "editor") detectKeywords(value);
  };

  const handleEditorChange = (content) => {
    if (activeTab === "editor") {
      setNote({ ...note, description: content });
      setFormError({ ...formError, description: false });
      detectKeywords(content);
    }
  };

  const detectKeywords = (descriptionValue) => {
    const words = descriptionValue.trim().toLowerCase().split(/\s+/);
    const lastWord = words[words.length - 1];
    if (!lastWord) {
      setMatchedSuggestions([]);
      return;
    }
    const matches = suggestionsList.filter((item) => lastWord.includes(item.keyword));
    setMatchedSuggestions(matches);
  };

  const handleUseSuggestion = (text) => {
    if (activeTab !== "editor") return;
    const styledText = `<p style="font-family: '${selectedFont.value}';">${text}</p>`;
    setNote((prevNote) => ({
      ...prevNote,
      description: prevNote.description ? `${prevNote.description}${styledText}` : styledText,
    }));
    if (editorRef.current) {
      editorRef.current.execCommand("FontName", false, selectedFont.value);
      editorRef.current.insertContent(styledText);
    }
  };

  const getTextFromHtml = (html) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  };

  const translateText = async (text, targetLang) => {
    if (!text.trim()) throw new Error("No text to translate");
    try {
      const encodedText = encodeURIComponent(text);
      const response = await fetch(`https://lingva.ml/api/v1/auto/${targetLang}/${encodedText}`);
      if (!response.ok) throw new Error("Translation API request failed");
      const data = await response.json();
      return `<p style="font-family: '${selectedFont.value}';">${data.translation || text}</p>`;
    } catch (error) {
      console.error("Lingva Translate error:", error);
      throw error;
    }
  };

  const handleTranslate = async () => {
    if (activeTab !== "editor") return;
    if (!selectedLanguage) {
      showAlert("Please select a language to translate to.", "warning");
      return;
    }
    setIsTranslating(true);
    try {
      const text = getTextFromHtml(note.description);
      if (!text.trim()) {
        showAlert("Please enter some text to translate.", "warning");
        return;
      }
      const translatedText = await translateText(text, selectedLanguage.value);
      setNote({ ...note, description: translatedText });
      if (editorRef.current) {
        editorRef.current.execCommand("FontName", false, selectedFont.value);
        editorRef.current.setContent(translatedText);
      }
      showAlert("Description translated successfully!", "success");
    } catch (error) {
      showAlert("Failed to translate description.", "danger");
    } finally {
      setIsTranslating(false);
      setIsLanguageModalOpen(false);
    }
  };

  const customFontStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "0.5rem",
      padding: "0.5rem",
      width: "100%",
      minWidth: "12rem",
      boxShadow: "none",
      "&:hover": { border: "1px solid rgba(255, 255, 255, 0.3)" },
      backdropFilter: "blur(10px)",
      zIndex: 1000,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "0.5rem",
      marginTop: "0.25rem",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      zIndex: 1000,
    }),
    option: (base, { data }) => ({
      ...base,
      fontFamily: data.value,
      color: "#ffffff",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
    }),
    singleValue: (base) => ({
      ...base,
      fontFamily: selectedFont.value,
      color: "#ffffff",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#d1d5db",
    }),
  };

  const customLanguageStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: "0.5rem",
      padding: "0.5rem",
      width: "100%",
      minWidth: "12rem",
      boxShadow: "none",
      "&:hover": { border: "1px solid rgba(255, 255, 255, 0.3)" },
      backdropFilter: "blur(10px)",
      zIndex: 1000,
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "0.5rem",
      marginTop: "0.25rem",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      zIndex: 1000,
    }),
    option: (base) => ({
      ...base,
      color: "#ffffff",
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.2)" },
    }),
    singleValue: (base) => ({
      ...base,
      color: "#ffffff",
    }),
    placeholder: (base) => ({
      ...base,
      color: "#d1d5db",
    }),
  };

  const handleSelectTemplate = (template) => {
    if (activeTab !== "editor") setActiveTab("editor");
    const formattedDescription = DOMPurify.sanitize(template.description.replace(/{font}/g, selectedFont.value), {
      USE_PROFILES: { html: true },
      ADD_TAGS: ["style"],
      ADD_ATTR: ["style"],
    });
    setNote((prev) => ({ ...prev, title: template.title, description: formattedDescription }));
    if (editorRef.current) {
      editorRef.current.execCommand("FontName", false, selectedFont.value);
      editorRef.current.setContent(formattedDescription);
    }
    showAlert(`${template.title} template applied!`, "success");
    setIsTemplatesModalOpen(false);
  };

  const resetForm = () => {
    setNote({ title: "", description: "", tag: "" });
    setFormError({ title: false, description: false, tag: false });
    setMatchedSuggestions([]);
    if (activeTab === "canvas") setClearCanvasTrigger((prev) => prev + 1);
    if (editorRef.current && activeTab === "editor") editorRef.current.setContent("");
    showAlert("Form reset successfully!", "success");
  };

  const tools = [
    { icon: <FaMagic />, label: "Generate", action: handleGenerateDescription, disabled: isGenerating || aiUsageReached },
    {
      icon: <FaMicrophone />,
      label: "Voice",
      action: () => voiceInputRef.current.toggleVoiceInput(),
      disabled: voiceUsageReached && !isVoiceActive,
    },
    { icon: <FaFileUpload />, label: "Upload", action: () => uploadRef.current.triggerUpload(), disabled: false },
    { icon: <FaFont />, label: "Font", action: () => setIsFontModalOpen(true), disabled: false },
    { icon: <FaLanguage />, label: "Language", action: () => setIsLanguageModalOpen(true), disabled: false },
    { icon: <FaList />, label: "Templates", action: () => setIsTemplatesModalOpen(true), disabled: false },
  ];

  const memoizedTools = useMemo(
    () =>
      tools.map((tool, idx) => (
        <motion.button
          key={idx}
          onClick={(e) => {
            tool.action(e);
            if (navigator.vibrate) navigator.vibrate(50);
          }}
          disabled={tool.disabled}
          className="relative flex-shrink-0 flex flex-col items-center justify-center min-w-[72px] p-3 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 active:from-purple-800 active:to-purple-900 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-gray-900 snap-center disabled:opacity-50 disabled:cursor-not-allowed"
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1 }}
          aria-label={tool.label}
          role="button"
          tabIndex={0}
        >
          <motion.div
            className="absolute inset-0 rounded-xl bg-purple-500/30 opacity-0"
            animate={tool.disabled ? { opacity: 0 } : { opacity: 0.3 }}
            transition={{ duration: 0.2 }}
          />
          <div className="mb-1.5">{tool.icon}</div>
          <span className="text-xs font-medium truncate">{tool.label}</span>
          <motion.div
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2 py-1 opacity-0 pointer-events-none"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tool.label}
          </motion.div>
        </motion.button>
      )),
    [tools]
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 text-white">
      {/* Main content area */}
      <div className="flex-1 p-6 sm:p-8 md:p-12 pb-24">
        <div className="backdrop-blur-md transition-all duration-500 ease-in-out">
          {/* Note title input */}
          <div className="mb-10 animate-slide-in">
            <label htmlFor="title" className="text-2xl font-bold mb-4 flex items-center text-white tracking-wide">
              <FaBook className="mr-3 text-purple-400 animate-pulse" />
              Note Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={note.title}
              onChange={onChange}
              placeholder="Enter your note title..."
              className={`w-full px-6 py-4 rounded-xl bg-gray-900/50 border-2 border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-400 text-white transition-all duration-300 transform hover:scale-[1.01] ${formError.title ? "border-red-400" : ""}`}
              aria-invalid={formError.title}
              aria-describedby={formError.title ? "title-error" : undefined}
            />
            {formError.title && <p id="title-error" className="text-sm text-red-300 mt-3 animate-pulse">Title is required.</p>}
          </div>

          {/* Description input with editor/canvas tabs */}
          <div className="mb-10 animate-slide-in">
            <label className="text-2xl font-bold mb-4 flex items-center text-white tracking-wide">
              <FaBook className="mr-3 text-purple-400 animate-pulse" />
              {activeTab === "editor" ? "Description" : "Drawing Canvas"}
            </label>
            <div className="flex mb-8 space-x-3">
              <button
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-3xl ${activeTab === "editor" ? "bg-purple-600 text-white shadow-md" : "bg-gray-900/50 text-gray-300 hover:bg-purple-900/50"} active:scale-95`}
                onClick={() => setActiveTab("editor")}
                aria-pressed={activeTab === "editor"}
              >
                Editor
              </button>
              <button
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-3xl ${activeTab === "canvas" ? "bg-purple-600 text-white shadow-md" : "bg-gray-900/50 text-gray-300 hover:bg-purple-900/50"} active:scale-95`}
                onClick={() => setActiveTab("canvas")}
                aria-pressed={activeTab === "canvas"}
              >
                Drawing Canvas
              </button>
            </div>
            {activeTab === "canvas" && (
              <DrawingCanvas
                canvasRef={canvasRef}
                editorHeight={editorHeight}
                clearCanvasTrigger={clearCanvasTrigger}
                setClearCanvasTrigger={setClearCanvasTrigger}
                onCanvasChange={(dataUrl) => {
                  setNote((prev) => ({ ...prev, description: dataUrl ? `<img src="${dataUrl}" alt="Drawing" />` : "" }));
                }}
              />
            )}

            {matchedSuggestions.length > 0 && activeTab === "editor" && (
              <div className="p-5 bg-gray-900/50 rounded-xl mb-6 border-l-4 border-purple-400 animate-slide-in">
                <div className="flex items-start gap-3 mb-3">
                  <FaBook className="text-purple-400 mt-1 animate-pulse" />
                  <p className="text-sm font-bold text-white">AI Suggestions:</p>
                </div>
                {matchedSuggestions.map((match, index) => (
                  <div key={index} className="mb-3 p-4 bg-gray-800/50 rounded-lg transition-transform duration-300 hover:scale-105 hover:shadow-lg animate-fade-in">
                    <p className="text-sm text-gray-200">{match.suggestion}</p>
                    <p className="text-xs text-gray-400">{match.suggestionHindi}</p>
                    <button
                      onClick={() => handleUseSuggestion(match.suggestion)}
                      className="mt-3 px-5 py-2 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transform transition-all duration-300 hover:scale-105"
                    >
                      Use Suggestion
                    </button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "editor" && (
              <Editor
                key={selectedFont.value}
                apiKey="3jfzo13qbx7x4bmhwe8c1l03r6bmgzta97f0anud7iaeuo05"
                id="description"
                value={note.description}
                onInit={(evt, editor) => (editorRef.current = editor)}
                onEditorChange={handleEditorChange}
                init={{
                  height: 600,
                  menubar: "file edit view insert format tools table help",
                  plugins: [
                    "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                    "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                    "insertdatetime", "media", "table", "code", "help", "wordcount", "codesample"
                  ],
                  toolbar:
                    `undo redo | formatselect | bold italic underline strikethrough |
                    fontsizeselect fontselect | forecolor backcolor |
                    alignleft aligncenter alignright alignjustify |
                    bullist numlist outdent indent |
                    link image media codesample blockquote table |
                    removeformat | fullscreen preview code help`,
                  font_formats: fontFormats,
                  content_css: [`https://fonts.googleapis.com/css2?family=${selectedFont.value.replace(/ /g, "+")}&display=swap`],
                  content_style: `body { font-family: '${selectedFont.value}', ${selectedFont.premium ? "cursive" : "sans-serif"}; font-size: 14px; }`,
                  setup: (editor) => {
                    editor.on("init", () => {
                      const link = editor.dom.doc.createElement("link");
                      link.rel = "stylesheet";
                      link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.value.replace(/ /g, "+")}&display=swap`;
                      editor.dom.doc.head.appendChild(link);
                      editor.execCommand("FontName", false, selectedFont.value);
                    });
                    ["keydown", "input"].forEach((evt) =>
                      editor.on(evt, () => editor.execCommand("FontName", false, selectedFont.value))
                    );
                  },
                }}
                className={`w-full rounded-xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400 animate-fade-in ${formError.description ? "border-red-400" : "border-purple-500"}`}
                aria-invalid={formError.description}
                aria-describedby={formError.description ? "description-error" : undefined}
              />
            )}
            {formError.description && activeTab === "editor" && <p id="description-error" className="text-sm text-red-300 mt-3 animate-pulse">Description is required.</p>}
          </div>

          {/* Tag selection */}
          <div className="mb-10 animate-slide-in">
            <label htmlFor="tag" className="text-2xl font-bold mb-4 flex items-center text-white tracking-wide">
              <FaBook className="mr-3 text-purple-400 animate-pulse" />
              Tag
            </label>
            <select
              id="tag"
              name="tag"
              value={note.tag}
              onChange={onChange}
              className={`w-full px-6 py-4 rounded-xl bg-gray-900/50 border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-400 text-white transform hover:scale-[1.01] ${formError.tag ? "border-red-400" : "border-purple-500"}`}
              aria-invalid={formError.tag}
              aria-describedby={formError.tag ? "tag-error" : undefined}
            >
              <option value="" disabled>Select a tag</option>
              {predefinedTags.map((tag, index) => (
                <option key={index} value={tag}>{tag}</option>
              ))}
            </select>
            {formError.tag && <p id="tag-error" className="text-sm text-red-300 mt-3 animate-pulse">Tag is required.</p>}
          </div>

          {/* Form action buttons */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-gray-900/50 text-white rounded-xl shadow-lg hover:bg-gray-800 transform transition-all duration-300 hover:scale-105"
            >
              Reset Form
            </button>
            <button
              onClick={handleClick}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 flex items-center transition-all duration-300 transform hover:scale-105"
              disabled={isSubmitting}
            >
              {isSubmitting && <span className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full mr-2"></span>}
              Add Note
            </button>
          </div>
        </div>
      </div>

      {/* Draggable toolbar for desktop */}
      {!isMobileOrTablet && (
        <div
          ref={navbarRef}
          className={`fixed z-[100] bg-opacity-80  rounded-full transition-all duration-500 ease-in-out ${isDragging ? "cursor-grabbing" : "cursor-grab"} flex items-center justify-center`}
          style={{
            transform: `translate(${navbarPosition.x}px, ${navbarPosition.y}px)`,
          }}
          onMouseDown={(e) => {
            if (e.target.closest("button")) return;
            setIsDragging(true);
          }}
        >
          <AnimatePresence>
            {isNavbarCollapsed ? (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <motion.button
                  onClick={() => setIsNavbarCollapsed(false)}
                  className="p-3 sm:p-4 bg-yellow-300 text-gray-800 rounded-full shadow-lg backdrop-blur-md bg-opacity-80 hover:bg-yellow-400 transition-colors duration-300 tooltip"
                  data-tooltip="Open Tools"
                  whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Expand Navbar"
                >
                  <FaBookOpen size={18} className="animate-pulse" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                className="flex p-1.5 sm:p-2 ml-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-700 border border-white/20"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              >
                {tools.map((tool, index) => (
                  <motion.button
                    key={index}
                    onClick={tool.action}
                    disabled={tool.disabled}
                    className={`p-2 sm:p-3 mx-1 rounded-full ${tool.disabled ? "bg-gray-600 opacity-50" : "bg-transparent hover:bg-purple-500"} text-white transition-colors duration-300 tooltip`}
                    data-tooltip={tool.label}
                    whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={tool.label}
                  >
                    {tool.icon}
                  </motion.button>
                ))}
                <motion.button
                  onClick={() => setIsNavbarCollapsed(true)}
                  className="p-2 sm:p-3 mx-1 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-300 tooltip"
                  data-tooltip="Close Tools"
                  whileHover={{ scale: 1.1, boxShadow: "0 5px 15px rgba(147, 51, 234, 0.3)" }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Collapse Navbar"
                >
                  <FaTimes size={16} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Fixed bottom toolbar for mobile and tablet */}
      {isMobileOrTablet && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-[100]"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="relative bg-gray-900/70 border-t border-gray-700/50 backdrop-blur-lg shadow-2xl pt-3 pb-safe-area-inset-bottom">
            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-gray-500 rounded-full" />
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-gray-900/70 via-gray-900/40 to-transparent pointer-events-none" />
            <div
              className="flex space-x-4 snap-x snap-proximity overflow-x-auto hide-scrollbar scroll-smooth px-5 py-3"
              role="toolbar"
              aria-label="Mobile action toolbar"
            >
              {memoizedTools}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-gray-900/70 via-gray-900/40 to-transparent pointer-events-none" />
          </div>
        </motion.div>
      )}

      {/* Voice input component */}
      <VoiceInput
        ref={voiceInputRef}
        isPremium={isPremium}
        showAlert={showAlert}
        onTranscribe={handleTranscribe}
        onVoiceStateChange={setIsVoiceActive}
        onAIAction={handleAIAction}
      >
        {({ isVoiceOn }) =>
          isVoiceOn &&
          activeTab === "editor" && (
            <div className="mt-4 p-4 bg-gray-900/50 rounded-xl animate-fade-in" role="status" aria-live="polite">
              <span className="text-white text-sm">Listening...</span>
            </div>
          )
        }
      </VoiceInput>

      {/* File upload component */}
      <UploadComponent
        ref={uploadRef}
        onTextExtracted={(text) => {
          setNote((prev) => ({ ...prev, description: prev.description + text }));
          if (editorRef.current && activeTab === "editor") {
            editorRef.current.execCommand("FontName", false, selectedFont.value);
            editorRef.current.insertContent(text);
          }
        }}
        selectedFont={selectedFont}
        showAlert={showAlert}
        isPremium={isPremium}
        getUsageCount={getUsageCount}
        incrementUsageCount={incrementUsageCount}
      />

      {/* AI generation modal */}
      <AIGenerateModal
        isOpen={isAIGenerateModalOpen}
        onClose={() => setIsAIGenerateModalOpen(false)}
        title={note.title}
        selectedFont={selectedFont}
        onAddToNote={(html) => {
          setNote({ ...note, description: html });
          if (editorRef.current && activeTab === "editor") {
            editorRef.current.setContent(html);
          }
          setIsAIGenerateModalOpen(false);
          showAlert("Description generated successfully!", "success");
          if (!isPremium) incrementUsageCount("ai");
        }}
        showAlert={showAlert}
      />

      {/* Font selection modal with glassmorphism */}
      <AnimatePresence>
        {isFontModalOpen && (
          <motion.div
            key="font-modal"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[500] px-4"
            onClick={() => setIsFontModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="font-modal-title"
          >
            <motion.div
              initial={{ scale: 0.95, rotateY: -10 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.95, rotateY: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              ref={fontModalRef}
              tabIndex="-1"
              className="relative bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsFontModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                aria-label="Close font modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 id="font-modal-title" className="text-xl font-semibold text-white mb-4">
                Select Font
              </h2>
              <Select
                options={fontOptions}
                value={selectedFont}
                onChange={(option) => {
                  setSelectedFont(option);
                  setIsFontModalOpen(false);
                }}
                styles={customFontStyles}
                className="w-full"
                placeholder="Select a font"
                isSearchable
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Language selection modal with glassmorphism */}
      <AnimatePresence>
        {isLanguageModalOpen && (
          <motion.div
            key="language-modal"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[500] px-4"
            onClick={() => setIsLanguageModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="language-modal-title"
          >
            <motion.div
              initial={{ scale: 0.95, rotateY: -10 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0.95, rotateY: 10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              ref={languageModalRef}
              tabIndex="-1"
              className="relative bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                aria-label="Close language modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h2 id="language-modal-title" className="text-xl font-semibold text-white mb-4">
                Select Language
              </h2>
              <Select
                options={languageOptions}
                value={selectedLanguage}
                onChange={(option) => setSelectedLanguage(option)}
                styles={customLanguageStyles}
                className="w-full mb-4"
                placeholder="Select a language"
                isSearchable
              />
              <motion.button
                onClick={handleTranslate}
                disabled={!selectedLanguage || isTranslating}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                whileTap={{ scale: 0.95 }}
                aria-label="Translate"
              >
                {isTranslating && <span className="animate-spin h-5 w-5 border-2 border-t-2 border-white rounded-full mr-2"></span>}
                <FaBook className="mr-2" />
                Translate
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template selection modal with glassmorphism */}
<AnimatePresence>
      {isTemplatesModalOpen && (
        <motion.div
          key="templates-modal"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-[1000] px-3"
          onClick={() => setIsTemplatesModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="templates-modal-title"
        >
          <motion.div
            initial={{ scale: 0.97, rotateY: -5 }}
            animate={{ scale: 1, rotateY: 0 }}
            exit={{ scale: 0.97, rotateY: 5 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            ref={templatesModalRef}
            tabIndex="-1"
          className={`relative bg-white/5 backdrop-blur-xl border border-white/15 p-6 rounded-xl shadow-xl w-full ${
  isMobileOrTablet ? "max-w-sm" : "max-w-5xl"
} max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsTemplatesModalOpen(false)}
              className="absolute top-3 right-3 text-gray-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="Close templates modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <NoteTemplates
              onSelectTemplate={handleSelectTemplate}
              isCollapsed={isMobileOrTablet}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Custom styles */}
      <style>{`
        @keyframes slide-in { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s ease-in; }
        @keyframes waveform { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.5); } }
        .animate-waveform { animation: waveform 0.4s infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        @keyframes blink { 50% { opacity: 0; } }
        .animate-blink { animation: blink 1s step-end infinite; }
        @keyframes progress { 0% { width: 0%; } 100% { width: 75%; } }
        .animate-progress { animation: progress 2s ease-in-out infinite; }
        @keyframes spin-pulse { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
        .animate-spin-pulse { animation: spin-pulse 2s linear infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .tooltip {
          position: relative;
        }
        .tooltip::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
          margin-bottom: 8px;
        }
        .tooltip:hover::after {
          opacity: 1;
          visibility: visible;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .pb-safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        .react-select__menu {
          z-index: 1000 !important;
        }
      `}</style>
    </div>
  );
};

export default AddNote;