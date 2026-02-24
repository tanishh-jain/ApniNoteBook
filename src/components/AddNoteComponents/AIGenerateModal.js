import React, { useState, useRef } from 'react';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import Select from 'react-select';

const AIGenerateModal = ({ isOpen, onClose, title, selectedFont, onAddToNote, showAlert, existingNotes = [] }) => {
  const [format, setFormat] = useState('paragraphs');
  const [tone, setTone] = useState('formal');
  const [length, setLength] = useState('standard');
  const [purpose, setPurpose] = useState('general');
  const [language, setLanguage] = useState('English');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [activeDescription, setActiveDescription] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [prompt, setPrompt] = useState('');
  const modalRef = useRef(null);
  const cacheRef = useRef(new Map());

  // Define dropdown options for customization
  const formatOptions = [
    { value: 'bullet-points', label: 'Bullet Points' },
    { value: 'paragraphs', label: 'Paragraphs' },
    { value: 'numbered-list', label: 'Numbered List' },
    { value: 'pros-cons', label: 'Pros and Cons' },
    { value: 'action-plan', label: 'Action Plan' },
  ];

  const toneOptions = [
    { value: 'formal', label: 'Formal' },
    { value: 'casual', label: 'Casual' },
    { value: 'technical', label: 'Technical' },
    { value: 'friendly', label: 'Friendly' },
  ];

  const lengthOptions = [
    { value: 'concise', label: 'Concise (~100 words)' },
    { value: 'standard', label: 'Standard (~250 words)' },
    { value: 'detailed', label: 'Detailed (~500 words)' },
  ];

  const purposeOptions = [
    { value: 'general', label: 'General' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'brainstorming', label: 'Brainstorming' },
    { value: 'report', label: 'Report' },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
  ];

  // Styles for react-select dropdowns with responsive design
  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: '#1F2937/20',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0.375rem',
      color: '#F3F4F6',
      padding: '0.25rem',
      fontSize: '14px',
      minHeight: '40px',
      boxShadow: 'none',
      backdropFilter: 'blur(10px)',
      '&:hover': { borderColor: '#7C3AED' },
      '&:focus': { borderColor: '#7C3AED', boxShadow: '0 0 0 2px rgba(124, 58, 237, 0.2)' },
    }),
    singleValue: (base) => ({ ...base, color: '#F3F4F6', fontSize: '14px' }),
    placeholder: (base) => ({ ...base, color: '#9CA3AF', fontSize: '14px' }),
    menu: (base) => ({
      ...base,
      backgroundColor: '#1F2937/20',
      borderRadius: '0.375rem',
      marginTop: '2px',
      width: '100%',
      maxHeight: '200px',
      overflowY: 'auto',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 1000,
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected ? '#7C3AED' : isFocused ? '#374151/50' : '#1F2937/20',
      color: '#F3F4F6',
      padding: '0.5rem 1rem',
      fontSize: '14px',
      '&:active': { backgroundColor: '#6B7280' },
    }),
  };

  // Convert raw text to formatted HTML based on selected format
  const processTextToHtml = (text, format) => {
    const fontStyle = `font-family: '${selectedFont.value}';`;
    let processedText = DOMPurify.sanitize(
      text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<i>$1</i>')
    );

    if (format === 'bullet-points') {
      const lines = processedText.split('\n').filter((line) => line.trim().startsWith('-') || line.trim());
      const bulletPoints = lines.map((line) => line.trim().replace(/^-/, '').trim()).filter(Boolean);
      return `<ul style="${fontStyle} list-style-type: disc; margin-left: 1.5rem;">${bulletPoints
        .map((point) => `<li>${point}</li>`)
        .join('')}</ul>`;
    } else if (format === 'paragraphs') {
      const paragraphs = processedText.split('\n\n').map((p) => p.trim()).filter(Boolean);
      return paragraphs.map((p) => `<p style="${fontStyle} margin-bottom: 1rem;">${p}</p>`).join('');
    } else if (format === 'numbered-list') {
      const lines = processedText.split('\n').filter((line) => line.trim().startsWith(/\d+\./) || line.trim());
      const listItems = lines.map((line) => line.trim().replace(/^\d+\.\s*/, '')).filter(Boolean);
      return `<ol style="${fontStyle} list-style-type: decimal; margin-left: 1.5rem;">${listItems
        .map((item) => `<li>${item}</li>`)
        .join('')}</ol>`;
    } else if (format === 'pros-cons') {
      const [prosSection, consSection] = processedText.split(/(Cons:|### Cons)/i);
      const pros = prosSection?.replace(/Pros:|### Pros/i, '').trim().split('\n').filter(Boolean);
      const cons = consSection?.trim().split('\n').filter(Boolean) || [];
      return `<div style="${fontStyle}">
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Pros</h3>
        <ul style="list-style-type: disc; margin-left: 1.5rem;">${pros
          .map((item) => `<li>${item.replace(/^-/, '').trim()}</li>`)
          .join('')}
        </ul>
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; margin-top: 1rem;">Cons</h3>
        <ul style="list-style-type: disc; margin-left: 1.5rem;">${cons
          .map((item) => `<li>${item.replace(/^-/, '').trim()}</li>`)
          .join('')}
        </ul>
      </div>`;
    } else if (format === 'action-plan') {
      const steps = processedText.split('\n').filter((line) => line.trim().startsWith('-') || line.trim());
      const actionItems = steps.map((step) => step.trim().replace(/^-/, '').trim()).filter(Boolean);
      return `<div style="${fontStyle}">
        <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">Action Plan</h3>
        <ul style="list-style-type: disc; margin-left: 1.5rem;">${actionItems
          .map((item) => `<li>${item}</li>`)
          .join('')}
        </ul>
      </div>`;
    }
    return `<p style="${fontStyle} margin-bottom: 1rem;">${processedText}</p>`;
  };

  // Build prompt for AI generation
  const constructPrompt = () => {
    const lengthInstruction = lengthOptions.find((opt) => opt.value === length)?.label || 'Standard';
    const formatInstruction = formatOptions.find((opt) => opt.value === format)?.label || 'Paragraphs';
    const toneInstruction = toneOptions.find((opt) => opt.value === tone)?.label || 'Formal';
    const purposeInstruction = purposeOptions.find((opt) => opt.value === purpose)?.label || 'General';
    const languageInstruction = languageOptions.find((opt) => opt.value === language)?.label || 'English';
    const contextFromNotes = existingNotes.length
      ? `Context from existing notes: ${existingNotes.map((n) => n.title).join(', ')}. `
      : '';

    return `Generate a ${lengthInstruction.toLowerCase()} description in ${languageInstruction} for a note titled "${title}" intended for ${purposeInstruction.toLowerCase()}. Use a ${toneInstruction.toLowerCase()} tone and format the content as ${formatInstruction.toLowerCase()}. ${contextFromNotes}Include actionable steps, key points, and relevant insights. ${additionalInstructions ? 'Additional instructions: ' + additionalInstructions : ''}`;
  };

  // Build prompt for improving existing description
  const constructImprovementPrompt = (userPrompt) => {
    const formatInstruction = formatOptions.find((opt) => opt.value === format)?.label || 'Paragraphs';
    return `Refine the following description based on: "${userPrompt}". Format as ${formatInstruction.toLowerCase()}. Current description: "${activeDescription.text}"`;
  };

  // Fetch AI-generated description with caching
  const generateDescription = async (prompt, format, n = 1) => {
    const cacheKey = `${prompt}-${format}-${n}`;
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    const API_URL = "https://openrouter.ai/api/v1/chat/completions";
    const API_KEY =
      process.env.REACT_APP_OPENROUTER_API_KEY ||
      "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";

    const maxTokens = {
      concise: 200,
      standard: 500,
      detailed: 1000,
    }[length] || 500;

    const payload = {
      model: "mistralai/mixtral-8x7b-instruct",
      messages: [
        { role: "system", content: `You are a helpful assistant generating note descriptions in ${languageOptions.find((opt) => opt.value === language)?.label || 'English'}.` },
        { role: "user", content: prompt.slice(0, 1000) },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
      top_p: 0.9,
      n,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      const options = data.choices.map((choice) => ({
        text: choice.message.content,
        html: processTextToHtml(choice.message.content, format),
      }));
      cacheRef.current.set(cacheKey, options);
      return options;
    } catch (error) {
      throw new Error(`Generation failed: ${error.message}`);
    }
  };

  // Generate new description
  const generateText = async () => {
    setIsGenerating(true);
    try {
      const prompt = constructPrompt();
      const options = await generateDescription(prompt, format, 1);
      setActiveDescription(options[0]);
    } catch (error) {
      showAlert("Failed to generate description.", "danger");
    } finally {
      setIsGenerating(false);
    }
  };

  // Refine description with user prompt
  const handleImproveWithPrompt = async () => {
    if (!prompt.trim()) {
      showAlert("Please enter a refinement prompt.", "warning");
      return;
    }
    setIsGenerating(true);
    try {
      const improvementPrompt = constructImprovementPrompt(prompt);
      const improved = await generateDescription(improvementPrompt, format, 1);
      setActiveDescription(improved[0]);
      setPrompt('');
    } catch (error) {
      showAlert("Failed to improve description.", "danger");
    } finally {
      setIsGenerating(false);
    }
  };

  // Process text for summarization or expansion
  const handleTextProcessing = async (action) => {
    if (!activeDescription) {
      showAlert("No description to process.", "warning");
      return;
    }
    setIsGenerating(true);
    try {
      const processingPrompt = `${action} this description in ${languageOptions.find((opt) => opt.value === language)?.label || 'English'} as ${formatOptions.find((opt) => opt.value === format)?.label || 'Paragraphs'}: "${activeDescription.text}"`;
      const processed = await generateDescription(processingPrompt, format, 1);
      setActiveDescription(processed[0]);
    } catch (error) {
      showAlert(`Failed to ${action.toLowerCase()} description.`, "danger");
    } finally {
      setIsGenerating(false);
    }
  };

  // Enable editing of generated text
  const handleEdit = () => {
    setEditedText(activeDescription.text);
    setIsEditing(true);
  };

  // Save edited text
  const handleSaveEdit = () => {
    const newText = editedText;
    const newHtml = processTextToHtml(newText, format);
    setActiveDescription({ text: newText, html: newHtml });
    setIsEditing(false);
  };

  // Cancel editing
  const handleCancelEdit = () => setIsEditing(false);

  // Add generated description to note
  const handleAddToNote = () => {
    onAddToNote(activeDescription.html);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-[500] p-2 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            ref={modalRef}
            className="relative bg-gray-900/20 backdrop-blur-xl p-4 sm:p-6 rounded-xl shadow-4xl w-full max-w-[90vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto text-white scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700 border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-2xl font-bold">AI-Generated Description</h2>
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-white transition-colors p-2"
                aria-label="Close modal"
              >
                <FaTimes className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="mb-4 sm:mb-6 bg-gray-800/20 backdrop-blur-md p-4 rounded-lg min-h-[150px] sm:min-h-[200px] max-h-[250px] sm:max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-600 scrollbar-track-gray-700">
              {isGenerating ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : isEditing ? (
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full h-[150px] sm:h-[200px] p-3 border border-gray-600 rounded bg-gray-700/20 backdrop-blur-md text-white text-sm sm:text-base focus:outline-none focus:border-purple-500"
                  aria-label="Edit description"
                />
              ) : activeDescription ? (
                <div
                  dangerouslySetInnerHTML={{ __html: activeDescription.html }}
                  className="prose prose-invert max-w-none text-sm sm:text-base"
                />
              ) : (
                <p className="text-gray-400 text-sm sm:text-base">Generate a description to get started.</p>
              )}
            </div>

            <div className="mb-4 sm:mb-6 bg-gray-800/20 backdrop-blur-md p-4 rounded-lg">
              <h3 className="text-base sm:text-lg font-semibold mb-3">Customize Your Description</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <Select
                  options={formatOptions}
                  value={formatOptions.find((opt) => opt.value === format)}
                  onChange={(opt) => setFormat(opt.value)}
                  styles={customSelectStyles}
                  placeholder="Format"
                  aria-label="Select format"
                />
                <Select
                  options={toneOptions}
                  value={toneOptions.find((opt) => opt.value === tone)}
                  onChange={(opt) => setTone(opt.value)}
                  styles={customSelectStyles}
                  placeholder="Tone"
                  aria-label="Select tone"
                />
                <Select
                  options={lengthOptions}
                  value={lengthOptions.find((opt) => opt.value === length)}
                  onChange={(opt) => setLength(opt.value)}
                  styles={customSelectStyles}
                  placeholder="Length"
                  aria-label="Select length"
                />
                <Select
                  options={purposeOptions}
                  value={purposeOptions.find((opt) => opt.value === purpose)}
                  onChange={(opt) => setPurpose(opt.value)}
                  styles={customSelectStyles}
                  placeholder="Purpose"
                  aria-label="Select purpose"
                />
                <Select
                  options={languageOptions}
                  value={languageOptions.find((opt) => opt.value === language)}
                  onChange={(opt) => setLanguage(opt.value)}
                  styles={customSelectStyles}
                  placeholder="Language"
                  aria-label="Select language"
                />
              </div>
              <textarea
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder="Additional instructions or context (e.g., tags, keywords)"
                className="w-full p-3 border border-gray-600 rounded bg-gray-700/20 backdrop-blur-md text-white text-sm sm:text-base focus:outline-none focus:border-purple-500 transition-colors mb-3 sm:mb-4"
                rows="3"
                aria-label="Additional instructions"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Refine description (e.g., 'make it simpler')"
                  className="flex-1 p-3 border border-gray-600 rounded bg-gray-700/20 backdrop-blur-md text-white text-sm sm:text-base focus:outline-none focus:border-purple-500"
                  aria-label="Refine prompt"
                />
                <button
                  onClick={handleImproveWithPrompt}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-500 text-sm sm:text-base"
                  disabled={!prompt.trim() || isGenerating}
                >
                  Refine
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base"
                  >
                    Save
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
                    <button
                      onClick={generateText}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-500 text-sm sm:text-base"
                      disabled={isGenerating}
                    >
                      Generate
                    </button>
                    <button
                      onClick={() => handleTextProcessing('Summarize')}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-500 text-sm sm:text-base"
                      disabled={isGenerating || !activeDescription}
                    >
                      Summarize
                    </button>
                    <button
                      onClick={() => handleTextProcessing('Expand')}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-500 text-sm sm:text-base"
                      disabled={isGenerating || !activeDescription}
                    >
                      Expand
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
                    {activeDescription && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm sm:text-base"
                        >
                          Edit
                        </button>
                        <button
                          onClick={handleAddToNote}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base"
                        >
                          Add to Note
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIGenerateModal;