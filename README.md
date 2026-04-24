# AI Document Assistant

AI Document Assistant is a full-stack AI-powered document management system.

The system allows users to upload documents, process document content, search semantically, chat with documents using RAG, generate summaries, translate content, create audio versions, and organize documents into workspaces.

The project is built as a monorepo with:

- Backend: NestJS, Prisma, PostgreSQL, pgvector
- Frontend: Next.js, React, TypeScript, Tailwind CSS
- AI Provider: OpenRouter / OpenAI-compatible API

---

## 1. Project Overview

The main goal of this project is to help users work with long documents more efficiently.

Instead of reading and searching documents manually, users can upload files and use AI features such as:

- Asking questions about a document
- Getting answers with source citations
- Creating document summaries
- Translating document content
- Creating audio versions
- Managing related documents inside workspaces
- Chatting across multiple documents in a workspace

The core workflow is:

```txt
Upload document
→ Extract text
→ Split content into chunks
→ Generate embeddings
→ Store vectors in PostgreSQL with pgvector
→ Retrieve relevant chunks
→ Generate AI answer with citations
```

This is the foundation of the RAG workflow.

RAG means Retrieval-Augmented Generation.

Instead of asking the AI model to answer only from general knowledge, the system first retrieves relevant document chunks and then uses those chunks as context for generating an answer.

---

## 2. Main Features

### 2.1 Authentication

The system supports user authentication:

- Register
- Login
- Refresh access token
- Logout
- JWT access token
- JWT refresh token
- Protected dashboard routes
- User ownership checks for private resources

Authentication is used to protect documents, chat sessions, summaries, translations, audio versions, and workspaces.

---

### 2.2 Document Management

Users can upload and manage documents.

Supported file types:

```txt
PDF
DOCX
TXT
```

Main document features:

- Upload document
- Save document metadata
- List documents
- Search documents
- Filter by processing status
- Sort by created date, updated date, title, or status
- View document detail
- Delete document
- Track processing status
- Track processing jobs

Document statuses include:

```txt
UPLOADED
PROCESSING
EXTRACTED
CHUNKED
READY
FAILED
DELETED
```

A document must become `READY` before it can be used reliably for semantic search, RAG chat, summaries, translations, or workspace chat.

---

### 2.3 Document Processing Pipeline

The backend includes a document processing pipeline.

The main pipeline is:

```txt
Document
→ DocumentContent
→ DocumentChunk
→ DocumentChunkEmbedding
```

Pipeline steps:

1. Upload document
2. Save document metadata
3. Extract text from the uploaded file
4. Save extracted text into document content
5. Split text into chunks
6. Generate embeddings for each chunk
7. Save embeddings into PostgreSQL with pgvector
8. Mark document as ready

The pipeline makes the document searchable and usable for RAG.

---

### 2.4 Semantic Search

The system supports semantic search over document chunks.

Semantic search is different from normal keyword search. Instead of matching exact words, it compares meaning using vector embeddings.

The system stores embeddings using pgvector:

```txt
vector(1536)
```

Semantic search can return:

- Relevant document chunks
- Similarity score
- Distance
- Chunk index
- Document metadata
- Source content preview

This is used by the chat module to retrieve context before generating AI answers.

---

### 2.5 RAG Chat With Documents

Users can chat with a single document.

Document chat supports:

- Chat sessions
- Saved chat messages
- Streaming assistant response
- User messages
- Assistant messages
- Markdown rendering
- Citations
- Copy answer
- Rename chat session
- Delete chat session

The chat flow is:

```txt
User asks a question
→ Backend embeds/searches the question
→ Backend retrieves relevant document chunks
→ Backend sends context to AI model
→ AI generates grounded answer
→ Backend saves messages and citations
→ Frontend displays answer and source citations
```

Citations allow users to inspect the sources used by the AI answer.

---

### 2.6 Chat Citations

The system stores and displays citations for assistant answers.

A citation may include:

- Document ID
- Document name
- Chunk ID
- Chunk index
- Similarity score
- Distance
- Start offset
- End offset
- Character count
- Chunk content

This makes answers more transparent and trustworthy.

---

### 2.7 Summaries

Users can generate summaries from processed documents.

Supported summary types:

