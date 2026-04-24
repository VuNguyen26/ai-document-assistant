# AI Document Assistant Demo Script

This document contains a complete demo script for presenting the **AI Document Assistant** project.

The script is written for project defense, internship interview, portfolio presentation, or personal demo recording.

---

## 1. Short Project Introduction

Hello, today I will present my project: **AI Document Assistant**.

AI Document Assistant is a full-stack AI-powered document management system.

The main idea is to allow users to upload documents, process document content, ask questions using RAG, view citations, generate summaries, translate content, create audio versions, and organize documents into workspaces.

The project is built with:

```txt
Backend: NestJS, Prisma, PostgreSQL, pgvector
Frontend: Next.js, React, TypeScript, Tailwind CSS
AI Provider: OpenRouter / OpenAI-compatible API
```

The system is designed as a practical document assistant, not just a simple CRUD app.

---

## 2. Problem Statement

Working with long documents is time-consuming.

In real situations, users often need to:

```txt
- Read long PDF or DOCX files manually
- Search for important information
- Summarize large documents
- Translate content into another language
- Ask questions about a document
- Compare related documents
- Manage many files from the same topic or project
```

Doing all of this manually takes a lot of time.

This project solves that problem by turning uploaded documents into searchable and interactive AI knowledge sources.

---

## 3. Main Solution

The system provides a complete workflow:

```txt
Upload document
→ Extract text
→ Split text into chunks
→ Generate embeddings
→ Store vectors in PostgreSQL with pgvector
→ Retrieve relevant chunks
→ Generate AI answer
→ Display answer with citations
```

This workflow is called RAG.

RAG means **Retrieval-Augmented Generation**.

Instead of asking the AI model to answer only from its general knowledge, the system first searches the uploaded document content, retrieves relevant chunks, and then sends those chunks to the AI model as context.

Because of that, the answer is grounded in the uploaded document.

---

## 4. Technology Stack

The backend is built with:

```txt
NestJS
TypeScript
Prisma ORM
PostgreSQL
pgvector
JWT Authentication
OpenRouter / OpenAI-compatible API
```

