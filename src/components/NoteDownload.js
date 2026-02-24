import React, { useState } from "react";
import { motion } from "framer-motion";
import html2pdf from "html2pdf.js";
import htmlDocx from "html-docx-js/dist/html-docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import DOMPurify from "dompurify";
import logoImg from "../images/logoimg.png";

const NoteDownload = ({ note, isPremium, showAlert, isDownloading, setIsDownloading }) => {
  // Convert image URL to base64
  const convertImageToBase64 = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error("Failed to fetch image");
      const contentType = response.headers.get("content-type");
      const supportedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!supportedTypes.includes(contentType)) {
        console.warn(`Unsupported image type: ${contentType}`);
        return "https://via.placeholder.com/150?text=Unsupported+Image";
      }
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Image conversion error:", err);
      return "https://via.placeholder.com/150?text=Image+Error";
    }
  };

  // Wait for images to load
  const waitForAllImages = (container) => {
    return new Promise((resolve) => {
      const images = container.getElementsByTagName("img");
      if (images.length === 0) return resolve();
      let loadedCount = 0;
      const onLoadOrError = () => {
        loadedCount++;
        if (loadedCount === images.length) resolve();
      };
      for (let img of images) {
        if (img.complete) {
          onLoadOrError();
        } else {
          img.addEventListener("load", onLoadOrError);
          img.addEventListener("error", onLoadOrError);
        }
      }
    });
  };

  // Strip HTML tags for plain text
  const stripHTML = (html) => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").replace(/\n\s*\n/g, "\n").trim();
  };

  // Escape CSV field
  const escapeCSVField = (field) => {
    if (typeof field !== "string") return field;
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  // Sanitize note description HTML
  const sanitizedDescription = DOMPurify.sanitize(note.description || "No Description Available", {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["style"],
  });

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!isPremium) {
      showAlert("PDF download is available to premium users only. Please upgrade.", "warning");
      return;
    }
    setIsDownloading(true);
    try {
      const noteTitle = note.title || "Untitled Note";
      const noteDate = note.date ? new Date(note.date).toLocaleDateString() : "Not Available";
      const exportDate = new Date().toLocaleString();

      const container = document.createElement("div");
      container.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
          @page { size: a4; margin: 0.5in 0.5in 1in 0.5in; }
          body { margin: 0; padding: 0; font-family: 'Roboto', 'Times New Roman', serif; }
          .note-container { width: 100%; margin: 0 auto; padding: 0; }
          .cover-page {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: linear-gradient(180deg, #e6f0ff 0%, #fff 100%);
            page-break-after: always;
            padding: 50px;
          }
          .cover-title { font-size: 28pt; color: #0057b8; margin: 20px 0; }
          .cover-subtitle { font-size: 14pt; color: #666; margin: 5px 0; }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .header-left { text-align: left; flex: 1; font-size: 12pt; }
          .header-center { text-align: center; flex: 1; font-size: 12pt; }
          .header-right { text-align: right; flex: 1; font-size: 12pt; }
          .logo { width: 100px; height: auto; object-fit: contain; }
          .section { margin-bottom: 20px; }
          h1 { font-size: 18pt; color: #0057b8; }
          h2 { font-size: 14pt; color: #003087; }
          p, div { font-size: 10pt; line-height: 1.6; color: #333; }
          img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; object-fit: contain; margin-top: 5px; }
          .caption { font-size: 9pt; color: #666; text-align: center; margin-top: 5px; font-style: italic; }
        </style>
        <div class="note-container">
          <div class="cover-page">
            <img src="${logoImg}" alt="ApniNoteBook Logo" class="logo" />
            <h1 class="cover-title">${noteTitle}</h1>
            <p class="cover-subtitle">Created on: ${noteDate}</p>
            <p class="cover-subtitle">Exported on: ${exportDate}</p>
            <p class="cover-subtitle">ApniNoteBook - Professional Note Management</p>
          </div>
          <div class="header">
            <div class="header-left">${noteTitle}</div>
            <div class="header-center">ApniNoteBook</div>
            <div class="header-right">${noteDate}</div>
          </div>
          <div class="section" style="text-align: justify;">
            ${sanitizedDescription}
          </div>
          ${
            note.images?.length
              ? note.images
                  .map(
                    (img, index) => `
                      <div class="section" style="text-align: center; margin: 20px 0;">
                        <img src="${img}" alt="Note Image ${index + 1}" />
                        <p class="caption">Figure ${index + 1}: Note Image</p>
                      </div>
                    `
                  )
                  .join("")
              : ""
          }
        </div>
      `;

      const images = container.getElementsByTagName("img");
      for (let img of images) {
        if (!img.src.startsWith("data:")) {
          try {
            img.src = await convertImageToBase64(img.src);
          } catch (error) {
            console.warn(`Failed to convert image ${img.src} to base64:`, error);
            img.src = logoImg;
          }
        }
      }

      await waitForAllImages(container);

      const options = {
        margin: [0.5, 0.5, 1, 0.5],
        filename: `${noteTitle.replace(/[^a-z0-9]/gi, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"], avoid: ["table", "tr", "h1", "h2", "p", "div"] },
        pdfCallback: (pdf) => {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.setTextColor(0, 0, 0);
            pdf.text(
              `ApniNoteBook - Page ${i} of ${totalPages}`,
              pdf.internal.pageSize.getWidth() / 2,
              pdf.internal.pageSize.getHeight() - 0.3,
              { align: "center" }
            );
          }
          pdf.setProperties({
            title: noteTitle,
            author: "ApniNoteBook User",
            creator: "ApniNoteBook",
            keywords: `${note.tags?.join(", ") || "note"}, ApniNoteBook`,
            created: exportDate,
          });
        },
      };

      await html2pdf().from(container).set(options).save();
      showAlert("Note downloaded as PDF", "success");
    } catch (error) {
      console.error("PDF generation error:", error);
      showAlert("Failed to download PDF", "danger");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download DOCX
  const handleDownloadDOCX = async () => {
    if (!isPremium) {
      showAlert("DOCX download is available to premium users only. Please upgrade.", "warning");
      return;
    }
    setIsDownloading(true);
    try {
      const noteTitle = note.title || "Untitled Note";
      const noteDate = note.date ? new Date(note.date).toLocaleDateString() : "Not Available";
      const exportDate = new Date().toLocaleString();

      const h1Matches = sanitizedDescription.match(/<h1[^>]*>(.*?)<\/h1>/g) || [];
      const h2Matches = sanitizedDescription.match(/<h2[^>]*>(.*?)<\/h2>/g) || [];
      const sections = [...h1Matches, ...h2Matches].map((section, index) => ({
        html: section,
        level: section.startsWith("<h2") ? "h2" : "h1",
        index: index + 1,
      }));
      const tocItems = sections.map(({ html, level, index }) => {
        const titleMatch = html.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/);
        const title = titleMatch ? stripHTML(titleMatch[1]).trim() : `Section ${index}`;
        return `<p style="margin-left: ${level === "h2" ? "20px" : "0"}"><a href="#section-${index}" style="color: #0057b8; text-decoration: none;">${title}</a></p>`;
      });

      let sectionIndex = 0;
      const descriptionWithIds = sanitizedDescription.replace(
        /<(h[1-2])[^>]*>(.*?)<\/\1>/g,
        (match, level, content) => {
          sectionIndex++;
          return `<div id="section-${sectionIndex}"><${level}>${content}</${level}></div>`;
        }
      );

      let imagesHTML = "";
      if (note.images?.length) {
        const base64Images = await Promise.all(
          note.images.map(async (url) => {
            try {
              const base64 = await convertImageToBase64(url);
              return base64;
            } catch (error) {
              console.error(`Failed to convert image ${url}:`, error);
              return "";
            }
          })
        );
        imagesHTML = base64Images
          .map(
            (src, index) =>
              src
                ? `
              <p style="text-align: center; margin: 20px 0;">
                <img src="${src}" alt="Figure ${index + 1}: Note Image" style="max-width: 100%; height: auto; border: 1px solid #ccc;" />
                <p style="font-size: 10pt; color: #666; text-align: center; font-style: italic;">Figure ${index + 1}: Note Image</p>
              </p>
            `
                : ""
          )
          .join("");
      }

      const docxContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="title" content="${noteTitle}">
            <meta name="author" content="ApniNoteBook User">
            <meta name="company" content="ApniNoteBook">
            <meta name="keywords" content="${note.tags?.join(", ") || "note"}, ApniNoteBook">
            <meta name="created" content="${exportDate}">
            <style>
              @page {
                size: letter;
                margin: 0.75in;
              }
              body { font-family: 'Arial', 'Roboto', sans-serif; color: #333; }
              .cover-page { text-align: center; padding: 100px 20px; background: linear-gradient(180deg, #e6f0ff 0%, #fff 100%); page-break-after: always; }
              .cover-title { font-size: 28pt; color: #0057b8; margin-bottom: 20px; }
              .cover-subtitle { font-size: 14pt; color: #666; }
              .header { background: linear-gradient(to right, #0057b8, #007bff); color: white; padding: 10px; text-align: center; border-bottom: 3px solid #003087; }
              .toc { margin: 20px 0; page-break-after: always; }
              .toc h2 { font-size: 16pt; color: #0057b8; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              h1 { font-size: 20pt; color: #0057b8; }
              h2 { font-size: 16pt; color: #003087; }
              p, div { font-size: 12pt; line-height: 1.8; }
              .footer { text-align: center; font-size: 10pt; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; background: #f8f9fa; }
            </style>
          </head>
          <body>
            <div class="cover-page">
              <h1 class="cover-title">${noteTitle}</h1>
              <p class="cover-subtitle">Created on: ${noteDate}</p>
              <p class="cover-subtitle">Exported on: ${exportDate}</p>
              <p class="cover-subtitle">ApniNoteBook - Professional Note Management</p>
            </div>
            ${
              tocItems.length > 0
                ? `
                  <div class="toc">
                    <h2>Table of Contents</h2>
                    ${tocItems.join("")}
                  </div>
                `
                : ""
            }
            <div class="header">
              <h1>${noteTitle}</h1>
              <p style="font-size: 12pt; margin: 0;">Created on: ${noteDate}</p>
            </div>
            <div style="margin: 20px 0; text-align: justify;">
              ${descriptionWithIds}
            </div>
            ${imagesHTML}
            <div class="footer">
              <p>© ${new Date().getFullYear()} ApniNoteBook. All rights reserved.</p>
              <p>Contact: support@apninotebook.com | www.apninotebook.com</p>
              <p>Generated by ApniNoteBook Premium on ${exportDate}</p>
            </div>
          </body>
        </html>
      `;

      if (docxContent.length > 1000000) {
        showAlert("Note is too large to download as DOCX. Please split it into smaller notes.", "warning");
        setIsDownloading(false);
        return;
      }

      const docxBlob = htmlDocx.asBlob(docxContent, { orientation: "portrait" });
      saveAs(docxBlob, `${noteTitle.replace(/[^a-z0-9]/gi, "_")}.docx`);
      showAlert("Note downloaded as DOCX", "success");
    } catch (error) {
      console.error("DOCX generation error:", error);
      showAlert("Failed to download DOCX", "danger");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download CSV
  const handleDownloadCSV = () => {
    if (!isPremium) {
      showAlert("CSV download is available to premium users only. Please upgrade.", "warning");
      return;
    }
    setIsDownloading(true);
    try {
      const plainDescription = stripHTML(sanitizedDescription);
      const noteData = [
        ["Field", "Value"],
        ["Title", escapeCSVField(note.title || "Untitled Note")],
        ["Description", escapeCSVField(plainDescription)],
        ["Tags", escapeCSVField(Array.isArray(note.tags) ? note.tags.join(", ") : "General")],
        ["Priority", escapeCSVField(note.priority || "low")],
        ["Due Date", escapeCSVField(note.dueDate || "Not Set")],
        ["Created on", escapeCSVField(note.date ? new Date(note.date).toLocaleDateString() : "Not Available")],
        ["Images", escapeCSVField(note.images?.length ? note.images.join("; ") : "None")],
        ["Exported on", escapeCSVField(new Date().toLocaleString())],
      ];

      const ws = XLSX.utils.aoa_to_sheet(noteData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Note");
      XLSX.writeFile(wb, `${note.title || "Untitled Note"}.csv`, {
        bookType: "csv",
        type: "blob",
        compression: true,
      });
      showAlert("Note downloaded as CSV", "success");
    } catch (error) {
      console.error("CSV generation error:", error);
      showAlert("Failed to download CSV", "danger");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download JSON
  const handleDownloadJSON = () => {
    if (!isPremium) {
      showAlert("JSON download is available to premium users only. Please upgrade.", "warning");
      return;
    }
    setIsDownloading(true);
    try {
      const noteData = {
        uid: note.uid || "unknown",
        title: note.title || "Untitled Note",
        description: {
          plain: stripHTML(sanitizedDescription),
          html: sanitizedDescription,
        },
        tags: Array.isArray(note.tags) ? note.tags : ["General"],
        priority: note.priority || "low",
        dueDate: note.dueDate || null,
        createdOn: note.date ? new Date(note.date).toISOString() : null,
        images: note.images || [],
        exportedOn: new Date().toISOString(),
        source: "ApniNoteBook",
        version: "1.0.0",
      };
      const blob = new Blob([JSON.stringify(noteData, null, 2)], {
        type: "application/json;charset=utf-8",
      });
      saveAs(blob, `${note.title || "Untitled Note"}.json`);
      showAlert("Note downloaded as JSON", "success");
    } catch (error) {
      console.error("JSON generation error:", error);
      showAlert("Failed to download JSON", "danger");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download TXT
  const handleDownloadTXT = () => {
    setIsDownloading(true);
    try {
      const noteTitle = note.title || "Untitled Note";
      const noteDate = note.date ? new Date(note.date).toLocaleDateString() : "Not Available";
      const plainDescription = stripHTML(sanitizedDescription).replace(/[\r\n]+/g, "\n");
      const text = `
ApniNoteBook Note Export
======================
Title: ${noteTitle}
Created on: ${noteDate}
Tags: ${Array.isArray(note.tags) ? note.tags.join(", ") : "General"}
Priority: ${note.priority || "low"}
Due Date: ${note.dueDate || "Not Set"}
Exported on: ${new Date().toLocaleString()}
======================
Description:
${plainDescription}
======================
Images:
${note.images?.length ? note.images.join("\n") : "None"}
======================
© ${new Date().getFullYear()} ApniNoteBook
      `.trim();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `${noteTitle.replace(/[^a-z0-9]/gi, "_")}.txt`);
      showAlert("Note downloaded as TXT", "success");
    } catch (error) {
      console.error("TXT generation error:", error);
      showAlert("Failed to download TXT", "danger");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute bg-gradient-to-r from-indigo-600/90 to-purple-700/90 backdrop-blur-md text-white p-3 rounded-xl shadow-2xl top-12 left-2 z-50 w-48 sm:w-52 border border-purple-400/20"
    >
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-medium text-white/95">Download Options</p>
        <motion.button
          whileHover={{ scale: 1.2 }}
          className="text-white/90 hover:text-red-400 transition-transform"
          title="Close"
          aria-label="Close download options"
        >
          <i className="fas fa-times text-sm" />
        </motion.button>
      </div>
      {isDownloading ? (
        <div className="flex items-center justify-center p-3">
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="h-4 w-4 text-purple-400 mr-1"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </motion.svg>
          <span className="text-white/90 text-xs">Processing...</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={handleDownloadTXT}
            className="group flex flex-col items-center justify-center p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-transform"
            title="Download as .txt"
            aria-label="Download as .txt"
          >
            <i className="fas fa-file-alt text-purple-400 text-sm" />
            <span className="text-xs text-white/90 mt-0.5">.txt</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={handleDownloadPDF}
            disabled={!isPremium}
            className={`group flex flex-col items-center justify-center p-1 rounded-lg ${
              !isPremium
                ? "bg-gray-500/50 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20"
            } transition-transform`}
            title={!isPremium ? "Upgrade to Premium for PDF download" : "Download as .pdf"}
            aria-label={!isPremium ? "Upgrade to Premium for PDF download" : "Download as .pdf"}
          >
            <i className="fas fa-file-pdf text-purple-400 text-sm" />
            <span className="text-xs text-white/90 mt-0.5">.pdf</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={handleDownloadDOCX}
            disabled={!isPremium}
            className={`group flex flex-col items-center justify-center p-1 rounded-lg ${
              !isPremium
                ? "bg-gray-500/50 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20"
            } transition-transform`}
            title={!isPremium ? "Upgrade to Premium for DOCX download" : "Download as .docx"}
            aria-label={!isPremium ? "Upgrade to Premium for DOCX download" : "Download as .docx"}
          >
            <i className="fas fa-file-word text-purple-400 text-sm" />
            <span className="text-xs text-white/90 mt-0.5">.docx</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={handleDownloadCSV}
            disabled={!isPremium}
            className={`group flex flex-col items-center justify-center p-1 rounded-lg ${
              !isPremium
                ? "bg-gray-500/50 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20"
            } transition-transform`}
            title={!isPremium ? "Upgrade to Premium for CSV download" : "Download as .csv"}
            aria-label={!isPremium ? "Upgrade to Premium for CSV download" : "Download as .csv"}
          >
            <i className="fas fa-file-csv text-purple-400 text-sm" />
            <span className="text-xs text-white/90 mt-0.5">.csv</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={handleDownloadJSON}
            disabled={!isPremium}
            className={`group flex flex-col items-center justify-center p-1 rounded-lg ${
              !isPremium
                ? "bg-gray-500/50 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20"
            } transition-transform`}
            title={!isPremium ? "Upgrade to Premium for JSON download" : "Download as .json"}
            aria-label={!isPremium ? "Upgrade to Premium for JSON download" : "Download as .json"}
          >
            <i className="fas fa-file-code text-purple-400 text-sm" />
            <span className="text-xs text-white/90 mt-0.5">.json</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};

export default NoteDownload;