```txt
SHORT
DETAILED
BULLET
BEGINNER
PRESENTATION
```

Summary features:

- Select document
- Select summary type
- Select output language
- Optional prompt style
- Generate summary
- Save summary history
- Copy summary
- Delete summary
- Filter summaries by document

This helps users quickly understand long documents.

---

### 2.8 Translations

Users can translate document content or generated summaries.

Translation source types:

```txt
DOCUMENT
SUMMARY
```

Translation features:

- Select document
- Select source type
- Select summary source if needed
- Set source language
- Set target language
- Set translation style
- Generate translation
- Save translation history
- Copy translation
- Delete translation
- Filter translations by document and source type

This helps users reuse document content in multiple languages.

---

### 2.9 Audio Versions

The project includes an audio module foundation.

The goal of the audio module is to allow users to create audio versions from document-related content, such as:

- Extracted document content
- Summaries
- Translations
- Selected text

This feature can be connected to a TTS model through OpenRouter or another OpenAI-compatible audio API.

---

### 2.10 Workspaces

A workspace is used to group related documents.

Workspace features:

- Create workspace
- Edit workspace name
- Edit workspace description
- Delete workspace
- Search workspaces
- View workspace detail
- Add document to workspace
- Remove document from workspace
- See document counts
- See ready document counts
- See incomplete document counts

Workspaces are useful when several documents belong to the same topic, project, customer, subject, or workflow.

---

### 2.11 Workspace Chat

Workspace chat allows users to ask questions across multiple documents.

Document chat uses one document. Workspace chat uses all `READY` documents inside a workspace.

Workspace chat supports:

- Multi-document question answering
- Chat sessions
- Saved messages
- Streaming answers
- Citations from multiple documents
- Session rename
- Session delete

Example use cases:

```txt
Compare the main points across these documents.
Summarize all documents in this workspace.
What common requirements appear in these files?
Find differences between these documents.
```

---

### 2.12 Dashboard UI

The frontend includes a polished dashboard interface.

Main pages:

```txt
/
/login
/dashboard
/documents
/documents/[id]
/documents/[id]/chat
/documents/[id]/audio
/summaries
/translations
/workspaces
/workspaces/[id]
/workspaces/[id]/chat
/profile
/settings
```

The UI follows a clean SaaS-style dashboard design with:

- Modern cards
- Consistent spacing
- Indigo accent color
- Clean form controls
- Clear empty states
- Loading skeletons
- Responsive layout
- Minimal icons
- Product-style layout

---

## 3. Tech Stack

### 3.1 Backend

```txt
NestJS
TypeScript
Prisma ORM
PostgreSQL
pgvector
JWT
Passport JWT
bcrypt
class-validator
pdf-parse
mammoth
OpenAI-compatible API
OpenRouter
```

Backend responsibilities:

- Authentication
- Authorization
- Document upload
- Document processing
- Text extraction
- Chunk generation
- Embedding generation
- Semantic search
- RAG chat
- Chat history
- Citations
- Summaries
- Translations
- Audio versions
- Workspaces

---

### 3.2 Frontend

```txt
Next.js App Router
React
TypeScript
Tailwind CSS
react-hot-toast
react-markdown
remark-gfm
```

Frontend responsibilities:

- Public pages
- Login UI
- Protected dashboard layout
- Document management UI
- Document detail UI
- Document chat UI
- Summary UI
- Translation UI
- Workspace UI
- Workspace chat UI
- Profile page
- Settings page

---

### 3.3 Database

```txt
PostgreSQL
pgvector
Prisma migrations
```

The database stores:

- Users
- Refresh tokens
- Documents
- Extracted content
- Chunks
- Embeddings
- Processing jobs
- Chat sessions
- Chat messages
- Chat citations
- Summaries
- Translations
- Audio versions
- Workspaces
- Workspace-document relations

---

## 4. Project Structure

