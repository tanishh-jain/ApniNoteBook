import React, { useState, useMemo, useEffect } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import DOMPurify from "dompurify";
import { motion } from "framer-motion";
import { Tilt } from "react-tilt";
import LazyLoad from "react-lazyload";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";

// NoteTemplates component to render swipeable template cards with previews
const NoteTemplates = ({ onSelectTemplate, isCollapsed }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favoriteTemplates")) || []
  );
  const [recentTemplates, setRecentTemplates] = useState(
    JSON.parse(localStorage.getItem("recentTemplates")) || []
  );
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem("templateOnboardingShown")
  );
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [previewContent, setPreviewContent] = useState({});

  const categories = [
    { value: "All", label: "All Templates" },
    { value: "Work", label: "Work" },
    { value: "Personal", label: "Personal" },
    { value: "Academic", label: "Academic" },
    { value: "Creative", label: "Creative" },
  ];

  const templates = [
    {
      id: "meeting",
      title: "Meeting Notes",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Meeting Notes</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Time:</strong> <span contenteditable="true">Insert Time</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Location:</strong> <span contenteditable="true">Insert Location or Virtual Link</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Attendees:</strong> <span contenteditable="true">List Attendees</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Agenda</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Topic 1</li>
          <li contenteditable="true">Topic 2</li>
          <li contenteditable="true">Topic 3</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Discussion Points</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Key Point 1</li>
          <li contenteditable="true">Key Point 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Action Items</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Action 1 - Assigned to Person</li>
          <li contenteditable="true">Action 2 - Assigned to Person</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Next Steps:</strong> <span contenteditable="true">Outline Next Steps</span></p>
      `,
    },
    {
      id: "project",
      title: "Project Plan",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Project Plan</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Project Name:</strong> <span contenteditable="true">Insert Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Start Date:</strong> <span contenteditable="true">Insert Start Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>End Date:</strong> <span contenteditable="true">Insert End Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Project Manager:</strong> <span contenteditable="true">Insert Name</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Objectives</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Objective 1</li>
          <li contenteditable="true">Objective 2</li>
          <li contenteditable="true">Objective 3</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Key Deliverables</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Deliverable 1 - Due Date</li>
          <li contenteditable="true">Deliverable 2 - Due Date</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Team Members</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Member 1 - Role</li>
          <li contenteditable="true">Member 2 - Role</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Milestones</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Milestone 1 - Date</li>
          <li contenteditable="true">Milestone 2 - Date</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Risks:</strong> <span contenteditable="true">List Potential Risks</span></p>
      `,
    },
    {
      id: "journal",
      title: "Journal Entry",
      category: "Personal",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Journal Entry</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Mood:</strong> <span contenteditable="true">Insert Mood</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Thoughts</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Write your thoughts here</p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Highlights of the Day</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Highlight 1</li>
          <li contenteditable="true">Highlight 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Goals for Tomorrow</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Goal 1</li>
          <li contenteditable="true">Goal 2</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Gratitude:</strong> <span contenteditable="true">What are you thankful for?</span></p>
      `,
    },
    {
      id: "todo",
      title: "To-Do List",
      category: "Personal",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">To-Do List</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Priority Tasks</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li><input type="checkbox"> <span contenteditable="true">Task 1 - Due Date</span></li>
          <li><input type="checkbox"> <span contenteditable="true">Task 2 - Due Date</span></li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Secondary Tasks</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li><input type="checkbox"> <span contenteditable="true">Task 3</span></li>
          <li><input type="checkbox"> <span contenteditable="true">Task 4</span></li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Notes</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Additional Notes or Context</p>
      `,
    },
    {
      id: "brainstorm",
      title: "Brainstorming Session",
      category: "Creative",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Brainstorming Session</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Topic:</strong> <span contenteditable="true">Insert Topic</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Participants:</strong> <span contenteditable="true">List Participants</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Ideas</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Idea 1</li>
          <li contenteditable="true">Idea 2</li>
          <li contenteditable="true">Idea 3</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Evaluation</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Idea 1 Evaluation</li>
          <li contenteditable="true">Idea 2 Evaluation</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Next Steps</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Outline Next Steps</p>
      `,
    },
    {
      id: "study",
      title: "Study Notes",
      category: "Academic",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Study Notes</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Subject:</strong> <span contenteditable="true">Insert Subject</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Topic:</strong> <span contenteditable="true">Insert Topic</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Key Concepts</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Concept 1</li>
          <li contenteditable="true">Concept 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Definitions</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li><strong><span contenteditable="true">Term 1</span>:</strong> <span contenteditable="true">Definition</span></li>
          <li><strong><span contenteditable="true">Term 2</span>:</strong> <span contenteditable="true">Definition</span></li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Examples</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Example 1</li>
          <li contenteditable="true">Example 2</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Questions:</strong> <span contenteditable="true">List Questions</span></p>
      `,
    },
    {
      id: "travel",
      title: "Travel Itinerary",
      category: "Personal",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Travel Itinerary</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Destination:</strong> <span contenteditable="true">Insert Destination</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Travel Dates:</strong> <span contenteditable="true">Start Date to End Date</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Day 1: <span contenteditable="true">Date</span></h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Time - Activity</li>
          <li contenteditable="true">Time - Activity</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Day 2: <span contenteditable="true">Date</span></h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Time - Activity</li>
          <li contenteditable="true">Time - Activity</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Accommodation</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Hotel Name, Address, Contact</p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Packing List</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Item 1</li>
          <li contenteditable="true">Item 2</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Notes:</strong> <span contenteditable="true">Additional Notes</span></p>
      `,
    },
    {
      id: "recipe",
      title: "Recipe",
      category: "Creative",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Recipe</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Dish Name:</strong> <span contenteditable="true">Insert Dish Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Servings:</strong> <span contenteditable="true">Insert Number</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Prep Time:</strong> <span contenteditable="true">Insert Time</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Cook Time:</strong> <span contenteditable="true">Insert Time</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Ingredients</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Ingredient 1 - Quantity</li>
          <li contenteditable="true">Ingredient 2 - Quantity</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Instructions</h3>
        <ol style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Step 1</li>
          <li contenteditable="true">Step 2</li>
        </ol>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Tips</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Tip 1</p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Tip 2</p>
      `,
    },
    {
      id: "event",
      title: "Event Plan",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Event Plan</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Event Name:</strong> <span contenteditable="true">Insert Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Time:</strong> <span contenteditable="true">Insert Time</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Venue:</strong> <span contenteditable="true">Insert Venue</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Schedule</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Time - Activity</li>
          <li contenteditable="true">Time - Activity</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Budget</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Item 1 - Cost</li>
          <li contenteditable="true">Item 2 - Cost</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Vendors</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Vendor 1 - Contact</li>
          <li contenteditable="true">Vendor 2 - Contact</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Notes:</strong> <span contenteditable="true">Additional Notes</span></p>
      `,
    },
    {
      id: "bug",
      title: "Bug Report",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Bug Report</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Issue Title:</strong> <span contenteditable="true">Insert Title</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date Reported:</strong> <span contenteditable="true">Insert Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Reported By:</strong> <span contenteditable="true">Insert Name</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Description</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Describe the bug in detail</p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Steps to Reproduce</h3>
        <ol style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Step 1</li>
          <li contenteditable="true">Step 2</li>
        </ol>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Expected Behavior</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Describe expected outcome</p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Actual Behavior</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Describe what happened</p>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Priority:</strong> <span contenteditable="true">Low/Medium/High</span></p>
      `,
    },
    {
      id: "code_review",
      title: "Code Review",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Code Review</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Project:</strong> <span contenteditable="true">Insert Project Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Reviewer:</strong> <span contenteditable="true">Insert Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Code Details</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>File/Module:</strong> <span contenteditable="true">Insert File</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Commit ID:</strong> <span contenteditable="true">Insert Commit ID</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Comments</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Comment 1</li>
          <li contenteditable="true">Comment 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Suggestions</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Suggestion 1</li>
          <li contenteditable="true">Suggestion 2</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Status:</strong> <span contenteditable="true">Approved/Changes Requested</span></p>
      `,
    },
    {
      id: "standup",
      title: "Daily Standup",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Daily Standup</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Team:</strong> <span contenteditable="true">Insert Team Name</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Yesterday's Progress</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Task 1</li>
          <li contenteditable="true">Task 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Today's Plan</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Task 1</li>
          <li contenteditable="true">Task 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Blockers</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">List Blockers</p>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Notes:</strong> <span contenteditable="true">Additional Notes</span></p>
      `,
    },
    {
      id: "interview",
      title: "Interview Notes",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Interview Notes</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Candidate:</strong> <span contenteditable="true">Insert Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Position:</strong> <span contenteditable="true">Insert Position</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Interviewer:</strong> <span contenteditable="true">Insert Name</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Questions Asked</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Question 1</li>
          <li contenteditable="true">Question 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Responses</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Response 1</li>
          <li contenteditable="true">Response 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Evaluation</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;" contenteditable="true">Strengths, Weaknesses, Overall Fit</p>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Recommendation:</strong> <span contenteditable="true">Hire/Decline/Further Review</span></p>
      `,
    },
    {
      id: "swot",
      title: "SWOT Analysis",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">SWOT Analysis</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Project/Organization:</strong> <span contenteditable="true">Insert Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Date:</strong> <span contenteditable="true">Insert Date</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Strengths</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Strength 1</li>
          <li contenteditable="true">Strength 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Weaknesses</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Weakness 1</li>
          <li contenteditable="true">Weakness 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Opportunities</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Opportunity 1</li>
          <li contenteditable="true">Opportunity 2</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Threats</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Threat 1</li>
          <li contenteditable="true">Threat 2</li>
        </ul>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Action Plan:</strong> <span contenteditable="true">Outline Actions</span></p>
      `,
    },
    {
      id: "budget",
      title: "Budget Plan",
      category: "Work",
      description: `
        <h2 style="font-family: 'Inter', system-ui, sans-serif; color: #4B0082;">Budget Plan</h2>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Project/Event:</strong> <span contenteditable="true">Insert Name</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Period:</strong> <span contenteditable="true">Insert Period</span></p>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Income</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Source 1 - Amount</li>
          <li contenteditable="true">Source 2 - Amount</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Expenses</h3>
        <ul style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;">
          <li contenteditable="true">Category 1 - Amount</li>
          <li contenteditable="true">Category 2 - Amount</li>
        </ul>
        <h3 style="font-family: 'Inter', system-ui, sans-serif; color: #6A0DAD;">Summary</h3>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Total Income:</strong> <span contenteditable="true">Amount</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Total Expenses:</strong> <span contenteditable="true">Amount</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif; margin-bottom: 1em;"><strong>Net Balance:</strong> <span contenteditable="true">Amount</span></p>
        <p style="font-family: 'Inter', system-ui, sans-serif;"><strong>Notes:</strong> <span contenteditable="true">Additional Notes</span></p>
      `,
    },
  ];

  const sanitizedTemplates = useMemo(
    () =>
      templates.map((template) => ({
        ...template,
        description: DOMPurify.sanitize(template.description, {
          USE_PROFILES: { html: true },
          ADD_TAGS: ["style", "input", "span"],
          ADD_ATTR: ["style", "type", "contenteditable"],
        }),
      })),
    []
  );

  const filteredTemplates = useMemo(
    () =>
      sanitizedTemplates.filter(
        (template) =>
          (selectedCategory === "All" || template.category === selectedCategory) &&
          template.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, selectedCategory, sanitizedTemplates]
  );

  const trackTemplateSelection = (templateId) => {
    console.log(`Template selected: ${templateId}`);
  };

  const handleSelectTemplate = (template) => {
    const updatedRecent = [
      template.id,
      ...recentTemplates.filter((id) => id !== template.id),
    ].slice(0, 3);
    setRecentTemplates(updatedRecent);
    localStorage.setItem("recentTemplates", JSON.stringify(updatedRecent));
    trackTemplateSelection(template.id);
    onSelectTemplate({
      ...template,
      description: previewContent[template.id] || template.description,
    });
  };

  const toggleFavorite = (templateId) => {
    const updatedFavorites = favorites.includes(templateId)
      ? favorites.filter((id) => id !== templateId)
      : [...favorites, templateId];
    setFavorites(updatedFavorites);
    localStorage.setItem("favoriteTemplates", JSON.stringify(updatedFavorites));
  };

  const handlePreviewChange = (templateId, content) => {
    setPreviewContent((prev) => ({ ...prev, [templateId]: content }));
  };

  useEffect(() => {
    if (showOnboarding) {
      const timer = setTimeout(() => {
        setShowOnboarding(false);
        localStorage.setItem("templateOnboardingShown", "true");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showOnboarding]);

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: isCollapsed ? 1 : 2,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: isCollapsed ? "10px" : "40px",
    cssEase: "cubic-bezier(0.4, 0, 0.2, 1)",
    accessibility: true,
    arrows: false,
    adaptiveHeight: true,
    onSwipe: () => navigator.vibrate && navigator.vibrate(50),
  };

  const cardHeight = isCollapsed ? "300px" : "400px";

  return (
    <div className={`flex flex-col items-center ${isCollapsed ? "p-2" : "p-6"}`}>
      {showOnboarding && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-sm p-3 rounded-lg shadow-lg z-50"
          role="alert"
          aria-live="polite"
        >
          Swipe or click to browse templates. Click a card to use it!
        </motion.div>
      )}

      <div className="relative w-full max-w-md mb-4">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 rounded-lg bg-gray-900/50 border border-purple-500 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-label="Search templates"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {categories.map((category) => (
          <motion.button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              selectedCategory === category.value
                ? "bg-purple-600 text-white"
                : "bg-gray-900/50 text-gray-300 hover:bg-purple-900/50"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={selectedCategory === category.value}
            aria-label={`Filter by ${category.label}`}
          >
            {category.label}
          </motion.button>
        ))}
      </div>

      {(recentTemplates.length > 0 || favorites.length > 0) && (
        <div className="w-full mb-4">
          {recentTemplates.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">Recent Templates</h3>
              <div className="flex gap-2 overflow-x-auto">
                {recentTemplates.map((id) => {
                  const template = sanitizedTemplates.find((t) => t.id === id);
                  if (!template) return null;
                  return (
                    <motion.button
                      key={id}
                      onClick={() => handleSelectTemplate(template)}
                      className="px-3 py-1 bg-gray-900/50 text-white rounded-lg hover:bg-purple-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {template.title}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
          {favorites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Favorite Templates</h3>
              <div className="flex gap-2 overflow-x-auto">
                {favorites.map((id) => {
                  const template = sanitizedTemplates.find((t) => t.id === id);
                  if (!template) return null;
                  return (
                    <motion.button
                      key={id}
                      onClick={() => handleSelectTemplate(template)}
                      className="px-3 py-1 bg-gray-900/50 text-white rounded-lg hover:bg-purple-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {template.title}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <Slider
        {...sliderSettings}
        className="w-full max-w-5xl py-5 mx-auto z-[99]"
        role="region"
        aria-label="Template selection carousel"
      >
        {filteredTemplates.map((template) => (
          <LazyLoad key={template.id} height={350} offset={100}>
            <div
              className="px-2"
              role="option"
              aria-label={`Template: ${template.title}`}
            >
              <Tilt options={{ max: 15, scale: 1, speed: 600, axis: 'y' }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`relative bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 my-5 shadow-lg w-full h-[350px] overflow-hidden transition-all duration-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] group cursor-pointer ${
                    favorites.includes(template.id) ? "border-purple-500" : ""
                  }`}
                  onClick={() => handleSelectTemplate(template)}
                  onKeyDown={(e) => e.key === "Enter" && handleSelectTemplate(template)}
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.08), rgba(168,85,247,0.08))",
                  }}
                  tabIndex={0}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(template.id);
                    }}
                    className={`absolute top-2 right-2 text-yellow-400 ${
                      favorites.includes(template.id) ? "opacity-100" : "opacity-50"
                    } hover:opacity-100 transition-opacity`}
                    aria-label={
                      favorites.includes(template.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 15l-5.5 3 1.5-5.5L2 7.5l5.5-0.5L10 2l2.5 5 5.5 0.5-4 4.5 1.5 5.5z" />
                    </svg>
                  </button>

                  {hoveredTemplate === template.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full bg-gray-900/80 text-white text-xs p-2 rounded-lg z-10"
                    >
                      Use the {template.title} template for structured note-taking.
                    </motion.div>
                  )}

                  <div className="relative mt-4">
                    {template.id === "code_review" ? (
                      <SyntaxHighlighter
                        language="javascript"
                        style={dark}
                        className="text-sm"
                      >
                        {previewContent[template.id] || template.description}
                      </SyntaxHighlighter>
                    ) : (
                      <div
                        className="overflow-auto max-h-[220px] pr-4 text-sm text-gray-200 prose prose-invert max-w-none"
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) =>
                          handlePreviewChange(template.id, e.target.innerHTML)
                        }
                        dangerouslySetInnerHTML={{
                          __html:
                            previewContent[template.id] || template.description,
                        }}
                      />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
                  </div>
                </motion.div>
              </Tilt>
            </div>
          </LazyLoad>
        ))}
      </Slider>

      <style>{`
  .slick-slider {
    position: relative;
    padding-bottom: 20px;
  }
  .slick-slide {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 ${isCollapsed ? "8px" : "16px"};
  }
  .slick-center {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
    border-color: #A855F7;
    transition: all 0.3s ease;
  }
  .prose-invert h2 {
    color: #4B0082;
    margin-bottom: 1em;
    font-size: 1.75rem;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .prose-invert h3 {
    color: #6A0DAD;
    margin-bottom: 0.5em;
    font-size: 1.1rem;
    font-weight: 500;
  }
  .prose-invert p,
  .prose-invert ul,
  .prose-invert ol {
    color: #F3F4F6;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 1rem;
    line-height: 1.6;
  }
  .prose-invert ul,
  .prose-invert ol {
    padding-left: 1.5em;
  }
  .prose-invert li {
    margin-bottom: 0.5em;
  }
  .prose-invert input[type="checkbox"] {
    margin-right: 0.5em;
    transform: scale(1.1);
  }
  .prose-invert [contenteditable="true"] {
    border-bottom: 1px dashed #A855F7;
    cursor: text;
  }
  .prose-invert [contenteditable="true"]:focus {
    outline: 1px solid #A855F7;
  }
  .animate-slide-in {
    animation: slide-in 0.7s ease-out;
  }
  @keyframes slide-in {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .overflow-auto {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  .overflow-auto::-webkit-scrollbar {
    display: none !important;
  }
  .react-syntax-highlighter {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  .react-syntax-highlighter::-webkit-scrollbar {
    display: none !important;
  }
  @media (max-width: 640px) {
    .prose-invert h2 {
      font-size: 1.5rem;
    }
    .prose-invert h3 {
      font-size: 1rem;
    }
    .prose-invert p,
    .prose-invert ul,
    .prose-invert ol {
      font-size: 0.9rem;
    }
  }
`}</style>
    </div>
  );
};

export default NoteTemplates;