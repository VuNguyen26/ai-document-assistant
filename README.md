<div align="center">

# AI Document Assistant

### From raw documents to searchable, grounded AI knowledge.

A production-deployed Retrieval-Augmented Generation platform for uploading
documents, asking natural-language questions, inspecting source citations,
creating summaries, translating content, and organizing knowledge in workspaces.

<br />

[![Live Demo](https://img.shields.io/badge/OPEN_LIVE_PRODUCT-4F46E5?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-document-assistant-tau.vercel.app)
[![Source Code](https://img.shields.io/badge/EXPLORE_SOURCE-111827?style=for-the-badge&logo=github&logoColor=white)](https://github.com/VuNguyen26/ai-document-assistant)

<br />

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-087EA4?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS_11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-336791?style=flat-square&logo=postgresql&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-7C3AED?style=flat-square&logo=openai&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

<br />

<img
  src="./docs/assets/readme/product-landing.png"
  alt="AI Document Assistant product landing page"
  width="100%"
/>

</div>

---

## At a Glance

**AI Document Assistant** is a full-stack SaaS application that transforms
PDF, DOCX, and TXT files into an AI-searchable knowledge workspace.

Unlike a basic chatbot wrapper, the application implements the complete
document intelligence lifecycle:

```text
Upload
  -> Extract
  -> Chunk
  -> Embed
  -> Retrieve
  -> Generate
  -> Cite
```

| Product area | Implementation |
| --- | --- |
| AI workflow | Complete Retrieval-Augmented Generation pipeline |
| Retrieval | PostgreSQL vector similarity search with pgvector |
| Answers | Grounded responses with inspectable source citations |
| Processing | Background jobs, retries, failure history, and live polling |
| Access | Authenticated users and isolated guest sessions |
| Deployment | Vercel frontend and Railway backend |
| Quality | Unit tests, E2E tests, linting, production builds, and manual production validation |

---

## Product Highlights

### Document Intelligence

- Upload and manage **PDF, DOCX, and TXT** documents.
- Extract and normalize document text.
- Divide content into retrieval-friendly chunks.
- Generate and store 1,536-dimensional embeddings.
- Search by meaning instead of exact keywords.
- Track extraction, chunking, embedding, and processing status.

### Grounded AI Chat

- Ask questions about a single document.
- Ask questions across documents inside a workspace.
- Preserve chat sessions and conversation history.
- Display the exact source chunks used in each answer.
- Expose similarity scores, offsets, and citation content.
- Reject unsupported claims when information is absent.

### AI Productivity

- Generate and save document summaries.
- Translate document content and retain translation history.
- Manage document audio workflows.
- Organize related documents into workspaces.
- Start immediately without a traditional registration flow.

### Production Experience

- Responsive SaaS dashboard and document library.
- Automatic status refresh while processing is active.
- Retry-aware background task history.
- Partial-error handling and loading states.
- Independent frontend and backend deployments.

---

## How It Works

```mermaid
flowchart LR
    Upload["Upload document"] --> Extract["Extract text"]
    Extract --> Chunk["Create chunks"]
    Chunk --> Embed["Generate embeddings"]
    Embed --> VectorDB[("PostgreSQL + pgvector")]
    Question["User question"] --> Retrieve["Semantic retrieval"]
    VectorDB --> Retrieve
    Retrieve --> Context["Relevant context"]
    Context --> LLM["Grounded generation"]
    LLM --> Answer["Answer + citations"]
```

The model does not answer from general knowledge alone. Relevant document
chunks are retrieved first and supplied as grounded context.

When the requested information is unavailable, the assistant reports that the
document does not provide enough information instead of inventing an answer.

---

## Architecture

```mermaid
flowchart TB
    User["User or Guest"]

    subgraph Frontend["Frontend - Vercel"]
        Web["Next.js 16"]
        UI["Responsive SaaS UI"]
        Polling["Bounded status polling"]
    end

    subgraph Backend["Backend - Railway"]
        API["NestJS REST API"]
        Auth["JWT and guest sessions"]
        Jobs["Background processing jobs"]
        Retrieval["Semantic retrieval"]
    end

    subgraph Data["Data and AI"]
        Storage["Local or R2-compatible storage"]
        Database[("PostgreSQL")]
        Vectors[("pgvector")]
        OpenRouter["OpenRouter"]
    end

    User --> Web
    Web --> UI
    UI --> API
    Polling --> API

    API --> Auth
    API --> Jobs
    API --> Retrieval

    Jobs --> Storage
    Jobs --> Database
    Jobs --> Vectors

    Retrieval --> Vectors
    Retrieval --> OpenRouter
    OpenRouter --> API
```

---

## Technology Stack

<table>
<tr>
<td valign="top" width="33%">

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- React Markdown
- App Router
- Vercel

</td>
<td valign="top" width="33%">

### Backend

- NestJS 11
- Prisma ORM 6
- PostgreSQL
- pgvector
- Jest
- Docker
- Railway

</td>
<td valign="top" width="33%">

### AI and Documents

- OpenRouter
- OpenAI-compatible SDK
- Vector embeddings
- RAG retrieval
- `pdf-parse`
- Mammoth DOCX parser
- Source citations

</td>
</tr>
</table>

---

## Engineering Highlights

### Observable background processing

Document processing runs outside the upload request lifecycle. Jobs record
their state, attempt count, timestamps, and failure messages.

The interface polls only while active work exists and stops automatically when
processing completes.

### Verifiable answers

Every generated response can be linked to persisted source chunks. Users can
open, inspect, and copy the evidence behind an answer.

### Guest-first access

The backend creates a real isolated guest identity with access and refresh
tokens. Guest-owned documents and conversations remain protected by server-side
ownership checks.

### Secure configuration

Database credentials, JWT secrets, and AI provider keys stay on the backend and
are injected through environment variables. Local `.env` files are ignored by
Git.

### Deployment-ready architecture

The frontend and backend deploy independently. Database migrations run through
the backend deployment lifecycle, while the web application uses a configurable
public API endpoint.

---

## Project Structure

```text
ai-document-assistant/
|
+-- apps/
|   +-- frontend/              Next.js application
|   +-- backend/               NestJS API and processing pipeline
|
+-- docs/
|   +-- assets/readme/         Product images used by this README
|
+-- Dockerfile                 Backend production container
+-- railway.json               Railway deployment configuration
+-- README.md
```

---

## Run Locally

### Prerequisites

- Node.js 20 or newer
- Docker
- OpenRouter API key

### 1. Start PostgreSQL with pgvector

```bash
docker run \
  --name ai-doc-postgres-vector \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ai_document_assistant \
  -p 5433:5432 \
  -d pgvector/pgvector:pg16
```

### 2. Start the backend

```bash
cd apps/backend
npm install
```

Copy `.env.example` to `.env` and configure:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_document_assistant?schema=public
FRONTEND_URL=http://localhost:3000

JWT_ACCESS_SECRET=replace_with_a_secure_value
JWT_REFRESH_SECRET=replace_with_a_secure_value

OPENROUTER_API_KEY=your_openrouter_api_key
```

Prepare the database and run the API:

```bash
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

Backend endpoint:

```text
http://localhost:4000/api/v1
```

### 3. Start the frontend

```bash
cd apps/frontend
npm install
```

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

Run the web application:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Quality and Validation

Latest verified baseline:

| Check | Result |
| --- | --- |
| Frontend ESLint | Passed |
| Frontend production build | Passed |
| Prisma schema validation | Passed |
| Backend ESLint | Passed |
| Backend unit tests | **26 / 26 passed** |
| Backend E2E tests | **2 / 2 passed** |
| Backend production build | Passed |
| Manual production RAG flow | Passed |

The production flow was manually validated end to end:

```text
Upload document
-> Extract content
-> Create chunks
-> Generate embeddings
-> Update processing state
-> Ask grounded questions
-> Inspect source citations
-> Reject unsupported claims
```

### Validation commands

```bash
# Frontend
cd apps/frontend
npm run lint
npm run build

# Backend
cd apps/backend
npx prisma validate
npx eslint "{src,apps,libs,test}/**/*.ts"
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

---

## Deployment

| Component | Platform |
| --- | --- |
| Frontend | Vercel |
| Backend | Railway |
| Database | PostgreSQL with pgvector |
| AI provider | OpenRouter |
| Storage | Local or R2-compatible storage |

<div align="center">

[![Open Production](https://img.shields.io/badge/OPEN_PRODUCTION_APPLICATION-4F46E5?style=for-the-badge&logo=vercel&logoColor=white)](https://ai-document-assistant-tau.vercel.app)

</div>

---

## What This Project Demonstrates

- End-to-end RAG product design and implementation.
- Modular frontend and backend architecture.
- Semantic retrieval using PostgreSQL and pgvector.
- Secure LLM and embedding API integration.
- Asynchronous processing, retries, and live status tracking.
- Authentication, token refresh, guest access, and ownership isolation.
- Responsive production-quality interface design.
- Full-stack cloud deployment and production validation.

---

<div align="center">

### Full-Stack AI Engineering Portfolio Project

Built with Next.js, NestJS, PostgreSQL, pgvector, and OpenRouter.

<br />

[Live Product](https://ai-document-assistant-tau.vercel.app)
&nbsp;&middot;&nbsp;
[Source Code](https://github.com/VuNguyen26/ai-document-assistant)

</div>