```txt
ai-document-assistant/
├─ apps/
│  ├─ backend/
│  │  ├─ prisma/
│  │  │  └─ schema.prisma
│  │  │
│  │  └─ src/
│  │     ├─ app.module.ts
│  │     ├─ main.ts
│  │     ├─ config/
│  │     ├─ libs/
│  │     └─ modules/
│  │        ├─ auth/
│  │        ├─ audio/
│  │        ├─ chat/
│  │        ├─ chunks/
│  │        ├─ documents/
│  │        ├─ embeddings/
│  │        ├─ extraction/
│  │        ├─ health/
│  │        ├─ search/
│  │        ├─ summaries/
│  │        ├─ translations/
│  │        └─ workspaces/
│  │
│  └─ frontend/
│     └─ src/
│        ├─ app/
│        │  ├─ (dashboard)/
│        │  │  ├─ dashboard/
│        │  │  ├─ documents/
│        │  │  ├─ profile/
│        │  │  ├─ settings/
│        │  │  ├─ summaries/
│        │  │  ├─ translations/
│        │  │  └─ workspaces/
│        │  │
│        │  └─ (public)/
│        │
│        ├─ components/
│        │  ├─ layout/
│        │  └─ ui/
│        │
│        ├─ features/
│        │  ├─ audio/
│        │  ├─ auth/
│        │  ├─ chat/
│        │  ├─ documents/
│        │  ├─ summaries/
│        │  ├─ translations/
│        │  └─ workspaces/
│        │
│        └─ lib/
│           └─ auth/
│
├─ README.md
└─ package-lock.json
```

---

## 5. Backend Setup

Go to the backend folder:

```bash
cd apps/backend
```

Install dependencies:

```bash
npm install
```

Create `.env` file in:

```txt
apps/backend/.env
```

Example `.env`:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:3000

DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ai_document_assistant?schema=public"

JWT_ACCESS_SECRET=replace_this_with_a_long_random_access_secret
JWT_REFRESH_SECRET=replace_this_with_a_long_random_refresh_secret
JWT_ACCESS_EXPIRES_IN=900
JWT_REFRESH_EXPIRES_IN=604800

BCRYPT_SALT_ROUNDS=10

OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_CHAT_MODEL=openai/gpt-4o-mini
OPENROUTER_EMBEDDING_MODEL=text-embedding-3-small
OPENROUTER_TTS_MODEL=openai/gpt-audio-mini
```

Generate Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start backend development server:

```bash
npm run start:dev
```

Backend API runs at:

```txt
http://localhost:4000/api/v1
```

---

## 6. Frontend Setup

Go to the frontend folder:

```bash
cd apps/frontend
```

Install dependencies:

```bash
npm install
```

Create `.env.local` file in:

```txt
apps/frontend/.env.local
```

Example `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Start frontend development server:

```bash
npm run dev
```

Frontend runs at:

```txt
http://localhost:3000
```

Build frontend:

```bash
npm run build
```

---

## 7. Database Setup With Docker

This project requires PostgreSQL with pgvector.

Example Docker command for PowerShell:

```powershell
docker run --name ai-doc-postgres-vector `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=ai_document_assistant `
  -p 5433:5432 `
  -d pgvector/pgvector:pg16
```

Enable pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

If using Prisma migrations, make sure the extension exists before using vector columns.

---

## 8. Development Commands

### Backend

```bash
cd apps/backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
npm run build
```

### Frontend

```bash
cd apps/frontend
npm install
npm run dev
npm run build
```

### Git

```bash
git status
git add .
git commit -m "your commit message"
git push
```

---

## 9. Environment Variables

### Backend environment variables

```txt
NODE_ENV
PORT
FRONTEND_URL
DATABASE_URL

JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN

BCRYPT_SALT_ROUNDS