The frontend is built with:

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
react-hot-toast
react-markdown
remark-gfm
```

The database is PostgreSQL with pgvector support.

Prisma is used to manage database schema, migrations and queries.

---

## 5. Project Architecture

The project uses a monorepo structure:

```txt
ai-document-assistant/
├─ apps/
│  ├─ backend/
│  └─ frontend/
├─ README.md
└─ docs/
```

The backend follows a modular monolith architecture.

Important backend modules include:

```txt
auth
documents
extraction
chunks
embeddings
search
chat
summaries
translations
audio
workspaces
health
```

The frontend follows a feature-based structure.

Important frontend features include:

```txt
auth
documents
chat
summaries
translations
workspaces
audio
```

This structure keeps the project organized and easier to maintain.

---

## 6. Demo Preparation

Before starting the demo, make sure PostgreSQL, backend and frontend are running.

### Start database

If using Docker:

```powershell
docker start ai-doc-postgres-vector
```

### Start backend

```powershell
cd E:\ai-document-assistant\apps\backend
npm run start:dev
```

Backend should run at:

```txt
http://localhost:4000/api/v1
```

### Start frontend

```powershell
cd E:\ai-document-assistant\apps\frontend
npm run dev
```

Frontend should run at:

```txt
http://localhost:3000
```

### Optional build check

```powershell
cd E:\ai-document-assistant\apps\frontend
npm run build
```

---

## 7. Recommended Demo Order

The recommended demo order is:

```txt
1. Login
2. Dashboard
3. Documents
4. Upload document
5. Document detail
6. Document chat
7. Citations
8. Summaries
9. Translations
10. Workspaces
11. Workspace detail
12. Workspace chat
13. Profile
14. Settings
15. Backend architecture explanation
16. Database explanation
17. Closing
```

---

## 8. Login Demo

First, I open the application and log in.

The authentication system protects the dashboard and user data.

After login, the user can access private features such as:

```txt
Documents
Chat sessions
Summaries
Translations
Workspaces
Profile
Settings
```

The backend uses JWT access tokens and refresh tokens for authentication.

---

## 9. Dashboard Demo

After logging in, I am redirected to the dashboard.

The dashboard gives an overview of the system.

It shows the main modules:

```txt
Documents
Workspaces
Summaries
Translations
Profile
Settings
```

The dashboard also provides quick actions such as:

```txt
Upload document
Open documents
Create summary
Translate content
Open workspace
```

The UI is designed as a clean SaaS-style dashboard with a consistent indigo accent color, modern cards, and simple navigation.

---

## 10. Document Upload Demo

Next, I go to the Documents page.

Here, I can upload a document.

Supported file types are:

```txt
PDF
DOCX
TXT
```

When I upload a file, the system stores document metadata such as:

```txt
Title
Original filename
MIME type
File size
Source language
Processing status
Owner user ID
```

After upload, the document enters the processing pipeline.

The document status can move through:

```txt
UPLOADED
PROCESSING
EXTRACTED
CHUNKED
READY
FAILED
```

The final status should be `READY`.

When the document is READY, it can be used for semantic search, chat, summaries, translations and workspace chat.

---

## 11. Document List Demo

On the Documents page, users can manage uploaded files.

The page supports:

```txt
Search by title or filename
Filter by status
Sort by created date
Sort by updated date
Sort by title
Sort by status
Pagination
Delete document
Open document detail
Start chat when document is ready
```

The UI uses compact document cards.

Each card shows:

```txt
Document title
Original filename
File type
File size
Language
Created date
Processing status
Latest processing job
Action buttons
```

This helps users understand the state of each document quickly.

---

## 12. Document Detail Demo

Next, I open a document detail page.

This page is used to inspect one document.

It can show information such as:

```txt
Document metadata
Extracted content
Chunks
Processing jobs
Status
Error message if processing failed
```

The purpose of this page is to help the user verify whether the document is ready for AI features.

---

## 13. Document Chat Demo

Now I open the document chat page.

This is one of the most important features of the project.

The user can ask questions about the current document.

Example questions:

```txt
Summarize this document.
What are the main points?
What does this document say about security?
List the key requirements.
Explain this document in simple language.
```

The backend will:

```txt
Receive the user question
Retrieve relevant chunks from the document
Build context from those chunks
Send the question and context to the AI model
Stream the assistant answer
Save the chat messages
Save citations
```

The frontend displays the answer in a chat interface.

The assistant answer supports Markdown formatting.

---

## 14. Citation Demo

For RAG systems, citations are very important.

A citation shows which document chunks were used to generate the answer.

In this project, each citation may include:

```txt
Document name
Chunk index
Similarity score
Distance
Character count
Chunk content preview
```

The user can open the citation section under an assistant message.

The user can also copy:

```txt
Chunk content
Citation reference
```

This makes the system more transparent and helps users verify the answer.

---

## 15. Summary Demo

Next, I open the Summaries page.

Here, the user can generate summaries from processed documents.

The user can choose a summary type:

```txt
Short
Detailed
Bullet points
Beginner friendly
Presentation
```

The user can also choose:

```txt
Language
Prompt style
Document source
```

After generating a summary, the result is saved into summary history.

Users can:

```txt
Review generated summaries
Filter summaries by document
Copy summary content
Delete summary records
```

This feature helps users understand long documents faster.

---

## 16. Translation Demo

Next, I open the Translations page.

The translation module allows users to translate:

```txt
Full document content
Generated summaries
```

The user can choose:

```txt
Source type
Source language
Target language
Translation style
```

After generating a translation, it is saved into translation history.

Users can:

```txt
Review translations
Filter translations by document
Filter translations by source type
Copy translated content
Delete translation records
```

This feature is useful when users need to reuse document content in another language.

---

## 17. Workspace Demo

Next, I open the Workspaces page.

A workspace is used to group related documents.

For example, users can create workspaces for:

```txt
A customer project
A research topic
A legal document set
A technical document collection
A course or study folder
```

The Workspaces page supports:

```txt
Create workspace
Edit workspace
Delete workspace
Search workspace
Open workspace detail
```

Each workspace shows:

```txt
Total documents
Ready documents
Incomplete documents
Preview documents
Updated date
```

---

## 18. Workspace Detail Demo

Inside the workspace detail page, users can manage one workspace.

The page supports:

```txt
Update workspace name
Update workspace description
Add document to workspace
Remove document from workspace
View linked documents
Open document detail
Start document chat
Start workspace chat
```

This makes it easier to organize related files before asking multi-document questions.

---

## 19. Workspace Chat Demo

Workspace chat is different from document chat.

Document chat uses one document.

Workspace chat can use multiple READY documents in the same workspace.

The flow is:

```txt
User asks a question
→ Backend searches across READY documents in the workspace
→ Backend retrieves the most relevant chunks
→ AI generates an answer from those chunks
→ Frontend displays the answer and citations
```

Example workspace chat questions:

```txt
Compare the key points across these documents.
Summarize all documents in this workspace.
What common requirements appear in these files?
Find differences between these documents.
```

This feature is useful when users need to analyze multiple related documents together.

---

## 20. Profile Demo

The Profile page shows basic information about the current signed-in user.

It can display:

```txt
User email
User role
Current session state
Available modules
```

At the current stage, profile data is read from the authenticated session.

In the future, it can be connected to a dedicated profile API.

---

## 21. Settings Demo

The Settings page shows application preferences.

Current settings are displayed as read-only UI.

Example settings include:

```txt
Theme
Accent color
Dashboard density
Chat mode
Citations
Authentication mode
```

In the future, these settings can be stored in the database and updated by the user.

---

## 22. Backend Architecture Explanation

The backend uses NestJS and is organized by modules.

### Auth module

Responsible for:

```txt
Register
Login
Refresh token
Logout
JWT verification
Current user
```

### Documents module

Responsible for:

```txt
Upload documents
List documents
Search/filter/sort documents
View document detail
Delete documents
Ownership check
```

### Extraction module

Responsible for:

```txt
Extract text from PDF
Extract text from DOCX
Extract text from TXT
Save extracted content
```

### Chunks module

Responsible for:

```txt
Split document content into chunks
Save chunk index
Save character count
Save offsets
```

### Embeddings module

Responsible for:

```txt
Call embedding model
Generate vector embeddings
Save embeddings into database
```

### Search module

Responsible for:

```txt
Semantic search
Vector similarity
Return relevant chunks
```

### Chat module

Responsible for:

```txt
Chat sessions
Chat messages
Streaming answers
RAG context retrieval
Citations
Document chat
Workspace chat
```

### Summaries module

Responsible for:

```txt
Generate summaries
List summaries
Filter summaries
Delete summaries
```

### Translations module

Responsible for:

```txt
Generate translations
List translations
Filter translations
Delete translations
```

### Workspaces module

Responsible for:

```txt
Create workspace
Update workspace
Delete workspace
Add document
Remove document
Workspace chat
```

---

## 23. Database Explanation

The project uses PostgreSQL with Prisma ORM.

Important tables include:

```txt
users
refresh_tokens
documents
document_contents
document_chunks
document_chunk_embeddings
document_processing_jobs
chat_sessions
chat_messages
chat_citations
summaries
translations
audio_versions
workspaces
workspace_documents
```

The vector table stores embeddings using pgvector:

```txt
vector(1536)
```

This allows semantic search directly inside PostgreSQL.

---

## 24. Frontend Architecture Explanation

The frontend uses Next.js App Router and feature-based structure.

Main route groups:

```txt
(public)
(dashboard)
```

Main frontend features:

```txt
auth
documents
chat
summaries
translations
workspaces
audio
```

Each feature can contain:

```txt
api
components
hooks
types
```

This keeps the frontend code modular.

For example:

```txt
features/documents
```

contains document API calls, document page components, upload UI, document cards and document types.

```txt
features/chat
```

contains chat API calls, streaming hook, chat components, message list, composer, citations and markdown renderer.

---

## 25. What Has Been Completed

The project currently has:

```txt
Authentication flow
Dashboard layout
Document upload UI
Document list UI
Document detail flow
Document chat UI
RAG chat with citations
Summary UI
Translation UI
Workspace UI
Workspace detail UI
Workspace chat UI
Profile UI
Settings UI
Frontend production build passing
```

Backend foundation includes:

```txt
Auth
Documents
Extraction
Chunks
Embeddings
Search
Chat
Summaries
Translations
Audio
Workspaces
```

---

## 26. Current Limitations

Current limitations include:

```txt
Some settings are read-only UI only
Profile page is based on current session data
Audio feature may need more complete TTS integration
Production deployment is not completed yet
Automated tests are not fully implemented yet
File storage is still local/development-oriented
Background job processing can be improved
```

---

## 27. Future Improvements

Future improvements include:

```txt
Add Docker Compose for full local setup
Add backend unit and integration tests
Add frontend tests
Add API documentation
Add admin dashboard
Persist user settings
Add better document preview
Add real-time processing progress
Add production object storage
Improve background job queue
Improve retry strategy for failed jobs
Deploy frontend
Deploy backend
Deploy PostgreSQL with pgvector
```

---

## 28. Common Questions and Suggested Answers

### Question: What is RAG?

RAG means Retrieval-Augmented Generation.

In this project, when the user asks a question, the backend first retrieves relevant document chunks using semantic search. Then those chunks are sent to the AI model as context. The AI answer is generated based on the retrieved content.

This helps reduce hallucination and makes the answer more grounded in the uploaded document.

---

### Question: Why use pgvector?

pgvector allows PostgreSQL to store and compare vector embeddings.

This means we can use the same PostgreSQL database for normal relational data and semantic search.

It is useful because the system needs both structured data and vector search.

---

### Question: Why use Prisma?

Prisma helps manage database schema, migrations and type-safe queries.

It improves developer productivity and keeps the database layer easier to maintain.

---

### Question: Why use NestJS?

NestJS provides a structured backend architecture with modules, controllers, services, guards and dependency injection.

This is useful for a project with many features such as authentication, documents, chat, summaries, translations and workspaces.

---

### Question: Why use Next.js?

Next.js provides App Router, server/client components, routing, layout structure and frontend build optimization.

It is suitable for building a modern dashboard application.

---

### Question: What makes this project more than a CRUD app?

This project includes AI-powered features such as:

```txt
Document extraction
Chunking
Embedding generation
Semantic search
RAG chat
Streaming response
Citations
Summaries
Translations
Workspace chat
```

These features make it more advanced than a normal CRUD application.

---

### Question: How do citations improve the system?

Citations show which document chunks were used by the AI answer.

This helps users verify the answer and makes the system more transparent.

---

### Question: What is the difference between document chat and workspace chat?

Document chat works with one document.

Workspace chat works with multiple READY documents inside a workspace.

Workspace chat is useful for comparing or summarizing multiple related files.

---

## 29. Short Presentation Version

Use this version when time is limited.

```txt
Hello, today I will present AI Document Assistant.

This is a full-stack AI-powered document management system.

Users can upload documents such as PDF, DOCX and TXT. The backend extracts text, splits it into chunks, creates embeddings and stores vectors in PostgreSQL with pgvector.

After processing, users can chat with documents using RAG. The system retrieves relevant chunks from the uploaded document and sends them as context to the AI model. The answer can include citations, so users can verify which chunks were used.

Besides chat, the system also supports summaries, translations, audio version foundation and workspaces. A workspace allows users to group multiple related documents and chat across them.

The backend is built with NestJS, Prisma, PostgreSQL and pgvector. The frontend is built with Next.js, TypeScript and Tailwind CSS.

The project demonstrates authentication, document processing, semantic search, RAG, AI API integration, chat history, citations and a polished dashboard UI.
```

---

## 30. Closing Statement

In conclusion, AI Document Assistant is a practical full-stack AI project.

It combines:

```txt
Full-stack web development
Authentication
Document management
AI API integration
Vector search
RAG
Chat history
Citations
Summaries
Translations
Workspaces
Modern dashboard UI
```

The project shows how AI can be integrated into a real document workflow to help users understand and reuse long documents more efficiently.

Thank you.