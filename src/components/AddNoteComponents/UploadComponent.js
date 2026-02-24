import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DOMPurify from 'dompurify';
import { pdfjs } from 'react-pdf';
import heic2any from 'heic2any';
import WaveSurfer from 'wavesurfer.js';
import { FaTimesCircle, FaUpload, FaExclamationTriangle } from 'react-icons/fa';
import Tooltip from 'react-tooltip';
import Mammoth from "mammoth";

let Tesseract = null;

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const MIN_TEXT_ITEMS = 10;
const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY || '730c8b6e986d295243b22747e9e269c99c6e82d2';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_RETRIES = 2;

const supportedFormats = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff', 'image/heic'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'application/epub+zip'],
  audio: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/mpeg', 'audio/flac', 'audio/aac'],
};

const UploadComponent = forwardRef(({ onTextExtracted, selectedFont, showAlert, isPremium, getUsageCount, incrementUsageCount }, ref) => {
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState({ image: false, document: false, audio: false });
  const [processingType, setProcessingType] = useState(null);
  const [fileQueue, setFileQueue] = useState([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [extractedSegments, setExtractedSegments] = useState([]);
  const [confidences, setConfidences] = useState([]);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [telemetry, setTelemetry] = useState({ errors: 0, processingTime: 0, lowConfidenceSegments: 0 });
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('uploadOnboardingShown'));
  const [isTesseractLoaded, setIsTesseractLoaded] = useState(false);

  // Load Tesseract.js for OCR functionality
  useEffect(() => {
    import('tesseract.js').then((module) => {
      Tesseract = module;
      setIsTesseractLoaded(true);
    }).catch(err => {
      console.error('Tesseract.js load error:', err);
      showAlert('Failed to initialize OCR engine. Image processing disabled.', 'danger');
    });
  }, []);

  // Expose triggerUpload method to parent component
  useImperativeHandle(ref, () => ({
    triggerUpload: () => setIsUploadModalOpen(true),
  }));

  // Preprocess image for OCR by resizing and applying filters
  const preprocessImage = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxWidth = 1920;
          const maxHeight = 1080;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          ctx.filter = 'contrast(1.3) brightness(1.1) grayscale(0.5)';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Unable to create processed image blob'));
            }
          }, 'image/png', 0.95);
        };
        img.onerror = () => reject(new Error('Unable to load image for preprocessing'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Unable to read image file'));
      reader.readAsDataURL(file);
    });
  };

  // Process a single PDF page to extract text or perform OCR
  const processPdfPage = async (page, pageNum, totalPages) => {
    const startTime = performance.now();
    let html = '';
    let confidence = 1.0;

    try {
      const textContent = await page.getTextContent();
      if (textContent.items.length > MIN_TEXT_ITEMS) {
        const lines = [];
        let currentLine = [];
        let lastY = null;
        let lastX = null;
        let lastFontSize = null;

        for (const item of textContent.items) {
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          const fontSize = item.height || 12;

          if (lastY !== null && (Math.abs(y - lastY) > 5 || Math.abs(x - lastX) > 100)) {
            if (currentLine.length) {
              const lineText = currentLine.join(' ').trim();
              if (lineText) {
                const tag = lastFontSize > 16 ? 'h2' : lastFontSize > 14 ? 'h3' : 'p';
                lines.push(`<${tag} style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0;">${DOMPurify.sanitize(lineText)}</${tag}>`);
              }
              currentLine = [];
            }
          }
          if (item.str.trim()) currentLine.push(item.str);
          lastY = y;
          lastX = x;
          lastFontSize = fontSize;
        }
        if (currentLine.length) {
          const lineText = currentLine.join(' ').trim();
          if (lineText) {
            const tag = lastFontSize > 16 ? 'h2' : lastFontSize > 14 ? 'h3' : 'p';
            lines.push(`<${tag} style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0;">${DOMPurify.sanitize(lineText)}</${tag}>`);
          }
        }
        html = lines.join('');
      } else {
        if (!isTesseractLoaded) {
          throw new Error('OCR engine not loaded');
        }
        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        const { data: { text: ocrText, confidence: ocrConfidence } } = await Tesseract.recognize(canvas, 'eng', {
          tessedit_ocr_engine_mode: Tesseract.OEM?.LSTM_ONLY || 1,
          tessedit_pageseg_mode: Tesseract.PSM?.AUTO || 3,
        });
        confidence = ocrConfidence / 100;
        if (ocrText.trim() && confidence > 0.5) {
          const paragraphs = ocrText
            .split('\n')
            .filter(line => line.trim())
            .map(line => `<p style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0;">${DOMPurify.sanitize(line.trim())}</p>`);
          html = paragraphs.join('');
        } else {
          throw new Error('No readable text extracted from this page');
        }
      }

      setProgress(((pageNum + 1) / totalPages) * 100);
      const processingTime = performance.now() - startTime;
      setTelemetry(prev => ({
        ...prev,
        processingTime: prev.processingTime + processingTime,
        lowConfidenceSegments: prev.lowConfidenceSegments + (confidence < 0.7 ? 1 : 0),
      }));

      return { html, confidence };
    } catch (error) {
      setTelemetry(prev => ({ ...prev, errors: prev.errors + 1 }));
      throw new Error(`Page ${pageNum + 1} processing failed: ${error.message}`);
    }
  };

  // Process uploaded file based on its type
  const processFile = async (file, type, retryCount = 0) => {
    const startTime = performance.now();
    const isImage = supportedFormats.image.includes(file.type);
    const isDocument = supportedFormats.document.includes(file.type);
    const isAudio = supportedFormats.audio.includes(file.type);
    const usageType = isImage ? 'image' : isDocument ? 'document' : 'audio';

    if (!isImage && !isDocument && !isAudio) {
      showAlert('Unsupported file format. Please upload an image, document, or audio file.', 'warning');
      return;
    }

    if (!Object.values(supportedFormats).flat().includes(file.type)) {
      showAlert(`Unsupported ${usageType} format. Supported: ${supportedFormats[usageType].join(', ')}.`, 'warning');
      return;
    }

    if (!isPremium && getUsageCount(usageType) >= 2) {
      showAlert(`Free ${usageType} uploads exhausted. Upgrade to continue.`, 'warning');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showAlert('File too large. Maximum size is 5MB.', 'warning');
      return;
    }

    if (isImage && !isTesseractLoaded && retryCount < MAX_RETRIES) {
      showAlert('OCR engine not ready. Retrying...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return processFile(file, type, retryCount + 1);
    }

    setIsProcessing(prev => ({ ...prev, [usageType]: true }));
    setProcessingType(usageType);
    setProgress(0);
    setExtractedSegments([]);
    setConfidences([]);

    try {
      let htmlContent = '';
      let finalConfidence = 1.0;

      if (isImage) {
        if (!isTesseractLoaded) {
          throw new Error('OCR engine not loaded. Please try again later.');
        }
        let processedFile = file;
        if (file.type === 'image/heic') {
          const convertedBlob = await heic2any({ blob: file, toType: 'image/png' });
          processedFile = new File([convertedBlob], file.name.replace('.heic', '.png'), { type: 'image/png' });
        }
        const canvasBlob = await preprocessImage(processedFile);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = URL.createObjectURL(canvasBlob);
        });
        const { data: { text: ocrText, confidence: ocrConfidence } } = await Tesseract.recognize(canvas, 'eng', {
          tessedit_ocr_engine_mode: Tesseract.OEM?.LSTM_ONLY || 1,
          tessedit_pageseg_mode: Tesseract.PSM?.AUTO || 3,
        });
        finalConfidence = ocrConfidence / 100;
        if (!ocrText.trim()) {
          if (retryCount < MAX_RETRIES) {
            showAlert('Retrying image processing...', 'info');
            return processFile(file, type, retryCount + 1);
          }
          throw new Error('No text detected in the image. Try a higher quality image.');
        }
        if (finalConfidence < 0.5 && retryCount < MAX_RETRIES) {
          showAlert('Retrying image processing due to low confidence...', 'info');
          return processFile(file, type, retryCount + 1);
        }
        if (finalConfidence < 0.5) {
          throw new Error('Low confidence in text detection. Try a clearer image.');
        }
        const paragraphs = ocrText
          .split('\n')
          .filter(line => line.trim())
          .map(line => `<p style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0;">${DOMPurify.sanitize(line.trim())}</p>`);
        htmlContent = paragraphs.join('');
        setExtractedSegments([htmlContent]);
        setConfidences([finalConfidence]);
        showAlert(`Text extracted successfully! (Confidence: ${(finalConfidence * 100).toFixed(0)}%)`, 'success');
      } else if (isDocument) {
        if (file.type === 'application/pdf') {
          const pdf = await pdfjs.getDocument(URL.createObjectURL(file)).promise;
          const totalPages = pdf.numPages;
          const results = [];
          for (let i = 0; i < totalPages; i++) {
            const page = await pdf.getPage(i + 1);
            const result = await processPdfPage(page, i, totalPages);
            if (result.html) results.push(result);
          }
          if (results.length === 0) {
            if (retryCount < MAX_RETRIES) {
              showAlert('Retrying PDF processing...', 'info');
              return processFile(file, type, retryCount + 1);
            }
            throw new Error('No text extracted from PDF.');
          }
          htmlContent = results.map(r => r.html).join('');
          finalConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
          setExtractedSegments([htmlContent]);
          setConfidences([finalConfidence]);
          showAlert('PDF processed successfully!', 'success');
        } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
          const text = await file.text();
          if (!text.trim()) {
            if (retryCount < MAX_RETRIES) {
              showAlert('Retrying text processing...', 'info');
              return processFile(file, type, retryCount + 1);
            }
            throw new Error('No content in text file.');
          }
          htmlContent = `<p style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0;">${DOMPurify.sanitize(text)}</p>`;
          setExtractedSegments([htmlContent]);
          setConfidences([1.0]);
          showAlert('Text file processed successfully!', 'success');
        } else if (file.type === 'application/epub+zip') {
          showAlert('ePub processing requires server-side support. Please contact support.', 'warning');
          return;
        } else {
          const result = await Mammoth.convertToHtml({
            arrayBuffer: await file.arrayBuffer(),
            styleMap: [
              "p[style-name='Title'] => h1:fresh",
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "b => strong",
              "i => em",
            ],
          });
          let docHtml = result.value.trim();
          if (!docHtml && retryCount < MAX_RETRIES) {
            showAlert('Retrying document processing...', 'info');
            return processFile(file, type, retryCount + 1);
          }
          if (!docHtml) {
            throw new Error('No content extracted from the document.');
          }
          docHtml = docHtml.replace(/<([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
            const styleAttr = attrs.match(/style="([^"]*)"/);
            const existingStyle = styleAttr ? styleAttr[1] : '';
            const newStyle = `font-family: '${selectedFont.value}'; ${existingStyle}`;
            return `<${tag} ${attrs.replace(/style="[^"]*"/, '')} style="${newStyle}">`;
          });
          htmlContent = docHtml;
          setExtractedSegments([htmlContent]);
          setConfidences([1.0]);
          showAlert('Document processed successfully!', 'success');
        }
      } else if (isAudio) {
        if (!DEEPGRAM_API_KEY || DEEPGRAM_API_KEY === 'YOUR_API_KEY') {
          showAlert('Deepgram API key is missing. Audio transcription disabled.', 'warning');
          return;
        }
        const cacheKey = `audio_${file.name}_${file.size}`;
        const cachedResult = localStorage.getItem(cacheKey);
        if (cachedResult) {
          const { text, confidence } = JSON.parse(cachedResult);
          htmlContent = `<p style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0;">${DOMPurify.sanitize(text)}</p>`;
          setExtractedSegments([htmlContent]);
          setConfidences([confidence]);
          showAlert('Audio transcribed successfully (from cache)!', 'success');
        } else {
          const response = await fetch(`https://api.deepgram.com/v1/listen?punctuate=true&model=general&language=en`, {
            method: 'POST',
            headers: {
              Authorization: `Token ${DEEPGRAM_API_KEY}`,
              'Content-Type': file.type,
            },
            body: file,
          });
          if (!response.ok) {
            if (retryCount < MAX_RETRIES) {
              showAlert('Retrying audio transcription...', 'info');
              return processFile(file, type, retryCount + 1);
            }
            throw new Error('Audio transcription failed.');
          }
          const data = await response.json();
          const text = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
          finalConfidence = data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.9;
          if (!text.trim()) {
            throw new Error('No text detected in the audio.');
          }
          htmlContent = `<p style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0;">${DOMPurify.sanitize(text)}</p>`;
          setExtractedSegments([htmlContent]);
          setConfidences([finalConfidence]);
          localStorage.setItem(cacheKey, JSON.stringify({ text, confidence: finalConfidence }));
          showAlert('Audio transcribed successfully!', 'success');
        }
      }

      if (htmlContent) {
        onTextExtracted(htmlContent);
        if (!isPremium) incrementUsageCount(usageType);
        setHistory(prev => [...prev.slice(0, historyIndex + 1), { segments: extractedSegments, confidences }]);
        setHistoryIndex(prev => prev + 1);
      }

      const processingTime = performance.now() - startTime;
      setTelemetry(prev => ({
        ...prev,
        processingTime: prev.processingTime + processingTime,
        lowConfidenceSegments: prev.lowConfidenceSegments + (finalConfidence < 0.7 ? 1 : 0),
      }));
    } catch (error) {
      setTelemetry(prev => ({ ...prev, errors: prev.errors + 1 }));
      showAlert(`Failed to process ${usageType}: ${error.message}`, 'danger', {
        details: error.stack,
        retry: retryCount < MAX_RETRIES ? () => processFile(file, type, retryCount + 1) : null,
      });
    } finally {
      setIsProcessing(prev => ({ ...prev, [usageType]: false }));
      setProcessingType(null);
    }
  };

  // Component for editing extracted text with formatting options
  const EditableParagraph = ({ initialText, index, confidence }) => {
    const [text, setText] = useState(initialText);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);

    const handleChange = (e) => {
      const newText = e.target.value;
      setText(newText);
      setExtractedSegments(prev => {
        const updated = [...prev];
        updated[index] = `<p style="font-family: '${selectedFont.value}'; margin: 0 0 1em 0; ${isBold ? 'font-weight: bold;' : ''}${isItalic ? 'font-style: italic;' : ''}">${DOMPurify.sanitize(newText)}</p>`;
        return updated;
      });
      setHistory(prev => [...prev.slice(0, historyIndex + 1), { segments: extractedSegments, confidences }]);
      setHistoryIndex(prev => prev + 1);
    };

    return (
      <div className="relative p-3 sm:p-4 bg-gray-800/30 backdrop-blur-md rounded-lg shadow-md mb-3 sm:mb-4">
        <div className="flex space-x-2 mb-2">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`p-1.5 sm:p-2 rounded ${isBold ? 'bg-purple-600' : 'bg-gray-700'} text-white text-sm sm:text-base`}
            aria-label="Toggle Bold"
          >
            <b>B</b>
          </button>
          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`p-1.5 sm:p-2 rounded ${isItalic ? 'bg-purple-600' : 'bg-gray-700'} text-white text-sm sm:text-base`}
            aria-label="Toggle Italic"
          >
            <i>I</i>
          </button>
        </div>
        <textarea
          value={text}
          onChange={handleChange}
          className="w-full p-2 sm:p-3 border border-gray-600 rounded-lg bg-gray-900 text-white resize-y text-sm sm:text-base"
          rows={Math.max(2, text.split('\n').length)}
          aria-label={`Edit extracted text segment ${index + 1}`}
        />
        {confidence < 0.7 && (
          <span
            className="absolute top-2 right-2 text-yellow-500 flex items-center text-xs sm:text-sm"
            data-tooltip-id={`confidence-tooltip-${index}`}
            data-tooltip-content={`OCR confidence is ${(confidence * 100).toFixed(0)}%. Consider reviewing this text.`}
          >
            <FaExclamationTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Low Confidence ({(confidence * 100).toFixed(0)}%)
            <Tooltip id={`confidence-tooltip-${index}`} />
          </span>
        )}
      </div>
    );
  };

  // Handle file preview for images, PDFs, and audio
  const handleFilePreview = (file) => {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (waveSurfer) waveSurfer.destroy();
    setWaveSurfer(null);

    if (supportedFormats.image.includes(file.type) || file.type === 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(file));
    } else if (supportedFormats.audio.includes(file.type)) {
      const ws = WaveSurfer.create({
        container: waveSurferRef.current,
        waveColor: '#9333ea',
        progressColor: '#7e22ce',
        height: 80, // Reduced for mobile
      });
      ws.load(URL.createObjectURL(file));
      setWaveSurfer(ws);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Process file queue and clean up resources
  useEffect(() => {
    if (currentFileIndex >= 0 && currentFileIndex < fileQueue.length) {
      const file = fileQueue[currentFileIndex];
      handleFilePreview(file);
      processFile(file, file.type.startsWith('audio') ? 'audio' : 'imageOrDoc').then(() => {
        setCurrentFileIndex(prev => prev + 1);
      });
    } else if (currentFileIndex >= fileQueue.length && fileQueue.length > 0) {
      setFileQueue([]);
      setCurrentFileIndex(-1);
      setPreviewUrl(null);
      if (waveSurfer) waveSurfer.destroy();
      setWaveSurfer(null);
    }
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (waveSurfer) waveSurfer.destroy();
    };
  }, [currentFileIndex, fileQueue]);

  // Undo changes to extracted text
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setExtractedSegments(history[historyIndex - 1].segments);
      setConfidences(history[historyIndex - 1].confidences);
    }
  };

  // Redo changes to extracted text
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setExtractedSegments(history[historyIndex + 1].segments);
      setConfidences(history[historyIndex + 1].confidences);
    }
  };

  // Close onboarding message and save state
  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('uploadOnboardingShown', 'true');
  };

  // Handle file upload from input
  const handleFileUpload = (event, type = 'unknown') => {
    const files = Array.from(event.target.files);
    files.forEach(file => handleFilePreview(file));
    setFileQueue(prev => [...prev, ...files]);
    setCurrentFileIndex(0);
    setIsUploadModalOpen(false);
  };

  // Handle drag and drop file upload
  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files);
    files.forEach(file => handleFilePreview(file));
    setFileQueue(prev => [...prev, ...files]);
    setCurrentFileIndex(0);
  };

  return (
    <>
      <input
        type="file"
        accept={Object.values(supportedFormats).flat().join(',')}
        ref={fileInputRef}
        multiple
        onChange={e => handleFileUpload(e, 'imageOrDoc')}
        className="hidden"
        aria-label="Upload image or document"
      />
      <input
        type="file"
        accept="audio/*"
        ref={audioInputRef}
        multiple
        onChange={e => handleFileUpload(e, 'audio')}
        className="hidden"
        aria-label="Upload audio"
      />
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-[500] p-2 sm:p-4"
            onClick={() => setIsUploadModalOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="relative bg-gray-900/20 backdrop-blur-xl p-4 sm:p-6 rounded-2xl shadow-4xl w-full max-w-[90vw] sm:max-w-md border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="absolute top-3 right-3 text-gray-300 hover:text-white transition-colors"
                aria-label="Close upload modal"
              >
                <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <h2 id="upload-modal-title" className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 flex items-center">
                <FaUpload className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400 animate-pulse" />
                Upload & Extract
              </h2>
              <div
                onDragOver={e => e.preventDefault()}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed p-4 sm:p-6 mb-3 sm:mb-4 text-center rounded-lg transition-all duration-300 ${isDragging ? 'border-purple-500 bg-purple-900/10' : 'border-gray-500 bg-gray-800/20'}`}
                role="region"
                aria-label="Drag and drop files here"
              >
                <motion.div
                  animate={{ y: isDragging ? -5 : 0 }}
                  className="flex flex-col items-center"
                >
                  <FaUpload className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400 mb-2 animate-bounce" />
                  <p className="text-gray-200 text-base sm:text-lg">{isDragging ? 'Drop your files here' : 'Drag and drop or click to select'}</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Supported: Images, PDFs, DOC/DOCX, TXT, MD, ePub, Audio (max 5MB)</p>
                </motion.div>
              </div>
              {previewUrl && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-800/20 backdrop-blur-md rounded-lg max-h-[40vh] overflow-y-auto">
                  {supportedFormats.image.includes(fileQueue[currentFileIndex]?.type) && (
                    <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-[30vh] rounded-lg object-contain" />
                  )}
                  {fileQueue[currentFileIndex]?.type === 'application/pdf' && (
                    <iframe src={previewUrl} className="w-full h-[30vh] sm:h-64 rounded-lg" title="PDF Preview" />
                  )}
                  {supportedFormats.audio.includes(fileQueue[currentFileIndex]?.type) && (
                    <div ref={waveSurferRef} className="w-full h-20 sm:h-32" aria-label="Audio waveform preview" />
                  )}
                </div>
              )}
              <div className="flex flex-col sm:flex-row justify-between mt-3 sm:mt-4 gap-2 sm:gap-4">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                  aria-label="Select Image or Document"
                >
                  Image/Doc
                </button>
                <button
                  onClick={() => audioInputRef.current.click()}
                  className="px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                  aria-label="Select Audio"
                >
                  Audio
                </button>
              </div>
              {showOnboarding && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gray-800/20 backdrop-blur-md rounded-lg text-xs sm:text-sm text-gray-300"
                >
                  <p>Welcome! Drag files here or click to upload. Extract text from images, documents, or transcribe audio.</p>
                  <button
                    onClick={handleOnboardingClose}
                    className="mt-1 sm:mt-2 text-purple-400 hover:text-purple-500 text-xs sm:text-sm"
                    aria-label="Close onboarding message"
                  >
                    Got it!
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {Object.values(isProcessing).some(v => v) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-md z-[1000] p-2 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="processing-modal-title"
          >
            <div className="bg-gray-900/20 backdrop-blur-xl p-4 sm:p-8 rounded-2xl shadow-4xl w-full max-w-[90vw] sm:max-w-md border border-white/10">
              <h2 id="processing-modal-title" className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mr-2 sm:mr-3 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z" />
                </svg>
                Processing {processingType}
              </h2>
              <div className="relative w-full h-24 sm:h-32 flex items-center justify-center">
                <svg className="w-16 h-16 sm:w-24 sm:h-24">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40"
                    stroke="#4b0082"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="40"
                    stroke="#9333ea"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - progress / 100)}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-lg sm:text-2xl text-white font-bold">{Math.round(progress)}%</span>
              </div>
              <p className="text-gray-200 text-center mt-3 sm:mt-4 text-sm sm:text-base" aria-live="polite">
                {fileQueue.length > 1 ? `Processing file ${currentFileIndex + 1} of ${fileQueue.length}` : `Extracting content...`}
              </p>
              {extractedSegments.length > 0 && (
                <div className="mt-4 sm:mt-6 max-h-[50vh] overflow-y-auto p-3 sm:p-4 bg-gray-800/20 backdrop-blur-md rounded-lg">
                  {extractedSegments.map((segment, index) => (
                    <EditableParagraph
                      key={index}
                      initialText={segment.replace(/<[^>]+>/g, '')}
                      index={index}
                      confidence={confidences[index] || 1.0}
                    />
                  ))}
                  <div className="flex flex-col sm:flex-row justify-between mt-3 sm:mt-4 gap-2 sm:gap-4">
                    <button
                      onClick={handleUndo}
                      disabled={historyIndex === 0}
                      className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm sm:text-base"
                      aria-label="Undo changes"
                    >
                      Undo
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg disabled:opacity-50 hover:bg-gray-700 text-sm sm:text-base"
                      aria-label="Redo changes"
                    >
                      Redo
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  setFileQueue([]);
                  setCurrentFileIndex(-1);
                  setIsProcessing(prev => ({ ...prev, [processingType]: false }));
                  setProcessingType(null);
                }}
                className="mt-3 sm:mt-4 w-full px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base"
                aria-label="Cancel processing"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-pulse {
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .shadow-4xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        @media (max-width: 640px) {
          .text-sm {
            font-size: 0.75rem;
          }
          .text-base {
            font-size: 0.875rem;
          }
          .text-lg {
            font-size: 1rem;
          }
          .text-xl {
            font-size: 1.125rem;
          }
          .text-2xl {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </>
  );
});

export default UploadComponent;