OPENROUTER_API_KEY
OPENROUTER_CHAT_MODEL
OPENROUTER_EMBEDDING_MODEL
OPENROUTER_TTS_MODEL
```

### Frontend environment variables

```txt
NEXT_PUBLIC_API_URL
```

---

## 10. Backend Modules

### Auth Module

Responsible for:

- Register
- Login
- Refresh token
- Logout
- Password hashing
- JWT generation
- JWT verification
- Current user handling

---

### Documents Module

Responsible for:

- Uploading files
- Creating document records
- Listing documents
- Searching documents
- Filtering documents
- Sorting documents
- Viewing document detail
- Deleting documents
- Checking document ownership

---

### Extraction Module

Responsible for:

- Extracting text from uploaded files
- Supporting PDF, DOCX and TXT files
- Saving extracted text into the database

---

### Chunks Module

Responsible for:

- Splitting extracted document content into smaller chunks
- Saving chunk index
- Saving character count
- Saving start offset
- Saving end offset

---

### Embeddings Module

Responsible for:

- Calling AI embedding model
- Generating vector embeddings
- Saving embeddings to the database
- Connecting chunks with embeddings

---

### Search Module

Responsible for:

- Semantic search
- Vector similarity search
- Returning relevant document chunks
- Returning score and distance

---

### Chat Module

Responsible for:

- Chat sessions
- Chat messages
- Streaming assistant response
- RAG context retrieval
- Saving citations
- Document chat
- Workspace chat

---

### Summaries Module

Responsible for:

- Creating summaries
- Listing summary history
- Filtering summaries
- Deleting summaries

---

### Translations Module

Responsible for:

- Translating document content
- Translating summaries
- Listing translation history
- Filtering translations
- Deleting translations

---

### Audio Module

Responsible for:

- Audio version foundation
- TTS-related records
- Future text-to-speech integration

---

### Workspaces Module

Responsible for:

- Creating workspaces
- Updating workspace metadata
- Deleting workspaces
- Adding documents to workspaces
- Removing documents from workspaces
- Workspace-level document grouping
- Workspace chat support

---

## 11. Frontend Feature Structure

The frontend uses a feature-based structure.

```txt
features/
├─ auth/
├─ documents/
├─ chat/
├─ summaries/
├─ translations/
├─ workspaces/
└─ audio/
```

Each feature can contain:

```txt
api/
components/
hooks/
types/
```

This helps keep frontend code modular and easier to maintain.

---

## 12. Main Frontend Pages

```txt
/                         Public entry page
/login                    Login page
/dashboard                Dashboard overview
/documents                Document management
/documents/[id]           Document detail
/documents/[id]/chat      Document chat
/documents/[id]/audio     Document audio
/summaries                Summary workspace
/translations             Translation workspace
/workspaces               Workspace management
/workspaces/[id]          Workspace detail
/workspaces/[id]/chat     Workspace chat
/profile                  User profile
/settings                 Application settings
```

---

## 13. Main User Flow

Recommended user flow:

```txt
1. Register or login
2. Open dashboard
3. Upload a document
4. Wait for the document to be processed
5. Open document detail
6. Start document chat
7. Ask questions about the document
8. Review citations
9. Generate a summary
10. Generate a translation
11. Create a workspace
12. Add documents to the workspace
13. Start workspace chat
```

---

## 14. RAG Flow Explanation

The RAG flow in this project works like this:

```txt
User question
→ Convert question into search query
→ Retrieve relevant chunks from vector database
→ Build context from retrieved chunks
→ Send context and question to AI model
→ Receive AI answer
→ Save answer
→ Save citations
→ Display answer and sources in frontend
```

This improves answer quality because the AI response is grounded in the uploaded document content.

---

## 15. Chat Citation Flow

When the assistant answers, the system can store citations.

A citation connects the answer to the document chunks used as context.

Citation data can include:

```txt
documentId
documentName
chunkId
chunkIndex
content
score
distance
startOffset
endOffset
charCount
```

The frontend displays citations under the assistant answer.

Users can:

- View source chunks
- Copy chunk content
- Copy citation reference

---

## 16. Document Status Meaning

### UPLOADED

The file has been uploaded and saved.

### PROCESSING

The backend is processing the file.

### EXTRACTED

Text has been extracted from the file.

### CHUNKED

Extracted text has been split into chunks.

### READY

The document is ready for semantic search and chat.

### FAILED

The processing pipeline failed.

### DELETED

The document has been deleted or soft-deleted.

---

## 17. UI Design Direction

The frontend dashboard was polished to look like a real SaaS application.

UI design principles:

- Clean layout
- Minimal icons
- Indigo accent color
- Consistent cards
- Consistent buttons
- Clear empty states
- Clean loading states
- Responsive layout
- Professional spacing
- Not too colorful
- Not too template-like

Main polished areas:

```txt
Dashboard
Documents
Document cards
Upload form
Document chat
Workspace chat
Summaries
Translations
Workspaces
Profile
Settings
```

---

## 18. Testing Checklist

Before considering the project complete, test the following:

### Auth

```txt
Register
Login
Logout
Refresh token
Protected routes
```

### Documents

```txt
Upload PDF
Upload DOCX
Upload TXT
Search document
Filter document
Sort document
Open document detail
Delete document
```

### Processing

```txt
Extract text
Create chunks
Create embeddings
Mark document READY
Handle failed document
```

### Chat

```txt
Create new chat
Ask question
Stream response
Save user message
Save assistant message
Show citations
Rename session
Delete session
Reload chat history
```

### Summaries

```txt
Generate summary
List summaries
Filter by document
Copy summary
Delete summary
```

### Translations

```txt
Translate document
Translate summary
List translations
Filter translations
Copy translation
Delete translation
```

### Workspaces

```txt
Create workspace
Edit workspace
Delete workspace
Add document
Remove document
Open workspace detail
Chat with workspace
```

### UI

```txt
Desktop layout
Mobile layout
Loading states
Empty states
Error states
Button alignment
Card spacing
Form focus states
```

---

## 19. Current Project Status

The project currently has:

- Monorepo structure
- NestJS backend
- Next.js frontend
- Prisma schema
- PostgreSQL integration
- pgvector support
- Authentication module
- Document module
- Extraction module
- Chunking module
- Embedding module
- Search module
- Chat module
- Summary module
- Translation module
- Audio module foundation
- Workspace module
- Polished dashboard UI
- Frontend production build passing

---

## 20. Known Notes

### Next.js workspace root warning

During frontend build, Next.js may show a warning about multiple lockfiles:

```txt
Warning: Next.js inferred your workspace root, but it may not be correct.
Detected additional lockfiles.
```

This warning does not block the build.

It happens because the repository has a root `package-lock.json` and another `package-lock.json` inside `apps/frontend`.

Possible future fixes:

- Configure `turbopack.root` in Next.js config
- Remove unnecessary lockfile
- Standardize package management for the monorepo

---

## 21. Future Improvements

Possible improvements:

- Add Docker Compose for full local setup
- Add backend tests
- Add frontend tests
- Add API documentation
- Add admin dashboard
- Add user settings persistence
- Add better document preview
- Add real-time processing progress
- Add background job queue
- Add production object storage
- Improve retry mechanism for failed jobs
- Add deployment guide
- Deploy frontend to Vercel
- Deploy backend to Render, Railway, Fly.io, or similar
- Deploy PostgreSQL with pgvector using Supabase, Neon, or another provider

---

## 22. Demo Script Summary

Short explanation:

```txt
AI Document Assistant is a full-stack AI document management system.

Users can upload documents, process them, ask questions using RAG, view citations, generate summaries, translate content, create audio versions, and organize documents into workspaces.

The backend is built with NestJS, Prisma, PostgreSQL and pgvector.

The frontend is built with Next.js, TypeScript and Tailwind CSS.

The system demonstrates authentication, document processing, vector search, RAG, AI API integration, chat history, citations, summaries, translations and workspace-based document management.
```

---

## 23. Recommended Demo Order

```txt
1. Login
2. Open dashboard
3. Open documents page
4. Upload document
5. Show document status
6. Open document detail
7. Start document chat
8. Ask a question
9. Show citations
10. Open summaries page
11. Generate a summary
12. Open translations page
13. Generate a translation
14. Open workspaces page
15. Create workspace
16. Add document to workspace
17. Open workspace chat
18. Ask a multi-document question
19. Show profile
20. Show settings
```

---

## 24. Useful Git Commands

Check changes:

```bash
git status
```

Stage frontend changes:

```bash
git add apps/frontend
```

Stage README:

```bash
git add README.md
```

Commit UI polish:

```bash
git commit -m "feat: polish frontend dashboard UI"
```

Commit documentation:

```bash
git commit -m "docs: add project README"
```

Push code:

```bash
git push
```

---

## 25. Suggested Commit Messages

For UI polish:

```bash
git commit -m "feat: polish frontend dashboard UI"
```

For README:

```bash
git commit -m "docs: add project README"
```

For demo script:

```bash
git commit -m "docs: add demo script"
```

For frontend and docs together:

```bash
git commit -m "feat: polish frontend UI and add project docs"
```

---

## 26. License

This project is currently developed for learning, portfolio and demonstration purposes.

A production license can be added later if needed.